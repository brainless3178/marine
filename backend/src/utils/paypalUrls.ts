/**
 * Customer-facing PayPal redirect URLs.
 *
 * Built from FRONTEND_URL so production never redirects buyers to localhost.
 * The localhost value is a dev-only fallback — utils/env.ts refuses to boot
 * production with a missing/localhost FRONTEND_URL (it logs a startup warning),
 * so this fallback can only be hit during local development.
 */

export function paypalReturnUrl(orderId: string): string {
  return `${process.env.FRONTEND_URL || 'http://localhost:5173'}/checkout?paypal=success&orderId=${orderId}`
}

export function paypalCancelUrl(): string {
  return `${process.env.FRONTEND_URL || 'http://localhost:5173'}/checkout?paypal=cancelled`
}
