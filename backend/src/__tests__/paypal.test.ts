import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock fetch globally before importing the module under test
const mockFetch = vi.fn()

// Set env vars before importing
process.env.PAYPAL_MODE = 'sandbox'
process.env.PAYPAL_CLIENT_ID = 'test-client-id'
process.env.PAYPAL_CLIENT_SECRET = 'test-client-secret'

const paypal = await import('../utils/paypal.js')

describe('PAYPAL_BASE', () => {
  it('uses sandbox URL in dev/test mode', () => {
    expect(paypal.PAYPAL_BASE).toBe('https://api-m.sandbox.paypal.com')
  })
})

describe('getPaypalAccessToken', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    paypal.resetPaypalCache()
  })

  it('returns null on fetch failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))
    globalThis.fetch = mockFetch as any

    const token = await paypal.getPaypalAccessToken()
    expect(token).toBeNull()
  })

  it('returns null on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false })
    globalThis.fetch = mockFetch as any

    const token = await paypal.getPaypalAccessToken()
    expect(token).toBeNull()
  })

  it('returns access token on success', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: 'A21AA.test-token', expires_in: 32400 }),
    })
    globalThis.fetch = mockFetch as any

    const token = await paypal.getPaypalAccessToken()
    expect(token).toBe('A21AA.test-token')
  })

  it('sends correct auth header', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: 'A21AA.token', expires_in: 32400 }),
    })
    globalThis.fetch = mockFetch as any

    await paypal.getPaypalAccessToken()

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api-m.sandbox.paypal.com/v1/oauth2/token',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': expect.stringContaining('Basic'),
          'Content-Type': 'application/x-www-form-urlencoded',
        }),
        body: 'grant_type=client_credentials',
      }),
    )
  })

  it('caches token and reuses it', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'cached-token', expires_in: 32400 }),
    })
    globalThis.fetch = mockFetch as any

    const first = await paypal.getPaypalAccessToken()
    const second = await paypal.getPaypalAccessToken()

    expect(first).toBe('cached-token')
    expect(second).toBe('cached-token')
    expect(mockFetch).toHaveBeenCalledTimes(1) // Only one network call
  })
})

describe('processPaypalRefund', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    paypal.resetPaypalCache()
  })

  it('returns error when token fetch fails', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Auth failed'))
    globalThis.fetch = mockFetch as any

    const result = await paypal.processPaypalRefund('PAY-ID-123', 100, 'USD')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('access token')
    }
  })

  it('returns error when order lookup fails', async () => {
    // First call = token success
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: 'token-123', expires_in: 32400 }),
    })
    // Second call = order lookup fails
    mockFetch.mockResolvedValueOnce({ ok: false })
    globalThis.fetch = mockFetch as any

    const result = await paypal.processPaypalRefund('PAY-ID-123', 100, 'USD')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('lookup')
    }
  })

  it('returns error when no capture found', async () => {
    // Token success
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: 'token-123', expires_in: 32400 }),
    })
    // Order lookup — no captures
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        purchase_units: [{ payments: { captures: [] } }],
      }),
    })
    globalThis.fetch = mockFetch as any

    const result = await paypal.processPaypalRefund('PAY-ID-123', 50, 'USD')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('No capture found')
    }
  })

  it('sends refund request with correct amount', async () => {
    // Token success
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: 'token-123', expires_in: 32400 }),
    })
    // Order lookup with capture
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        purchase_units: [{
          payments: { captures: [{ id: 'CAPTURE-001' }] },
        }],
      }),
    })
    // Refund success
    mockFetch.mockResolvedValueOnce({ ok: true })
    globalThis.fetch = mockFetch as any

    const result = await paypal.processPaypalRefund('PAY-ID-123', 75.50, 'USD')
    expect(result.success).toBe(true)

    // Verify refund call
    const refundCall = mockFetch.mock.calls[2]
    expect(refundCall[0]).toBe('https://api-m.sandbox.paypal.com/v2/payments/captures/CAPTURE-001/refund')
    const sentBody = JSON.parse(refundCall[1].body)
    expect(sentBody.amount.value).toBe('75.50')
    expect(sentBody.amount.currency_code).toBe('USD')
  })

  it('returns success on full refund flow', async () => {
    mockFetch
      .mockResolvedValueOnce({ // Token
        ok: true, json: async () => ({ access_token: 'tok-1', expires_in: 32400 }),
      })
      .mockResolvedValueOnce({ // Order lookup
        ok: true, json: async () => ({
          purchase_units: [{ payments: { captures: [{ id: 'CAP-001' }] } }],
        }),
      })
      .mockResolvedValueOnce({ ok: true }) // Refund
    globalThis.fetch = mockFetch as any

    const result = await paypal.processPaypalRefund('ORDER-001', 200, 'USD')
    expect(result.success).toBe(true)
  })
})
