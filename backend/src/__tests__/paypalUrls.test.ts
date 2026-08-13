import { describe, it, expect, beforeEach } from 'vitest'

describe('paypal redirect URLs', () => {
  beforeEach(() => {
    delete process.env.FRONTEND_URL
  })

  it('builds return/cancel URLs from the configured FRONTEND_URL', async () => {
    process.env.FRONTEND_URL = 'https://alkatraders.co'
    const { paypalReturnUrl, paypalCancelUrl } = await import('../utils/paypalUrls.js')
    expect(paypalReturnUrl('ord-123')).toBe('https://alkatraders.co/checkout?paypal=success&orderId=ord-123')
    expect(paypalCancelUrl()).toBe('https://alkatraders.co/checkout?paypal=cancelled')
  })

  it('falls back to localhost only when unset (dev mode)', async () => {
    const { paypalReturnUrl, paypalCancelUrl } = await import('../utils/paypalUrls.js')
    expect(paypalReturnUrl('ord-1')).toBe('http://localhost:5173/checkout?paypal=success&orderId=ord-1')
    expect(paypalCancelUrl()).toBe('http://localhost:5173/checkout?paypal=cancelled')
  })
})
