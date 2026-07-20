import { Router } from 'express'
import { prisma } from '../../server.js'
import { asyncHandler } from '../../middleware/validate.js'

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
  res.json({ categories })
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
  if (!category) return res.status(404).json({ error: 'Category not found' })
  res.json({ category })
}))

export default router
