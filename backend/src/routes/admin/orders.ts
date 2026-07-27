import { Router } from 'express'
import { prisma } from '../../server.js'
import { authenticateAdmin, requireRole, AuthRequest } from '../../middleware/auth.js'
import { asyncHandler, validateBody } from '../../middleware/validate.js'
import { z } from 'zod'
import { paginationParams, paginationResponse } from '../../utils/helpers.js'
import { orderInclude } from '../../utils/prisma-helpers.js'
import { logAudit } from '../../utils/audit.js'
import { sendOrderShipped, sendOrderCancelled, sendOrderConfirmation } from '../../services/email.js'
import { escapeHtml } from '../../utils/html-escape.js'
import logger from '../../utils/logger.js'
import { processPaypalRefund } from '../../utils/paypal.js'

const router = Router()
router.use(authenticateAdmin)

const statusUpdateSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'paid', 'processing', 'packed', 'shipped', 'delivered', 'cancelled']),
  note: z.string().optional(),
})

const trackingSchema = z.object({
  trackingNumber: z.string().min(1),
  courier: z.string().min(1),
})

const STATUS_FLOW = ['pending', 'confirmed', 'paid', 'processing', 'packed', 'shipped', 'delivered']

// ─── List All Orders ───────────────────────────────────────────
router.get('/', asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginationParams(Number(req.query.page), Number(req.query.limit))

  const where: any = {}
  if ((req.query.status as string)) where.status = (req.query.status as string)
  if ((req.query.paymentStatus as string)) where.paymentStatus = (req.query.paymentStatus as string)
  if ((req.query.search as string)) {
    where.OR = [
      { orderNumber: { contains: (req.query.search as string), mode: 'insensitive' } },
      { customer: { name: { contains: (req.query.search as string), mode: 'insensitive' } } },
      { customer: { email: { contains: (req.query.search as string), mode: 'insensitive' } } },
    ]
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.order.count({ where }),
  ])

  res.json({ orders, pagination: paginationResponse(total, page, limit) })
}))

// ─── Get Order Detail ──────────────────────────────────────────
router.get('/:id', asyncHandler(async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id as string },
    include: orderInclude,
  })
  if (!order) return res.status(404).json({ error: 'Order not found' })
  res.json({ order })
}))

