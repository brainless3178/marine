import { Router } from 'express'
import { prisma } from '../../server.js'
import { authenticateAdmin, requireRole, AuthRequest } from '../../middleware/auth.js'
import { asyncHandler, validateBody } from '../../middleware/validate.js'
import { z } from 'zod'
import { logAudit } from '../../utils/audit.js'
import { generateOrderNumber, generateOfferNumber, paginationParams, paginationResponse } from '../../utils/helpers.js'
import { rfqInclude } from '../../utils/prisma-helpers.js'
import { sendRfqResponse } from '../../services/email.js'
import logger from '../../utils/logger.js'

const router = Router()
router.use(authenticateAdmin)

const statusSchema = z.object({
  status: z.enum(['new', 'reviewing', 'awaiting-supplier', 'quote-sent', 'customer-replied', 'won', 'lost', 'closed']),
  note: z.string().optional(),
})

const assignSchema = z.object({
  assignedTo: z.string().uuid(),
})

const notesSchema = z.object({
  note: z.string().min(1),
  isInternal: z.boolean().optional(),
})

const respondSchema = z.object({
  message: z.string().min(1),
})

const convertToOfferSchema = z.object({
  offeredPrice: z.number().min(0),
  message: z.string().optional(),
})

const convertToOrderSchema = z.object({
  total: z.number().min(0),
  unitPrice: z.number().min(0),
})

// ─── List All RFQs ──────────────────────────────────────────
router.get('/', asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginationParams(Number(req.query.page), Number(req.query.limit))

  const where: any = {}
  if ((req.query.status as string)) where.status = (req.query.status as string)
  if ((req.query.urgency as string)) where.urgency = (req.query.urgency as string)
  if ((req.query.assignedTo as string)) where.assignedTo = (req.query.assignedTo as string)
  if ((req.query.search as string)) {
    where.OR = [
      { fullName: { contains: (req.query.search as string), mode: 'insensitive' } },
      { email: { contains: (req.query.search as string), mode: 'insensitive' } },
      { company: { contains: (req.query.search as string), mode: 'insensitive' } },
      { rfqNumber: { contains: (req.query.search as string), mode: 'insensitive' } },
      { productDescription: { contains: (req.query.search as string), mode: 'insensitive' } },
      { partNumber: { contains: (req.query.search as string), mode: 'insensitive' } },
    ]
  }

  const [rfqs, total] = await Promise.all([
    prisma.rfq.findMany({
      where,
      include: rfqInclude,
      orderBy: [
        { urgency: 'asc' }, // emergency first
        { createdAt: 'desc' },
      ],
      skip,
      take: limit,
    }),
    prisma.rfq.count({ where }),
  ])

  res.json({ rfqs, pagination: paginationResponse(total, page, limit) })
}))

// ─── Get RFQ Detail ─────────────────────────────────────────
router.get('/:id', asyncHandler(async (req, res) => {
  const rfq = await prisma.rfq.findUnique({
    where: { id: req.params.id as string },
    include: rfqInclude,
  })
  if (!rfq) return res.status(404).json({ error: 'RFQ not found' })
  res.json({ rfq })
}))

// ─── Update RFQ Status ──────────────────────────────────────
router.patch('/:id/status', requireRole('sales-agent'), validateBody(statusSchema), asyncHandler(async (req: AuthRequest, res) => {
  const rfq = await prisma.rfq.findUnique({ where: { id: req.params.id as string } })
  if (!rfq) return res.status(404).json({ error: 'RFQ not found' })

  const updated = await prisma.rfq.update({
    where: { id: req.params.id as string },
    data: { status: req.body.status },
  })

  // Add timeline note if provided
  if (req.body.note) {
    await prisma.rfqNote.create({
      data: {
        rfqId: rfq.id,
        authorId: req.user!.id,
        note: req.body.note,
        isInternal: true,
      },
    })
  }

  await logAudit({
    actor: req.user!,
    action: 'rfq.status.update',
    entityType: 'rfq',
    entityId: rfq.id,
    entityName: rfq.rfqNumber,
    previousValue: { status: rfq.status },
    newValue: { status: req.body.status },
    ipAddress: req.ip,
  })

  res.json({ rfq: updated })
}))

// ─── Assign RFQ ─────────────────────────────────────────────
router.patch('/:id/assign', requireRole('store-manager'), validateBody(assignSchema), asyncHandler(async (req: AuthRequest, res) => {
  const rfq = await prisma.rfq.findUnique({ where: { id: req.params.id as string } })
  if (!rfq) return res.status(404).json({ error: 'RFQ not found' })

  const assignee = await prisma.adminUser.findUnique({ where: { id: req.body.assignedTo } })
  if (!assignee) return res.status(400).json({ error: 'Assignee not found' })

  const updated = await prisma.rfq.update({
    where: { id: req.params.id as string },
    data: { assignedTo: req.body.assignedTo },
  })

  await logAudit({
    actor: req.user!,
    action: 'rfq.assign',
    entityType: 'rfq',
    entityId: rfq.id,
    entityName: rfq.rfqNumber,
    newValue: { assignedTo: assignee.name },
    ipAddress: req.ip,
  })

  res.json({ rfq: updated })
}))

