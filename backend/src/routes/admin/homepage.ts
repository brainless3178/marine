import { Router } from 'express'
import { z } from 'zod'
import { authenticateAdmin, requireRole, AuthRequest } from '../../middleware/auth.js'
import { asyncHandler, validateBody } from '../../middleware/validate.js'
import { sendSuccess, sendError } from '../../middleware/response.js'
import * as homepageService from '../../services/homepageService.js'

const router = Router()
router.use(authenticateAdmin)

const homepageSectionSchema = z.object({
  sectionType: z.string().min(1).max(100),
  label: z.string().max(200).optional(),
  isEnabled: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
  config: z.record(z.unknown()).optional(),
})

const updateSectionsSchema = z.object({
  sections: z.array(homepageSectionSchema).min(1).max(50),
})

// ─── Get All Homepage Sections ─────────────────────────────────
router.get('/', asyncHandler(async (_req, res) => {
  sendSuccess(res, await homepageService.listAdminSections())
}))

// ─── Update All Sections ───────────────────────────────────────
router.put('/', requireRole('content-manager'), validateBody(updateSectionsSchema), asyncHandler(async (req: AuthRequest, res) => {
  try {
    sendSuccess(res, await homepageService.updateSections(req.body.sections, req.user!, req.ip))
  } catch (err: any) {
    sendError(res, err.message, err.status || 500)
  }
}))

export default router
