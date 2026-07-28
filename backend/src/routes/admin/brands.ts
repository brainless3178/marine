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

const brandSchema = z.object({
  name: z.string().min(1).max(255),
  logoUrl: z.string().optional().nullable(),
  sectors: z.array(z.string()).optional(),
  description: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  seoTitle: z.string().optional().nullable(),
  seoDescription: z.string().optional().nullable(),
  isVisible: z.boolean().optional(),
  sortOrder: z.number().optional(),
})

// ─── List All Brands ───────────────────────────────────────────
router.get('/', asyncHandler(async (_req, res) => {
  const brands = await prisma.brand.findMany({
    include: {
      _count: { select: { products: { where: { status: 'published' } } } },
    },
    orderBy: { sortOrder: 'asc' },
  })
  sendSuccess(res, { brands })
}))

// ─── Create Brand ──────────────────────────────────────────────
router.post('/', requireRole('inventory-manager'), validateBody(brandSchema), asyncHandler(async (req: AuthRequest, res) => {
  const slug = generateSlug(req.body.name)
  const existing = await prisma.brand.findUnique({ where: { slug } })
  if (existing) {
    return sendError(res, 'Brand with this name already exists', 400)
  }

  const brand = await prisma.brand.create({
    data: { ...req.body, slug },
  })

  await logAudit({ actor: req.user, action: 'brand.create', entityType: 'brand', entityId: brand.id, entityName: brand.name, newValue: brand, ipAddress: req.ip })
  sendSuccess(res, { brand }, 201)
}))

// ─── Update Brand ──────────────────────────────────────────────
router.put('/:id', requireRole('inventory-manager'), validateBody(brandSchema.partial()), asyncHandler(async (req: AuthRequest, res) => {
  const existing = await prisma.brand.findUnique({ where: { id: req.params.id as string } })
  if (!existing) {
    return sendError(res, 'Brand not found', 404)
  }

  let slug = existing.slug
  if (req.body.name && req.body.name !== existing.name) {
    slug = generateSlug(req.body.name)
    const slugExists = await prisma.brand.findFirst({ where: { slug, id: { not: req.params.id as string } } })
    if (slugExists) slug = `${slug}-${Date.now()}`
  }

  const brand = await prisma.brand.update({
    where: { id: req.params.id as string },
    data: { ...req.body, slug },
  })

  await logAudit({ actor: req.user, action: 'brand.update', entityType: 'brand', entityId: brand.id, entityName: brand.name, previousValue: existing, newValue: brand, ipAddress: req.ip })
  sendSuccess(res, { brand })
}))

// ─── Delete Brand ──────────────────────────────────────────────
router.delete('/:id', requireRole('store-manager'), asyncHandler(async (req: AuthRequest, res) => {
  const existing = await prisma.brand.findUnique({
    where: { id: req.params.id as string },
    include: { _count: { select: { products: true } } },
  })

  if (!existing) {
    return sendError(res, 'Brand not found', 404)
  }

  if (existing._count.products > 0) {
    return sendError(res, 'Cannot delete brand with products. Reassign products first.', 400)
  }

  await prisma.brand.delete({ where: { id: req.params.id as string } })
  await logAudit({ actor: req.user, action: 'brand.delete', entityType: 'brand', entityId: existing.id, entityName: existing.name, previousValue: existing, ipAddress: req.ip })
  sendSuccess(res, { message: 'Brand deleted' })
}))

export default router
