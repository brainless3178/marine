import { Router } from 'express'
import { prisma } from '../../server.js'
import { asyncHandler } from '../../middleware/validate.js'
import { sendSuccess } from '../../middleware/response.js'

const router = Router()

// ─── Get Enabled Homepage Sections ─────────────────────────────
router.get('/', asyncHandler(async (_req, res) => {
  const sections = await prisma.homepageSection.findMany({
    where: { isEnabled: true },
    orderBy: { sortOrder: 'asc' },
  })
  sendSuccess(res, { sections })
}))

export default router
