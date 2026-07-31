import { Router } from 'express'
import { authenticateAdmin, requireRole, AuthRequest } from '../../middleware/auth.js'
import { asyncHandler, validateBody } from '../../middleware/validate.js'
import { sendSuccess, sendError } from '../../middleware/response.js'
import { z } from 'zod'
import * as categoryService from '../../services/categoryService.js'

const router = Router()
router.use(authenticateAdmin)

const categorySchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  parentId: z.string().uuid().optional().nullable(),
  icon: z.string().optional().nullable(),
  seoTitle: z.string().optional().nullable(),
  seoDescription: z.string().optional().nullable(),
  sortOrder: z.number().optional(),
  isVisible: z.boolean().optional(),
})

// ─── List All Categories ───────────────────────────────────────
router.get('/', asyncHandler(async (_req, res) => {
  sendSuccess(res, await categoryService.listAdminCategories())
}))

// ─── Create Category ───────────────────────────────────────────
router.post('/', requireRole('inventory-manager'), validateBody(categorySchema), asyncHandler(async (req: AuthRequest, res) => {
  try {
    sendSuccess(res, await categoryService.createCategory(req.body, req.user!, req.ip), 201)
  } catch (err: any) {
    sendError(res, err.message, err.status || 500)
  }
}))

// ─── Update Category ───────────────────────────────────────────
router.put('/:id', requireRole('inventory-manager'), validateBody(categorySchema.partial()), asyncHandler(async (req: AuthRequest, res) => {
  try {
    sendSuccess(res, await categoryService.updateCategory(req.params.id as string, req.body, req.user!, req.ip))
  } catch (err: any) {
    sendError(res, err.message, err.status || 500)
  }
}))

// ─── Delete Category ───────────────────────────────────────────
router.delete('/:id', requireRole('store-manager'), asyncHandler(async (req: AuthRequest, res) => {
  try {
    sendSuccess(res, await categoryService.deleteCategory(req.params.id as string, req.user!, req.ip))
  } catch (err: any) {
    sendError(res, err.message, err.status || 500)
  }
}))

// ─── Reorder Categories ────────────────────────────────────────
router.patch('/:id/reorder', requireRole('inventory-manager'), asyncHandler(async (req: AuthRequest, res) => {
  try {
    sendSuccess(res, await categoryService.reorderCategory(req.params.id as string, req.body.sortOrder, req.user!, req.ip))
  } catch (err: any) {
    sendError(res, err.message, err.status || 500)
  }
}))

export default router
