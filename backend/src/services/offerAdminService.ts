import { prisma } from '../server.js'
import { paginationParams, paginationResponse, generateOrderNumber } from '../utils/helpers.js'
import { logAudit } from '../utils/audit.js'
import { sendOfferDecision } from './emailSenders.js'
import logger from '../utils/logger.js'
import type { AuthUser } from '../middleware/auth.js'

// ─── Queries ──────────────────────────────────────────────────

export async function listOffers(params: { status?: string; productId?: string; page?: number; limit?: number }) {
  const { page, limit, skip } = paginationParams(params.page, params.limit)

  const where: Record<string, unknown> = {}
  if (params.status) where.status = params.status
  if (params.productId) where.productId = params.productId

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

  return { offers, pagination: paginationResponse(total, page, limit) }
}

export async function getOffer(id: string) {
  const offer = await prisma.offer.findUnique({
    where: { id },
    include: {
      product: { select: { id: true, name: true, sku: true, regularPrice: true, salePrice: true, stockCount: true } },
      rfq: { select: { id: true, rfqNumber: true } },
    },
  })
  if (!offer) throw Object.assign(new Error('Offer not found'), { status: 404 })
  return { offer }
}

// ─── Mutations ────────────────────────────────────────────────

export async function acceptOffer(id: string, actor: AuthUser) {
  const offer = await prisma.offer.update({
    where: { id },
    data: { status: 'accepted', respondedAt: new Date() },
    include: { product: { select: { name: true } } },
  })
  await logAudit({ actor, action: 'offer.accept', entityType: 'offer', entityId: offer.id })
  sendOfferDecision({ to: offer.customerEmail, offerNumber: offer.offerNumber, productName: offer.product?.name || 'Unknown', decision: 'accepted' }).catch(err => logger.error({ err }, 'Offer email failed'))
  return { offer }
}

export async function rejectOffer(id: string, actor: AuthUser) {
  const offer = await prisma.offer.update({
    where: { id },
    data: { status: 'rejected', respondedAt: new Date() },
    include: { product: { select: { name: true } } },
  })
  await logAudit({ actor, action: 'offer.reject', entityType: 'offer', entityId: offer.id })
  sendOfferDecision({ to: offer.customerEmail, offerNumber: offer.offerNumber, productName: offer.product?.name || 'Unknown', decision: 'rejected' }).catch(err => logger.error({ err }, 'Offer email failed'))
  return { offer }
}

export async function counterOffer(id: string, counterPrice: number, actor: AuthUser) {
  const offer = await prisma.offer.update({
    where: { id },
    data: { status: 'countered', counterPrice, respondedAt: new Date() },
    include: { product: { select: { name: true } } },
  })
  await logAudit({ actor, action: 'offer.counter', entityType: 'offer', entityId: offer.id })
  sendOfferDecision({ to: offer.customerEmail, offerNumber: offer.offerNumber, productName: offer.product?.name || 'Unknown', decision: 'countered', counterPrice }).catch(err => logger.error({ err }, 'Offer email failed'))
  return { offer }
}

export async function convertOfferToOrder(id: string, actor: AuthUser) {
  const offer = await prisma.offer.findUnique({
    where: { id },
    include: { product: { select: { id: true, name: true, sku: true, regularPrice: true, salePrice: true } } },
  })
  if (!offer) throw Object.assign(new Error('Offer not found'), { status: 404 })
  if (offer.status !== 'accepted') throw Object.assign(new Error('Only accepted offers can be converted to orders'), { status: 400 })

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
    actor, action: 'offer.convert-to-order', entityType: 'offer', entityId: offer.id, entityName: offer.offerNumber,
    newValue: { orderId: order.id, orderNumber: order.orderNumber },
  })

  return { order }
}
