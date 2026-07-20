import { Router } from 'express'
import { prisma } from '../../server.js'
import { asyncHandler, validateBody } from '../../middleware/validate.js'
import { z } from 'zod'
import { generateRfqNumber } from '../../utils/helpers.js'
import { logAudit } from '../../utils/audit.js'
import { sendRfqReceived } from '../../services/email.js'
import logger from '../../utils/logger.js'

const router = Router()

const rfqSchema = z.object({
  fullName: z.string().min(1).max(200),
  company: z.string().max(200).optional(),
  email: z.string().email().max(254),
  phone: z.string().max(30).optional(),
  country: z.string().max(100).optional(),
  role: z.string().max(100).optional(),
  productDescription: z.string().min(1).max(5000),
  partNumber: z.string().max(200).optional(),
  brand: z.string().max(200).optional(),
  quantity: z.number().int().min(1).max(10000).default(1),
  deliveryLocation: z.string().max(500).optional(),
  urgency: z.enum(['standard', 'urgent', 'emergency']).default('standard'),
  notes: z.string().max(2000).optional(),
  source: z.string().max(200).optional(),
  consent: z.boolean().refine(v => v === true, 'Consent is required'),
})

// ─── Submit RFQ ────────────────────────────────────────────────
router.post('/', validateBody(rfqSchema), asyncHandler(async (req, res) => {
  const rfq = await prisma.rfq.create({
    data: {
      rfqNumber: await generateRfqNumber(),
      ...req.body,
      status: 'new',
      responseDeadline: req.body.urgency === 'emergency'
        ? new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours
        : req.body.urgency === 'urgent'
          ? new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
          : null,
    },
  })

  await logAudit({
    action: 'rfq.create',
    entityType: 'rfq',
    entityId: rfq.id,
    entityName: rfq.rfqNumber,
    newValue: rfq,
  })

  // Notify admin team (non-blocking)
  sendRfqReceived({
    rfqNumber: rfq.rfqNumber,
    customerName: req.body.fullName,
    productDescription: req.body.productDescription,
    urgency: req.body.urgency,
  }).catch(err => logger.error({ err }, 'RFQ email failed'))

  res.status(201).json({
    message: 'RFQ submitted successfully',
    rfqNumber: rfq.rfqNumber,
    id: rfq.id,
  })
}))

export default router
