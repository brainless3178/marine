import { Router } from 'express'
import { prisma } from '../../server.js'
import { authenticateAdmin, requireRole, AuthRequest } from '../../middleware/auth.js'
import { asyncHandler } from '../../middleware/validate.js'
import { logAudit } from '../../utils/audit.js'

const router = Router()
router.use(authenticateAdmin)

// ─── Get All Settings (any authenticated admin can read) ──────────────────────────────────────────
router.get('/', asyncHandler(async (_req, res) => {
  const settings = await prisma.storeSetting.findMany({ orderBy: { category: 'asc' } })
  // Group by category
  const grouped: Record<string, any> = {}
  for (const s of settings) {
    const cat = s.category || 'general'
    if (!grouped[cat]) grouped[cat] = {}
    grouped[cat][s.key] = s.value
  }
  res.json({ settings: grouped, flat: settings })
}))

// ─── Update Settings (store-manager+ only) ──────────────────────
router.put('/', requireRole('store-manager'), asyncHandler(async (req: AuthRequest, res) => {
  const { settings } = req.body // { [key]: value }
  if (!settings || typeof settings !== 'object') {
    return res.status(400).json({ error: 'settings object required' })
  }

  const updates = []
  for (const [key, value] of Object.entries(settings)) {
    updates.push(
      prisma.storeSetting.upsert({
        where: { key },
        update: { value: value as any, updatedBy: req.user!.id },
        create: { key, value: value as any, updatedBy: req.user!.id },
      })
    )
  }

  await Promise.all(updates)
  await logAudit({ actor: req.user, action: 'settings.update', entityType: 'store_settings', entityName: Object.keys(settings).join(', '), ipAddress: req.ip })
  res.json({ message: 'Settings updated', count: updates.length })
}))

export default router
