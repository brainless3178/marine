import { Router } from 'express'
import { prisma } from '../../server.js'
import { authenticateAdmin, requireRole, AuthRequest } from '../../middleware/auth.js'
import { asyncHandler, validateBody } from '../../middleware/validate.js'
import { logAudit } from '../../utils/audit.js'
import { sendSuccess, sendError } from '../../middleware/response.js'
import { z } from 'zod'
import { generateSlug } from '../../utils/helpers.js'

const router = Router()
router.use(authenticateAdmin)

const categorySchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  parentId: z.string().uuid().optional().nullable(),
  icon: z.string().optional().nullable(),
  seoTitle: z.string().optional().nullable(),
  seoDescription: z.string().optional().nullable(),
  sortOrder: z.number().optional(),
  isVisible: z.boolean().optional(),
})

// ─── List All Categories ───────────────────────────────────────
router.get('/', asyncHandler(async (_req, res) => {
  const categories = await prisma.category.findMany({
    where: { parentId: null },
    include: {
      children: {
        orderBy: { sortOrder: 'asc' },
        include: {
          _count: { select: { products: { where: { status: 'published' } } } },
        },
      },
      _count: { select: { products: { where: { status: 'published' } } } },
    },
    orderBy: { sortOrder: 'asc' },
  })

  sendSuccess(res, { categories })
}))

// ─── Create Category ───────────────────────────────────────────
router.post('/', requireRole('inventory-manager'), validateBody(categorySchema), asyncHandler(async (req: AuthRequest, res) => {
  const slug = generateSlug(req.body.name)
  const existing = await prisma.category.findUnique({ where: { slug } })
  if (existing) {
    return sendError(res, 'Category with this name already exists', 400)
  }

  const category = await prisma.category.create({
    data: { ...req.body, slug },
  })

  await logAudit({ actor: req.user, action: 'category.create', entityType: 'category', entityId: category.id, entityName: category.name, newValue: category, ipAddress: req.ip })
  sendSuccess(res, { category }, 201)
}))

// ─── Update Category ───────────────────────────────────────────
router.put('/:id', requireRole('inventory-manager'), validateBody(categorySchema.partial()), asyncHandler(async (req: AuthRequest, res) => {
  const existing = await prisma.category.findUnique({ where: { id: req.params.id as string } })
  if (!existing) {
    return sendError(res, 'Category not found', 404)
  }

  let slug = existing.slug
  if (req.body.name && req.body.name !== existing.name) {
    slug = generateSlug(req.body.name)
    const slugExists = await prisma.category.findFirst({ where: { slug, id: { not: req.params.id as string } } })
    if (slugExists) slug = `${slug}-${Date.now()}`
  }

  const category = await prisma.category.update({
    where: { id: req.params.id as string },
    data: { ...req.body, slug },
  })

  await logAudit({ actor: req.user, action: 'category.update', entityType: 'category', entityId: category.id, entityName: category.name, previousValue: existing, newValue: category, ipAddress: req.ip })
  sendSuccess(res, { category })
}))

// ─── Delete Category ───────────────────────────────────────────
router.delete('/:id', requireRole('store-manager'), asyncHandler(async (req: AuthRequest, res) => {
  const existing = await prisma.category.findUnique({
    where: { id: req.params.id as string },
    include: { _count: { select: { products: true, children: true } } },
  })

  if (!existing) {
    return sendError(res, 'Category not found', 404)
  }

  if (existing._count.products > 0) {
    return sendError(res, 'Cannot delete category with products. Move products first.', 400)
  }

  if (existing._count.children > 0) {
    return sendError(res, 'Cannot delete category with subcategories.', 400)
  }

  await prisma.category.delete({ where: { id: req.params.id as string } })
  await logAudit({ actor: req.user, action: 'category.delete', entityType: 'category', entityId: existing.id, entityName: existing.name, previousValue: existing, ipAddress: req.ip })
  sendSuccess(res, { message: 'Category deleted' })
}))

// ─── Reorder Categories ────────────────────────────────────────
router.patch('/:id/reorder', requireRole('inventory-manager'), asyncHandler(async (req: AuthRequest, res) => {
  const { sortOrder } = req.body
  const category = await prisma.category.update({
    where: { id: req.params.id as string },
    data: { sortOrder },
  })
  await logAudit({ actor: req.user, action: 'category.reorder', entityType: 'category', entityId: category.id, entityName: category.name, newValue: { sortOrder }, ipAddress: req.ip })
  sendSuccess(res, { category })
}))

export default router
