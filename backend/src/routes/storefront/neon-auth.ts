/**
 * Neon Auth Backend Proxy Routes
 *
 * Since Neon Auth runs on a different domain (neonauth.c-10.us-east-1.aws.neon.tech),
 * its cookies are NOT accessible to our frontend (aalka.netlify.app). This module
 * acts as a server-side proxy that:
 *
 * 1. Initiates OAuth by calling Neon Auth's sign-in endpoint server-side
 * 2. Handles the OAuth callback with Neon Auth's session cookie
 * 3. Issues our own JWT for the frontend to use
 * 4. Validates Neon Auth sessions server-side and returns user data
 */

import { Router, Request, Response } from 'express'
import type { AuthRequest } from '../../middleware/auth.js'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'

const router = Router()

// ─── Configuration ─────────────────────────────────────────────
const NEON_AUTH_URL = process.env.NEON_AUTH_URL || 'https://ep-orange-voice-aur4fzzm.neonauth.c-10.us-east-1.aws.neon.tech/neondb/auth'
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001'

const _jwtSecret = process.env.JWT_SECRET
if (!_jwtSecret) {
  throw new Error('FATAL: JWT_SECRET environment variable is required.')
}
const JWT_SECRET = _jwtSecret as string

// ─── CSRF State Store (in-memory, expires after 10 min) ───────
const pendingStates = new Map<string, { createdAt: number }>()
const STATE_TTL_MS = 10 * 60 * 1000 // 10 minutes

// Clean up expired states every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of pendingStates) {
    if (now - value.createdAt > STATE_TTL_MS) {
      pendingStates.delete(key)
    }
  }
}, 5 * 60 * 1000)

// ─── Generate our own JWT for the frontend ─────────────────────
function generateOurJWT(user: { id: string; email: string; name?: string; image?: string }): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: 'customer',
      type: 'customer',
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

function generateRefreshJWT(user: { id: string; email: string }): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: 'customer',
      type: 'customer',
      refresh: true,
    },
    JWT_SECRET,
    { expiresIn: '14d' }
  )
}

// ─── POST /api/auth/neon/sign-in ───────────────────────────────
// Initiates Google OAuth flow. Returns the redirect URL for the frontend.
router.post('/sign-in', async (_req: AuthRequest, res: Response) => {
  try {
    // Generate a CSRF state token
    const state = crypto.randomBytes(32).toString('hex')
    pendingStates.set(state, { createdAt: Date.now() })

    // Callback goes to our backend (not frontend) so we receive Neon Auth's
    // session cookies/tokens server-side and can validate them.
    const callbackURL = `${BACKEND_URL}/api/auth/neon/callback?state=${state}`

    // Call Neon Auth to get the Google OAuth redirect URL
    const response = await fetch(`${NEON_AUTH_URL}/sign-in/social`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'google',
        callbackURL,
      }),
    })

    if (!response.ok) {
      const error = (await response.json().catch(() => ({ error: 'Failed to initiate sign-in' }))) as { error?: string; message?: string }
      return res.status(response.status).json({ error: error.error || error.message || 'Sign-in initiation failed' })
    }

    const data = (await response.json()) as { url?: string }

    if (!data.url) {
      return res.status(500).json({ error: 'No redirect URL returned from Neon Auth' })
    }

    res.json({ url: data.url, state })
  } catch (err: any) {
    console.error('Neon Auth sign-in proxy error:', err)
    res.status(500).json({ error: 'Failed to initiate Google sign-in' })
  }
})

