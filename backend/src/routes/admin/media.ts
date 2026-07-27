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

// Helper: upload buffer to Cloudinary, return URL + public_id
async function uploadToCloudinary(buffer: Buffer, hashPrefix: string): Promise<{ url: string; publicId: string }> {
  const b64 = `data:image/webp;base64,${buffer.toString('base64')}`
  const publicId = `alka/${hashPrefix}`
  const result = await cloudinary.uploader.upload(b64, {
    public_id: publicId,
    resource_type: 'image',
    overwrite: false,  // Don't overwrite if same public_id exists (dedup via filename)
    invalidate: true,
  })
  return { url: result.secure_url, publicId }
}

// Helper: extract Cloudinary public_id from a URL for deletion
function extractCloudinaryPublicId(url: string): string | null {
  // URL format: https://res.cloudinary.com/CLOUD/image/upload/v12345/alka/HASH.webp
  const match = url.match(/\/image\/upload\/v\d+\/(.+)\/?$/)
  if (!match) return null
  // Remove file extension from the path
  return match[1].replace(/\.[^.]+$/, '')
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
router.post('/upload', upload.single('file'), asyncHandler(async (req: AuthRequest, res) => {
  const file = req.file
  if (!file) return res.status(400).json({ error: 'No file provided' })

  // Optimize image with Sharp (resize, format convert, auto-rotate)
  const { optimized, width, height } = await optimizeImage(file.buffer, file.mimetype)

  // Compute hash from OPTIMIZED buffer — this is what gets stored and used for dedup
  const fileHash = generateHash(optimized)
  const hashPrefix = fileHash.slice(0, 12)

  // Quick pre-check to avoid unnecessary Cloudinary upload for duplicates
  const preExisting = await prisma.mediaAsset.findFirst({ where: { hash: fileHash } })
  if (preExisting) {
    return res.status(200).json({ asset: preExisting, message: 'Duplicate file — existing asset returned' })
  }

  // Upload to Cloudinary (only for new files)
  const { url, publicId } = await uploadToCloudinary(optimized, hashPrefix)

  // Prisma $transaction ensures atomic check+create — no race condition
  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.mediaAsset.findFirst({ where: { hash: fileHash } })
    if (existing) return { asset: existing, created: false }

    const asset = await tx.mediaAsset.create({
      data: {
        filename: publicId,           // Cloudinary public_id (alka/hash123456)
        originalName: file.originalname,
        url,                          // Cloudinary secure_url
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

  if (!result.created) {
    // Duplicate detected inside transaction (race condition window) — Cloudinary
    // image is idempotent (overwrite: false) so no harm done
    return res.status(200).json({ asset: result.asset, message: 'Duplicate file — existing asset returned' })
  }

  res.status(201).json({ asset: result.asset })
}))

// ─── Delete Media ──────────────────────────────────────────────
router.delete('/:id', requireRole('inventory-manager'), asyncHandler(async (req: AuthRequest, res) => {
  const assetId = req.params.id as string

  // Fetch asset FIRST to get its URL for usage checks
  const asset = await prisma.mediaAsset.findUnique({ where: { id: assetId } })
  if (!asset) return res.status(404).json({ error: 'Media asset not found' })

  // Check usage by URL across ALL entities
  const assetUrl = asset.url
  const [productImageCount, brandCount, adminUserCount, productCount] = await Promise.all([
    prisma.productImage.count({ where: { mediaAssetId: assetId } }),
    prisma.brand.count({ where: { logoUrl: assetUrl } }),
    prisma.adminUser.count({ where: { avatarUrl: assetUrl } }),
    prisma.product.count({ where: { ogImageUrl: assetUrl } }),
  ])

  if (productImageCount > 0) {
    return res.status(400).json({ error: `Cannot delete: used by ${productImageCount} product image(s)` })
  }
  if (brandCount > 0) {
    return res.status(400).json({ error: 'Cannot delete: used as a brand logo' })
  }
  if (adminUserCount > 0) {
    return res.status(400).json({ error: 'Cannot delete: used as an admin avatar' })
  }
  if (productCount > 0) {
    return res.status(400).json({ error: 'Cannot delete: used as a product OG image' })
  }

  // Delete from Cloudinary
  const cloudinaryPublicId = extractCloudinaryPublicId(assetUrl)
  if (cloudinaryPublicId) {
    try {
      await cloudinary.uploader.destroy(cloudinaryPublicId, { invalidate: true })
    } catch {
      console.warn(`Failed to delete from Cloudinary: ${cloudinaryPublicId}`)
    }
  }

  // Delete DB record
  await prisma.mediaAsset.delete({ where: { id: assetId } })

  res.json({ message: 'Deleted' })
}))

export default router
