import { Router } from 'express'
import multer from 'multer'
import sharp from 'sharp'
import crypto from 'crypto'
import path from 'path'
import fs from 'fs'
import { prisma } from '../../server.js'
import { authenticateAdmin, requireRole, AuthRequest } from '../../middleware/auth.js'
import { asyncHandler } from '../../middleware/validate.js'
import { paginationParams, paginationResponse } from '../../utils/helpers.js'

const router = Router()
router.use(authenticateAdmin)

// ─── Multer Config ────────────────────────────────────────────
const UPLOAD_DIR = path.resolve('uploads')
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true, mode: 0o755 })

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

// Helper: write file to disk and return URL
async function saveFile(buffer: Buffer, hash: string, ext: string): Promise<{ filename: string; url: string }> {
  // Use hash as filename for dedup-friendly storage (same hash = same filename)
  const filename = `${hash.slice(0, 12)}${ext}`
  const filepath = path.join(UPLOAD_DIR, filename)
  if (!fs.existsSync(filepath)) {
    fs.writeFileSync(filepath, buffer)
  }
  return { filename, url: `/uploads/${filename}` }
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

  // Convert to WebP for smaller file size, auto-rotate from EXIF orientation
  // Sharp strips EXIF metadata by default in WebP output (no .withMetadata() call needed)
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

  // Optimize image
  const { optimized, width, height } = await optimizeImage(file.buffer, file.mimetype)

  // Compute hash from OPTIMIZED buffer — this is what gets stored and used for dedup
  const fileHash = generateHash(optimized)

  // Save optimized file to disk FIRST (content-addressed filename = safe idempotent write)
  const { filename, url } = await saveFile(optimized, fileHash, '.webp')

  // Prisma $transaction ensures atomic check+create — no race condition
  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.mediaAsset.findFirst({ where: { hash: fileHash } })
    if (existing) return { asset: existing, created: false }

    const asset = await tx.mediaAsset.create({
      data: {
        filename,
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

  if (!result.created) {
    return res.status(200).json({ asset: result.asset, message: 'Duplicate file — existing asset returned' })
  }

  res.status(201).json({ asset: result.asset })
}))

// ─── Delete Media ──────────────────────────────────────────────
router.delete('/:id', requireRole('inventory-manager'), asyncHandler(async (req: AuthRequest, res) => {
  const assetId = req.params.id as string

  // Fetch asset FIRST to get its URL for usage checks, and disk path for cleanup
  const asset = await prisma.mediaAsset.findUnique({ where: { id: assetId } })
  if (!asset) return res.status(404).json({ error: 'Media asset not found' })

  // Check usage by URL across ALL entities (Brand, AdminUser, Product store URLs not asset IDs)
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

  // Delete DB record
  await prisma.mediaAsset.delete({ where: { id: assetId } })

  // Delete disk file if it exists
  const filepath = path.join(UPLOAD_DIR, asset.filename)
  try {
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath)
    }
  } catch {
    // File might already be gone — log but don't fail the request
    console.warn(`Failed to delete disk file: ${filepath}`)
  }

  res.json({ message: 'Deleted' })
}))

export default router
