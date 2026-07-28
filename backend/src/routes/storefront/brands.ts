import { Router } from 'express'
import { prisma } from '../../server.js'
import { asyncHandler } from '../../middleware/validate.js'
import { sendSuccess, sendError } from '../../middleware/response.js'

const router = Router()

// ─── List Visible Brands ───────────────────────────────────────
router.get('/', asyncHandler(async (_req, res) => {
  const brands = await prisma.brand.findMany({
    where: { isVisible: true },
    include: { _count: { select: { products: { where: { status: 'published' } } } } },
    orderBy: { sortOrder: 'asc' },
  })
  sendSuccess(res, { brands })
}))

// ─── Get Brand by Slug ─────────────────────────────────────────
router.get('/:slug', asyncHandler(async (req, res) => {
  const brand = await prisma.brand.findFirst({
    where: { slug: req.params.slug as string, isVisible: true },
    include: { _count: { select: { products: { where: { status: 'published' } } } } },
  })
  if (!brand) return sendError(res, 'Brand not found', 404)
  sendSuccess(res, { brand })
}))

export default router
