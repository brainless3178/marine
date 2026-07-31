import { Router } from 'express'
import { authenticateAdmin, requireRole, AuthRequest } from '../../middleware/auth.js'
import { asyncHandler, validateBody } from '../../middleware/validate.js'
import { z } from 'zod'
import { sendSuccess, sendError } from '../../middleware/response.js'
import * as testimonialService from '../../services/testimonialService.js'

const router = Router()
router.use(authenticateAdmin)

const testimonialSchema = z.object({
  testimonials: z.array(z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(1),
    role: z.string().optional(),
    company: z.string().optional(),
    avatarUrl: z.string().optional(),
    text: z.string().min(1),
    rating: z.number().min(1).max(5).optional(),
    sortOrder: z.number().optional(),
    isVisible: z.boolean().optional(),
  })),
})

// ─── List All Testimonials ────────────────────────────────────
router.get('/', asyncHandler(async (_req, res) => {
  sendSuccess(res, await testimonialService.listAdminTestimonials())
}))

// ─── Update All Testimonials ──────────────────────────────────
router.put('/', requireRole('content-manager'), validateBody(testimonialSchema), asyncHandler(async (req: AuthRequest, res) => {
  try {
    sendSuccess(res, await testimonialService.bulkUpdateTestimonials(req.body.testimonials, req.user!, req.ip))
  } catch (err: any) {
    sendError(res, err.message, err.status || 500)
  }
}))

export default router
