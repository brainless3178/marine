import { Request, Response, NextFunction } from 'express'
import { rateLimit, RateLimitRequestHandler } from 'express-rate-limit'
import type { AuthRequest } from './auth.js'

// ─── Per-User Rate Limiter ─────────────────────────────────────
// Uses req.user?.id when available (authenticated requests),
// falls back to IP address for unauthenticated requests.
// This prevents one user from exhausting another user's quota
// behind a shared IP (e.g., corporate NAT).

export function createUserAwareLimiter(options: {
  windowMs: number
  max: number
  message?: string
}): RateLimitRequestHandler {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: options.message || 'Too many requests, please try again later.' },
    keyGenerator: (req: Request) => {
      const authReq = req as AuthRequest
      // Use user ID if authenticated, fall back to IP
      if (authReq.user?.id) {
        return `user:${authReq.user.id}`
      }
      // IP-based key for unauthenticated requests
      return (
        (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
        || req.ip
        || req.socket.remoteAddress
        || 'unknown'
      )
    },
  })
}
