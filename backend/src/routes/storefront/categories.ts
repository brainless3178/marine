import { Router } from 'express'
import { asyncHandler, validateParams } from '../../middleware/validate.js'
import { sendSuccess, sendError } from '../../middleware/response.js'
import { z } from 'zod'
import * as categoryService from '../../services/categoryService.js'

const router = Router()

const slugParamsSchema = z.object({
  slug: z.string().min(1).max(200),
})

// ─── List Visible Categories ───────────────────────────────────
router.get('/', asyncHandler(async (_req, res) => {
  sendSuccess(res, await categoryService.listStorefrontCategories())
}))

// ─── Get Category by Slug ──────────────────────────────────────
router.get('/:slug', validateParams(slugParamsSchema), asyncHandler(async (req, res) => {
  try {
    sendSuccess(res, await categoryService.getCategoryBySlug(req.params.slug as string))
  } catch (err: any) {
    sendError(res, err.message, err.status || 500)
  }
}))

export default router
