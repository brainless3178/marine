import { Router } from 'express'
import { prisma } from '../../server.js'
import { asyncHandler, validateBody } from '../../middleware/validate.js'
import { z } from 'zod'
import { authenticateAdmin, AuthRequest } from '../../middleware/auth.js'
import { logAudit } from '../../utils/audit.js'

const router = Router()

// ─── List Visible Offices (Public) ───────────────────────────
router.get('/', asyncHandler(async (_req, res) => {
  const offices = await prisma.office.findMany({
    where: { isVisible: true },
    orderBy: { sortOrder: 'asc' },
  })
  res.json({ offices })
}))

// ─── Admin: List All Offices (must be before /:slug) ──────────
router.get('/admin/all', authenticateAdmin, asyncHandler(async (_req, res) => {
  const offices = await prisma.office.findMany({
    orderBy: { sortOrder: 'asc' },
  })
  res.json({ offices })
}))

// ─── Admin: Update All Offices ────────────────────────────────
const officeSchema = z.object({
  offices: z.array(z.object({
    id: z.string().uuid().optional(),
    city: z.string().min(1),
    country: z.string().min(1),
    address: z.string().optional(),
    timezone: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    coordinatesLat: z.number().optional(),
    coordinatesLng: z.number().optional(),
    sortOrder: z.number().optional(),
    isVisible: z.boolean().optional(),
  })),
})

router.put('/admin', authenticateAdmin, validateBody(officeSchema), asyncHandler(async (req: AuthRequest, res) => {
  // Delete existing and recreate
  await prisma.office.deleteMany()
  await prisma.office.createMany({
    data: req.body.offices.map((o: any, i: number) => ({
      city: o.city,
      country: o.country,
      address: o.address,
      timezone: o.timezone,
      phone: o.phone,
      email: o.email,
      coordinatesLat: o.coordinatesLat,
      coordinatesLng: o.coordinatesLng,
      sortOrder: o.sortOrder ?? i,
      isVisible: o.isVisible ?? true,
    })),
  })

  const result = await prisma.office.findMany({ orderBy: { sortOrder: 'asc' } })

  await logAudit({
    actor: req.user,
    action: 'offices.update',
    entityType: 'office',
    entityName: result.map(o => o.city).join(', '),
    ipAddress: req.ip,
  })

  res.json({ offices: result })
}))

// ─── Get Office by Slug (Public — must be last) ───────────────
router.get('/:slug', asyncHandler(async (req, res) => {
  const office = await prisma.office.findFirst({
    where: { city: req.params.slug as string, isVisible: true },
  })
  if (!office) return res.status(404).json({ error: 'Office not found' })
  res.json({ office })
}))

export default router
