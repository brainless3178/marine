import { Router } from 'express'
import { prisma } from '../../server.js'
import { authenticateAdmin, requireRole, AuthRequest } from '../../middleware/auth.js'
import { asyncHandler, validateBody } from '../../middleware/validate.js'
import { logAudit } from '../../utils/audit.js'
import { z } from 'zod'
import { generateSlug } from '../../utils/helpers.js'

const router = Router()
router.use(authenticateAdmin)

const industrySchema = z.object({
  name: z.string().min(1).max(255),
  icon: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  painPoints: z.array(z.string()).optional(),
  seoTitle: z.string().optional().nullable(),
  seoDescription: z.string().optional().nullable(),
  sortOrder: z.number().optional(),
  isVisible: z.boolean().optional(),
})

// ─── List All Industries ───────────────────────────────────────
router.get('/', asyncHandler(async (_req, res) => {
  const industries = await prisma.industry.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { sortOrder: 'asc' },
  })
  res.json({ industries })
}))

// ─── Create Industry ───────────────────────────────────────────
router.post('/', requireRole('inventory-manager'), validateBody(industrySchema), asyncHandler(async (req: AuthRequest, res) => {
  const slug = generateSlug(req.body.name)
  const existing = await prisma.industry.findUnique({ where: { slug } })
  if (existing) {
    return res.status(400).json({ error: 'Industry with this name already exists' })
  }

  const industry = await prisma.industry.create({
    data: { ...req.body, slug },
  })

  await logAudit({ actor: req.user, action: 'industry.create', entityType: 'industry', entityId: industry.id, entityName: industry.name, newValue: industry, ipAddress: req.ip })
  res.status(201).json({ industry })
}))

// ─── Update Industry ───────────────────────────────────────────
router.put('/:id', requireRole('inventory-manager'), validateBody(industrySchema.partial()), asyncHandler(async (req: AuthRequest, res) => {
  const existing = await prisma.industry.findUnique({ where: { id: req.params.id as string } })
  if (!existing) {
    return res.status(404).json({ error: 'Industry not found' })
  }

  let slug = existing.slug
  if (req.body.name && req.body.name !== existing.name) {
    slug = generateSlug(req.body.name)
    const slugExists = await prisma.industry.findFirst({ where: { slug, id: { not: req.params.id as string } } })
    if (slugExists) slug = `${slug}-${Date.now()}`
  }

  const industry = await prisma.industry.update({
    where: { id: req.params.id as string },
    data: { ...req.body, slug },
  })

  await logAudit({ actor: req.user, action: 'industry.update', entityType: 'industry', entityId: industry.id, entityName: industry.name, previousValue: existing, newValue: industry, ipAddress: req.ip })
  res.json({ industry })
}))

// ─── Delete Industry ───────────────────────────────────────────
router.delete('/:id', requireRole('store-manager'), asyncHandler(async (req: AuthRequest, res) => {
  const existing = await prisma.industry.findUnique({
    where: { id: req.params.id as string },
    include: { _count: { select: { products: true } } },
  })

  if (!existing) {
    return res.status(404).json({ error: 'Industry not found' })
  }

  if (existing._count.products > 0) {
    return res.status(400).json({ error: 'Cannot delete industry with products.' })
  }

  await prisma.industry.delete({ where: { id: req.params.id as string } })
  await logAudit({ actor: req.user, action: 'industry.delete', entityType: 'industry', entityId: existing.id, entityName: existing.name, previousValue: existing, ipAddress: req.ip })
  res.json({ message: 'Industry deleted' })
}))

export default router
