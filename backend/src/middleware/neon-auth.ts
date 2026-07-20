/**
 * Neon Auth (Managed Better Auth) middleware
 *
 * Verifies JWTs issued by Neon Auth against the JWKS endpoint.
 * This replaces the custom JWT auth for customer routes.
 */

import { Response, NextFunction } from 'express'
import * as jose from 'jose'
import type { AuthRequest } from './auth.js'

// ─── Neon Auth Configuration ──────────────────────────────────
const NEON_AUTH_URL = process.env.NEON_AUTH_URL || 'https://ep-orange-voice-aur4fzzm.neonauth.c-10.us-east-1.aws.neon.tech/neondb/auth'
const NEON_AUTH_JWKS_URL = `${NEON_AUTH_URL}/.well-known/jwks.json`

// Cache the JWKS set (refreshed automatically by jose)
const JWKS = jose.createRemoteJWKSet(new URL(NEON_AUTH_JWKS_URL))

// ─── Types ────────────────────────────────────────────────────
export interface NeonAuthUser {
  id: string
  email: string
  name?: string
  image?: string
}

export interface NeonAuthRequest extends AuthRequest {
  neonUser?: NeonAuthUser
}

// ─── Verify Neon Auth JWT ─────────────────────────────────────
async function verifyNeonAuthJWT(token: string): Promise<NeonAuthUser | null> {
  try {
    const { payload } = await jose.jwtVerify(token, JWKS, {
      issuer: new URL(NEON_AUTH_URL).origin,
    })

    return {
      id: payload.sub as string,
      email: payload.email as string,
      name: payload.name as string | undefined,
      image: payload.picture as string | undefined,
    }
  } catch (err) {
    return null
  }
}

// ─── Middleware: Authenticate Neon Auth Customer ───────────────
export async function authenticateNeonCustomer(req: NeonAuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' })
  }

  const token = authHeader.split(' ')[1]
  const user = await verifyNeonAuthJWT(token)

  if (!user) {
    return res.status(401).json({ error: 'Invalid or expired Neon Auth token' })
  }

  req.neonUser = user

  // Map to the standard AuthUser format used by other middleware
  req.user = {
    id: user.id,
    email: user.email,
    role: 'customer',
    type: 'customer',
  }

  next()
}

// ─── Helper: Get Neon Auth session from request ───────────────
export async function getNeonAuthSession(headers: Record<string, string | undefined>) {
  const authHeader = headers.authorization
  if (!authHeader?.startsWith('Bearer ')) return null

  const token = authHeader.split(' ')[1]
  return verifyNeonAuthJWT(token)
}
