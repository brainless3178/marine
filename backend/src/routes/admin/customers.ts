import { Router } from 'express'
import { prisma } from '../../server.js'
import { authenticateAdmin, requireRole, AuthRequest } from '../../middleware/auth.js'
import { asyncHandler, validateBody } from '../../middleware/validate.js'
import { z } from 'zod'
import { logAudit } from '../../utils/audit.js'
import { paginationParams, paginationResponse } from '../../utils/helpers.js'
import bcrypt from 'bcryptjs'

const router = Router()
router.use(authenticateAdmin)
router.use(requireRole('sales-agent'))

const createCustomerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
  company: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  website: z.string().optional(),
})

const updateCustomerSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  website: z.string().optional(),
  status: z.enum(['active', 'inactive', 'vip', 'new']).optional(),
})

const notesSchema = z.object({
  notes: z.string().min(1).max(5000),
})

const statusUpdateSchema = z.object({
  status: z.enum(['active', 'inactive', 'vip', 'new']),
})

// ─── List All Customers ────────────────────────────────────────
router.get('/', asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginationParams(Number(req.query.page), Number(req.query.limit))
  const where: any = {}
  if ((req.query.status as string)) where.status = (req.query.status as string)
  if ((req.query.search as string)) {
    where.OR = [
      { name: { contains: (req.query.search as string), mode: 'insensitive' } },
      { email: { contains: (req.query.search as string), mode: 'insensitive' } },
      { company: { contains: (req.query.search as string), mode: 'insensitive' } },
    ]
  }

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      include: { _count: { select: { orders: true, rfqs: true, offers: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.customer.count({ where }),
  ])

  res.json({ customers, pagination: paginationResponse(total, page, limit) })
}))

// ─── Get Customer Detail ───────────────────────────────────────
router.get('/:id', asyncHandler(async (req, res) => {
  const customer = await prisma.customer.findUnique({
    where: { id: req.params.id as string },
    include: {
      orders: { orderBy: { createdAt: 'desc' }, take: 10, select: { id: true, orderNumber: true, total: true, status: true, createdAt: true } },
      rfqs: { orderBy: { createdAt: 'desc' }, take: 10 },
      _count: { select: { orders: true, rfqs: true, offers: true } },
    },
  })
  if (!customer) return res.status(404).json({ error: 'Customer not found' })
  res.json({ customer })
}))

// ─── Create Customer ───────────────────────────────────────────
router.post('/', validateBody(createCustomerSchema), asyncHandler(async (req: AuthRequest, res) => {
  const { password, ...data } = req.body
  const passwordHash = await bcrypt.hash(password, 12)

  const existing = await prisma.customer.findUnique({ where: { email: data.email } })
  if (existing) return res.status(400).json({ error: 'Email already registered' })

  const customer = await prisma.customer.create({
    data: { ...data, passwordHash },
  })

  await logAudit({
    actor: req.user,
    action: 'customer.create',
    entityType: 'customer',
    entityId: customer.id,
    entityName: customer.name,
    newValue: { name: customer.name, email: customer.email },
    ipAddress: req.ip,
  })

  res.status(201).json({ customer: { id: customer.id, name: customer.name, email: customer.email, status: customer.status } })
}))

// ─── Update Customer ───────────────────────────────────────────
router.patch('/:id', validateBody(updateCustomerSchema), asyncHandler(async (req: AuthRequest, res) => {
  const existing = await prisma.customer.findUnique({ where: { id: req.params.id as string } })
  if (!existing) return res.status(404).json({ error: 'Customer not found' })

  const customer = await prisma.customer.update({
    where: { id: req.params.id as string },
    data: req.body,
  })

  await logAudit({
    actor: req.user,
    action: 'customer.update',
    entityType: 'customer',
    entityId: customer.id,
    entityName: customer.name,
    previousValue: { status: existing.status },
    newValue: req.body,
    ipAddress: req.ip,
  })

  res.json({ customer })
}))

// ─── Update Customer Status ────────────────────────────────────
router.patch('/:id/status', validateBody(statusUpdateSchema), asyncHandler(async (req: AuthRequest, res) => {
  const customer = await prisma.customer.update({
    where: { id: req.params.id as string },
    data: { status: req.body.status },
  })
  await logAudit({ actor: req.user, action: 'customer.status', entityType: 'customer', entityId: customer.id, entityName: customer.name, newValue: { status: req.body.status }, ipAddress: req.ip })
  res.json({ customer })
}))

// ─── Add Internal Note ─────────────────────────────────────────
router.post('/:id/notes', validateBody(notesSchema), asyncHandler(async (req: AuthRequest, res) => {
  const customer = await prisma.customer.findUnique({ where: { id: req.params.id as string } })
  if (!customer) return res.status(404).json({ error: 'Customer not found' })

  const updated = await prisma.customer.update({
    where: { id: req.params.id as string },
    data: { internalNotes: req.body.notes },
  })

  await logAudit({
    actor: req.user,
    action: 'customer.notes',
    entityType: 'customer',
    entityId: customer.id,
    entityName: customer.name,
    ipAddress: req.ip,
  })

  res.json({ customer: { id: updated.id, internalNotes: updated.internalNotes } })
}))

export default router
