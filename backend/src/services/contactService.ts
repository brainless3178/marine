import { prisma } from '../server.js'
import { generateRfqNumber } from '../utils/helpers.js'
import { logAudit } from '../utils/audit.js'
import { sendContactNotification, sendEmergencyAlert } from './email.js'
import logger from '../utils/logger.js'

export async function submitContactForm(data: {
  name: string; email: string; subject?: string; message: string
}) {
  const message = await prisma.contactMessage.create({ data })

  await logAudit({
    action: 'contact.create',
    entityType: 'contact_message',
    entityId: message.id,
    entityName: message.subject || 'Contact form',
  })

  sendContactNotification({
    name: data.name,
    email: data.email,
    subject: data.subject || '',
    message: data.message,
  }).catch(err => logger.error({ err }, 'Contact email failed'))

  return message
}

export async function submitEmergencyRequest(data: {
  name: string; phone: string; partDescription: string; vesselName?: string
}) {
  // Create emergency request
  const emergency = await prisma.emergencyRequest.create({
    data: {
      name: data.name,
      phone: data.phone,
      partDescription: data.partDescription,
      vesselName: data.vesselName,
    },
  })

  // Auto-create emergency-priority RFQ
  const rfq = await prisma.rfq.create({
    data: {
      rfqNumber: await generateRfqNumber(),
      fullName: data.name,
      phone: data.phone,
      email: 'sales@alkatraders.co',
      productDescription: data.partDescription,
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
    entityName: `Emergency: ${data.vesselName || data.name}`,
    newValue: { emergency, rfqNumber: rfq.rfqNumber },
  })

  // Send emergency alert email (non-blocking)
  sendEmergencyAlert({
    rfqNumber: rfq.rfqNumber,
    customerName: data.name,
    phone: data.phone,
    partDescription: data.partDescription,
    vesselName: data.vesselName,
  }).catch(err => logger.error({ err }, 'Emergency email failed'))

  return { emergency, rfqNumber: rfq.rfqNumber, id: emergency.id }
}
