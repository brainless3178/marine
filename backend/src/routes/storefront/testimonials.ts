import { Router } from 'express'
import { prisma } from '../../server.js'
import { asyncHandler } from '../../middleware/validate.js'
import { sendSuccess } from '../../middleware/response.js'

const router = Router()

// ─── List Visible Testimonials ─────────────────────────────────
router.get('/', asyncHandler(async (_req, res) => {
  const testimonials = await prisma.testimonial.findMany({
    where: { isVisible: true },
    orderBy: { sortOrder: 'asc' },
  })
  sendSuccess(res, { testimonials })
}))

export default router
