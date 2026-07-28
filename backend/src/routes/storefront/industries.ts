import { Router } from 'express'
import { prisma } from '../../server.js'
import { asyncHandler } from '../../middleware/validate.js'
import { sendSuccess, sendError } from '../../middleware/response.js'

const router = Router()

// ─── List Visible Industries ───────────────────────────────────
router.get('/', asyncHandler(async (_req, res) => {
  const industries = await prisma.industry.findMany({
    where: { isVisible: true },
    include: { _count: { select: { products: true } } },
    orderBy: { sortOrder: 'asc' },
  })
  sendSuccess(res, { industries })
}))

// ─── Get Industry by Slug ──────────────────────────────────────
router.get('/:slug', asyncHandler(async (req, res) => {
  const industry = await prisma.industry.findFirst({
    where: { slug: req.params.slug as string, isVisible: true },
    include: { _count: { select: { products: true } } },
  })
  if (!industry) return sendError(res, 'Industry not found', 404)
  sendSuccess(res, { industry })
}))

export default router
