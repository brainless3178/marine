import { Router } from 'express'
import { z } from 'zod'
import multer from 'multer'
import { authenticateAdmin, requireRole, AuthRequest } from '../../middleware/auth.js'
import { asyncHandler, validateBody, validateQuery, validateParams } from '../../middleware/validate.js'
import * as mediaService from '../../services/mediaService.js'
import { sendSuccess, sendError } from '../../middleware/response.js'

const router = Router()
router.use(authenticateAdmin)

// ─── Zod Schemas ───────────────────────────────────────────────
const listMediaQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(24).optional(),
  search: z.string().max(200).optional(),
})

const uuidParamSchema = z.object({
  id: z.string().uuid(),
})

const uploadResponseSchema = z.object({
  asset: z.object({
    id: z.string(),
    url: z.string(),
    filename: z.string(),
  }).optional(),
  message: z.string().optional(),
})

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
router.get('/', validateQuery(listMediaQuerySchema), asyncHandler(async (req, res) => {
  const result = await mediaService.listMediaAssets({
    search: req.query.search as string,
    page: Number(req.query.page),
    limit: Number(req.query.limit),
  })
  sendSuccess(res, result)
}))

// ─── Get Media Usage ───────────────────────────────────────────
router.get('/:id/usage', validateParams(uuidParamSchema), asyncHandler(async (req, res) => {
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
  } catch (err: unknown) {
    const e = err as { message?: string; status?: number }
    sendError(res, e.message || 'Upload failed', e.status || 500)
  }
}))

// ─── Delete Media ──────────────────────────────────────────────
router.delete('/:id', requireRole('inventory-manager'), validateParams(uuidParamSchema), asyncHandler(async (req: AuthRequest, res) => {
  try {
    const result = await mediaService.deleteMedia(req.params.id as string)
    sendSuccess(res, result)
  } catch (err: unknown) {
    const e = err as { message?: string; status?: number }
    sendError(res, e.message || 'Delete failed', e.status || 500)
  }
}))

export default router
