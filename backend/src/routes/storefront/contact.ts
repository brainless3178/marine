import { Router } from 'express'
import { prisma } from '../../server.js'
import { asyncHandler, validateBody } from '../../middleware/validate.js'
import { z } from 'zod'
import { generateRfqNumber } from '../../utils/helpers.js'
import { logAudit } from '../../utils/audit.js'
import { sendContactNotification, sendEmergencyAlert } from '../../services/email.js'
import logger from '../../utils/logger.js'

const router = Router()

const contactSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(254),
  subject: z.string().max(300).optional(),
  message: z.string().min(1).max(5000),
})

const emergencySchema = z.object({
  name: z.string().min(1).max(200),
  phone: z.string().min(1).max(30),
  partDescription: z.string().min(1).max(5000),
  vesselName: z.string().max(200).optional(),
})

// ─── Submit Contact Form ───────────────────────────────────────
router.post('/', validateBody(contactSchema), asyncHandler(async (req, res) => {
  const message = await prisma.contactMessage.create({ data: req.body })

  await logAudit({
    action: 'contact.create',
    entityType: 'contact_message',
    entityId: message.id,
    entityName: message.subject || 'Contact form',
  })

  // Send notification email to admin (non-blocking)
  sendContactNotification({
    name: req.body.name,
    email: req.body.email,
    subject: req.body.subject || '',
    message: req.body.message,
  }).catch(err => logger.error({ err }, 'Contact email failed'))

  res.status(201).json({ message: 'Message sent successfully', id: message.id })
}))

// ─── Submit Emergency Request ──────────────────────────────────
router.post('/emergency', validateBody(emergencySchema), asyncHandler(async (req, res) => {
  // Create emergency request
  const emergency = await prisma.emergencyRequest.create({ data: req.body })

  // Auto-create emergency-priority RFQ
  const rfq = await prisma.rfq.create({
    data: {
      rfqNumber: await generateRfqNumber(),
      fullName: req.body.name,
      phone: req.body.phone,
      email: 'emergency@alkatraders.com',
      productDescription: req.body.partDescription,
      urgency: 'emergency',
      status: 'new',
      source: 'emergency-form',
      consent: true,
      responseDeadline: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours SLA
    },
  })

  // Link RFQ to emergency request
  await prisma.emergencyRequest.update({
    where: { id: emergency.id },
    data: { rfqId: rfq.id },
  })

  await logAudit({
    action: 'emergency.create',
    entityType: 'emergency_request',
    entityId: emergency.id,
    entityName: `Emergency: ${req.body.vesselName || req.body.name}`,
    newValue: { emergency, rfqNumber: rfq.rfqNumber },
  })

  // Send emergency alert email (non-blocking)
  sendEmergencyAlert({
    rfqNumber: rfq.rfqNumber,
    customerName: req.body.name,
    phone: req.body.phone,
    partDescription: req.body.partDescription,
    vesselName: req.body.vesselName,
  }).catch(err => logger.error({ err }, 'Emergency email failed'))

  res.status(201).json({
    message: 'Emergency request submitted. Our team will contact you within 30 minutes.',
    id: emergency.id,
    rfqNumber: rfq.rfqNumber,
  })
}))

export default router
