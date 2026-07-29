/**
 * Email service — core infrastructure plus barrel re-exports.
 *
 * Core: queueEmail, sendEmail, startEmailQueueProcessor, stopEmailQueueProcessor
 * Templates: emailTemplates (in emailTemplates.ts)
 * Senders: All send* functions (in emailSenders.ts)
 */

import { Resend } from 'resend'
import { prisma } from '../server.js'
import logger from '../utils/logger.js'
import type { Prisma } from '@prisma/client'

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

const emailLog = logger.child({ context: 'email' })

const FROM = process.env.EMAIL_FROM || 'noreply@alkatraders.com'
const MAX_EMAIL_ATTEMPTS = 3

// ─── Email Queue ───────────────────────────────────────────────

interface QueueEmail {
  to: string
  toName?: string
  subject: string
  html: string
  text?: string
  template?: string
  templateData?: Record<string, unknown>
}

/**
 * Queue an email for async delivery.
 */
export async function queueEmail(email: QueueEmail): Promise<void> {
  try {
    const record = await prisma.emailQueue.create({
      data: {
        toEmail: email.to,
        toName: email.toName,
        subject: email.subject,
        htmlBody: email.html,
        textBody: email.text,
        template: email.template,
        templateData: email.templateData as unknown as Prisma.InputJsonValue,
        status: 'pending',
      },
    })
    // Attempt to send immediately
    await sendEmail(record.id)
  } catch (error) {
    emailLog.error({ err: error, to: email.to, subject: email.subject }, 'Failed to queue email')
  }
}

async function sendEmail(queueId: string): Promise<void> {
  const record = await prisma.emailQueue.findUnique({ where: { id: queueId } })
  if (!record || (record.status !== 'pending' && record.status !== 'retrying')) return

  if (!resend) {
    emailLog.info({ to: record.toEmail, subject: record.subject }, '[DRY RUN] Would send email')
    await prisma.emailQueue.update({
      where: { id: queueId },
      data: { status: 'sent', sentAt: new Date() },
    })
    return
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: record.toEmail,
      subject: record.subject,
      html: record.htmlBody,
      text: record.textBody || undefined,
    })
    if (error) throw new Error(error.message)

    await prisma.emailQueue.update({
      where: { id: queueId },
      data: { status: 'sent', sentAt: new Date(), attempts: { increment: 1 } },
    })
  } catch (error: any) {
    const attempts = record.attempts + 1
    const status = attempts >= record.maxAttempts ? 'failed' : 'retrying'
    await prisma.emailQueue.update({
      where: { id: queueId },
      data: { status, attempts, lastError: error.message },
    })
  }
}

// ─── Queue Processor ───────────────────────────────────────────

let processorInterval: ReturnType<typeof setInterval> | null = null

export function startEmailQueueProcessor(intervalMs = 60_000) {
  if (processorInterval) return
  processorInterval = setInterval(async () => {
    try {
      const pending = await prisma.emailQueue.findMany({
        where: { status: 'retrying', attempts: { lt: MAX_EMAIL_ATTEMPTS } },
        orderBy: { createdAt: 'asc' },
        take: 10,
      })
      for (const record of pending) {
        await sendEmail(record.id)
      }
    } catch (error) {
      emailLog.error({ err: error }, 'Email queue processor error')
    }
  }, intervalMs)
}

export function stopEmailQueueProcessor() {
  if (processorInterval) {
    clearInterval(processorInterval)
    processorInterval = null
  }
}

// ─── Barrel re-exports ─────────────────────────────────────────

export { emailTemplates } from './emailTemplates.js'
export {
  sendOrderConfirmation, sendOrderShipped, sendOrderCancelled,
  sendRfqReceived, sendRfqResponse, sendEmergencyAlert,
  sendOfferReceived, sendOfferDecision,
  sendContactNotification, sendPasswordReset, sendWelcome,
} from './emailSenders.js'
