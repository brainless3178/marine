import { Router } from 'express'
import multer from 'multer'
import sharp from 'sharp'
import crypto from 'crypto'
import { v2 as cloudinary } from 'cloudinary'
import { prisma } from '../../server.js'
import { authenticateAdmin, requireRole, AuthRequest } from '../../middleware/auth.js'
import { asyncHandler } from '../../middleware/validate.js'
import { paginationParams, paginationResponse } from '../../utils/helpers.js'

// Configure Cloudinary from env — auto-reads CLOUDINARY_URL (cloudinary://key:secret@cloudname)
cloudinary.config()

const router = Router()
router.use(authenticateAdmin)

// ─── Multer Config ────────────────────────────────────────────
const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']
    if (allowed.includes(file.mimetype)) cb(null, true)
    else cb(new Error(`Unsupported file type: ${file.mimetype}`))
  },
})

// Maximum base64-encoded payload Cloudinary accepts via data URI upload
// Base64 adds ~33% overhead, so max binary is ~15MB for Cloudinary's ~20MB data URI limit
const CLOUDINARY_BASE64_LIMIT = 15 * 1024 * 1024  // 15MB binary limit before base64 overhead

// Helper: generate file hash for duplicate detection
function generateHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex')
}

// Helper: upload buffer to Cloudinary, return URL + public_id
// Uses full SHA-256 hash as public_id to guarantee uniqueness on Cloudinary side
async function uploadToCloudinary(buffer: Buffer, fullHash: string): Promise<{ url: string; publicId: string }> {
  if (buffer.length > CLOUDINARY_BASE64_LIMIT) {
    throw new Error(`Optimized image too large: ${(buffer.length / 1024 / 1024).toFixed(1)}MB exceeds ${CLOUDINARY_BASE64_LIMIT / 1024 / 1024}MB base64 limit`)
  }
  const b64 = `data:image/webp;base64,${buffer.toString('base64')}`
  const publicId = `alka/${fullHash}`
  const result = await cloudinary.uploader.upload(b64, {
    public_id: publicId,
    resource_type: 'image',
    overwrite: false,  // Safe dedup — if public_id exists, Cloudinary returns existing asset silently
    // NOTE: invalidate intentionally omitted — overwrite:false means nothing was replaced
  })
  return { url: result.secure_url, publicId }
}

// Helper: delete from Cloudinary by public_id (throws on failure — caller must handle)
async function destroyCloudinary(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId, { invalidate: true })
}

// Helper: optimize image with Sharp
async function optimizeImage(buffer: Buffer, mimetype: string): Promise<{ optimized: Buffer; width: number; height: number }> {
  const image = sharp(buffer)
  const metadata = await image.metadata()
  const width = metadata.width || 0
  const height = metadata.height || 0

  // Resize if larger than 2000px on any side
  if (width > 2000 || height > 2000) {
    image.resize({ width: Math.min(width, 2000), height: Math.min(height, 2000), fit: 'inside', withoutEnlargement: true })
  }

  // Convert to WebP, auto-rotate from EXIF orientation
  const optimized = await image.rotate().webp({ quality: 85 }).toBuffer()
  return { optimized, width, height }
}

// ─── List Media Assets ─────────────────────────────────────────
router.get('/', asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginationParams(Number(req.query.page), Number(req.query.limit))
  const where: any = {}
  if ((req.query.search as string)) {
    where.OR = [
      { filename: { contains: (req.query.search as string), mode: 'insensitive' } },
      { altText: { contains: (req.query.search as string), mode: 'insensitive' } },
    ]
  }

  const [assets, total] = await Promise.all([
    prisma.mediaAsset.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
    prisma.mediaAsset.count({ where }),
  ])
  res.json({ assets, pagination: paginationResponse(total, page, limit) })
}))

// ─── Get Media Usage ───────────────────────────────────────────
router.get('/:id/usage', asyncHandler(async (req, res) => {
  const usage = await prisma.productImage.findMany({
    where: { mediaAssetId: req.params.id as string },
    include: { product: { select: { id: true, name: true, sku: true } } },
  })
  res.json({ usage })
}))

