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
async function saveFile(buffer: Buffer, originalName: string): Promise<{ filename: string; url: string }> {
  const hash = generateHash(buffer)
  const ext = path.extname(originalName).toLowerCase() || '.jpg'
  const filename = `${hash.slice(0, 12)}-${Date.now()}${ext}`
  const filepath = path.join(UPLOAD_DIR, filename)
  fs.writeFileSync(filepath, buffer)
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

  // Convert to WebP for smaller file size
  const optimized = await image.webp({ quality: 85 }).toBuffer()
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

  // Check for duplicate by hash
  const hash = generateHash(file.buffer)
  const existing = await prisma.mediaAsset.findFirst({ where: { hash } })
  if (existing) {
    return res.status(209).json({ asset: existing, message: 'Duplicate file — existing asset returned' })
  }

  // Optimize image
  const { optimized, width, height } = await optimizeImage(file.buffer, file.mimetype)

  // Save optimized file
  const { filename, url } = await saveFile(optimized, file.originalname)

  // Create media asset record
  const asset = await prisma.mediaAsset.create({
    data: {
      filename,
      originalName: file.originalname,
      url,
      mimeType: 'image/webp',
      fileSize: optimized.length,
      width,
      height,
      hash,
      uploadedBy: req.user!.id,
    },
  })

  res.status(201).json({ asset })
}))

// ─── Delete Media ──────────────────────────────────────────────
router.delete('/:id', requireRole('inventory-manager'), asyncHandler(async (req: AuthRequest, res) => {
  // Check if used by any product
  const usage = await prisma.productImage.count({ where: { mediaAssetId: req.params.id as string } })
  if (usage > 0) {
    return res.status(400).json({ error: `Cannot delete: used by ${usage} product(s)` })
  }
  await prisma.mediaAsset.delete({ where: { id: req.params.id as string } })
  res.json({ message: 'Deleted' })
}))

export default router
