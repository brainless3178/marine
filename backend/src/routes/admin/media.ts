import { Router } from 'express'
import multer from 'multer'
import { authenticateAdmin, requireRole, AuthRequest } from '../../middleware/auth.js'
import { asyncHandler } from '../../middleware/validate.js'
import * as mediaService from '../../services/mediaService.js'
import { sendSuccess, sendError } from '../../middleware/response.js'

const router = Router()
router.use(authenticateAdmin)

// ─── Multer Config ────────────────────────────────────────────
const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']
    if (allowed.includes(file.mimetype)) cb(null, true)
    else cb(new Error(`Unsupported file type: ${file.mimetype}`))
  },
})

// ─── List Media Assets ─────────────────────────────────────────
router.get('/', asyncHandler(async (req, res) => {
  const result = await mediaService.listMediaAssets({
    search: req.query.search as string,
    page: Number(req.query.page),
    limit: Number(req.query.limit),
  })
  sendSuccess(res, result)
}))

// ─── Get Media Usage ───────────────────────────────────────────
router.get('/:id/usage', asyncHandler(async (req, res) => {
  const result = await mediaService.getMediaUsage(req.params.id as string)
  sendSuccess(res, result)
}))

// ─── Upload Media ─────────────────────────────────────────────
router.post('/upload', upload.single('file'), asyncHandler(async (req: AuthRequest, res) => {
  try {
    const result = await mediaService.uploadMedia(req.file!, req.user!)
    if (result.message) {
      return sendSuccess(res, result)
    }
    sendSuccess(res, result, 201)
  } catch (err: any) {
    sendError(res, err.message, err.status || 500)
  }
}))

// ─── Delete Media ──────────────────────────────────────────────
router.delete('/:id', requireRole('inventory-manager'), asyncHandler(async (req: AuthRequest, res) => {
  try {
    const result = await mediaService.deleteMedia(req.params.id as string)
    sendSuccess(res, result)
  } catch (err: any) {
    sendError(res, err.message, err.status || 500)
  }
}))

export default router
