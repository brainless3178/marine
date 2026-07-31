import { Router } from 'express'
import { asyncHandler } from '../../middleware/validate.js'
import { sendSuccess } from '../../middleware/response.js'
import * as testimonialService from '../../services/testimonialService.js'

const router = Router()

// ─── List Visible Testimonials ─────────────────────────────────
router.get('/', asyncHandler(async (_req, res) => {
  sendSuccess(res, await testimonialService.listStorefrontTestimonials())
}))

export default router
