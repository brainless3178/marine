import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../../server.js'
import { authenticateAdmin, requireRole, AuthRequest } from '../../middleware/auth.js'
import { asyncHandler, validateBody } from '../../middleware/validate.js'
import { logAudit } from '../../utils/audit.js'
import { sendSuccess, sendError } from '../../middleware/response.js'
import type { Prisma } from '@prisma/client'

const router = Router()
router.use(authenticateAdmin)

const updateSettingsSchema = z.object({
  settings: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])).refine(obj => Object.keys(obj).length > 0, 'At least one setting is required'),
})

// ─── Get All Settings (any authenticated admin can read) ───────
router.get('/', asyncHandler(async (_req, res) => {
  const settings = await prisma.storeSetting.findMany({ orderBy: { category: 'asc' } })
  const grouped: Record<string, Record<string, unknown>> = {}
  for (const s of settings) {
    const cat = s.category || 'general'
    if (!grouped[cat]) grouped[cat] = {}
    grouped[cat][s.key] = s.value
  }
  sendSuccess(res, { settings: grouped, flat: settings })
}))

// ─── Update Settings (store-manager+ only) ──────────────────────
router.put('/', requireRole('store-manager'), validateBody(updateSettingsSchema), asyncHandler(async (req: AuthRequest, res) => {
  const { settings } = req.body

  const updates = []
  for (const [key, value] of Object.entries(settings)) {
    updates.push(
      prisma.storeSetting.upsert({
        where: { key },
        update: { value: value as Prisma.InputJsonValue, updatedBy: req.user!.id },
        create: { key, value: value as Prisma.InputJsonValue, updatedBy: req.user!.id },
      })
    )
  }

  await Promise.all(updates)
  await logAudit({ actor: req.user, action: 'settings.update', entityType: 'store_settings', entityName: Object.keys(settings).join(', '), ipAddress: req.ip })
  sendSuccess(res, { message: 'Settings updated', count: updates.length })
}))

export default router