// ─── Upload Media ─────────────────────────────────────────────
// Flow:
//   1. Optimize + hash
//   2. Pre-check hash in DB (optimization to avoid Cloudinary API call for duplicates)
//   3. Upload to Cloudinary
//   4. Prisma $transaction: atomic findFirst + create
//   5. If transaction fails → cleanup Cloudinary orphan
router.post('/upload', upload.single('file'), asyncHandler(async (req: AuthRequest, res) => {
  const file = req.file
  if (!file) return res.status(400).json({ error: 'No file provided' })

  // Optimize image with Sharp (resize, format convert, auto-rotate)
  const { optimized, width, height } = await optimizeImage(file.buffer, file.mimetype)

  // Compute hash from OPTIMIZED buffer — this is what gets stored and used for dedup
  const fileHash = generateHash(optimized)

  // Quick pre-check to avoid unnecessary Cloudinary upload for duplicates
  // This is NOT atomic — a concurrent upload of the same file can still pass this check.
  // The Prisma transaction below handles that race condition atomically.
  const preExisting = await prisma.mediaAsset.findFirst({ where: { hash: fileHash } })
  if (preExisting) {
    return res.status(200).json({ asset: preExisting, message: 'Duplicate file — existing asset returned' })
  }

  // Upload to Cloudinary (only for genuinely new files — pre-check passed)
  // Cloudinary overwrite:false means if two threads race here with the same hash,
  // the second upload silently returns the existing asset — no error, no duplicate on Cloudinary.
  let cloudinaryResult: { url: string; publicId: string }
  try {
    cloudinaryResult = await uploadToCloudinary(optimized, fileHash)
  } catch (err) {
    return res.status(502).json({
      error: 'Failed to upload to Cloudinary',
      detail: (err as Error).message,
    })
  }

  const { url, publicId } = cloudinaryResult

  // Prisma $transaction: atomic findFirst + create
  // If a concurrent request already created this hash, findFirst returns it and we return 200.
  // The earlier Cloudinary upload is harmless (overwrite:false returns existing asset).
  let result: { asset: any; created: boolean }
  try {
    result = await prisma.$transaction(async (tx) => {
      const existing = await tx.mediaAsset.findFirst({ where: { hash: fileHash } })
      if (existing) return { asset: existing, created: false }

      const asset = await tx.mediaAsset.create({
        data: {
          filename: publicId,  // Cloudinary public_id (alka/<full-hash>)
          originalName: file.originalname,
          url,                 // Cloudinary secure_url
          mimeType: 'image/webp',
          fileSize: optimized.length,
          width,
          height,
          hash: fileHash,
          uploadedBy: req.user!.id,
        },
      })
      return { asset, created: true }
    })
  } catch (err) {
    // Transaction failed AFTER Cloudinary upload — try to clean up the orphan on Cloudinary
    try { await destroyCloudinary(publicId) } catch { /* best-effort cleanup */ }
    return res.status(502).json({
      error: 'Database error after Cloudinary upload — orphan cleaned up',
      detail: (err as Error).message,
    })
  }

  if (!result.created) {
    // Duplicate detected inside the transaction (narrow race window).
    // Cloudinary has the file (overwrite:false made it a no-op), no harm.
    return res.status(200).json({ asset: result.asset, message: 'Duplicate file — existing asset returned' })
  }

  res.status(201).json({ asset: result.asset })
}))

// ─── Delete Media ──────────────────────────────────────────────
router.delete('/:id', requireRole('inventory-manager'), asyncHandler(async (req: AuthRequest, res) => {
  const assetId = req.params.id as string

  // Fetch asset FIRST to get its stored public_id + URL for usage checks
  const asset = await prisma.mediaAsset.findUnique({ where: { id: assetId } })
  if (!asset) return res.status(404).json({ error: 'Media asset not found' })

  // Check usage by URL across ALL entities
  // Note: there is a narrow race window between this check and the destroy below.
  // In practice this is milliseconds; a fully safe approach would require DB locks.
  const [productImageCount, brandCount, adminUserCount, productCount] = await Promise.all([
    prisma.productImage.count({ where: { mediaAssetId: assetId } }),
    prisma.brand.count({ where: { logoUrl: asset.url } }),
    prisma.adminUser.count({ where: { avatarUrl: asset.url } }),
    prisma.product.count({ where: { ogImageUrl: asset.url } }),
  ])
  if (productImageCount + brandCount + adminUserCount + productCount > 0) {
    const inUse: string[] = []
    if (productImageCount > 0) inUse.push(`${productImageCount} product image(s)`)
    if (brandCount > 0) inUse.push('brand logo')
    if (adminUserCount > 0) inUse.push('admin avatar')
    if (productCount > 0) inUse.push('product OG image')
    return res.status(400).json({ error: `Cannot delete: in use as ${inUse.join(', ')}` })
  }

  // Delete from Cloudinary using the stored public_id (asset.filename)
  // Using filename (the stored public_id) is more reliable than parsing the URL
  if (asset.filename) {
    await destroyCloudinary(asset.filename)
  }

  // Delete DB record
  await prisma.mediaAsset.delete({ where: { id: assetId } })

  res.json({ message: 'Deleted' })
}))

export default router
