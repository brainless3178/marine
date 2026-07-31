import { Router } from 'express'
import { asyncHandler, validateParams } from '../../middleware/validate.js'
import { sendSuccess, sendError } from '../../middleware/response.js'
import { z } from 'zod'
import * as brandService from '../../services/brandService.js'

const router = Router()

const slugParamsSchema = z.object({
  slug: z.string().min(1).max(200),
})

// ─── List Visible Brands ───────────────────────────────────────
router.get('/', asyncHandler(async (_req, res) => {
  sendSuccess(res, await brandService.listStorefrontBrands())
}))

// ─── Get Brand by Slug ─────────────────────────────────────────
router.get('/:slug', validateParams(slugParamsSchema), asyncHandler(async (req, res) => {
  try {
    sendSuccess(res, await brandService.getBrandBySlug(req.params.slug as string))
  } catch (err: any) {
    sendError(res, err.message, err.status || 500)
  }
}))

export default router
