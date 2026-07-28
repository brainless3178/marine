import { Router } from 'express'
import { asyncHandler } from '../../middleware/validate.js'
import { sendSuccess } from '../../middleware/response.js'
import * as searchService from '../../services/searchService.js'

const router = Router()

// ─── Full-Text Search ──────────────────────────────────────────
router.get('/', asyncHandler(async (req, res) => {
  const q = (req.query.q as string) || ''
  const results = await searchService.fullTextSearch(q)
  sendSuccess(res, { ...results, query: q })
}))

export default router