// ─── GET /api/auth/neon/callback ──────────────────────────────
// Handles the OAuth callback from Neon Auth redirect (GET request).
// Neon Auth redirects here after Google auth completes.
// We receive any cookies/tokens Neon Auth sets, validate the session,
// issue our own JWT, and redirect to the frontend.
router.get('/callback', async (req: AuthRequest, res: Response) => {
  try {
    const state = req.query.state as string | undefined
    const error = req.query.error as string | undefined

    // Check for OAuth error from Google/Neon Auth
    if (error) {
      console.error('OAuth callback error:', error)
      return res.redirect(`${FRONTEND_URL}/auth/callback?error=${encodeURIComponent(error)}`)
    }

    // Validate CSRF state
    if (!state || !pendingStates.has(state)) {
      console.error('Invalid or missing CSRF state in callback')
      return res.redirect(`${FRONTEND_URL}/auth/callback?error=invalid_state`)
    }
    pendingStates.delete(state)

    // Neon Auth may pass a token via Authorization header, query param, or Set-Cookie.
    // Cross-domain cookies won't be forwarded, so we check all possible sources:
    const neonAuthHeader = req.headers.authorization || ''
    const neonToken = (req.query.token as string) || (req.query.access_token as string) || ''
    // Also check Set-Cookie headers that Neon Auth may have set on the redirect response
    const neonCookie = req.headers.cookie || ''

    // Validate the Neon Auth session by calling their get-session endpoint
    const sessionResponse = await fetch(`${NEON_AUTH_URL}/get-session`, {
      method: 'GET',
      headers: {
        ...(neonAuthHeader ? { 'Authorization': neonAuthHeader } : {}),
        ...(neonToken ? { 'Authorization': `Bearer ${neonToken}` } : {}),
        ...(neonCookie ? { 'Cookie': neonCookie } : {}),
      },
    })

    if (!sessionResponse.ok) {
      console.error('Neon Auth session validation failed:', sessionResponse.status)
      return res.redirect(`${FRONTEND_URL}/auth/callback?error=session_invalid`)
    }

    const sessionData = (await sessionResponse.json()) as { user?: { id: string; email: string; name?: string; image?: string }; session?: Record<string, unknown> }
    const user = sessionData.user
    const session = sessionData.session

    if (!user || !session) {
      return res.redirect(`${FRONTEND_URL}/auth/callback?error=no_session`)
    }

    // Issue our own JWT
    const accessToken = generateOurJWT({
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
    })

    const refreshToken = generateRefreshJWT({
      id: user.id,
      email: user.email,
    })

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days
    })

    // Redirect to frontend with access token and user data in URL hash
    // (hash is not sent to server, more secure than query params for tokens)
    const userData = encodeURIComponent(JSON.stringify({
      id: user.id,
      name: user.name || user.email?.split('@')[0] || 'User',
      email: user.email,
      image: user.image,
    }))

    res.redirect(`${FRONTEND_URL}/auth/callback#access_token=${accessToken}&user=${userData}`)
  } catch (err: any) {
    console.error('Neon Auth callback proxy error:', err)
    res.redirect(`${FRONTEND_URL}/auth/callback?error=callback_failed`)
  }
})

// ─── GET /api/auth/neon/session ────────────────────────────────
// Returns the current user session. Validates our JWT or refreshes from cookie.
router.get('/session', async (req: AuthRequest, res: Response) => {
  try {
    const authHeader = req.headers.authorization

    // Try to validate the access token
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string; type: string }
        if (decoded.type === 'customer') {
          return res.json({
            user: {
              id: decoded.id,
              email: decoded.email,
              name: decoded.email.split('@')[0],
              role: decoded.role,
            },
            accessToken: token,
          })
        }
      } catch {
        // Token expired — try refresh
      }
    }

    // Try refresh token cookie
    const refreshToken = req.cookies?.refreshToken
    if (refreshToken) {
      try {
        const decoded = jwt.verify(refreshToken, JWT_SECRET) as { id: string; email: string; type: string; refresh?: boolean }
        if (decoded.refresh && decoded.type === 'customer') {
          const newAccessToken = generateOurJWT({
            id: decoded.id,
            email: decoded.email,
          })
          return res.json({
            user: {
              id: decoded.id,
              email: decoded.email,
              name: decoded.email.split('@')[0],
              role: 'customer',
            },
            accessToken: newAccessToken,
          })
        }
      } catch {
        // Refresh token invalid
      }
    }

    res.status(401).json({ error: 'No valid session' })
  } catch (err: any) {
    res.status(500).json({ error: 'Session validation failed' })
  }
})

// ─── POST /api/auth/neon/sign-out ──────────────────────────────
// Signs out the user by clearing the refresh token cookie.
router.post('/sign-out', (_req: AuthRequest, res: Response) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  })
  res.json({ message: 'Signed out successfully' })
})

// ─── POST /api/auth/neon/refresh ───────────────────────────────
// Refreshes the access token using the refresh token cookie.
router.post('/refresh', (req: AuthRequest, res: Response) => {
  try {
    const refreshToken = req.cookies?.refreshToken
    if (!refreshToken) {
      return res.status(401).json({ error: 'No refresh token' })
    }

    const decoded = jwt.verify(refreshToken, JWT_SECRET) as { id: string; email: string; type: string; refresh?: boolean }
    if (!decoded.refresh || decoded.type !== 'customer') {
      return res.status(401).json({ error: 'Invalid refresh token' })
    }

    const newAccessToken = generateOurJWT({
      id: decoded.id,
      email: decoded.email,
    })

    res.json({ accessToken: newAccessToken })
  } catch {
    res.status(401).json({ error: 'Invalid or expired refresh token' })
  }
})

export default router
