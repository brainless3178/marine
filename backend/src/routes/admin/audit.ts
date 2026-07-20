import { Router } from 'express'
import { prisma } from '../../server.js'
import { authenticateAdmin } from '../../middleware/auth.js'
import { asyncHandler } from '../../middleware/validate.js'
import { paginationParams, paginationResponse } from '../../utils/helpers.js'

const router = Router()
router.use(authenticateAdmin)

// ─── List Audit Logs ───────────────────────────────────────────
router.get('/', asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginationParams(Number(req.query.page), Number(req.query.limit))

  const where: any = {}
  if ((req.query.entityType as string)) where.entityType = (req.query.entityType as string)
  if ((req.query.actorEmail as string)) where.actorEmail = { contains: (req.query.actorEmail as string) as string, mode: 'insensitive' }
  if ((req.query.action as string)) where.action = { contains: (req.query.action as string) as string, mode: 'insensitive' }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
    prisma.auditLog.count({ where }),
  ])

  res.json({ logs, pagination: paginationResponse(total, page, limit) })
}))

export default router
