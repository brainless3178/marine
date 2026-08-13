import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { authenticateAdmin, requireRole, AuthRequest } from '../../middleware/auth.js'
import { asyncHandler } from '../../middleware/validate.js'
import { sendSuccess, sendError } from '../../middleware/response.js'
import * as brandLogoService from '../../services/brandLogoService.js'

const router = Router()
router.use(authenticateAdmin)
// Brand logo uploads are content — require at least content-manager.
router.use(requireRole('content-manager'))

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
  try {
    const result = await brandLogoService.uploadBrandLogo(
      req.params.id as string,
      req.file!,
      req.user!,
      req.ip
    )
    sendSuccess(res, result)
  } catch (err: unknown) {
    const e = err as { message?: string; status?: number }
    sendError(res, e.message || 'Logo upload failed', e.status || 500)
  }
}))

export default router
