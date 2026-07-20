import { Router } from 'express'
import { prisma } from '../../server.js'
import { authenticateCustomer, AuthRequest } from '../../middleware/auth.js'
import { asyncHandler, validateBody } from '../../middleware/validate.js'
import { z } from 'zod'
import logger from '../../utils/logger.js'
import { sendOrderConfirmation } from '../../services/email.js'
import { logAudit } from '../../utils/audit.js'
import { getPaypalAccessToken, PAYPAL_BASE, PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET } from '../../utils/paypal.js'

const router = Router()
const payLog = logger.child({ context: 'paypal' })

// ─── Get PayPal Client ID (for frontend SDK) ─────────────────
router.get('/client-id', asyncHandler(async (_req, res) => {
  if (!PAYPAL_CLIENT_ID) {
    return res.status(503).json({ error: 'PayPal not configured' })
  }
  res.json({ clientId: PAYPAL_CLIENT_ID })
}))

// ─── Create PayPal Order ─────────────────────────────────────
const createOrderSchema = z.object({
  orderId: z.string().uuid(),
})

router.post('/create-order', authenticateCustomer, validateBody(createOrderSchema), asyncHandler(async (req: AuthRequest, res) => {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    return res.status(503).json({ error: 'PayPal not configured' })
  }

  const { orderId } = req.body

  const order = await prisma.order.findFirst({
    where: { id: orderId, customerId: req.user!.id },
  })
  if (!order) return res.status(404).json({ error: 'Order not found' })
  if (order.paymentStatus === 'paid') {
    return res.status(400).json({ error: 'Order already paid' })
  }

  // Get PayPal access token
  const accessToken = await getPaypalAccessToken()
  if (!accessToken) {
    return res.status(502).json({ error: 'Failed to connect to PayPal' })
  }

  // Create PayPal order
  const paypalOrderRes = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: order.orderNumber,
        description: `Order ${order.orderNumber} — Alka Traders`,
        amount: {
          currency_code: order.currency || 'USD',
          value: Number(order.total).toFixed(2),
          breakdown: {
            item_total: { currency_code: order.currency || 'USD', value: Number(order.subtotal).toFixed(2) },
            shipping: { currency_code: order.currency || 'USD', value: Number(order.shippingCost).toFixed(2) },
            tax_total: { currency_code: order.currency || 'USD', value: Number(order.tax).toFixed(2) },
          },
        },
      }],
      application_context: {
        brand_name: 'Alka Traders',
        landing_page: 'BILLING',
        user_action: 'PAY_NOW',
        return_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/checkout?paypal=success&orderId=${orderId}`,
        cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/checkout?paypal=cancelled`,
      },
    }),
  })

  if (!paypalOrderRes.ok) {
    const err: Record<string, unknown> = await paypalOrderRes.json() as Record<string, unknown>
    payLog.error({ err, orderId }, 'PayPal create order failed')
    return res.status(502).json({ error: 'PayPal order creation failed' })
  }

  const paypalData = await paypalOrderRes.json() as { id: string }
  payLog.info({ orderId, paypalOrderId: paypalData.id }, 'PayPal order created')

  // Store PayPal order ID on our order
  await prisma.order.update({
    where: { id: orderId },
    data: { paymentIntentId: paypalData.id },
  })

  res.json({ paypalOrderId: paypalData.id })
}))

// ─── Capture PayPal Order ────────────────────────────────────
const captureSchema = z.object({
  paypalOrderId: z.string().min(1),
  orderId: z.string().uuid(),
})

router.post('/capture-order', authenticateCustomer, validateBody(captureSchema), asyncHandler(async (req: AuthRequest, res) => {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    return res.status(503).json({ error: 'PayPal not configured' })
  }

  const { paypalOrderId, orderId } = req.body

  const order = await prisma.order.findFirst({
    where: { id: orderId, customerId: req.user!.id },
    include: { items: true },
  })
  if (!order) return res.status(404).json({ error: 'Order not found' })
  if (order.paymentStatus === 'paid') {
    return res.status(400).json({ error: 'Order already paid' })
  }

  // Get PayPal access token
  const accessToken = await getPaypalAccessToken()
  if (!accessToken) {
    return res.status(502).json({ error: 'Failed to connect to PayPal' })
  }

  // Capture the PayPal order
  const captureRes = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${paypalOrderId}/capture`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
  })

  if (!captureRes.ok) {
    const err: Record<string, unknown> = await captureRes.json() as Record<string, unknown>
    payLog.error({ err, orderId, paypalOrderId }, 'PayPal capture failed')
    return res.status(502).json({ error: 'Payment capture failed' })
  }

  const captureData = await captureRes.json() as { status: string }

  if (captureData.status !== 'COMPLETED') {
    payLog.warn({ status: captureData.status, orderId }, 'PayPal capture not completed')
    return res.status(400).json({ error: 'Payment not completed', status: captureData.status })
  }

  // Atomic idempotency guard: only transition to paid if not already paid
  const updated = await prisma.order.updateMany({
    where: { id: orderId, paymentStatus: { not: 'paid' } },
    data: { paymentStatus: 'paid', status: 'confirmed' },
  })
  if (updated.count === 0) return res.json({ status: 'completed', orderId })

  await prisma.orderTimeline.create({
    data: { orderId, status: 'confirmed', note: 'Payment confirmed via PayPal' },
  })

  // Reduce stock — atomic guard prevents negative stock
  for (const item of order.items) {
    if (item.productId) {
      const affected = await prisma.$executeRawUnsafe(
        'UPDATE products SET stock_count = stock_count - $1 WHERE id = $2::uuid AND stock_count >= $1',
        item.quantity, item.productId
      )
      if (affected === 0) {
        payLog.warn({ productId: item.productId, quantity: item.quantity, orderId }, 'Stock insufficient during PayPal capture')
      }
    }
  }

  await logAudit({
    action: 'order.payment.confirmed',
    entityType: 'order',
    entityId: orderId,
    entityName: order.orderNumber,
    newValue: { paymentStatus: 'paid', status: 'confirmed', paypalOrderId },
  })

  // Send confirmation email (non-blocking)
  const customer = await prisma.customer.findUnique({ where: { id: req.user!.id }, select: { email: true, name: true } })
  if (customer) {
    const shippingAddr = [
      order.shippingAddressLine1, order.shippingAddressLine2,
      order.shippingCity, order.shippingState, order.shippingPostalCode, order.shippingCountry,
    ].filter(Boolean).join(', ')

    sendOrderConfirmation({
      to: customer.email,
      customerName: customer.name,
      orderNumber: order.orderNumber,
      items: order.items.map(i => ({ name: i.productName, quantity: i.quantity, price: Number(i.unitPrice) })),
      subtotal: Number(order.subtotal),
      shippingCost: Number(order.shippingCost),
      tax: Number(order.tax),
      total: Number(order.total),
      shippingAddress: shippingAddr,
    }).catch(err => payLog.error({ err }, 'Order confirmation email failed'))
  }

  payLog.info({ orderId, orderNumber: order.orderNumber, paypalOrderId }, 'PayPal payment captured')
  res.json({ status: 'completed', orderId })
}))

export default router
