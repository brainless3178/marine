import { Router } from 'express'
import { prisma } from '../../server.js'
import { authenticateCustomer, AuthRequest } from '../../middleware/auth.js'
import { asyncHandler, validateBody } from '../../middleware/validate.js'
import { z } from 'zod'
import { generateOrderNumber } from '../../utils/helpers.js'
import { logAudit } from '../../utils/audit.js'
import { sendOrderCancelled } from '../../services/email.js'
import logger from '../../utils/logger.js'

const router = Router()

const shippingSchema = z.object({
  fullName: z.string().min(1),
  addressLine1: z.string().min(1),
  addressLine2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().min(1),
})

const orderSchema = z.object({
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive(),
  })).min(1),
  shipping: shippingSchema,
  paymentMethod: z.enum(['bank-transfer', 'paypal']),
  customerNotes: z.string().optional(),
  idempotencyKey: z.string().max(200).optional(),
})

// ─── Create Order from Checkout ────────────────────────────────
router.post('/', authenticateCustomer, validateBody(orderSchema), asyncHandler(async (req: AuthRequest, res) => {
  const { items, shipping, paymentMethod, customerNotes, idempotencyKey } = req.body

  // Idempotency: if a recent order with the same key exists, return it
  if (idempotencyKey) {
    const existingOrder = await prisma.order.findFirst({
      where: {
        customerId: req.user!.id,
        customerNotes: { contains: `[idem:${idempotencyKey}]` },
        createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) }, // 5 minute window
      },
      include: { items: true },
    })
    if (existingOrder) {
      return res.status(200).json({ order: existingOrder })
    }
  }

  // Validate products exist and calculate totals
  let subtotal = 0
  const orderItems = []

  for (const item of items) {
    const product = await prisma.product.findUnique({ where: { id: item.productId } })
    if (!product) return res.status(400).json({ error: `Product ${item.productId} not found` })
    if (product.stockCount < item.quantity) {
      return res.status(400).json({ error: `Insufficient stock for ${product.name}` })
    }
    const price = Number(product.salePrice && Number(product.salePrice) < Number(product.regularPrice) ? product.salePrice : product.regularPrice)
    orderItems.push({
      productId: product.id,
      productName: product.name,
      productSku: product.sku,
      quantity: item.quantity,
      unitPrice: price,
      totalPrice: price * item.quantity,
    })
    subtotal += price * item.quantity
  }

  // Get settings for shipping/tax
  const [shippingCostSetting, taxRateSetting] = await Promise.all([
    prisma.storeSetting.findUnique({ where: { key: 'checkout.shippingCost' } }),
    prisma.storeSetting.findUnique({ where: { key: 'checkout.taxRate' } }),
  ])

  const shippingCost = Number(shippingCostSetting?.value) || Number(process.env.DEFAULT_SHIPPING_COST) || 25
  const taxRate = Number(taxRateSetting?.value) || Number(process.env.DEFAULT_TAX_RATE) || 0.08
  const tax = Math.round(subtotal * taxRate * 100) / 100
  const total = subtotal + shippingCost + tax

  const order = await prisma.order.create({
    data: {
      orderNumber: await generateOrderNumber(),
      customerId: req.user!.id,
      status: 'pending',
      paymentMethod,
      paymentStatus: 'pending',
      subtotal,
      shippingCost,
      tax,
      total,
      currency: 'USD',
      shippingFullName: shipping.fullName,
      shippingAddressLine1: shipping.addressLine1,
      shippingAddressLine2: shipping.addressLine2 || null,
      shippingCity: shipping.city,
      shippingState: shipping.state || null,
      shippingPostalCode: shipping.postalCode || null,
      shippingCountry: shipping.country,
      customerNotes: idempotencyKey ? `[idem:${idempotencyKey}] ${customerNotes || ''}` : (customerNotes || null),
      items: { create: orderItems },
      timeline: { create: { status: 'pending', note: 'Order placed' } },
    },
    include: { items: true, timeline: true },
  })

  // Stock is NOT reduced here — it is reduced on payment confirmation
  // (PayPal webhook for card payments, admin status update for bank transfers)

  await logAudit({
    action: 'order.create',
    entityType: 'order',
    entityId: order.id,
    entityName: order.orderNumber,
    newValue: order,
  })

  // Note: Confirmation email is sent after payment is confirmed (webhook or admin status update)
  // For bank-transfer orders, the admin confirms payment which triggers the email.

  res.status(201).json({ order })
}))

// ─── List Own Orders ──────────────────────────────────────────
router.get('/', authenticateCustomer, asyncHandler(async (req: AuthRequest, res) => {
  const page = Math.max(1, Number(req.query.page) || 1)
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20))
  const skip = (page - 1) * limit

  const where = { customerId: req.user!.id }
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.order.count({ where }),
  ])

  res.json({
    orders,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  })
}))

// ─── Get Order (own orders only) ───────────────────────────────
router.get('/:id', authenticateCustomer, asyncHandler(async (req: AuthRequest, res) => {
  const order = await prisma.order.findFirst({
    where: { id: req.params.id as string, customerId: req.user!.id },
    include: { items: true, timeline: { orderBy: { createdAt: 'desc' } } },
  })
  if (!order) return res.status(404).json({ error: 'Order not found' })
  res.json({ order })
}))

// ─── Request Cancellation ──────────────────────────────────────
router.post('/:id/cancel', authenticateCustomer, asyncHandler(async (req: AuthRequest, res) => {
  const order = await prisma.order.findFirst({
    where: { id: req.params.id as string, customerId: req.user!.id },
  })
  if (!order) return res.status(404).json({ error: 'Order not found' })

  if (order.status === 'cancelled') return res.status(400).json({ error: 'Order already cancelled' })

  // Only set cancelRequested flag — admin must approve actual cancellation and refund
  const updated = await prisma.order.update({
    where: { id: req.params.id as string },
    data: {
      cancelRequested: true,
      cancelReason: req.body.reason || 'Customer requested',
      cancelRequestedAt: new Date(),
    },
  })

  await prisma.orderTimeline.create({
    data: { orderId: req.params.id as string, status: order.status, note: 'Cancellation requested: ' + (req.body.reason || 'No reason provided') },
  })

  // Send cancellation request notification (non-blocking)
  const cancelCustomer = await prisma.customer.findUnique({ where: { id: req.user!.id }, select: { email: true, name: true } })
  if (cancelCustomer) {
    sendOrderCancelled({
      to: cancelCustomer.email,
      customerName: cancelCustomer.name,
      orderNumber: updated.orderNumber,
      reason: req.body.reason || 'Customer cancellation request',
    }).catch(err => logger.error({ err }, 'Order cancel email failed'))
  }

  res.json({ order: updated })
}))

export default router
