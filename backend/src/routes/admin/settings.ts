import { Router } from 'express'
import { z } from 'zod'
import { authenticateAdmin, requireRole, AuthRequest } from '../../middleware/auth.js'
import { asyncHandler, validateBody } from '../../middleware/validate.js'
import { sendSuccess, sendError } from '../../middleware/response.js'
import * as settingsService from '../../services/settingsService.js'

const router = Router()
router.use(authenticateAdmin)

const updateSettingsSchema = z.object({
  settings: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])).refine(obj => Object.keys(obj).length > 0, 'At least one setting is required'),
})

// ─── Get All Settings ──────────────────────────────────────────
router.get('/', asyncHandler(async (_req, res) => {
  sendSuccess(res, await settingsService.getAllSettings())
}))

// ─── Update Settings ───────────────────────────────────────────
router.put('/', requireRole('store-manager'), validateBody(updateSettingsSchema), asyncHandler(async (req: AuthRequest, res) => {
  try {
    sendSuccess(res, await settingsService.updateSettings(req.body.settings, req.user!, req.ip))
  } catch (err: any) {
    sendError(res, err.message, err.status || 500)
  }
}))

export default router