// ─── Add Internal Note ──────────────────────────────────────
router.post('/:id/notes', requireRole('sales-agent'), validateBody(notesSchema), asyncHandler(async (req: AuthRequest, res) => {
  const rfq = await prisma.rfq.findUnique({ where: { id: req.params.id as string } })
  if (!rfq) return res.status(404).json({ error: 'RFQ not found' })

  const note = await prisma.rfqNote.create({
    data: {
      rfqId: rfq.id,
      authorId: req.user!.id,
      note: req.body.note,
      isInternal: req.body.isInternal ?? true,
    },
    include: {
      author: { select: { id: true, name: true, email: true } },
    },
  })

  await logAudit({
    actor: req.user!,
    action: 'rfq.note.add',
    entityType: 'rfq',
    entityId: rfq.id,
    entityName: rfq.rfqNumber,
    ipAddress: req.ip,
  })

  res.status(201).json({ note })
}))

// ─── Send Response to Customer ──────────────────────────────
router.post('/:id/respond', requireRole('sales-agent'), validateBody(respondSchema), asyncHandler(async (req: AuthRequest, res) => {
  const rfq = await prisma.rfq.findUnique({ where: { id: req.params.id as string } })
  if (!rfq) return res.status(404).json({ error: 'RFQ not found' })

  // Update status to quote-sent if currently new/reviewing
  if (rfq.status === 'new' || rfq.status === 'reviewing') {
    await prisma.rfq.update({ where: { id: rfq.id }, data: { status: 'quote-sent' } })
  }

  // Add as internal note
  await prisma.rfqNote.create({
    data: {
      rfqId: rfq.id,
      authorId: req.user!.id,
      note: `Response sent: ${req.body.message}`,
      isInternal: false,
    },
  })

  // Send email to customer (non-blocking)
  sendRfqResponse({
    to: rfq.email,
    customerName: rfq.fullName,
    rfqNumber: rfq.rfqNumber,
    message: req.body.message,
  }).catch(err => logger.error({ err }, 'RFQ response email failed'))

  await logAudit({
    actor: req.user!,
    action: 'rfq.respond',
    entityType: 'rfq',
    entityId: rfq.id,
    entityName: rfq.rfqNumber,
    ipAddress: req.ip,
  })

  res.json({ message: 'Response sent' })
}))

// ─── Convert RFQ to Offer ──────────────────────────────────
router.post('/:id/convert-to-offer', requireRole('store-manager'), validateBody(convertToOfferSchema), asyncHandler(async (req: AuthRequest, res) => {
  const rfq = await prisma.rfq.findUnique({ where: { id: req.params.id as string } })
  if (!rfq) return res.status(404).json({ error: 'RFQ not found' })

  const offer = await prisma.offer.create({
    data: {
      offerNumber: await generateOfferNumber(),
      customerEmail: rfq.email,
      offeredPrice: req.body.offeredPrice,
      quantity: rfq.quantity,
      message: req.body.message || `Converted from RFQ ${rfq.rfqNumber}`,
      status: 'pending',
      rfqId: rfq.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  })

  await prisma.rfq.update({ where: { id: rfq.id }, data: { status: 'quote-sent' } })

  await logAudit({
    actor: req.user!,
    action: 'rfq.convert-to-offer',
    entityType: 'rfq',
    entityId: rfq.id,
    entityName: rfq.rfqNumber,
    newValue: { offerId: offer.id, offerNumber: offer.offerNumber },
  })

  res.status(201).json({ offer })
}))

// ─── Convert RFQ to Order ────────────────────────────────────
router.post('/:id/convert-to-order', requireRole('store-manager'), validateBody(convertToOrderSchema), asyncHandler(async (req: AuthRequest, res) => {
  const rfq = await prisma.rfq.findUnique({ where: { id: req.params.id as string } })
  if (!rfq) return res.status(404).json({ error: 'RFQ not found' })

  const order = await prisma.order.create({
    data: {
      orderNumber: await generateOrderNumber(),
      status: 'pending',
      paymentMethod: 'bank-transfer',
      paymentStatus: 'pending',
      subtotal: req.body.total || 0,
      shippingCost: 25,
      tax: 0,
      total: (req.body.total || 0) + 25,
      currency: 'USD',
      shippingFullName: rfq.fullName,
      shippingCity: rfq.deliveryLocation || '',
      shippingCountry: rfq.country || '',
      customerNotes: `Converted from RFQ ${rfq.rfqNumber}`,
      items: {
        create: [{
          productName: rfq.productDescription.slice(0, 500),
          productSku: rfq.partNumber || '',
          quantity: rfq.quantity,
          unitPrice: req.body.unitPrice || 0,
          totalPrice: (req.body.unitPrice || 0) * rfq.quantity,
        }],
      },
      timeline: { create: { status: 'pending', note: `Converted from RFQ ${rfq.rfqNumber}` } },
    },
    include: { items: true },
  })

  await prisma.rfq.update({ where: { id: rfq.id }, data: { status: 'won' } })

  await logAudit({
    actor: req.user!,
    action: 'rfq.convert-to-order',
    entityType: 'rfq',
    entityId: rfq.id,
    entityName: rfq.rfqNumber,
    newValue: { orderId: order.id, orderNumber: order.orderNumber },
  })

  res.status(201).json({ order })
}))

export default router
