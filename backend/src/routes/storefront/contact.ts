import { Router } from 'express'
import { asyncHandler, validateBody } from '../../middleware/validate.js'
import { z } from 'zod'
import { sendSuccess } from '../../middleware/response.js'
import * as contactService from '../../services/contactService.js'

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
  const message = await contactService.submitContactForm(req.body)
  sendSuccess(res, { message: 'Message sent successfully', id: message.id }, 201)
}))

// ─── Submit Emergency Request ──────────────────────────────────
router.post('/emergency', validateBody(emergencySchema), asyncHandler(async (req, res) => {
  const result = await contactService.submitEmergencyRequest(req.body)
  sendSuccess(res, {
    message: 'Emergency request submitted. Our team will contact you within 30 minutes.',
    id: result.id,
    rfqNumber: result.rfqNumber,
  }, 201)
}))

export default router
