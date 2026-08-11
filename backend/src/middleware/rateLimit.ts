import type { Request } from 'express'
import { rateLimit, RateLimitRequestHandler } from 'express-rate-limit'

// ─── Brute-Force Protection for Auth Endpoints ───────────────
// Stricter than general publicLimiter:
// - Login: 5 attempts per 15 minutes per IP
// - Register: 3 attempts per hour per IP
// - Password reset: 3 attempts per 15 minutes per IP

export const loginLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,                    // 5 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
  keyGenerator: (req: Request) => {
    // Use forwarded IP if behind reverse proxy, otherwise use connection IP
    return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
      || req.ip
      || req.socket.remoteAddress
      || 'unknown'
  },
  skipSuccessfulRequests: true, // Don't count successful logins against limit
})

export const registerLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,                    // 3 registrations per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many registration attempts. Please try again later.' },
  keyGenerator: (req: Request) => {
    return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
      || req.ip
      || req.socket.remoteAddress
      || 'unknown'
  },
})

export const passwordResetLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3,                    // 3 reset requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many password reset requests. Please try again later.' },
  keyGenerator: (req: Request) => {
    return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
      || req.ip
      || req.socket.remoteAddress
      || 'unknown'
  },
})