// ─── Update Order Status ───────────────────────────────────────
router.patch('/:id/status', requireRole('store-manager'), validateBody(statusUpdateSchema), asyncHandler(async (req: AuthRequest, res) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.id as string } })
  if (!order) return res.status(404).json({ error: 'Order not found' })

  const currentIdx = STATUS_FLOW.indexOf(order.status)
  const newIdx = STATUS_FLOW.indexOf(req.body.status)

  if (req.body.status !== 'cancelled' && (currentIdx === -1 || newIdx <= currentIdx)) {
    return res.status(400).json({ error: 'Can only advance order status forward' })
  }

  const updated = await prisma.order.update({
    where: { id: req.params.id as string },
    data: { status: req.body.status },
  })

  await prisma.orderTimeline.create({
    data: {
      orderId: req.params.id as string,
      status: req.body.status,
      note: req.body.note,
      createdBy: req.user!.id,
    },
  })

  // Reduce stock on paid (atomic guard — prevents negative stock)
  if (req.body.status === 'paid' && order.paymentStatus !== 'paid') {
    const items = await prisma.orderItem.findMany({ where: { orderId: req.params.id as string } })
    for (const item of items) {
      if (item.productId) {
        const affected = await prisma.$executeRawUnsafe(
          'UPDATE products SET stock_count = stock_count - $1 WHERE id = $2::uuid AND stock_count >= $1',
          item.quantity, item.productId
        )
        if (affected === 0) {
          logger.warn({ productId: item.productId, quantity: item.quantity, orderId: req.params.id }, 'Stock insufficient during admin order confirmation')
        }
      }
    }
  }

  if (req.body.status === 'cancelled' && order.paymentStatus === 'paid') {
    const items = await prisma.orderItem.findMany({ where: { orderId: req.params.id as string } })
    for (const item of items) {
      if (item.productId) {
        await prisma.$executeRawUnsafe(
          'UPDATE products SET stock_count = stock_count + $1 WHERE id = $2::uuid',
          item.quantity, item.productId
        )
      }
    }

    // Process actual PayPal refund if this was a PayPal payment
    if (order.paymentIntentId && order.paymentMethod === 'paypal') {
      const refundResult = await processPaypalRefund(
        order.paymentIntentId,
        Number(order.total),
        order.currency || 'USD'
      )
      if (refundResult.success) {
        logger.info({ orderId: order.id, orderNumber: order.orderNumber }, 'PayPal refund processed for cancelled order')
      } else {
        logger.error({ orderId: order.id, error: refundResult.error }, 'PayPal refund failed for cancelled order — still marking as refunded')
        // Continue with refunded status even if PayPal fails (for manual follow-up)
      }
    }

    // Update payment status to refunded on cancellation
    await prisma.order.update({
      where: { id: req.params.id as string },
      data: { paymentStatus: 'refunded' },
    })
  }

  await logAudit({
    actor: req.user!,
    action: 'order.status.update',
    entityType: 'order',
    entityId: order.id,
    entityName: order.orderNumber,
    newValue: { status: req.body.status },
    ipAddress: req.ip,
  })

  // Send confirmation email for bank transfer orders (card orders get it from webhook)
  if (req.body.status === 'paid' && order.paymentMethod !== 'card') {
    if (order.customerId) {
      const customer = await prisma.customer.findUnique({ where: { id: order.customerId }, select: { email: true, name: true } })
      if (customer) {
        const orderItems = await prisma.orderItem.findMany({ where: { orderId: order.id } })
        const shippingAddr = [order.shippingAddressLine1, order.shippingAddressLine2, order.shippingCity, order.shippingState, order.shippingPostalCode, order.shippingCountry].filter(Boolean).join(', ')
        sendOrderConfirmation({
          to: customer.email,
          customerName: customer.name,
          orderNumber: order.orderNumber,
          items: orderItems.map(i => ({ name: i.productName, quantity: i.quantity, price: Number(i.unitPrice) })),
          subtotal: Number(order.subtotal),
          shippingCost: Number(order.shippingCost),
          tax: Number(order.tax),
          total: Number(order.total),
          shippingAddress: shippingAddr,
        }).catch(err => logger.error({ err }, 'Order confirmation email failed'))
      }
    }
  }

  // Send cancellation email (non-blocking)
  if (req.body.status === 'cancelled') {
    const customer = order.customerId ? await prisma.customer.findUnique({ where: { id: order.customerId }, select: { email: true, name: true } }) : null
    if (customer) {
      sendOrderCancelled({ to: customer.email, customerName: customer.name, orderNumber: order.orderNumber, reason: req.body.note || 'Cancelled by admin' }).catch(err => logger.error({ err }, 'Cancel email failed'))
    }
  }

  res.json({ order: updated })
}))

// ─── Update Tracking ───────────────────────────────────────────
router.patch('/:id/tracking', requireRole('store-manager'), validateBody(trackingSchema), asyncHandler(async (req: AuthRequest, res) => {
  const order = await prisma.order.update({
    where: { id: req.params.id as string },
    data: { trackingNumber: req.body.trackingNumber, courier: req.body.courier },
  })

  // Send shipped notification email (non-blocking)
  if (order.customerId) {
    const customer = await prisma.customer.findUnique({ where: { id: order.customerId }, select: { email: true, name: true } })
    if (customer) {
      sendOrderShipped({
        to: customer.email,
        customerName: customer.name,
        orderNumber: order.orderNumber,
        trackingNumber: req.body.trackingNumber,
        courier: req.body.courier,
      }).catch(err => logger.error({ err }, 'Ship email failed'))
    }
  }

  res.json({ order })
}))

