import { Router } from 'express'
import { z } from 'zod'
import { authenticateAdmin } from '../../middleware/auth.js'
import { asyncHandler, validateQuery } from '../../middleware/validate.js'
import { sendSuccess } from '../../middleware/response.js'
import * as auditService from '../../services/auditService.js'

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
  sendSuccess(res, await auditService.listAuditLogs({
    page: Number(req.query.page),
    limit: Number(req.query.limit),
    entityType: req.query.entityType as string,
    actorEmail: req.query.actorEmail as string,
    action: req.query.action as string,
  }))
}))

export default router
