import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../../server.js'
import { authenticateCustomer, AuthRequest } from '../../middleware/auth.js'
import { asyncHandler, validateBody } from '../../middleware/validate.js'
import { z } from 'zod'
import { sendWelcome, sendPasswordReset } from '../../services/email.js'
import logger from '../../utils/logger.js'
import { loginLimiter, registerLimiter, passwordResetLimiter } from '../../middleware/rateLimit.js'

const router = Router()

const _jwtSecret = process.env.JWT_SECRET
if (!_jwtSecret) {
  throw new Error('FATAL: JWT_SECRET environment variable is required.')
}
const JWT_SECRET = _jwtSecret as string

function generateToken(payload: { id: string; email: string; role: string; type: string }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

function generateRefreshToken(payload: { id: string; email: string; role: string; type: string }) {
  return jwt.sign({ ...payload, refresh: true }, JWT_SECRET, { expiresIn: '14d' })
}

const registerSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
  phone: z.string().max(30).optional(),
  company: z.string().max(200).optional(),
  country: z.string().max(100).optional(),
})

const loginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(128),
})

const updateProfileSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  phone: z.string().max(30).optional(),
  company: z.string().max(200).optional(),
  country: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  address: z.string().max(500).optional(),
  website: z.string().max(200).optional(),
})

const forgotPasswordSchema = z.object({
  email: z.string().email().max(254),
})

const resetPasswordSchema = z.object({
  token: z.string().min(1).max(2000),
  password: z.string().min(8).max(128),
})

// ─── Register ──────────────────────────────────────────────────
router.post('/register', registerLimiter, validateBody(registerSchema), asyncHandler(async (req, res) => {
  const { password, ...data } = req.body

  const existing = await prisma.customer.findUnique({ where: { email: data.email } })
  if (existing) return res.status(400).json({ error: 'Email already registered' })

  const passwordHash = await bcrypt.hash(password, 12)
  const customer = await prisma.customer.create({
    data: { ...data, passwordHash },
  })

  const tokenPayload = { id: customer.id, email: customer.email, role: 'customer', type: 'customer' as const }
  const accessToken = generateToken(tokenPayload)
  const refreshToken = generateRefreshToken(tokenPayload)

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 14 * 24 * 60 * 60 * 1000,
  })

  // Send welcome email (non-blocking)
  sendWelcome({ to: customer.email, name: customer.name, email: customer.email }).catch(err => {
    logger.error({ err }, 'Welcome email failed')
  })

  res.status(201).json({
    accessToken,
    user: { id: customer.id, name: customer.name, email: customer.email },
  })
}))

// ─── Login ─────────────────────────────────────────────────────
router.post('/login', loginLimiter, validateBody(loginSchema), asyncHandler(async (req, res) => {
  const { email, password } = req.body

  const customer = await prisma.customer.findUnique({ where: { email } })
  if (!customer) return res.status(401).json({ error: 'Invalid email or password' })

  const valid = await bcrypt.compare(password, customer.passwordHash)
  if (!valid) return res.status(401).json({ error: 'Invalid email or password' })

  await prisma.customer.update({ where: { id: customer.id }, data: { lastLoginAt: new Date() } })

  const tokenPayload = { id: customer.id, email: customer.email, role: 'customer', type: 'customer' as const }
  const accessToken = generateToken(tokenPayload)
  const refreshToken = generateRefreshToken(tokenPayload)

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 14 * 24 * 60 * 60 * 1000,
  })

  res.json({
    accessToken,
    user: { id: customer.id, name: customer.name, email: customer.email },
  })
}))

// ─── Logout ────────────────────────────────────────────────────
router.post('/logout', authenticateCustomer, asyncHandler(async (_req, res) => {
  res.clearCookie('refreshToken')
  res.json({ message: 'Logged out' })
}))

