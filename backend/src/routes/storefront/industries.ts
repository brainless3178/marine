import { Router } from 'express'
import { asyncHandler } from '../../middleware/validate.js'
import { sendSuccess, sendError } from '../../middleware/response.js'
import * as industryService from '../../services/industryService.js'

const router = Router()

// ─── List Visible Industries ───────────────────────────────────
router.get('/', asyncHandler(async (_req, res) => {
  sendSuccess(res, await industryService.listStorefrontIndustries())
}))

// ─── Get Industry by Slug ──────────────────────────────────────
router.get('/:slug', asyncHandler(async (req, res) => {
  try {
    sendSuccess(res, await industryService.getIndustryBySlug(req.params.slug as string))
  } catch (err: any) {
    sendError(res, err.message, err.status || 500)
  }
}))

export default router
