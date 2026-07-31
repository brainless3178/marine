import { prisma } from '../server.js'
import { paginationParams, paginationResponse } from '../utils/helpers.js'

// ─── Queries ──────────────────────────────────────────────────

export async function listAuditLogs(params: { page?: number; limit?: number; entityType?: string; actorEmail?: string; action?: string }) {
  const { page, limit, skip } = paginationParams(params.page, params.limit)

  const where: Record<string, unknown> = {}
  if (params.entityType) where.entityType = params.entityType
  if (params.actorEmail) where.actorEmail = { contains: params.actorEmail, mode: 'insensitive' }
  if (params.action) where.action = { contains: params.action, mode: 'insensitive' }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
    prisma.auditLog.count({ where }),
  ])

  return { logs, pagination: paginationResponse(total, page, limit) }
}