// ─── Cancel Order ──────────────────────────────────────────────
router.post('/:id/cancel', requireRole('store-manager'), asyncHandler(async (req: AuthRequest, res) => {
  const existingOrder = await prisma.order.findUnique({ where: { id: req.params.id as string } })
  if (!existingOrder) return res.status(404).json({ error: 'Order not found' })
  if (existingOrder.status === 'cancelled') return res.status(400).json({ error: 'Order already cancelled' })

  const order = await prisma.order.update({
    where: { id: req.params.id as string },
    data: {
      status: 'cancelled',
      cancelRequested: false,
      cancelReason: req.body.reason || 'Cancelled by admin',
    },
  })

  await prisma.orderTimeline.create({
    data: { orderId: req.params.id as string, status: 'cancelled', note: req.body.reason, createdBy: req.user!.id },
  })

  // Restore stock atomically (only if payment was confirmed — stock only reduced on payment)
  if (order.paymentStatus === 'paid') {
    const items = await prisma.orderItem.findMany({ where: { orderId: req.params.id as string } })
    for (const item of items) {
      if (item.productId) {
        await prisma.$executeRawUnsafe(
          'UPDATE products SET stock_count = stock_count + $1 WHERE id = $2::uuid',
          item.quantity, item.productId
        )
      }
    }

    // Process actual PayPal refund if this was a PayPal payment
    if (order.paymentIntentId && order.paymentMethod === 'paypal') {
      const refundResult = await processPaypalRefund(
        order.paymentIntentId,
        Number(order.total),
        order.currency || 'USD'
      )
      if (refundResult.success) {
        logger.info({ orderId: order.id, orderNumber: order.orderNumber }, 'PayPal refund processed for cancelled order')
      } else {
        logger.error({ orderId: order.id, error: refundResult.error }, 'PayPal refund failed for cancelled order — still marking as refunded')
      }
    }

    // Update payment status to refunded on cancellation
    await prisma.order.update({
      where: { id: req.params.id as string },
      data: { paymentStatus: 'refunded' },
    })
  }

  await logAudit({
    actor: req.user!,
    action: 'order.cancel',
    entityType: 'order',
    entityId: order.id,
    entityName: order.orderNumber,
    ipAddress: req.ip,
  })

  // Send cancellation email (non-blocking)
  if (order.customerId) {
    const customer = await prisma.customer.findUnique({ where: { id: order.customerId }, select: { email: true, name: true } })
    if (customer) {
      sendOrderCancelled({ to: customer.email, customerName: customer.name, orderNumber: order.orderNumber, reason: req.body.reason || 'Cancelled by admin' }).catch(err => logger.error({ err }, 'Cancel email failed'))
    }
  }

  res.json({ order })
}))

