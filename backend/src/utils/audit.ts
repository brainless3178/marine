import { prisma } from '../server.js'
import { AuthUser } from '../middleware/auth.js'
import logger from './logger.js'

const auditLogger = logger.child({ context: 'audit' })

interface AuditOptions {
  actor?: AuthUser
  action: string
  entityType: string
  entityId?: string
  entityName?: string
  previousValue?: any
  newValue?: any
  ipAddress?: string
  userAgent?: string
}

export async function logAudit(options: AuditOptions) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: options.actor?.id,
        actorEmail: options.actor?.email || 'system',
        action: options.action,
        entityType: options.entityType,
        entityId: options.entityId,
        entityName: options.entityName,
        previousValue: options.previousValue ? JSON.stringify(options.previousValue) : undefined,
        newValue: options.newValue ? JSON.stringify(options.newValue) : undefined,
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
      },
    })
  } catch (error) {
    auditLogger.error({ err: error, action: options.action, entityType: options.entityType }, 'Audit log failed')
  }
}
