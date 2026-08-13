import { describe, it, expect, vi } from 'vitest'
import jwt from 'jsonwebtoken'

// Set env vars before importing the middleware
process.env.JWT_SECRET = 'test-secret-key-not-used-in-production'
process.env.JWT_EXPIRES_IN = '15m'
process.env.REFRESH_TOKEN_EXPIRES_IN = '7d'

const auth = await import('../middleware/auth.js')

describe('generateToken', () => {
  it('generates a valid JWT for admin users', () => {
    const token = auth.generateToken({ id: 'user-1', email: 'admin@test.com', role: 'owner' })
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    expect(decoded.id).toBe('user-1')
    expect(decoded.email).toBe('admin@test.com')
    expect(decoded.role).toBe('owner')
    expect(decoded.type).toBe('admin')
  })

  it('generates a valid JWT for customer users', () => {
    const token = auth.generateToken({ id: 'cust-1', email: 'customer@test.com', role: 'customer', type: 'customer' })
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    expect(decoded.id).toBe('cust-1')
    expect(decoded.type).toBe('customer')
  })

  it('generates tokens with an expiration', () => {
    const token = auth.generateToken({ id: 'u1', email: 'u@t.com', role: 'viewer' })
    const decoded = jwt.decode(token) as any
    expect(decoded.exp).toBeGreaterThan(Math.floor(Date.now() / 1000))
    expect(decoded.exp).toBeLessThan(Math.floor(Date.now() / 1000) + 3600) // 15m expiry
  })

  // JWT_SECRET is validated at startup by backend/src/utils/env.ts (which
  // refuses to boot in production without a real secret), so there is no
  // module-load guard to test here.
})

describe('generateRefreshToken', () => {
  it('generates a refresh token with refresh flag', () => {
    const token = auth.generateRefreshToken({ id: 'user-1', email: 'admin@test.com', role: 'owner' })
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    expect(decoded.refresh).toBe(true)
    expect(decoded.id).toBe('user-1')
  })

  it('has longer expiry than access token', () => {
    const token = auth.generateRefreshToken({ id: 'u1', email: 'u@t.com', role: 'viewer' })
    const decoded = jwt.decode(token) as any
    const expiresIn = decoded.exp - decoded.iat
    expect(expiresIn).toBeGreaterThan(3600) // More than 1 hour (7 days typically)
  })
})

describe('authenticateAdmin middleware', () => {
  function mockReqRes(authHeader?: string) {
    const req = { headers: { authorization: authHeader } } as any
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as any
    const next = vi.fn()
    return { req, res, next }
  }

  it('passes with valid admin token', () => {
    const token = auth.generateToken({ id: 'admin-1', email: 'admin@test.com', role: 'owner' })
    const { req, res, next } = mockReqRes(`Bearer ${token}`)
    auth.authenticateAdmin(req, res, next)
    expect(next).toHaveBeenCalled()
    expect(req.user?.id).toBe('admin-1')
  })

  it('rejects missing token', () => {
    const { req, res, next } = mockReqRes(undefined)
    auth.authenticateAdmin(req, res, next)
    expect(next).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' })
  })

  it('rejects malformed authorization header', () => {
    const { req, res, next } = mockReqRes('Basic token123')
    auth.authenticateAdmin(req, res, next)
    expect(next).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(401)
  })

  it('rejects invalid token', () => {
    const { req, res, next } = mockReqRes('Bearer invalid-token-here')
    auth.authenticateAdmin(req, res, next)
    expect(next).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' })
  })

  it('rejects expired token', () => {
    // Use negative expiration to create a deterministically expired token
    const expiredPayload = { id: 'u1', email: 'a@b.com', role: 'viewer', type: 'admin' }
    const expiredToken = jwt.sign(expiredPayload, process.env.JWT_SECRET!, { expiresIn: -1 })
    const { req, res, next } = mockReqRes(`Bearer ${expiredToken}`)
    auth.authenticateAdmin(req, res, next)
    expect(next).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(401)
  })
})

describe('authenticateCustomer middleware', () => {
  function mockReqRes(authHeader?: string) {
    const req = { headers: { authorization: authHeader } } as any
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as any
    const next = vi.fn()
    return { req, res, next }
  }

  it('passes with valid customer token', () => {
    const token = auth.generateToken({ id: 'cust-1', email: 'cust@test.com', role: 'customer', type: 'customer' })
    const { req, res, next } = mockReqRes(`Bearer ${token}`)
    auth.authenticateCustomer(req, res, next)
    expect(next).toHaveBeenCalled()
    expect(req.user?.type).toBe('customer')
  })

  it('rejects admin token for customer route', () => {
    const token = auth.generateToken({ id: 'admin-1', email: 'admin@test.com', role: 'owner' })
    const { req, res, next } = mockReqRes(`Bearer ${token}`)
    auth.authenticateCustomer(req, res, next)
    expect(next).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({ error: 'Customer access required' })
  })

  it('rejects missing token', () => {
    const { req, res, next } = mockReqRes(undefined)
    auth.authenticateCustomer(req, res, next)
    expect(next).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(401)
  })
})

describe('requireRole middleware', () => {
  function mockReqRes(user?: any) {
    const req = { user } as any
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as any
    const next = vi.fn()
    return { req, res, next }
  }

  it('passes when user has required role', () => {
    const { req, res, next } = mockReqRes({ id: '1', email: 'a@b.com', role: 'inventory-manager' })
    auth.requireRole('inventory-manager')(req, res, next)
    expect(next).toHaveBeenCalled()
  })

  it('passes when user has higher role than required', () => {
    const { req, res, next } = mockReqRes({ id: '1', email: 'a@b.com', role: 'store-manager' })
    auth.requireRole('sales-agent')(req, res, next)
    expect(next).toHaveBeenCalled()
  })

  it('rejects when user has insufficient role', () => {
    const { req, res, next } = mockReqRes({ id: '1', email: 'a@b.com', role: 'viewer' })
    auth.requireRole('inventory-manager')(req, res, next)
    expect(next).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({ error: 'Insufficient permissions' })
  })

  it('rejects unauthenticated users', () => {
    const { req, res, next } = mockReqRes(undefined)
    auth.requireRole('viewer')(req, res, next)
    expect(next).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ error: 'Not authenticated' })
  })

  it('rejects unknown roles', () => {
    const { req, res, next } = mockReqRes({ id: '1', email: 'a@b.com', role: 'unknown-role' })
    auth.requireRole('viewer')(req, res, next)
    expect(next).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('passes owner for any role check', () => {
    const { req, res, next } = mockReqRes({ id: '1', email: 'a@b.com', role: 'owner' })
    auth.requireRole('store-manager')(req, res, next)
    expect(next).toHaveBeenCalled()
  })
})

describe('requireOwner middleware', () => {
  function mockReqRes(user?: any) {
    const req = { user } as any
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as any
    const next = vi.fn()
    return { req, res, next }
  }

  it('passes for owner', () => {
    const { req, res, next } = mockReqRes({ id: '1', role: 'owner' })
    auth.requireOwner(req, res, next)
    expect(next).toHaveBeenCalled()
  })

  it('rejects non-owner roles', () => {
    const { req, res, next } = mockReqRes({ id: '1', role: 'store-manager' })
    auth.requireOwner(req, res, next)
    expect(next).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({ error: 'Owner access required' })
  })

  it('rejects unauthenticated users', () => {
    const { req, res, next } = mockReqRes(undefined)
    auth.requireOwner(req, res, next)
    expect(next).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(403)
  })
})
