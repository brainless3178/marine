import { Router } from 'express'
import { asyncHandler, validateBody } from '../../middleware/validate.js'
import { z } from 'zod'
import { authenticateAdmin, AuthRequest } from '../../middleware/auth.js'
import { sendSuccess, sendError } from '../../middleware/response.js'
import * as officeService from '../../services/officeService.js'

const router = Router()

// ─── List Visible Offices (Public) ───────────────────────────
router.get('/', asyncHandler(async (_req, res) => {
  sendSuccess(res, await officeService.listStorefrontOffices())
}))

// ─── Admin: List All Offices (must be before /:slug) ──────────
router.get('/admin/all', authenticateAdmin, asyncHandler(async (_req, res) => {
  sendSuccess(res, await officeService.listAllOffices())
}))

// ─── Admin: Update All Offices ────────────────────────────────
const officeSchema = z.object({
  offices: z.array(z.object({
    id: z.string().uuid().optional(),
    city: z.string().min(1),
    country: z.string().min(1),
    address: z.string().optional(),
    timezone: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    coordinatesLat: z.number().optional(),
    coordinatesLng: z.number().optional(),
    sortOrder: z.number().optional(),
    isVisible: z.boolean().optional(),
  })),
})

router.put('/admin', authenticateAdmin, validateBody(officeSchema), asyncHandler(async (req: AuthRequest, res) => {
  try {
    sendSuccess(res, await officeService.updateAllOffices(req.body.offices, req.user!, req.ip))
  } catch (err: any) {
    sendError(res, err.message, err.status || 500)
  }
}))

// ─── Get Office by Slug (Public — must be last) ───────────────
router.get('/:slug', asyncHandler(async (req, res) => {
  try {
    sendSuccess(res, await officeService.getOfficeBySlug(req.params.slug as string))
  } catch (err: any) {
    sendError(res, err.message, err.status || 500)
  }
}))

export default router
