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
  const sections = await prisma.homepageSection.findMany({ orderBy: { sortOrder: 'asc' } })
  sendSuccess(res, { sections })
}))

// ─── Update All Sections ───────────────────────────────────────
router.put('/', requireRole('content-manager'), validateBody(updateSectionsSchema), asyncHandler(async (req: AuthRequest, res) => {
  const { sections } = req.body as z.infer<typeof updateSectionsSchema>

  // Delete existing and recreate
  await prisma.homepageSection.deleteMany()
  await prisma.homepageSection.createMany({
    data: sections.map((s, i: number) => ({
      sectionType: s.sectionType,
      label: s.label ?? '',
      isEnabled: s.isEnabled ?? true,
      sortOrder: s.sortOrder ?? i,
      config: (s.config ?? {}) as Prisma.InputJsonValue,
    })),
  })

  const result = await prisma.homepageSection.findMany({ orderBy: { sortOrder: 'asc' } })
  await logAudit({ actor: req.user, action: 'homepage.update', entityType: 'homepage_section', entityName: sections.map((s) => s.sectionType).join(', '), ipAddress: req.ip })
  sendSuccess(res, { sections: result })
}))

export default router
