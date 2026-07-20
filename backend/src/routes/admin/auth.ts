import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../../server.js'
import { generateToken, generateRefreshToken, authenticateAdmin, AuthRequest } from '../../middleware/auth.js'
import { asyncHandler, validateBody } from '../../middleware/validate.js'
import { z } from 'zod'
import { logAudit } from '../../utils/audit.js'

const router = Router()
const _jwtSecret = process.env.JWT_SECRET
if (!_jwtSecret) {
  throw new Error('FATAL: JWT_SECRET environment variable is required.')
}
const JWT_SECRET = _jwtSecret as string

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

// ─── Admin Login ───────────────────────────────────────────────
router.post('/login', validateBody(loginSchema), asyncHandler(async (req, res) => {
  const { email, password } = req.body

  const user = await prisma.adminUser.findUnique({ where: { email } })
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }

  if (!user.isActive) {
    return res.status(403).json({ error: 'Account is deactivated' })
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }

  // Update last login
  await prisma.adminUser.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  })

  const tokenPayload = { id: user.id, email: user.email, role: user.role }
  const accessToken = generateToken(tokenPayload)
  const refreshToken = generateRefreshToken(tokenPayload)

  // Set refresh token as httpOnly cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  })

  await logAudit({
    action: 'login',
    entityType: 'admin_user',
    entityId: user.id,
    entityName: user.email,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  })

  res.json({
    accessToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
    },
  })
}))

// ─── Refresh Token ─────────────────────────────────────────────
router.post('/refresh', asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken
  if (!refreshToken) {
    return res.status(401).json({ error: 'No refresh token' })
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET) as any
    if (!decoded.refresh) {
      return res.status(401).json({ error: 'Invalid refresh token' })
    }

    const user = await prisma.adminUser.findUnique({ where: { id: decoded.id } })
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User not found or deactivated' })
    }

    const tokenPayload = { id: user.id, email: user.email, role: user.role }
    const accessToken = generateToken(tokenPayload)
    const newRefreshToken = generateRefreshToken(tokenPayload)

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })

    res.json({ accessToken })
  } catch {
    return res.status(401).json({ error: 'Invalid refresh token' })
  }
}))

// ─── Logout ────────────────────────────────────────────────────
router.post('/logout', authenticateAdmin, asyncHandler(async (req: AuthRequest, res) => {
  res.clearCookie('refreshToken')

  if (req.user) {
    await logAudit({
      actor: req.user,
      action: 'logout',
      entityType: 'admin_user',
      entityId: req.user.id,
      ipAddress: req.ip,
    })
  }

  res.json({ message: 'Logged out successfully' })
}))

// ─── Get Current User ──────────────────────────────────────────
router.get('/me', authenticateAdmin, asyncHandler(async (req: AuthRequest, res) => {
  const user = await prisma.adminUser.findUnique({
    where: { id: req.user!.id },
    select: { id: true, name: true, email: true, role: true, avatarUrl: true, lastLoginAt: true },
  })

  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }

  res.json({ user })
}))

export default router