// ─── Invoice PDF (simple HTML) ─────────────────────────────────
router.get('/:id/invoice', requireRole('store-manager'), asyncHandler(async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id as string },
    include: orderInclude,
  })
  if (!order) return res.status(404).json({ error: 'Order not found' })

  const items = (order.items || []).map((item: any) => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #eee">${escapeHtml(item.product?.name || item.productName || 'Product')}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;font-family:monospace;font-size:12px">${escapeHtml(item.product?.sku || item.sku || '')}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">$${(item.unitPrice || item.price || 0).toFixed(2)}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;font-weight:bold">$${((item.unitPrice || item.price || 0) * item.quantity).toFixed(2)}</td>
    </tr>`
  ).join('')

  const customer = (order as any).customer || {}
  const shipping = {
    fullName: order.shippingFullName || '',
    addressLine1: order.shippingAddressLine1 || '',
    addressLine2: order.shippingAddressLine2 || '',
    city: order.shippingCity || '',
    state: order.shippingState || '',
    postalCode: order.shippingPostalCode || '',
    country: order.shippingCountry || '',
  }

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Invoice ${escapeHtml(order.orderNumber)}</title><style>body{font-family:'Segoe UI',sans-serif;margin:40px;color:#333}table{width:100%;border-collapse:collapse}th{background:#f8f9fa;padding:8px;text-align:left;border-bottom:2px solid #dee2e6;font-size:12px;text-transform:uppercase}</style></head><body>
    <div style="display:flex;justify-content:space-between;margin-bottom:30px">
      <div><h1 style="margin:0;color:#0EA5E9">ALKA TRADERS</h1><p style="color:#666;font-size:13px">Marine & Industrial Equipment</p></div>
      <div style="text-align:right"><h2 style="margin:0">INVOICE</h2><p style="font-family:monospace;font-size:14px;color:#666">#${order.orderNumber}</p><p style="font-size:13px;color:#666">Date: ${new Date(order.createdAt).toLocaleDateString()}</p></div>
    </div>
    <div style="display:flex;gap:40px;margin-bottom:30px">
      <div style="flex:1"><h3 style="font-size:12px;text-transform:uppercase;color:#999;margin-bottom:8px">Bill To</h3><p style="font-size:13px"><strong>${escapeHtml(customer.name || shipping.fullName || 'N/A')}</strong></p><p style="font-size:13px;color:#666">${escapeHtml(customer.email || '')}</p><p style="font-size:13px;color:#666">${escapeHtml(shipping.addressLine1 || '')}${shipping.city ? ', ' + escapeHtml(shipping.city) : ''}${shipping.country ? ', ' + escapeHtml(shipping.country) : ''}</p></div>
      <div style="flex:1"><h3 style="font-size:12px;text-transform:uppercase;color:#999;margin-bottom:8px">Payment</h3><p style="font-size:13px">Method: ${escapeHtml(order.paymentMethod || 'N/A')}</p><p style="font-size:13px">Status: ${escapeHtml(order.paymentStatus || 'pending')}</p>${order.trackingNumber ? `<p style="font-size:13px">Tracking: ${escapeHtml(order.trackingNumber)} (${escapeHtml(order.courier || '')})</p>` : ''}</div>
    </div>
    <table><thead><tr><th>Product</th><th>SKU</th><th style="text-align:center">Qty</th><th style="text-align:right">Unit Price</th><th style="text-align:right">Total</th></tr></thead><tbody>${items}</tbody></table>
    <div style="margin-top:20px;text-align:right">
      <p style="font-size:13px">Subtotal: $${(order.subtotal || 0).toFixed(2)}</p>
      <p style="font-size:13px">Shipping: $${(order.shippingCost || 0).toFixed(2)}</p>
      <p style="font-size:13px">Tax: $${(order.tax || 0).toFixed(2)}</p>
      <p style="font-size:18px;font-weight:bold;border-top:2px solid #333;padding-top:8px;margin-top:8px">Grand Total: $${(order.total || 0).toFixed(2)}</p>
    </div>
    <p style="text-align:center;color:#999;font-size:11px;margin-top:40px">Alka Traders · Marine & Industrial Equipment · alkatraders.com</p>
  </body></html>`

  res.setHeader('Content-Type', 'text/html')
  res.send(html)
}))

// ─── Export CSV ────────────────────────────────────────────────
router.get('/export/csv', requireRole('store-manager'), asyncHandler(async (_req, res) => {
  const orders = await prisma.order.findMany({ include: { items: true }, orderBy: { createdAt: 'desc' }, take: 10000 })

  const headers = ['Order Number', 'Status', 'Payment Status', 'Total', 'Created At']
  const rows = orders.map(o => [o.orderNumber, o.status, o.paymentStatus, o.total.toString(), o.createdAt.toISOString()])

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', 'attachment; filename=orders.csv')
  res.send(csv)
}))

export default router
