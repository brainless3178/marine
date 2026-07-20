/**
 * Neon Auth Client Library (Backend Proxy)
 *
 * All Neon Auth communication happens server-side via our backend proxy.
 * The backend handles OAuth initiation, callback processing, and JWT issuance.
 * This frontend client only communicates with our backend endpoints.
 *
 * Flow:
 * 1. Frontend calls POST /api/auth/neon/sign-in → Backend gets OAuth URL from Neon Auth
 * 2. Frontend redirects to Google → User authenticates
 * 3. Google → Neon Auth → Backend /api/auth/neon/callback (server-side!)
 * 4. Backend validates Neon Auth session, issues our JWT, redirects to frontend /auth/callback#access_token=xxx&user=xxx
 * 5. Frontend extracts JWT from URL hash, stores in memory
 * 6. Frontend uses JWT for all API calls
 */

// ─── Configuration ─────────────────────────────────────────────
const API_BASE = '/api/auth/neon'

// ─── Types ─────────────────────────────────────────────────────
export interface NeonAuthUser {
  id: string
  email: string
  name: string
  image?: string
}

export interface NeonAuthSession {
  user: NeonAuthUser
  accessToken: string
}

// ─── Token Storage (in-memory only, never localStorage) ────────
let currentAccessToken: string | null = null
let currentSession: NeonAuthSession | null = null
let sessionPromise: Promise<NeonAuthSession | null> | null = null

// ─── Initiate Google OAuth ─────────────────────────────────────

/**
 * Start the Google OAuth sign-in flow.
 * Calls our backend proxy which gets the OAuth URL from Neon Auth.
 */
export async function signInWithGoogle(): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}/sign-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to initiate sign-in' }))
      throw new Error(error.error || `Sign-in failed (${response.status})`)
    }

    const data = await response.json()

    if (!data.url) {
      throw new Error('No redirect URL returned')
    }

    // Redirect to Google OAuth consent screen
    window.location.href = data.url
  } catch (err) {
    console.error('Neon Auth sign-in error:', err)
    throw err
  }
}

// ─── Handle OAuth Callback ─────────────────────────────────────

/**
 * Handle the redirect back from Google → Neon Auth → Backend → our frontend.
 * The backend redirects to /auth/callback#access_token=xxx&user=xxx
 * We extract the token and user data from the URL hash.
 */
export async function handleAuthCallback(): Promise<NeonAuthSession | null> {
  const url = new URL(window.location.href)

  // Check for error in query params (from backend redirect on failure)
  const queryError = url.searchParams.get('error')
  if (queryError) {
    console.error('OAuth callback error:', queryError)
    cleanUrl()
    return null
  }

  // Parse hash fragment for access_token and user data
  const hash = url.hash.replace(/^#\/?/, '')
  const hashParams = new URLSearchParams(hash)

  const accessToken = hashParams.get('access_token')
  const userJson = hashParams.get('user')

  if (!accessToken || !userJson) {
    console.error('No access token or user data in callback URL')
    cleanUrl()
    return null
  }

  try {
    const user = JSON.parse(decodeURIComponent(userJson)) as NeonAuthUser

    const session: NeonAuthSession = {
      user,
      accessToken,
    }

    currentAccessToken = accessToken
    currentSession = session

    // Clean up URL
    cleanUrl()

    return session
  } catch (err) {
    console.error('Failed to parse callback data:', err)
    cleanUrl()
    return null
  }
}

function cleanUrl() {
  // Remove hash and query params from URL
  window.history.replaceState({}, '', window.location.pathname)
}

// ─── Get Session ───────────────────────────────────────────────

/**
 * Get the current session. First checks in-memory, then validates via backend.
 */
export async function getSession(): Promise<NeonAuthSession | null> {
  // Return cached session if we have one
  if (currentAccessToken && currentSession) {
    return currentSession
  }

  // Deduplicate concurrent calls
  if (sessionPromise) return sessionPromise

  sessionPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE}/session`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          ...(currentAccessToken ? { 'Authorization': `Bearer ${currentAccessToken}` } : {}),
        },
      })

      if (!response.ok) {
        currentSession = null
        currentAccessToken = null
        return null
      }

      const data = await response.json()

      if (data.user && data.accessToken) {
        const session: NeonAuthSession = {
          user: data.user,
          accessToken: data.accessToken,
        }
        currentAccessToken = session.accessToken
        currentSession = session
        return session
      }

      return null
    } catch (err) {
      console.error('Session fetch failed:', err)
      currentSession = null
      currentAccessToken = null
      return null
    } finally {
      sessionPromise = null
    }
  })()

  return sessionPromise
}

// ─── Sign Out ──────────────────────────────────────────────────

/**
 * Sign out the user. Clears session on backend and locally.
 */
export async function signOut(): Promise<void> {
  try {
    await fetch(`${API_BASE}/sign-out`, {
      method: 'POST',
      credentials: 'include',
    })
  } catch (err) {
    console.warn('Sign-out error (non-fatal):', err)
  } finally {
    currentSession = null
    currentAccessToken = null
  }
}

// ─── Accessors ─────────────────────────────────────────────────

/**
 * Get the current access token for API Authorization headers.
 */
export function getAccessToken(): string | null {
  return currentAccessToken
}

/**
 * Get the current user from memory (synchronous).
 */
export function getCurrentUser(): NeonAuthUser | null {
  return currentSession?.user || null
}

/**
 * Set the current session manually.
 */
export function setSession(session: NeonAuthSession | null) {
  currentSession = session
  currentAccessToken = session?.accessToken || null
}
