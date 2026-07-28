import { Router } from 'express'
import { prisma } from '../../server.js'
import { asyncHandler } from '../../middleware/validate.js'
import { sendSuccess, sendError } from '../../middleware/response.js'

const router = Router()

// ─── List Visible Categories ───────────────────────────────────
router.get('/', asyncHandler(async (_req, res) => {
  const categories = await prisma.category.findMany({
    where: { isVisible: true, parentId: null },
    include: {
      children: {
        where: { isVisible: true },
        orderBy: { sortOrder: 'asc' },
        include: { _count: { select: { products: { where: { status: 'published' } } } } },
      },
      _count: { select: { products: { where: { status: 'published' } } } },
    },
    orderBy: { sortOrder: 'asc' },
  })
  sendSuccess(res, { categories })
}))

// ─── Get Category by Slug ──────────────────────────────────────
router.get('/:slug', asyncHandler(async (req, res) => {
  const category = await prisma.category.findFirst({
    where: { slug: req.params.slug as string, isVisible: true },
    include: {
      children: {
        where: { isVisible: true },
        include: { _count: { select: { products: { where: { status: 'published' } } } } },
      },
      _count: { select: { products: { where: { status: 'published' } } } },
    },
  })
  if (!category) return sendError(res, 'Category not found', 404)
  sendSuccess(res, { category })
}))

export default router
