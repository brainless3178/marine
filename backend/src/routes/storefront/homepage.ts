import { Router } from 'express'
import { asyncHandler } from '../../middleware/validate.js'
import { sendSuccess } from '../../middleware/response.js'
import * as homepageService from '../../services/homepageService.js'

const router = Router()

// ─── Get Enabled Homepage Sections ─────────────────────────────
router.get('/', asyncHandler(async (_req, res) => {
  sendSuccess(res, await homepageService.listStorefrontSections())
}))

export default router
