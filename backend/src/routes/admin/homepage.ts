import { Router } from 'express'
import { prisma } from '../../server.js'
import { authenticateAdmin, requireRole, AuthRequest } from '../../middleware/auth.js'
import { asyncHandler } from '../../middleware/validate.js'
import { logAudit } from '../../utils/audit.js'

const router = Router()
router.use(authenticateAdmin)

// ─── Get All Homepage Sections ─────────────────────────────────
router.get('/', asyncHandler(async (_req, res) => {
  const sections = await prisma.homepageSection.findMany({ orderBy: { sortOrder: 'asc' } })
  res.json({ sections })
}))

// ─── Update All Sections ───────────────────────────────────────
router.put('/', requireRole('content-manager'), asyncHandler(async (req: AuthRequest, res) => {
  const { sections } = req.body
  if (!Array.isArray(sections)) {
    return res.status(400).json({ error: 'sections array required' })
  }

  // Delete existing and recreate
  await prisma.homepageSection.deleteMany()
  await prisma.homepageSection.createMany({
    data: sections.map((s: any, i: number) => ({
      sectionType: s.sectionType,
      label: s.label,
      isEnabled: s.isEnabled ?? true,
      sortOrder: s.sortOrder ?? i,
      config: s.config ?? {},
    })),
  })

  const result = await prisma.homepageSection.findMany({ orderBy: { sortOrder: 'asc' } })
  await logAudit({ actor: req.user, action: 'homepage.update', entityType: 'homepage_section', entityName: sections.map((s: any) => s.sectionType).join(', '), ipAddress: req.ip })
  res.json({ sections: result })
}))

export default router