// ─── Get Current User ──────────────────────────────────────────
router.get('/me', authenticateCustomer, asyncHandler(async (req: AuthRequest, res) => {
  const customer = await prisma.customer.findUnique({
    where: { id: req.user!.id },
    select: { id: true, name: true, email: true, phone: true, company: true, country: true },
  })
  if (!customer) return res.status(404).json({ error: 'User not found' })
  res.json({ user: customer })
}))

// ─── Update Profile ──────────────────────────────────────────
router.put('/me', authenticateCustomer, validateBody(updateProfileSchema), asyncHandler(async (req: AuthRequest, res) => {
  const customer = await prisma.customer.update({
    where: { id: req.user!.id },
    data: req.body,
    select: { id: true, name: true, email: true, phone: true, company: true, country: true, city: true, address: true, website: true },
  })
  res.json({ user: customer })
}))

// ─── Refresh Token ────────────────────────────────────────────
router.post('/refresh', asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken
  if (!refreshToken) return res.status(401).json({ error: 'No refresh token' })

  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET) as any
    if (!decoded.refresh || decoded.type !== 'customer') {
      return res.status(401).json({ error: 'Invalid refresh token' })
    }

    const customer = await prisma.customer.findUnique({ where: { id: decoded.id } })
    if (!customer || customer.status !== 'active') {
      return res.status(401).json({ error: 'Account not found or inactive' })
    }

    const tokenPayload = { id: customer.id, email: customer.email, role: 'customer', type: 'customer' as const }
    const accessToken = generateToken(tokenPayload)
    const newRefreshToken = generateRefreshToken(tokenPayload)

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 14 * 24 * 60 * 60 * 1000,
    })

    res.json({ accessToken })
  } catch {
    return res.status(401).json({ error: 'Invalid refresh token' })
  }
}))

// ─── Forgot Password ──────────────────────────────────────────
router.post('/forgot-password', passwordResetLimiter, validateBody(forgotPasswordSchema), asyncHandler(async (req, res) => {
  const { email } = req.body
  const customer = await prisma.customer.findUnique({ where: { email } })

  // Always return success to prevent email enumeration
  if (!customer) {
    return res.json({ message: 'If an account exists with this email, a reset link has been sent.' })
  }

  // Generate reset token (1 hour expiry) — signed with password hash so it's
  // automatically invalidated when the user changes their password
  const resetToken = jwt.sign(
    { id: customer.id, email: customer.email, type: 'customer', reset: true },
    JWT_SECRET + customer.passwordHash,
    { expiresIn: '1h' }
  )

  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`

  sendPasswordReset({ to: customer.email, name: customer.name, resetUrl }).catch(err => {
    logger.error({ err }, 'Password reset email failed')
  })

  res.json({ message: 'If an account exists with this email, a reset link has been sent.' })
}))

// ─── Reset Password ───────────────────────────────────────────
router.post('/reset-password', passwordResetLimiter, validateBody(resetPasswordSchema), asyncHandler(async (req, res) => {
  const { token, password } = req.body

  // Decode without verification to get user ID
  const decoded = jwt.decode(token) as any
  if (!decoded || !decoded.id || !decoded.reset || decoded.type !== 'customer') {
    return res.status(400).json({ error: 'Invalid reset token' })
  }

  // Fetch user to get current password hash for verification
  const customer = await prisma.customer.findUnique({ where: { id: decoded.id } })
  if (!customer) {
    return res.status(400).json({ error: 'Invalid or expired reset token' })
  }

  // Verify token against current password hash
  // This invalidates old tokens when password changes
  try {
    jwt.verify(token, JWT_SECRET + customer.passwordHash)
  } catch {
    return res.status(400).json({ error: 'Invalid or expired reset token' })
  }

  const passwordHash = await bcrypt.hash(password, 12)
  await prisma.customer.update({
    where: { id: decoded.id },
    data: { passwordHash },
  })

  res.json({ message: 'Password has been reset. You can now log in.' })
}))

export default router
