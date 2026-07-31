import { Router } from 'express'
import { asyncHandler } from '../../middleware/validate.js'
import { sendSuccess } from '../../middleware/response.js'
import * as settingsService from '../../services/settingsService.js'

const router = Router()

// ─── Get Public Settings ───────────────────────────────────────
router.get('/', asyncHandler(async (_req, res) => {
  sendSuccess(res, await settingsService.getPublicSettings())
}))

export default router
