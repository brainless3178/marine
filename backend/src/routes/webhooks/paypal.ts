import { Router } from 'express'
import { prisma } from '../../server.js'
import { logAudit } from '../../utils/audit.js'
import { sendOrderConfirmation } from '../../services/email.js'
import logger from '../../utils/logger.js'
import { getPaypalAccessToken, PAYPAL_BASE, PAYPAL_WEBHOOK_ID, PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET } from '../../utils/paypal.js'

const router = Router()
const hookLog = logger.child({ context: 'paypal-webhook' })

// ─── Validate PayPal cert_url (SSRF defense) ─────────────────
const ALLOWED_CERT_URL_PATTERNS = [
  /^https:\/\/api[.]paypal\.com\/v1\/notifications\/cert\/.*$/i,
  /^https:\/\/api-m[.]paypal\.com\/v1\/notifications\/cert\/.*$/i,
  /^https:\/\/api[.]sandbox[.]paypal\.com\/v1\/notifications\/cert\/.*$/i,
  /^https:\/\/api-m[.]sandbox[.]paypal\.com\/v1\/notifications\/cert\/.*$/i,
]

function isValidPaypalCertUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false
  return ALLOWED_CERT_URL_PATTERNS.some(pattern => pattern.test(url))
}

// ─── Verify PayPal Webhook Signature ────────────────────────
async function verifyPayPalWebhook(req: any): Promise<boolean> {
  if (!PAYPAL_WEBHOOK_ID) {
    if (process.env.NODE_ENV === 'production') {
      hookLog.fatal('PAYPAL_WEBHOOK_ID not configured in production — rejecting webhook')
      return false
    }
    hookLog.warn('PAYPAL_WEBHOOK_ID not configured — skipping signature verification (dev mode)')
    return true
  }

  // Validate cert_url to prevent SSRF to arbitrary endpoints
  const certUrl = req.headers['paypal-cert-url']
  if (!isValidPaypalCertUrl(certUrl)) {
    hookLog.warn({ certUrl }, 'Invalid PayPal cert_url — possible SSRF attempt')
    return false
  }

  try {
    const accessToken = await getPaypalAccessToken()
    if (!accessToken) return false

    const verificationPayload = {
      auth_algo: req.headers['paypal-auth-algo'],
      cert_url: certUrl,
      transmission_id: req.headers['paypal-transmission-id'],
      transmission_sig: req.headers['paypal-transmission-sig'],
      transmission_time: req.headers['paypal-transmission-time'],
      webhook_id: PAYPAL_WEBHOOK_ID,
      webhook_event: req.body,
    }

    const response = await fetch(`${PAYPAL_BASE}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(verificationPayload),
    })

    const data = await response.json() as { verification_status: string }
    return data.verification_status === 'SUCCESS'
  } catch (err) {
    hookLog.error({ err }, 'Webhook signature verification failed')
    return false
  }
}

// ─── PayPal Webhook Handler ──────────────────────────────────
router.post('/', async (req, res) => {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    return res.status(503).json({ error: 'PayPal not configured' })
  }

  // Verify webhook signature before processing
  const isValid = await verifyPayPalWebhook(req)
  if (!isValid) {
    hookLog.warn('PayPal webhook signature verification failed — rejecting webhook')
    return res.status(401).json({ error: 'Invalid webhook signature' })
  }

  const event = req.body
  hookLog.info({ eventType: event.event_type }, 'PayPal webhook received and verified')

  // Log webhook
  try {
    await prisma.webhookLog.create({
      data: {
        source: 'paypal',
        eventType: event.event_type || 'unknown',
        payload: event as any,
        status: 'received',
      },
    })
  } catch (err) {
    hookLog.error({ err }, 'Failed to log webhook')
  }

  // Handle capture events
  if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
    await handleCaptureCompleted(event.resource)
  } else if (event.event_type === 'PAYMENT.CAPTURE.DENIED') {
    await handleCaptureFailed(event.resource)
  }

  res.json({ received: true })
})

async function handleCaptureCompleted(resource: any) {
  try {
    // Find order by reference_id (orderNumber)
    const referenceId = resource?.supplementary_data?.related_ids?.order_id || resource?.custom_id
    if (!referenceId) return

    // Try finding by paymentIntentId (paypalOrderId) first, then by orderNumber
    let order = await prisma.order.findFirst({
      where: { paymentIntentId: referenceId },
      include: { items: true },
    })
    if (!order) {
      order = await prisma.order.findFirst({
        where: { orderNumber: referenceId },
        include: { items: true },
      })
    }
    if (!order || order.paymentStatus === 'paid') return

    // Atomic guard: only transition to paid if not already paid (prevents duplicate stock reduction)
    const updated = await prisma.order.updateMany({
      where: { id: order.id, paymentStatus: { not: 'paid' } },
      data: { paymentStatus: 'paid', status: 'confirmed' },
    })
    if (updated.count === 0) return // Already processed

    await prisma.orderTimeline.create({
      data: { orderId: order.id, status: 'confirmed', note: 'Payment confirmed via PayPal webhook' },
    })

    // Reduce stock — atomic guard prevents negative stock
    for (const item of order.items) {
      if (item.productId) {
        const affected = await prisma.$executeRawUnsafe(
          'UPDATE products SET stock_count = stock_count - $1 WHERE id = $2::uuid AND stock_count >= $1',
          item.quantity, item.productId
        )
        if (affected === 0) {
          hookLog.warn({ productId: item.productId, quantity: item.quantity, orderId: order.id }, 'Stock insufficient during webhook capture')
        }
      }
    }

    await logAudit({
      action: 'order.payment.confirmed',
      entityType: 'order',
      entityId: order.id,
      entityName: order.orderNumber,
      newValue: { paymentStatus: 'paid', status: 'confirmed' },
    })

    // Send confirmation email
    const customer = order.customerId
      ? await prisma.customer.findUnique({ where: { id: order.customerId }, select: { email: true, name: true } })
      : null
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
      }).catch(err => hookLog.error({ err }, 'Webhook order email failed'))
    }

    hookLog.info({ orderId: order.id, orderNumber: order.orderNumber }, 'Order paid via PayPal webhook')
  } catch (err) {
    hookLog.error({ err }, 'Error handling PayPal capture completed')
  }
}

async function handleCaptureFailed(resource: any) {
  try {
    const referenceId = resource?.supplementary_data?.related_ids?.order_id || resource?.custom_id
    if (!referenceId) return

    const order = await prisma.order.findFirst({
      where: { paymentIntentId: referenceId },
    })
    if (!order) return

    await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: 'pending' },
    })

    await prisma.orderTimeline.create({
      data: { orderId: order.id, status: order.status, note: 'PayPal payment capture denied' },
    })

    hookLog.warn({ orderId: order.id }, 'PayPal capture denied')
  } catch (err) {
    hookLog.error({ err }, 'Error handling PayPal capture failed')
  }
}

export default router
