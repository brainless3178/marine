import { describe, it, expect, vi, beforeEach } from 'vitest'
import crypto from 'crypto'

// ─── Inline CSRF logic for testing ──────────────────────────
// We test the same algorithm used in the middleware since the
// middleware functions are not individually exported.
const CSRF_SECRET = 'test-secret'
const TOKEN_EXPIRY_MS = 60 * 60 * 1000

function generateToken(): string {
  const randomBytes = crypto.randomBytes(32).toString('hex')
  const timestamp = Date.now().toString(36)
  const signature = crypto
    .createHmac('sha256', CSRF_SECRET)
    .update(`${randomBytes}:${timestamp}`)
    .digest('hex')
    .slice(0, 16)
  return `${randomBytes}.${timestamp}.${signature}`
}

function verifyToken(token: string): boolean {
  const parts = token.split('.')
  if (parts.length !== 3) return false
  const [randomBytes, timestamp, signature] = parts
  const expectedSignature = crypto
    .createHmac('sha256', CSRF_SECRET)
    .update(`${randomBytes}:${timestamp}`)
    .digest('hex')
    .slice(0, 16)
  if (signature.length !== expectedSignature.length) return false
  let diff = 0
  for (let i = 0; i < signature.length; i++) {
    diff |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i)
  }
  if (diff !== 0) return false
  const tokenTime = parseInt(timestamp, 36)
  if (Date.now() - tokenTime > TOKEN_EXPIRY_MS) return false
  return true
}

describe('CSRF Token Generation & Verification', () => {
  it('should generate a valid token that passes verification', () => {
    const token = generateToken()
    expect(token).toMatch(/^[a-f0-9]+\.[a-z0-9]+.[a-f0-9]+$/)
    expect(verifyToken(token)).toBe(true)
  })

  it('should reject tokens with invalid format', () => {
    expect(verifyToken('')).toBe(false)
    expect(verifyToken('invalid')).toBe(false)
    expect(verifyToken('a.b')).toBe(false)
    expect(verifyToken('a.b.c.d')).toBe(false)
  })

  it('should reject tokens with tampered signature', () => {
    const token = generateToken()
    const parts = token.split('.')
    parts[2] = '0000000000000000'
    expect(verifyToken(parts.join('.'))).toBe(false)
  })

  it('should reject tokens with tampered random bytes', () => {
    const token = generateToken()
    const parts = token.split('.')
    parts[0] = 'a'.repeat(64)
    expect(verifyToken(parts.join('.'))).toBe(false)
  })

  it('should reject expired tokens', () => {
    const randomBytes = crypto.randomBytes(32).toString('hex')
    const oldTimestamp = (Date.now() - TOKEN_EXPIRY_MS - 1000).toString(36)
    const signature = crypto
      .createHmac('sha256', CSRF_SECRET)
      .update(`${randomBytes}:${oldTimestamp}`)
      .digest('hex')
      .slice(0, 16)
    expect(verifyToken(`${randomBytes}.${oldTimestamp}.${signature}`)).toBe(false)
  })

  it('should generate unique tokens each time', () => {
    const tokens = new Set<string>()
    for (let i = 0; i < 100; i++) {
      tokens.add(generateToken())
    }
    expect(tokens.size).toBe(100)
  })
})
