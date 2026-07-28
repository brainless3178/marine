import { Router } from 'express'
import { prisma } from '../../server.js'
import { authenticateAdmin, requireOwner, AuthRequest } from '../../middleware/auth.js'
import { asyncHandler, validateBody } from '../../middleware/validate.js'
import { logAudit } from '../../utils/audit.js'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { sendSuccess, sendError } from '../../middleware/response.js'

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
  const users = await prisma.adminUser.findMany({
    select: { id: true, name: true, email: true, role: true, avatarUrl: true, isActive: true, lastLoginAt: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })
  sendSuccess(res, { users })
}))

// ─── Create Admin User ─────────────────────────────────────────
router.post('/', validateBody(userSchema), asyncHandler(async (req: AuthRequest, res) => {
  const { password, ...data } = req.body
  const passwordHash = await bcrypt.hash(password, 12)

  const existing = await prisma.adminUser.findUnique({ where: { email: data.email } })
  if (existing) return sendError(res, 'Email already exists', 400)

  const user = await prisma.adminUser.create({ data: { ...data, passwordHash } })
  await logAudit({ actor: req.user, action: 'user.create', entityType: 'admin_user', entityId: user.id, entityName: user.name, newValue: { id: user.id, name: user.name, email: user.email, role: user.role }, ipAddress: req.ip })
  sendSuccess(res, { user: { id: user.id, name: user.name, email: user.email, role: user.role } }, 201)
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
  const { password, ...data } = req.body
  const updateData: any = { ...data }

  if (password) {
    updateData.passwordHash = await bcrypt.hash(password, 12)
  }

  const user = await prisma.adminUser.update({ where: { id: req.params.id as string }, data: updateData })
  await logAudit({ actor: req.user, action: 'user.update', entityType: 'admin_user', entityId: user.id, entityName: user.name, newValue: { id: user.id, name: user.name, email: user.email, role: user.role }, ipAddress: req.ip })
  sendSuccess(res, { user: { id: user.id, name: user.name, email: user.email, role: user.role } })
}))

// ─── Deactivate Admin User ─────────────────────────────────────
router.delete('/:id', asyncHandler(async (req: AuthRequest, res) => {
  if (req.params.id as string === req.user!.id) {
    return sendError(res, 'Cannot deactivate yourself', 400)
  }
  await prisma.adminUser.update({ where: { id: req.params.id as string }, data: { isActive: false } })
  await logAudit({ actor: req.user, action: 'user.deactivate', entityType: 'admin_user', entityId: req.params.id as string, ipAddress: req.ip })
  sendSuccess(res, { message: 'User deactivated' })
}))

const roleChangeSchema = z.object({
  role: z.enum(['owner', 'store-manager', 'inventory-manager', 'sales-agent', 'content-manager', 'viewer']),
})

// ─── Change Role ───────────────────────────────────────────────
router.patch('/:id/role', validateBody(roleChangeSchema), asyncHandler(async (req: AuthRequest, res) => {
  // Prevent self-demotion to non-owner role
  if (req.params.id === req.user!.id && req.body.role !== 'owner') {
    return sendError(res, 'Cannot change your own role from owner', 400)
  }

  const user = await prisma.adminUser.update({
    where: { id: req.params.id as string },
    data: { role: req.body.role },
  })
  await logAudit({ actor: req.user, action: 'user.changeRole', entityType: 'admin_user', entityId: user.id, entityName: user.name, newValue: { role: req.body.role }, ipAddress: req.ip })
  sendSuccess(res, { user: { id: user.id, name: user.name, email: user.email, role: user.role } })
}))

export default router
