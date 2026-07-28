import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../../server.js'
import { authenticateAdmin } from '../../middleware/auth.js'
import { asyncHandler, validateQuery } from '../../middleware/validate.js'
import { paginationParams, paginationResponse } from '../../utils/helpers.js'
import { sendSuccess } from '../../middleware/response.js'

const router = Router()
router.use(authenticateAdmin)

const auditQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  entityType: z.string().max(100).optional(),
  actorEmail: z.string().email().optional().or(z.literal('')),
  action: z.string().max(100).optional(),
})

// ─── List Audit Logs ───────────────────────────────────────────
router.get('/', validateQuery(auditQuerySchema), asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginationParams(Number(req.query.page), Number(req.query.limit))

  const where: any = {}
  if (req.query.entityType) where.entityType = req.query.entityType as string
  if (req.query.actorEmail) where.actorEmail = { contains: req.query.actorEmail as string, mode: 'insensitive' }
  if (req.query.action) where.action = { contains: req.query.action as string, mode: 'insensitive' }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
    prisma.auditLog.count({ where }),
  ])

  sendSuccess(res, { logs, pagination: paginationResponse(total, page, limit) })
}))

export default router
