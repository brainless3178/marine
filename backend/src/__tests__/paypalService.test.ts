import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.hoisted(() => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-for-unit-tests'
})

const mockPrisma = {
  order: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  orderTimeline: { create: vi.fn() },
  product: { findUnique: vi.fn() },
  customer: { findUnique: vi.fn() },
  webhookLog: { create: vi.fn() },
  $executeRawUnsafe: vi.fn(),
  auditLog: { create: vi.fn() },
}

vi.mock('../server.js', () => ({ prisma: mockPrisma }))

vi.mock('../utils/paypal.js', () => ({
  getPaypalAccessToken: vi.fn().mockResolvedValue('test-access-token'),
  PAYPAL_BASE: 'https://api-m.sandbox.paypal.com',
  PAYPAL_WEBHOOK_ID: 'webhook-id',
}))

vi.mock('../utils/logger.js', () => ({
  default: {
    info: vi.fn(), warn: vi.fn(), error: vi.fn(), fatal: vi.fn(),
    child: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), fatal: vi.fn() }),
  },
}))

vi.mock('../utils/audit.js', () => ({
  logAudit: vi.fn(),
}))

vi.mock('./emailSenders.js', () => ({
  sendOrderConfirmation: vi.fn().mockResolvedValue(undefined),
}))

const { handleCaptureCompleted, capturePaypalOrder } = await import('../services/paypalService.js')

function sampleOrder(overrides: Record<string, unknown> = {}) {
  return {
    id: 'order-1',
    orderNumber: 'AT-ORD-1',
    status: 'pending',
    paymentStatus: 'pending',
    paymentMethod: 'paypal',
    paymentIntentId: 'PAY-1',
    customerId: 'cust-1',
    subtotal: 100, shippingCost: 25, tax: 8, total: 133, currency: 'USD',
    items: [{ productId: 'prod-1', quantity: 2, productName: 'Pump', unitPrice: 50 }],
    shippingAddressLine1: '1 Main St', shippingAddressLine2: null, shippingCity: 'Dubai',
    shippingState: null, shippingPostalCode: null, shippingCountry: 'AE',
    ...overrides,
  }
}

describe('handleCaptureCompleted (webhook) — stock consistency', () => {
  beforeEach(() => vi.clearAllMocks())

  it('reverts an order to pending when the atomic stock decrement fails', async () => {
    mockPrisma.order.findFirst.mockResolvedValue(sampleOrder())
    mockPrisma.product.findUnique.mockResolvedValue({ stockCount: 10, name: 'Pump' })
    mockPrisma.order.updateMany
      .mockResolvedValueOnce({ count: 1 }) // mark paid
      .mockResolvedValueOnce({ count: 1 }) // revert to pending
    mockPrisma.$executeRawUnsafe.mockResolvedValue(0) // atomic decrement rejected

    await handleCaptureCompleted({ custom_id: 'PAY-1' })

    expect(mockPrisma.order.updateMany).toHaveBeenCalledTimes(2)
    const revertCall = mockPrisma.order.updateMany.mock.calls[1]
    expect(revertCall[0].where).toEqual({ id: 'order-1', paymentStatus: 'paid' })
    expect(revertCall[0].data).toEqual({ paymentStatus: 'pending', status: 'pending' })
    expect(mockPrisma.orderTimeline.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ note: expect.stringContaining('reverted to pending') }) })
    )
  })

  it('does not confirm when pre-flight stock is insufficient', async () => {
    mockPrisma.order.findFirst.mockResolvedValue(sampleOrder())
    mockPrisma.product.findUnique.mockResolvedValue({ stockCount: 1, name: 'Pump' }) // needs 2

    await handleCaptureCompleted({ custom_id: 'PAY-1' })

    expect(mockPrisma.order.updateMany).not.toHaveBeenCalled()
    expect(mockPrisma.orderTimeline.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ note: expect.stringContaining('stock insufficient') }) })
    )
  })
})

describe('capturePaypalOrder — stock consistency', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals()
  })

  it('reverts the order to pending and throws 409 when the stock decrement fails', async () => {
    mockPrisma.order.findFirst.mockResolvedValue(sampleOrder())
    mockPrisma.product.findUnique.mockResolvedValue({ stockCount: 10, name: 'Pump' })
    mockPrisma.order.updateMany
      .mockResolvedValueOnce({ count: 1 }) // mark paid
      .mockResolvedValueOnce({ count: 1 }) // revert to pending
    mockPrisma.$executeRawUnsafe.mockResolvedValue(0)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'COMPLETED' }),
    }))

    await expect(capturePaypalOrder('PAY-9', 'order-1', 'cust-1')).rejects.toMatchObject({ status: 409 })

    const revertCall = mockPrisma.order.updateMany.mock.calls[1]
    expect(revertCall[0].where).toEqual({ id: 'order-1', paymentStatus: 'paid' })
    expect(revertCall[0].data).toEqual({ paymentStatus: 'pending', status: 'pending' })
  })

  it('rejects before charging when pre-flight stock is insufficient', async () => {
    mockPrisma.order.findFirst.mockResolvedValue(sampleOrder())
    mockPrisma.product.findUnique.mockResolvedValue({ stockCount: 1, name: 'Pump' })
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    await expect(capturePaypalOrder('PAY-9', 'order-1', 'cust-1')).rejects.toMatchObject({ status: 400 })
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
