import { prisma } from '../server.js'
import { generateOfferNumber } from '../utils/helpers.js'
import { logAudit } from '../utils/audit.js'
import { sendOfferReceived } from './email.js'
import logger from '../utils/logger.js'

export async function submitOffer(data: {
  productId: string; customerEmail: string; offeredPrice: number
  quantity?: number; message?: string
}) {
  const { productId, ...rest } = data

  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product) throw Object.assign(new Error('Product not found'), { status: 404 })

  const offer = await prisma.offer.create({
    data: {
      offerNumber: await generateOfferNumber(),
      productId,
      ...rest,
      status: 'pending',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
    include: { product: { select: { id: true, name: true, regularPrice: true } } },
  })

  await logAudit({
    action: 'offer.create',
    entityType: 'offer',
    entityId: offer.id,
    entityName: offer.offerNumber,
    newValue: offer,
  })

  // Notify admin (non-blocking)
  sendOfferReceived({
    offerNumber: offer.offerNumber,
    productName: product.name,
    offeredPrice: data.offeredPrice,
    customerEmail: data.customerEmail,
  }).catch(err => logger.error({ err }, 'Offer email failed'))

  return offer
}
