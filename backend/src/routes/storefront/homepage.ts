import { Router } from 'express'
import { prisma } from '../../server.js'
import { asyncHandler } from '../../middleware/validate.js'

const router = Router()

// ─── Get Enabled Homepage Sections ─────────────────────────────
router.get('/', asyncHandler(async (_req, res) => {
  const sections = await prisma.homepageSection.findMany({
    where: { isEnabled: true },
    orderBy: { sortOrder: 'asc' },
  })
  res.json({ sections })
}))

export default router
