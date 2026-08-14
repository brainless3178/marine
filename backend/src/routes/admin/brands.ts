import { Router } from 'express'
import { authenticateAdmin, requireRole, AuthRequest } from '../../middleware/auth.js'
import { asyncHandler, validateBody } from '../../middleware/validate.js'
import { sendSuccess, sendError } from '../../middleware/response.js'
import { z } from 'zod'
import * as brandService from '../../services/brandService.js'

const router = Router()
router.use(authenticateAdmin)

const brandSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().max(255).optional(),
  logoUrl: z.string().optional().nullable(),
  sectors: z.array(z.string()).optional(),
  description: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  seoTitle: z.string().optional().nullable(),
  seoDescription: z.string().optional().nullable(),
  isVisible: z.boolean().optional(),
  sortOrder: z.number().optional(),
})

// ─── List All Brands ───────────────────────────────────────────
router.get('/', asyncHandler(async (_req, res) => {
  sendSuccess(res, await brandService.listAdminBrands())
}))

// ─── Create Brand ──────────────────────────────────────────────
router.post('/', requireRole('inventory-manager'), validateBody(brandSchema), asyncHandler(async (req: AuthRequest, res) => {
  try {
    sendSuccess(res, await brandService.createBrand(req.body, req.user!, req.ip), 201)
  } catch (err: any) {
    sendError(res, err.message, err.status || 500)
  }
}))

// ─── Update Brand ──────────────────────────────────────────────
router.put('/:id', requireRole('inventory-manager'), validateBody(brandSchema.partial()), asyncHandler(async (req: AuthRequest, res) => {
  try {
    sendSuccess(res, await brandService.updateBrand(req.params.id as string, req.body, req.user!, req.ip))
  } catch (err: any) {
    sendError(res, err.message, err.status || 500)
  }
}))

// ─── Delete Brand ──────────────────────────────────────────────
router.delete('/:id', requireRole('store-manager'), asyncHandler(async (req: AuthRequest, res) => {
  try {
    sendSuccess(res, await brandService.deleteBrand(req.params.id as string, req.user!, req.ip))
  } catch (err: any) {
    sendError(res, err.message, err.status || 500)
  }
}))

export default router
