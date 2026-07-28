import { Router } from 'express'
import { asyncHandler, validateBody } from '../../middleware/validate.js'
import { z } from 'zod'
import { sendSuccess, sendError } from '../../middleware/response.js'
import * as offerService from '../../services/offerService.js'

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
  try {
    const offer = await offerService.submitOffer(req.body)
    sendSuccess(res, {
      message: 'Offer submitted successfully',
      offerNumber: offer.offerNumber,
      id: offer.id,
    }, 201)
  } catch (err: unknown) {
    const e = err as { message?: string; status?: number }
    sendError(res, e.message || 'Failed to submit offer', e.status || 500)
  }
}))

export default router
