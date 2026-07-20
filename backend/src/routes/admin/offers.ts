import { Router } from 'express'
import { prisma } from '../../server.js'
import { authenticateAdmin, requireRole, AuthRequest } from '../../middleware/auth.js'
import { asyncHandler, validateBody } from '../../middleware/validate.js'
import { z } from 'zod'
import { paginationParams, paginationResponse, generateOrderNumber } from '../../utils/helpers.js'
import { logAudit } from '../../utils/audit.js'
import { sendOfferDecision } from '../../services/email.js'
import logger from '../../utils/logger.js'

const router = Router()
router.use(authenticateAdmin)

const counterSchema = z.object({ counterPrice: z.number().positive() })

// ─── List All Offers ───────────────────────────────────────────
router.get('/', asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginationParams(Number(req.query.page), Number(req.query.limit))

  const where: any = {}
  if ((req.query.status as string)) where.status = (req.query.status as string)
  if ((req.query.productId as string)) where.productId = (req.query.productId as string)

  const [offers, total] = await Promise.all([
    prisma.offer.findMany({
      where,
      include: {
        product: { select: { id: true, name: true, sku: true, regularPrice: true } },
        rfq: { select: { id: true, rfqNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip, take: limit,
    }),
    prisma.offer.count({ where }),
  ])

  res.json({ offers, pagination: paginationResponse(total, page, limit) })
}))

// ─── Get Offer Detail ──────────────────────────────────────────
router.get('/:id', asyncHandler(async (req, res) => {
  const offer = await prisma.offer.findUnique({
    where: { id: req.params.id as string },
    include: {
      product: { select: { id: true, name: true, sku: true, regularPrice: true, salePrice: true, stockCount: true } },
      rfq: { select: { id: true, rfqNumber: true } },
    },
  })
  if (!offer) return res.status(404).json({ error: 'Offer not found' })
  res.json({ offer })
}))

// ─── Accept Offer ──────────────────────────────────────────────
router.patch('/:id/accept', requireRole('sales-agent'), asyncHandler(async (req: AuthRequest, res) => {
  const offer = await prisma.offer.update({
    where: { id: req.params.id as string },
    data: { status: 'accepted', respondedAt: new Date() },
    include: { product: { select: { name: true } } },
  })
  await logAudit({ actor: req.user!, action: 'offer.accept', entityType: 'offer', entityId: offer.id })
  sendOfferDecision({ to: offer.customerEmail, offerNumber: offer.offerNumber, productName: offer.product?.name || 'Unknown', decision: 'accepted' }).catch(err => logger.error({ err }, 'Offer email failed'))
  res.json({ offer })
}))

// ─── Reject Offer ──────────────────────────────────────────────
router.patch('/:id/reject', requireRole('sales-agent'), asyncHandler(async (req: AuthRequest, res) => {
  const offer = await prisma.offer.update({
    where: { id: req.params.id as string },
    data: { status: 'rejected', respondedAt: new Date() },
    include: { product: { select: { name: true } } },
  })
  await logAudit({ actor: req.user!, action: 'offer.reject', entityType: 'offer', entityId: offer.id })
  sendOfferDecision({ to: offer.customerEmail, offerNumber: offer.offerNumber, productName: offer.product?.name || 'Unknown', decision: 'rejected' }).catch(err => logger.error({ err }, 'Offer email failed'))
  res.json({ offer })
}))

// ─── Counter Offer ─────────────────────────────────────────────
router.patch('/:id/counter', requireRole('sales-agent'), validateBody(counterSchema), asyncHandler(async (req: AuthRequest, res) => {
  const offer = await prisma.offer.update({
    where: { id: req.params.id as string },
    data: { status: 'countered', counterPrice: req.body.counterPrice, respondedAt: new Date() },
    include: { product: { select: { name: true } } },
  })
  await logAudit({ actor: req.user!, action: 'offer.counter', entityType: 'offer', entityId: offer.id })
  sendOfferDecision({ to: offer.customerEmail, offerNumber: offer.offerNumber, productName: offer.product?.name || 'Unknown', decision: 'countered', counterPrice: req.body.counterPrice }).catch(err => logger.error({ err }, 'Offer email failed'))
  res.json({ offer })
}))

// ─── Convert Offer to Order ──────────────────────────────────
router.post('/:id/convert-to-order', requireRole('store-manager'), asyncHandler(async (req: AuthRequest, res) => {
  const offer = await prisma.offer.findUnique({
    where: { id: req.params.id as string },
    include: { product: { select: { id: true, name: true, sku: true, regularPrice: true, salePrice: true } } },
  })
  if (!offer) return res.status(404).json({ error: 'Offer not found' })
  if (offer.status !== 'accepted') return res.status(400).json({ error: 'Only accepted offers can be converted to orders' })

  const price = Number(offer.counterPrice || offer.offeredPrice)

  const order = await prisma.order.create({
    data: {
      orderNumber: await generateOrderNumber(),
      status: 'pending',
      paymentMethod: 'bank-transfer',
      paymentStatus: 'pending',
      subtotal: price * offer.quantity,
      shippingCost: 25,
      tax: 0,
      total: price * offer.quantity + 25,
      currency: 'USD',
      customerNotes: `Converted from offer ${offer.offerNumber}`,
      customerId: offer.customerId || undefined,
      items: {
        create: [{
          productId: offer.productId || undefined,
          productName: offer.product?.name || 'Unknown Product',
          productSku: offer.product?.sku || '',
          quantity: offer.quantity,
          unitPrice: price,
          totalPrice: price * offer.quantity,
        }],
      },
      timeline: { create: { status: 'pending', note: `Converted from offer ${offer.offerNumber}` } },
    },
    include: { items: true },
  })

  await prisma.offer.update({ where: { id: offer.id }, data: { status: 'converted-to-order' } })

  await logAudit({
    actor: req.user!,
    action: 'offer.convert-to-order',
    entityType: 'offer',
    entityId: offer.id,
    entityName: offer.offerNumber,
    newValue: { orderId: order.id, orderNumber: order.orderNumber },
  })

  res.status(201).json({ order })
}))

export default router
