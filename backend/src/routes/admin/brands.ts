import { Router } from 'express'
import { prisma } from '../../server.js'
import { authenticateAdmin, requireRole, AuthRequest } from '../../middleware/auth.js'
import { asyncHandler, validateBody } from '../../middleware/validate.js'
import { logAudit } from '../../utils/audit.js'
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
  res.json({ brands })
}))

// ─── Create Brand ──────────────────────────────────────────────
router.post('/', requireRole('inventory-manager'), validateBody(brandSchema), asyncHandler(async (req: AuthRequest, res) => {
  const slug = generateSlug(req.body.name)
  const existing = await prisma.brand.findUnique({ where: { slug } })
  if (existing) {
    return res.status(400).json({ error: 'Brand with this name already exists' })
  }

  const brand = await prisma.brand.create({
    data: { ...req.body, slug },
  })

  await logAudit({ actor: req.user, action: 'brand.create', entityType: 'brand', entityId: brand.id, entityName: brand.name, newValue: brand, ipAddress: req.ip })
  res.status(201).json({ brand })
}))

// ─── Update Brand ──────────────────────────────────────────────
router.put('/:id', requireRole('inventory-manager'), validateBody(brandSchema.partial()), asyncHandler(async (req: AuthRequest, res) => {
  const existing = await prisma.brand.findUnique({ where: { id: req.params.id as string } })
  if (!existing) {
    return res.status(404).json({ error: 'Brand not found' })
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
  res.json({ brand })
}))

// ─── Delete Brand ──────────────────────────────────────────────
router.delete('/:id', requireRole('store-manager'), asyncHandler(async (req: AuthRequest, res) => {
  const existing = await prisma.brand.findUnique({
    where: { id: req.params.id as string },
    include: { _count: { select: { products: true } } },
  })

  if (!existing) {
    return res.status(404).json({ error: 'Brand not found' })
  }

  if (existing._count.products > 0) {
    return res.status(400).json({ error: 'Cannot delete brand with products. Reassign products first.' })
  }

  await prisma.brand.delete({ where: { id: req.params.id as string } })
  await logAudit({ actor: req.user, action: 'brand.delete', entityType: 'brand', entityId: existing.id, entityName: existing.name, previousValue: existing, ipAddress: req.ip })
  res.json({ message: 'Brand deleted' })
}))

export default router
