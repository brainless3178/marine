import { Router } from 'express'
import { authenticateAdmin, requireOwner, AuthRequest } from '../../middleware/auth.js'
import { asyncHandler, validateBody } from '../../middleware/validate.js'
import { sendSuccess, sendError } from '../../middleware/response.js'
import { z } from 'zod'
import * as userService from '../../services/userService.js'

const router = Router()
router.use(authenticateAdmin)
router.use(requireOwner)

const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['owner', 'store-manager', 'inventory-manager', 'sales-agent', 'content-manager', 'viewer']),
  avatarUrl: z.string().optional(),
})

// ─── List All Admin Users ──────────────────────────────────────
router.get('/', asyncHandler(async (_req, res) => {
  sendSuccess(res, await userService.listUsers())
}))

// ─── Create Admin User ─────────────────────────────────────────
router.post('/', validateBody(userSchema), asyncHandler(async (req: AuthRequest, res) => {
  try {
    sendSuccess(res, await userService.createUser(req.body, req.user!, req.ip), 201)
  } catch (err: any) {
    sendError(res, err.message, err.status || 500)
  }
}))

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  avatarUrl: z.string().optional(),
  isActive: z.boolean().optional(),
})

// ─── Update Admin User ─────────────────────────────────────────
router.put('/:id', validateBody(updateUserSchema), asyncHandler(async (req: AuthRequest, res) => {
  try {
    sendSuccess(res, await userService.updateUser(req.params.id as string, req.body, req.user!, req.ip))
  } catch (err: any) {
    sendError(res, err.message, err.status || 500)
  }
}))

// ─── Deactivate Admin User ─────────────────────────────────────
router.delete('/:id', asyncHandler(async (req: AuthRequest, res) => {
  try {
    sendSuccess(res, await userService.deactivateUser(req.params.id as string, req.user!, req.ip))
  } catch (err: any) {
    sendError(res, err.message, err.status || 500)
  }
}))

const roleChangeSchema = z.object({
  role: z.enum(['owner', 'store-manager', 'inventory-manager', 'sales-agent', 'content-manager', 'viewer']),
})

// ─── Change Role ───────────────────────────────────────────────
router.patch('/:id/role', validateBody(roleChangeSchema), asyncHandler(async (req: AuthRequest, res) => {
  try {
    sendSuccess(res, await userService.changeUserRole(req.params.id as string, req.body.role, req.user!, req.ip))
  } catch (err: any) {
    sendError(res, err.message, err.status || 500)
  }
}))

export default router
