import { prisma } from '../server.js'
import { paginationParams, paginationResponse } from '../utils/helpers.js'

// ─── Queries ──────────────────────────────────────────────────

export async function getDashboardStats() {
  const [
    totalProducts, publishedProducts, draftProducts, outOfStock, emergencyProducts,
    totalOrders, pendingOrders, shippedOrders,
    totalRfqs, emergencyRfqs, newRfqs,
    totalOffers, pendingOffers,
    totalCustomers, newMessages,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { status: 'published' } }),
    prisma.product.count({ where: { status: 'draft' } }),
    prisma.product.count({ where: { availability: 'out-of-stock' } }),
    prisma.product.count({ where: { availability: 'emergency' } }),
    prisma.order.count(),
    prisma.order.count({ where: { status: 'pending' } }),
    prisma.order.count({ where: { status: 'shipped' } }),
    prisma.rfq.count(),
    prisma.rfq.count({ where: { urgency: 'emergency' } }),
    prisma.rfq.count({ where: { status: 'new' } }),
    prisma.offer.count(),
    prisma.offer.count({ where: { status: 'pending' } }),
    prisma.customer.count(),
    prisma.contactMessage.count({ where: { status: 'new' } }),
  ])

  return {
    products: { total: totalProducts, published: publishedProducts, draft: draftProducts, outOfStock, emergency: emergencyProducts },
    orders: { total: totalOrders, pending: pendingOrders, shipped: shippedOrders },
    rfqs: { total: totalRfqs, emergency: emergencyRfqs, new: newRfqs },
    offers: { total: totalOffers, pending: pendingOffers },
    customers: { total: totalCustomers },
    messages: { new: newMessages },
  }
}

export async function getDashboardAlerts() {
  const [lowStock, overdueRfqs] = await Promise.all([
    prisma.product.findMany({
      where: { stockCount: { lte: 10 }, status: 'published', availability: 'in-stock' },
      select: { id: true, name: true, sku: true, stockCount: true, lowStockThreshold: true },
      orderBy: { stockCount: 'asc' },
      take: 20,
    }),
    prisma.rfq.findMany({
      where: { urgency: 'emergency', status: { in: ['new', 'reviewing'] } },
      select: { id: true, rfqNumber: true, fullName: true, urgency: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),
  ])
  return { lowStock, overdueRfqs }
}

export async function getRecentActivity(limit = 20) {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: { id: true, actorEmail: true, action: true, entityType: true, entityName: true, createdAt: true },
  })
  return { activity: logs }
}
