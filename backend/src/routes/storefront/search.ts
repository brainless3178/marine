import { Router } from 'express'
import { asyncHandler, validateQuery } from '../../middleware/validate.js'
import { sendSuccess } from '../../middleware/response.js'
import * as searchService from '../../services/searchService.js'
import { z } from 'zod'

const router = Router()

const searchQuerySchema = z.object({
  q: z.string().optional(),
})

// ─── Full-Text Search ──────────────────────────────────────────
router.get('/', validateQuery(searchQuerySchema), asyncHandler(async (req, res) => {
  const q = (req.query.q as string) || ''
  const results = await searchService.fullTextSearch(q)
  sendSuccess(res, { ...results, query: q })
}))

export default router
