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

/** @internal Exported only for testing — resets the token cache */
export function resetPaypalCache() {
  cachedToken = null
  tokenExpiresAt = 0
}

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

// ─── PayPal Refund ──────────────────────────────────────────
// Refunds a PayPal capture for a given order.
// Returns { success: true } on success, or { success: false, error: string } on failure.
export async function processPaypalRefund(
  paypalOrderId: string,
  amount: number,
  currency: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const accessToken = await getPaypalAccessToken()
    if (!accessToken) {
      return { success: false, error: 'Failed to get PayPal access token' }
    }

    // First, get the capture ID from the PayPal order
    const orderRes = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${paypalOrderId}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    })
    if (!orderRes.ok) {
      return { success: false, error: 'Failed to lookup PayPal order' }
    }
    const orderData = await orderRes.json() as {
      purchase_units?: { payments?: { captures?: { id: string }[] } }[]
    }

    // Extract the capture ID from the purchase unit
    const captureId = orderData?.purchase_units?.[0]?.payments?.captures?.[0]?.id
    if (!captureId) {
      return { success: false, error: 'No capture found for this PayPal order' }
    }

    // Call PayPal Refund API
    const refundRes = await fetch(`${PAYPAL_BASE}/v2/payments/captures/${captureId}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        amount: {
          value: amount.toFixed(2),
          currency_code: currency || 'USD',
        },
      }),
    })

    if (!refundRes.ok) {
      const err = await refundRes.json().catch(() => ({})) as Record<string, unknown>
      paypalLog.error({ err, paypalOrderId, captureId }, 'PayPal refund failed')
      return { success: false, error: err instanceof Error ? err.message : (err as Record<string, string>)?.message || 'PayPal refund request rejected' }
    }

    paypalLog.info({ paypalOrderId, captureId, amount }, 'PayPal refund processed successfully')
    return { success: true }
  } catch (err) {
    paypalLog.error({ err, paypalOrderId }, 'PayPal refund error')
    return { success: false, error: 'PayPal refund failed with an exception' }
  }
}
