/**
 * Customer-facing PayPal redirect URLs.
 *
 * Built from FRONTEND_URL so production never redirects buyers to localhost.
 * The localhost value is a dev-only fallback — utils/env.ts warns at startup
 * when FRONTEND_URL is missing/localhost in production, and getFrontendUrl()
 * falls back to https://alkatraders.co there, so buyers can never be sent to
 * an admin's machine.
 */

import { getFrontendUrl } from './env.js'

export function paypalReturnUrl(orderId: string): string {
  return `${getFrontendUrl()}/checkout?paypal=success&orderId=${orderId}`
}

export function paypalCancelUrl(): string {
  return `${getFrontendUrl()}/checkout?paypal=cancelled`
}
