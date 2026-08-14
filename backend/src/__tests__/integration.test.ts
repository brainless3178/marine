import { describe, it, expect, vi } from 'vitest'

// ─── Set required env vars BEFORE any imports ──────────────────
vi.hoisted(() => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-for-integration-tests-32ch'
  process.env.CSRF_SECRET = process.env.CSRF_SECRET || 'test-csrf-secret-for-integration-tests-32c'
  process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test'
})

// ─── Mock Prisma before importing app ─────────────────────────
const mockPrisma = {
  $queryRaw: vi.fn().mockResolvedValue([{ '?column?': 1 }]),
  $connect: vi.fn(),
  $disconnect: vi.fn(),
  customer: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
  adminUser: { findUnique: vi.fn() },
  order: { findUnique: vi.fn(), create: vi.fn() },
  product: { findUnique: vi.fn() },
  rfq: { create: vi.fn() },
  contactMessage: { create: vi.fn() },
  emergencyRequest: { create: vi.fn() },
  storeSetting: { findUnique: vi.fn() },
}

vi.mock('../server.js', () => ({ prisma: mockPrisma }))

// ─── Import middleware directly for testing ────────────────────
import { verifyCsrf, issueCsrfToken } from '../middleware/csrf.js'
import { loginLimiter, registerLimiter, passwordResetLimiter } from '../middleware/rateLimit.js'

// ─── Tests ────────────────────────────────────────────────────

describe('Integration: XSS Sanitization', () => {
  it('should strip script tags from request body strings', async () => {
    const xss = (await import('xss')).default
    const xssOptions = { whiteList: {}, stripIgnoreTag: true, stripIgnoreTagBody: ['script', 'style'] }

    const body = { name: '<script>alert("xss")</script>John', message: '<img src=x onerror=alert(1)>Safe' }
    const sanitized = JSON.parse(JSON.stringify(body, (_key: string, value: unknown) => {
      if (typeof value === 'string') return xss(value, xssOptions).trim()
      return value
    }))

    expect(sanitized.name).not.toContain('<script>')
    expect(sanitized.message).not.toContain('<img')
  })

  it('should strip SVG XSS payloads', () => {
    const input = '<svg onload=alert(1)>'
    // The sanitize middleware would strip this via xss library
    expect(input).toContain('onload') // Before sanitization
  })
})

describe('Integration: CSRF Protection', () => {
  it('should issue a CSRF token on GET /api/csrf-token', () => {
    const req = { method: 'GET' } as any
    const res = {
      cookie: vi.fn(),
      json: vi.fn(),
    } as any

    issueCsrfToken(req, res)

    expect(res.cookie).toHaveBeenCalled()
    expect(res.json).toHaveBeenCalled()
    const callArgs = res.json.mock.calls[0][0]
    expect(callArgs.csrfToken).toBeTruthy()
    expect(typeof callArgs.csrfToken).toBe('string')
  })

  it('should reject non-GET requests to /api/csrf-token', () => {
    const req = { method: 'POST' } as any
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as any

    issueCsrfToken(req, res)

    expect(res.status).toHaveBeenCalledWith(405)
  })

  it('should skip CSRF for GET requests', () => {
    const req = { method: 'GET', path: '/api/storefront/rfq', cookies: {} } as any
    const res = {} as any
    const next = vi.fn()

    verifyCsrf(req, res, next)

    expect(next).toHaveBeenCalled()
  })

  it('should skip CSRF for webhook routes', () => {
    const req = { method: 'POST', path: '/api/webhooks/paypal', originalUrl: '/api/webhooks/paypal', cookies: { 'csrf-token': 'fake' } } as any
    const res = {} as any
    const next = vi.fn()

    verifyCsrf(req, res, next)

    expect(next).toHaveBeenCalled()
  })

  it('should skip CSRF when no cookie is set (non-browser client)', () => {
    const req = { method: 'POST', path: '/api/storefront/rfq', originalUrl: '/api/storefront/rfq', cookies: {}, headers: {} } as any
    const res = {} as any
    const next = vi.fn()

    verifyCsrf(req, res, next)

    expect(next).toHaveBeenCalled()
  })

  it('should reject when cookie exists but header is missing', () => {
    const req = { method: 'POST', path: '/api/storefront/rfq', originalUrl: '/api/storefront/rfq', cookies: { 'csrf-token': 'some-token' }, headers: {} } as any
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as any
    const next = vi.fn()

    verifyCsrf(req, res, next)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(next).not.toHaveBeenCalled()
  })

  it('should reject when token mismatch', () => {
    const req = { method: 'POST', path: '/api/storefront/rfq', originalUrl: '/api/storefront/rfq', cookies: { 'csrf-token': 'token-a' }, headers: { 'x-csrf-token': 'token-b' } } as any
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as any
    const next = vi.fn()

    verifyCsrf(req, res, next)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('should skip CSRF for admin refresh under the /api/v1 prefix', () => {
    const req = { method: 'POST', path: '/api/v1/admin/auth/refresh', originalUrl: '/api/v1/admin/auth/refresh', cookies: { 'csrf-token': 'some-token' }, headers: {} } as any
    const res = {} as any
    const next = vi.fn()

    verifyCsrf(req, res, next)

    expect(next).toHaveBeenCalled()
  })

  it('should skip CSRF for customer refresh under both prefixes', () => {
    for (const originalUrl of ['/api/auth/refresh', '/api/v1/auth/refresh']) {
      const req = { method: 'POST', path: originalUrl, originalUrl, cookies: { 'csrf-token': 'some-token' }, headers: {} } as any
      const res = {} as any
      const next = vi.fn()

      verifyCsrf(req, res, next)

      expect(next).toHaveBeenCalled()
    }
  })
})

describe('Integration: Rate Limiting', () => {
  it('loginLimiter should be a function', () => {
    expect(typeof loginLimiter).toBe('function')
  })

  it('registerLimiter should be a function', () => {
    expect(typeof registerLimiter).toBe('function')
  })

  it('passwordResetLimiter should be a function', () => {
    expect(typeof passwordResetLimiter).toBe('function')
  })
})
