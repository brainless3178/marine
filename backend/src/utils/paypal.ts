import logger from './logger.js'

const paypalLog = logger.child({ context: 'paypal' })

export const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || ''
export const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || ''
export const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID || ''
export const PAYPAL_BASE = process.env.PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com'

// ─── Get PayPal Access Token (cached with TTL) ─────────────
let cachedToken: string | null = null
let tokenExpiresAt = 0

export async function getPaypalAccessToken(): Promise<string | null> {
  // Return cached token if still valid (with 5 min buffer)
  if (cachedToken && Date.now() < tokenExpiresAt - 5 * 60 * 1000) {
    return cachedToken
  }

  try {
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64')
    const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`,
      },
      body: 'grant_type=client_credentials',
    })
    if (!res.ok) return null
    const data = await res.json() as { access_token: string; expires_in: number }
    cachedToken = data.access_token
    tokenExpiresAt = Date.now() + (data.expires_in * 1000)
    return cachedToken
  } catch (err) {
    paypalLog.error({ err }, 'Failed to get PayPal access token')
    return null
  }
}
