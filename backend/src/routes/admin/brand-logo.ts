import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { prisma } from '../../server.js'
import { authenticateAdmin, AuthRequest } from '../../middleware/auth.js'
import { asyncHandler } from '../../middleware/validate.js'
import { logAudit } from '../../utils/audit.js'

const router = Router()
router.use(authenticateAdmin)

// ─── Multer Config ────────────────────────────────────────────
const UPLOAD_DIR = path.resolve('uploads')
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true })

const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB for logos
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
    if (allowed.includes(file.mimetype)) cb(null, true)
    else cb(new Error(`Unsupported file type: ${file.mimetype}`))
  },
})

// ─── Upload Brand Logo ─────────────────────────────────────
router.post('/:id/logo', upload.single('file'), asyncHandler(async (req: AuthRequest, res) => {
  const brandId = req.params.id as string
  const brand = await prisma.brand.findUnique({ where: { id: brandId } })
  if (!brand) return res.status(404).json({ error: 'Brand not found' })

  const file = req.file
  if (!file) return res.status(400).json({ error: 'No file provided' })

  // Save file
  const ext = path.extname(file.originalname).toLowerCase() || '.png'
  const filename = `brand-${brandId.slice(0, 8)}-${Date.now()}${ext}`
  const filepath = path.join(UPLOAD_DIR, filename)
  fs.writeFileSync(filepath, file.buffer)
  const url = `/uploads/${filename}`

  // Delete old logo file if it exists
  if (brand.logoUrl && brand.logoUrl.startsWith('/uploads/')) {
    const oldPath = path.resolve(brand.logoUrl.slice(1))
    if (fs.existsSync(oldPath)) {
      fs.unlinkSync(oldPath)
    }
  }

  // Update brand logo URL
  const updated = await prisma.brand.update({
    where: { id: brandId },
    data: { logoUrl: url },
  })

  await logAudit({
    actor: req.user,
    action: 'brand.logo.upload',
    entityType: 'brand',
    entityId: brand.id,
    entityName: brand.name,
    newValue: { logoUrl: url },
    ipAddress: req.ip,
  })

  res.json({ brand: updated, url })
}))

export default router
