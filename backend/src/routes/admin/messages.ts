import { Router } from 'express'
import { prisma } from '../../server.js'
import { authenticateAdmin, requireRole, AuthRequest } from '../../middleware/auth.js'
import { asyncHandler, validateBody } from '../../middleware/validate.js'
import { z } from 'zod'
import { logAudit } from '../../utils/audit.js'
import { paginationParams, paginationResponse } from '../../utils/helpers.js'
import logger from '../../utils/logger.js'
import { sendSuccess, sendError } from '../../middleware/response.js'

const router = Router()
router.use(authenticateAdmin)

const composeSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  subject: z.string().optional(),
  message: z.string().min(1),
  internalNotes: z.string().optional(),
})

const replySchema = z.object({
  message: z.string().min(1),
})

// ─── List All Messages ────────────────────────────────────────
router.get('/', asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginationParams(Number(req.query.page), Number(req.query.limit))

  const where: any = {}
  if ((req.query.status as string)) where.status = (req.query.status as string)
  if ((req.query.search as string)) {
    where.OR = [
      { name: { contains: (req.query.search as string), mode: 'insensitive' } },
      { email: { contains: (req.query.search as string), mode: 'insensitive' } },
      { subject: { contains: (req.query.search as string), mode: 'insensitive' } },
      { message: { contains: (req.query.search as string), mode: 'insensitive' } },
    ]
  }

  const [messages, total] = await Promise.all([
    prisma.contactMessage.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.contactMessage.count({ where }),
  ])

  sendSuccess(res, { messages, pagination: paginationResponse(total, page, limit) })
}))

// ─── Get Message Detail ───────────────────────────────────────
router.get('/:id', asyncHandler(async (req, res) => {
  const message = await prisma.contactMessage.findUnique({
    where: { id: req.params.id as string },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
    },
  })
  if (!message) return sendError(res, 'Message not found', 404)

  // Auto-mark as read if new
  if (message.status === 'new') {
    await prisma.contactMessage.update({
      where: { id: message.id },
      data: { status: 'read' },
    })
    message.status = 'read'
  }

  sendSuccess(res, { message })
}))

// ─── Compose / Send Message ──────────────────────────────────
router.post('/', requireRole('store-manager'), validateBody(composeSchema), asyncHandler(async (req: AuthRequest, res) => {
  const message = await prisma.contactMessage.create({
    data: {
      name: req.body.name,
      email: req.body.email,
      subject: req.body.subject || 'Internal message',
      message: req.body.message,
      status: 'new',
      source: 'admin-compose',
    },
  })

  await logAudit({
    actor: req.user!,
    action: 'message.create',
    entityType: 'contact_message',
    entityId: message.id,
    entityName: message.subject || 'Compose',
    ipAddress: req.ip,
  })

  sendSuccess(res, { message }, 201)
}))

// ─── Mark as Read ─────────────────────────────────────────────
router.patch('/:id/read', asyncHandler(async (req: AuthRequest, res) => {
  const message = await prisma.contactMessage.findUnique({ where: { id: req.params.id as string } })
  if (!message) return sendError(res, 'Message not found', 404)

  const updated = await prisma.contactMessage.update({
    where: { id: req.params.id as string },
    data: { status: 'read' },
  })

  await logAudit({
    actor: req.user!,
    action: 'message.read',
    entityType: 'contact_message',
    entityId: message.id,
    ipAddress: req.ip,
  })

  sendSuccess(res, { message: updated })
}))

// ─── Archive Message ──────────────────────────────────────────
router.patch('/:id/archive', asyncHandler(async (req: AuthRequest, res) => {
  const message = await prisma.contactMessage.findUnique({ where: { id: req.params.id as string } })
  if (!message) return sendError(res, 'Message not found', 404)

  const updated = await prisma.contactMessage.update({
    where: { id: req.params.id as string },
    data: { status: 'archived' },
  })

  await logAudit({
    actor: req.user!,
    action: 'message.archive',
    entityType: 'contact_message',
    entityId: message.id,
    ipAddress: req.ip,
  })

  sendSuccess(res, { message: updated })
}))

// ─── Delete Message ───────────────────────────────────────────
router.delete('/:id', requireRole('store-manager'), asyncHandler(async (req: AuthRequest, res) => {
  const message = await prisma.contactMessage.findUnique({ where: { id: req.params.id as string } })
  if (!message) return res.status(404).json({ error: 'Message not found' })

  await prisma.contactMessage.delete({ where: { id: req.params.id as string } })

  await logAudit({
    actor: req.user!,
    action: 'message.delete',
    entityType: 'contact_message',
    entityId: message.id,
    entityName: message.subject || message.name,
    ipAddress: req.ip,
  })

  sendSuccess(res, { message: 'Message deleted' })
}))

// ─── Reply to Message ────────────────────────────────────────
router.post('/:id/reply', requireRole('store-manager'), validateBody(replySchema), asyncHandler(async (req: AuthRequest, res) => {
  const message = await prisma.contactMessage.findUnique({ where: { id: req.params.id as string } })
  if (!message) return sendError(res, 'Message not found', 404)

  // Update status to replied
  await prisma.contactMessage.update({
    where: { id: message.id },
    data: { status: 'replied' },
  })

  await logAudit({
    actor: req.user!,
    action: 'message.reply',
    entityType: 'contact_message',
    entityId: message.id,
    entityName: message.subject || message.name,
    ipAddress: req.ip,
  })

  // Send reply email to customer using styled template
  const { queueEmail } = await import('../../services/email.js')
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Tahoma,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:32px 0;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);"><tr><td style="background:linear-gradient(135deg,#0a1628,#1a2d4a);padding:24px 32px;text-align:center;"><h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">⚓ Alka Traders</h1><p style="margin:4px 0 0;color:#94a3b8;font-size:12px;letter-spacing:1px;text-transform:uppercase;">Marine & Industrial Equipment</p></td></tr><tr><td style="padding:32px;"><h2 style="margin:0 0 8px;color:#1e293b;font-size:22px;">Re: ${message.subject || 'Your Message'}</h2><p style="color:#64748b;font-size:14px;margin:0 0 16px;">Hi ${message.name},</p><div style="background:#f8fafc;border-radius:8px;padding:16px;margin-bottom:24px;color:#1e293b;font-size:14px;line-height:1.6;">${req.body.message}</div><p style="color:#64748b;font-size:13px;">If you have further questions, reply to this email or contact us at <a href="mailto:info@alkatraders.com" style="color:#0ea5e9;">info@alkatraders.com</a>.</p></td></tr><tr><td style="background:#f8fafc;padding:24px 32px;text-align:center;border-top:1px solid #e2e8f0;"><p style="margin:0;color:#64748b;font-size:12px;">Alka Traders — Marine & Industrial Equipment</p></td></tr></table></td></tr></table></body></html>`
  queueEmail({
    to: message.email,
    subject: `Re: ${message.subject || 'Your Message'} — Alka Traders`,
    html,
  }).catch(err => logger.error({ err }, 'Reply email failed'))

  sendSuccess(res, { message: 'Reply sent' })
}))

export default router
