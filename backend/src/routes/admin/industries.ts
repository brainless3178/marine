import { Router } from 'express'
import { authenticateAdmin, requireRole, AuthRequest } from '../../middleware/auth.js'
import { asyncHandler, validateBody } from '../../middleware/validate.js'
import { sendSuccess, sendError } from '../../middleware/response.js'
import { z } from 'zod'
import * as industryService from '../../services/industryService.js'

const router = Router()
router.use(authenticateAdmin)

const industrySchema = z.object({
  name: z.string().min(1).max(255),
  icon: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  painPoints: z.array(z.string()).optional(),
  seoTitle: z.string().optional().nullable(),
  seoDescription: z.string().optional().nullable(),
  sortOrder: z.number().optional(),
  isVisible: z.boolean().optional(),
})

// ─── List All Industries ───────────────────────────────────────
router.get('/', asyncHandler(async (_req, res) => {
  sendSuccess(res, await industryService.listAdminIndustries())
}))

// ─── Create Industry ───────────────────────────────────────────
router.post('/', requireRole('inventory-manager'), validateBody(industrySchema), asyncHandler(async (req: AuthRequest, res) => {
  try {
    sendSuccess(res, await industryService.createIndustry(req.body, req.user!, req.ip), 201)
  } catch (err: any) {
    sendError(res, err.message, err.status || 500)
  }
}))

// ─── Update Industry ───────────────────────────────────────────
router.put('/:id', requireRole('inventory-manager'), validateBody(industrySchema.partial()), asyncHandler(async (req: AuthRequest, res) => {
  try {
    sendSuccess(res, await industryService.updateIndustry(req.params.id as string, req.body, req.user!, req.ip))
  } catch (err: any) {
    sendError(res, err.message, err.status || 500)
  }
}))

// ─── Delete Industry ───────────────────────────────────────────
router.delete('/:id', requireRole('store-manager'), asyncHandler(async (req: AuthRequest, res) => {
  try {
    sendSuccess(res, await industryService.deleteIndustry(req.params.id as string, req.user!, req.ip))
  } catch (err: any) {
    sendError(res, err.message, err.status || 500)
  }
}))

export default router
