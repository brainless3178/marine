import { prisma } from '../server.js'
import { paginationParams, paginationResponse } from '../utils/helpers.js'
import { orderInclude } from '../utils/prisma-helpers.js'
import { logAudit } from '../utils/audit.js'
import { sendOrderShipped, sendOrderCancelled, sendOrderConfirmation } from './email.js'
import { escapeHtml } from '../utils/html-escape.js'
import logger from '../utils/logger.js'
import { processPaypalRefund } from '../utils/paypal.js'
import type { AuthUser } from '../middleware/auth.js'

const STATUS_FLOW = ['pending', 'confirmed', 'paid', 'processing', 'packed', 'shipped', 'delivered']

// ─── Types ────────────────────────────────────────────────────

export interface OrderFilters {
  status?: string
  paymentStatus?: string
  search?: string
  page?: number
  limit?: number
}

// ─── Queries ──────────────────────────────────────────────────

export async function listOrders(params: OrderFilters) {
  const { page, limit, skip } = paginationParams(params.page, params.limit)

  const where: any = {}
  if (params.status) where.status = params.status
  if (params.paymentStatus) where.paymentStatus = params.paymentStatus
  if (params.search) {
    where.OR = [
      { orderNumber: { contains: params.search, mode: 'insensitive' } },
      { customer: { name: { contains: params.search, mode: 'insensitive' } } },
      { customer: { email: { contains: params.search, mode: 'insensitive' } } },
    ]
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where, include: orderInclude,
      orderBy: { createdAt: 'desc' }, skip, take: limit,
    }),
    prisma.order.count({ where }),
  ])

  return { orders, pagination: paginationResponse(total, page, limit) }
}

export async function getOrder(id: string) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: orderInclude,
  })
  if (!order) throw Object.assign(new Error('Order not found'), { status: 404 })
  return order
}

// ─── Mutations ────────────────────────────────────────────────

export async function updateOrderStatus(id: string, status: string, note: string | undefined, actor: AuthUser, ipAddress = '') {
  const order = await prisma.order.findUnique({ where: { id } })
  if (!order) throw Object.assign(new Error('Order not found'), { status: 404 })

  const currentIdx = STATUS_FLOW.indexOf(order.status)
  const newIdx = STATUS_FLOW.indexOf(status)

  if (status !== 'cancelled' && (currentIdx === -1 || newIdx <= currentIdx)) {
    throw Object.assign(new Error('Can only advance order status forward'), { status: 400 })
  }

  const updated = await prisma.order.update({
    where: { id },
    data: { status },
  })

  // Add timeline entry
  await prisma.orderTimeline.create({
    data: { orderId: id, status, note, createdBy: actor.id },
  })

  // Reduce stock on paid (atomic guard — prevents negative stock)
  if (status === 'paid' && order.paymentStatus !== 'paid') {
    const items = await prisma.orderItem.findMany({ where: { orderId: id } })
    for (const item of items) {
      if (item.productId) {
        const affected = await prisma.$executeRawUnsafe(
          'UPDATE products SET stock_count = stock_count - $1 WHERE id = $2::uuid AND stock_count >= $1',
          item.quantity, item.productId
        )
        if (affected === 0) {
          logger.warn({ productId: item.productId, quantity: item.quantity, orderId: id }, 'Stock insufficient during admin order confirmation')
        }
      }
    }
  }

  // Restore stock + handle PayPal refund on cancellation
  if (status === 'cancelled' && order.paymentStatus === 'paid') {
    await restoreStockAndRefund(id, order)
  }

  // Audit log
  await logAudit({
    actor,
    action: 'order.status.update',
    entityType: 'order', entityId: order.id, entityName: order.orderNumber,
    newValue: { status },
    ipAddress,
  })

  // Send confirmation email for non-card payments
  if (status === 'paid' && order.paymentMethod !== 'card') {
    await sendOrderPaidEmail(id, order)
  }

  // Send cancellation email
  if (status === 'cancelled') {
    await sendOrderCancelledEmail(id, order)
  }

  return updated
}

export async function updateTracking(id: string, trackingNumber: string, courier: string, actor: AuthUser, ipAddress = '') {
  const order = await prisma.order.update({
    where: { id },
    data: { trackingNumber, courier },
  })

  // Send shipment notification (non-blocking)
  if (order.customerId) {
    const customer = await prisma.customer.findUnique({
      where: { id: order.customerId }, select: { email: true, name: true },
    })
    if (customer) {
      sendOrderShipped({
        to: customer.email, customerName: customer.name,
        orderNumber: order.orderNumber, trackingNumber, courier,
      }).catch(err => logger.error({ err }, 'Ship email failed'))
    }
  }

  return order
}

