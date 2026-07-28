import { Router } from 'express'
import { prisma } from '../../server.js'
import { asyncHandler, validateBody } from '../../middleware/validate.js'
import { z } from 'zod'
import { generateOfferNumber } from '../../utils/helpers.js'
import { logAudit } from '../../utils/audit.js'
import { sendOfferReceived } from '../../services/email.js'
import logger from '../../utils/logger.js'
import { sendSuccess, sendError } from '../../middleware/response.js'

const router = Router()

const offerSchema = z.object({
  productId: z.string().uuid(),
  customerEmail: z.string().email(),
  offeredPrice: z.number().positive(),
  quantity: z.number().int().positive().default(1),
  message: z.string().optional(),
})

// ─── Submit Offer ──────────────────────────────────────────────
router.post('/', validateBody(offerSchema), asyncHandler(async (req, res) => {
  const { productId, ...data } = req.body

  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product) return sendError(res, 'Product not found', 404)

  const offer = await prisma.offer.create({
    data: {
      offerNumber: await generateOfferNumber(),
      productId,
      ...data,
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
    offeredPrice: req.body.offeredPrice,
    customerEmail: req.body.customerEmail,
  }).catch(err => logger.error({ err }, 'Offer email failed'))

  sendSuccess(res, {
    message: 'Offer submitted successfully',
    offerNumber: offer.offerNumber,
    id: offer.id,
  }, 201)
}))

export default router
