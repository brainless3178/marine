import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import type { SignOptions } from 'jsonwebtoken'

const _jwtSecret = process.env.JWT_SECRET
if (!_jwtSecret) {
  throw new Error('FATAL: JWT_SECRET environment variable is required. Set it in .env before starting the server.')
}
const JWT_SECRET = _jwtSecret as string

export interface AuthUser {
  id: string
  email: string
  role: string
  type?: string
}

export interface AuthRequest extends Request {
  user?: AuthUser
}

// ─── Authenticate Admin ────────────────────────────────────────
export function authenticateAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' })
  }

  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser
    req.user = decoded
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

// ─── Authenticate Customer ─────────────────────────────────────
export function authenticateCustomer(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' })
  }

  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser & { type: string }
    if (decoded.type !== 'customer') {
      return res.status(403).json({ error: 'Customer access required' })
    }
    req.user = decoded
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

// ─── Require Role ──────────────────────────────────────────────
const ROLE_HIERARCHY: Record<string, number> = {
  'owner': 6,
  'store-manager': 5,
  'inventory-manager': 4,
  'sales-agent': 3,
  'content-manager': 3,
  'viewer': 1,
}

export function requireRole(minRole: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    const userLevel = ROLE_HIERARCHY[req.user.role] ?? 0
    const requiredLevel = ROLE_HIERARCHY[minRole] ?? 0

    if (userLevel < requiredLevel) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }

    next()
  }
}

// ─── Require Owner ─────────────────────────────────────────────
export function requireOwner(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'owner') {
    return res.status(403).json({ error: 'Owner access required' })
  }
  next()
}

// ─── Generate JWT ──────────────────────────────────────────────
export function generateToken(user: { id: string; email: string; role: string; type?: string }): string {
  const payload = { id: user.id, email: user.email, role: user.role, type: user.type || 'admin' }
  const options: SignOptions = { expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as unknown as SignOptions['expiresIn'] }
  return jwt.sign(payload, JWT_SECRET, options)
}

export function generateRefreshToken(user: { id: string; email: string; role: string; type?: string }): string {
  const payload = { id: user.id, email: user.email, role: user.role, type: user.type || 'admin', refresh: true }
  const options: SignOptions = { expiresIn: (process.env.REFRESH_TOKEN_EXPIRES_IN || '7d') as unknown as SignOptions['expiresIn'] }
  return jwt.sign(payload, JWT_SECRET, options)
}