export async function cancelOrder(id: string, reason: string | undefined, actor: AuthUser, ipAddress = '') {
  const existingOrder = await prisma.order.findUnique({ where: { id } })
  if (!existingOrder) throw Object.assign(new Error('Order not found'), { status: 404 })
  if (existingOrder.status === 'cancelled') throw Object.assign(new Error('Order already cancelled'), { status: 400 })

  const order = await prisma.order.update({
    where: { id },
    data: { status: 'cancelled', cancelRequested: false, cancelReason: reason || 'Cancelled by admin' },
  })

  await prisma.orderTimeline.create({
    data: { orderId: id, status: 'cancelled', note: reason, createdBy: actor.id },
  })

  // Restore stock and refund if paid
  if (order.paymentStatus === 'paid') {
    await restoreStockAndRefund(id, order)
  }

  await logAudit({
    actor,
    action: 'order.cancel',
    entityType: 'order', entityId: order.id, entityName: order.orderNumber,
    ipAddress,
  })

  // Send cancellation email (non-blocking)
  await sendOrderCancelledEmail(id, order)

  return order
}

export async function generateInvoiceHtml(id: string) {
  const order = await prisma.order.findUnique({
    where: { id }, include: orderInclude,
  })
  if (!order) throw Object.assign(new Error('Order not found'), { status: 404 })

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
    city: order.shippingCity || '',
    country: order.shippingCountry || '',
  }

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Invoice ${escapeHtml(order.orderNumber)}</title><style>body{font-family:'Segoe UI',sans-serif;margin:40px;color:#333}table{width:100%;border-collapse:collapse}th{background:#f8f9fa;padding:8px;text-align:left;border-bottom:2px solid #dee2e6;font-size:12px;text-transform:uppercase}</style></head><body>
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
}

// ─── Private Helpers ──────────────────────────────────────────

async function restoreStockAndRefund(id: string, order: any) {
  const items = await prisma.orderItem.findMany({ where: { orderId: id } })
  for (const item of items) {
    if (item.productId) {
      await prisma.$executeRawUnsafe(
        'UPDATE products SET stock_count = stock_count + $1 WHERE id = $2::uuid',
        item.quantity, item.productId
      )
    }
  }

  // Process PayPal refund if applicable
  if (order.paymentIntentId && order.paymentMethod === 'paypal') {
    const refundResult = await processPaypalRefund(
      order.paymentIntentId, Number(order.total), order.currency || 'USD'
    )
    if (refundResult.success) {
      logger.info({ orderId: order.id, orderNumber: order.orderNumber }, 'PayPal refund processed')
    } else {
      logger.error({ orderId: order.id, error: refundResult.error }, 'PayPal refund failed — still marking as refunded')
    }
  }

  await prisma.order.update({
    where: { id },
    data: { paymentStatus: 'refunded' },
  })
}

async function sendOrderPaidEmail(id: string, order: any) {
  if (!order.customerId) return
  const customer = await prisma.customer.findUnique({
    where: { id: order.customerId }, select: { email: true, name: true },
  })
  if (!customer) return

  const orderItems = await prisma.orderItem.findMany({ where: { orderId: id } })
  const shippingAddr = [order.shippingAddressLine1, order.shippingAddressLine2, order.shippingCity, order.shippingState, order.shippingPostalCode, order.shippingCountry].filter(Boolean).join(', ')

  sendOrderConfirmation({
    to: customer.email, customerName: customer.name, orderNumber: order.orderNumber,
    items: orderItems.map(i => ({ name: i.productName, quantity: i.quantity, price: Number(i.unitPrice) })),
    subtotal: Number(order.subtotal), shippingCost: Number(order.shippingCost),
    tax: Number(order.tax), total: Number(order.total),
    shippingAddress: shippingAddr,
  }).catch(err => logger.error({ err }, 'Order confirmation email failed'))
}

async function sendOrderCancelledEmail(id: string, order: any) {
  if (!order.customerId) return
  const customer = await prisma.customer.findUnique({
    where: { id: order.customerId }, select: { email: true, name: true },
  })
  if (!customer) return

  sendOrderCancelled({
    to: customer.email, customerName: customer.name,
    orderNumber: order.orderNumber, reason: order.cancelReason || 'Cancelled by admin',
  }).catch(err => logger.error({ err }, 'Cancel email failed'))
}
