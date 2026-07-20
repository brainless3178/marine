import { Router } from 'express'
import { prisma } from '../../server.js'
import { authenticateAdmin, requireRole, AuthRequest } from '../../middleware/auth.js'
import { asyncHandler, validateBody } from '../../middleware/validate.js'
import { z } from 'zod'
import { logAudit } from '../../utils/audit.js'

const router = Router()
router.use(authenticateAdmin)

const testimonialSchema = z.object({
  testimonials: z.array(z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(1),
    role: z.string().optional(),
    company: z.string().optional(),
    avatarUrl: z.string().optional(),
    text: z.string().min(1),
    rating: z.number().min(1).max(5).optional(),
    sortOrder: z.number().optional(),
    isVisible: z.boolean().optional(),
  })),
})

// ─── List All Testimonials ────────────────────────────────────
router.get('/', asyncHandler(async (_req, res) => {
  const testimonials = await prisma.testimonial.findMany({
    orderBy: { sortOrder: 'asc' },
  })
  res.json({ testimonials })
}))

// ─── Update All Testimonials ──────────────────────────────────
router.put('/', requireRole('content-manager'), validateBody(testimonialSchema), asyncHandler(async (req: AuthRequest, res) => {
  // Delete existing and recreate
  await prisma.testimonial.deleteMany()
  await prisma.testimonial.createMany({
    data: req.body.testimonials.map((t: any, i: number) => ({
      name: t.name,
      role: t.role,
      company: t.company,
      avatarUrl: t.avatarUrl,
      text: t.text,
      rating: t.rating ?? 5,
      sortOrder: t.sortOrder ?? i,
      isVisible: t.isVisible ?? true,
    })),
  })

  const result = await prisma.testimonial.findMany({ orderBy: { sortOrder: 'asc' } })

  await logAudit({
    actor: req.user,
    action: 'testimonials.update',
    entityType: 'testimonial',
    entityName: result.map(t => t.name).join(', '),
    ipAddress: req.ip,
  })

  res.json({ testimonials: result })
}))

export default router
