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

// Helper: generate file hash for duplicate detection
function generateHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex')
}

// Helper: validate a Cloudinary public_id format.
// Supports both legacy truncated (alka/<12chars>) and new full-hash (alka/<64chars>) formats.
// Returns true if the public_id matches the expected pattern — prevents accidental
// deletion of wrong assets if DB filename is corrupted.
function isValidCloudinaryPublicId(publicId: string): boolean {
  return /^alka\/[a-f0-9]{12,64}$/.test(publicId)
}

// Helper: upload buffer to Cloudinary, return URL + public_id.
// Uses full SHA-256 hash as public_id — content-addressed storage means
// identical buffers always map to the same Cloudinary asset.
// Cloudinary overwrite:false: if public_id exists, returns existing asset (HTTP 200, never throws).
// This means concurrent uploads of the same file are harmless — second upload is a no-op on CDN.
async function uploadToCloudinary(buffer: Buffer, fullHash: string): Promise<{ url: string; publicId: string }> {
  const b64 = `data:image/webp;base64,${buffer.toString('base64')}`
  const publicId = `alka/${fullHash}`
  const result = await cloudinary.uploader.upload(b64, {
    public_id: publicId,
    resource_type: 'image',
    overwrite: false,
  })
  return { url: result.secure_url, publicId }
}

// Helper: delete from Cloudinary by public_id.
// Cloudinary destroy() never throws — returns { result: 'ok' } or { result: 'not_found' }.
// Both are considered success (idempotent delete).
async function destroyCloudinary(publicId: string): Promise<boolean> {
  const result = await cloudinary.uploader.destroy(publicId, { invalidate: true })
  // result.result is 'ok' | 'not_found' | 'error'
  // 'not_found' means already deleted — still success for our purposes
  return result.result !== 'error'
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
// Architecture note: Cloudinary is NOT inside our transaction boundary.
// This is inherent — we can't do distributed transactions between Postgres and Cloudinary.
// Instead, we rely on content-addressed storage (hash as public_id) to make
// concurrent uploads and cleanup idempotent:
//   - overwrite:false means identical files map to the same CDN asset (no duplicates)
//   - destroy() returns 'not_found' for already-deleted files (idempotent delete)
//   - orphans (CDN file without DB record) are harmless — just wasted storage,
//     cleaned up by a periodic scan job
//
// Flow:
//   1. Optimize + hash (content-addressing)
//   2. DB pre-check (performance optimization only — skip CDN call for known duplicates)
//   3. Upload to Cloudinary (idempotent — overwrite:false)
//   4. Prisma $transaction: atomic findFirst + create (source of truth)
//   5. If transaction fails → best-effort Cloudinary cleanup (swallow errors)
router.post('/upload', upload.single('file'), asyncHandler(async (req: AuthRequest, res) => {
  const file = req.file
  if (!file) return res.status(400).json({ error: 'No file provided' })

  // Optimize image with Sharp (resize, format convert, auto-rotate)
  const { optimized, width, height } = await optimizeImage(file.buffer, file.mimetype)

  // Compute hash from OPTIMIZED buffer — this is the content address
  const fileHash = generateHash(optimized)

  // Performance optimization: if DB already has this hash, return immediately.
  // This avoids the Cloudinary API call for known duplicates.
  // NOT a concurrency mechanism — the transaction below handles races atomically.
  const preExisting = await prisma.mediaAsset.findFirst({ where: { hash: fileHash } })
  if (preExisting) {
    return res.status(200).json({ asset: preExisting, message: 'Duplicate file — existing asset returned' })
  }

  // Upload to Cloudinary. overwrite:false means:
  //   - New file → uploaded, returns new asset metadata
  //   - Existing public_id → returns existing asset (HTTP 200, never throws)
  // So concurrent uploads of the same file are safe — second is a no-op on CDN.
  const cloudinaryResult = await uploadToCloudinary(optimized, fileHash)
  const { url, publicId } = cloudinaryResult

  // Prisma $transaction: atomic findFirst + create
  // If a concurrent request already created this hash, findFirst returns it.
  // We return 200 with the existing record — the Cloudinary upload was harmless.
  let result: { asset: any; created: boolean }
  try {
    result = await prisma.$transaction(async (tx) => {
      const existing = await tx.mediaAsset.findFirst({ where: { hash: fileHash } })
      if (existing) return { asset: existing, created: false }

      const asset = await tx.mediaAsset.create({
        data: {
          filename: publicId,
          originalName: file.originalname,
          url,
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
    // Transaction failed AFTER Cloudinary upload — best-effort cleanup.
    // destroy() never throws (returns 'not_found' for missing files), so this
    // catch block only handles network errors. If cleanup fails, the orphaned
    // CDN file is harmless (content-addressed, nobody references it).
    await destroyCloudinary(publicId)
    return res.status(502).json({
      error: 'Database error after Cloudinary upload',
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
// Delete is idempotent: destroy() returns 'not_found' for already-deleted files.
// We always delete the DB record regardless of Cloudinary state.
// Rationale: orphaned CDN file (no DB record) = harmless wasted storage,
// orphaned DB record (dead CDN link) = user-facing bug.
router.delete('/:id', requireRole('inventory-manager'), asyncHandler(async (req: AuthRequest, res) => {
  const assetId = req.params.id as string

  const asset = await prisma.mediaAsset.findUnique({ where: { id: assetId } })
  if (!asset) return res.status(404).json({ error: 'Media asset not found' })

  // Check usage across ALL entities before allowing delete
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

  // Delete from Cloudinary (idempotent — 'not_found' is treated as success).
  // Validate filename format before using it as public_id to prevent
  // accidental deletion of wrong assets if DB is corrupted.
  let cloudinaryDeleteOk = true
  if (asset.filename) {
    if (isValidCloudinaryPublicId(asset.filename)) {
      cloudinaryDeleteOk = await destroyCloudinary(asset.filename)
    } else {
      // Filename doesn't match expected pattern — skip Cloudinary delete to avoid
      // accidental deletion of unrelated assets. The DB record will still be removed.
      console.warn(`[media] Skipping Cloudinary delete for ${assetId}: invalid public_id format: ${asset.filename}`)
    }
  }

  // Always delete DB record — even if Cloudinary delete failed.
  // An orphaned CDN file is less harmful than a dead reference in the DB.
  await prisma.mediaAsset.delete({ where: { id: assetId } })

  const warnings = !cloudinaryDeleteOk ? ['Cloudinary delete failed — file may remain on CDN'] : []
  res.json({ message: 'Deleted', warnings })
}))

export default router
