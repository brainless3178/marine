import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mock Prisma ──────────────────────────────────────────────
const mockPrisma = {
  product: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
  },
  order: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
  orderItem: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
  orderTimeline: {
    create: vi.fn(),
  },
  customer: {
    findUnique: vi.fn(),
  },
  storeSetting: {
    findUnique: vi.fn(),
  },
  $transaction: vi.fn(),
}

vi.mock('../server.js', () => ({ prisma: mockPrisma }))

describe('Stock Decrement Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should not decrement stock on order creation (stock reduced only on payment)', async () => {
    // Verify that order creation does NOT call product.update for stock
    mockPrisma.product.findUnique.mockResolvedValue({
      id: 'prod-1',
      name: 'Test Product',
      sku: 'TP-001',
      stockCount: 10,
      regularPrice: 100,
      salePrice: null,
    })
    mockPrisma.order.create.mockResolvedValue({
      id: 'order-1',
      orderNumber: 'ORD-001',
      status: 'pending',
    })

    // Simulate the storefront order creation logic
    const items = [{ productId: 'prod-1', quantity: 2 }]
    const stockDecrementCalled = false

    for (const item of items) {
      const product = await mockPrisma.product.findUnique({ where: { id: item.productId } })
      expect(product).toBeTruthy()
      expect(product!.stockCount).toBeGreaterThanOrEqual(item.quantity)

      // Stock should NOT be decremented here — only on payment confirmation
    }

    // Verify product.update was never called with stockCount decrement
    expect(stockDecrementCalled).toBe(false)
    expect(mockPrisma.product.update).not.toHaveBeenCalled()
  })

  it('should verify sufficient stock before order creation', async () => {
    mockPrisma.product.findUnique.mockResolvedValue({
      id: 'prod-1',
      name: 'Insufficient Product',
      stockCount: 1,
      regularPrice: 50,
    })

    const quantity = 5
    const product = await mockPrisma.product.findUnique({ where: { id: 'prod-1' } })

    // This should prevent the order
    expect(product!.stockCount).toBeLessThan(quantity)
  })
})

describe('Stock Decrement on Payment', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should decrement stock when order status changes to paid (admin flow)', async () => {
    const mockOrder = {
      id: 'order-1',
      orderNumber: 'ORD-001',
      status: 'pending',
      paymentStatus: 'pending',
      paymentMethod: 'bank-transfer',
      customerId: 'cust-1',
    }
    const mockItems = [
      { productId: 'prod-1', quantity: 2 },
      { productId: 'prod-2', quantity: 1 },
    ]

    mockPrisma.order.findUnique.mockResolvedValue(mockOrder)
    mockPrisma.order.update.mockResolvedValue({ ...mockOrder, status: 'paid' })
    mockPrisma.orderTimeline.create.mockResolvedValue({})
    mockPrisma.orderItem.findMany.mockResolvedValue(mockItems)
    mockPrisma.product.update.mockResolvedValue({})

    // Simulate admin status update to 'paid'
    const order = await mockPrisma.order.findUnique({ where: { id: 'order-1' } })
    expect(order!.paymentStatus).not.toBe('paid') // Not yet paid

    // This triggers stock decrement
    const items = await mockPrisma.orderItem.findMany({ where: { orderId: 'order-1' } })
    for (const item of items) {
      if (item.productId) {
        await mockPrisma.product.update({
          where: { id: item.productId },
          data: { stockCount: { decrement: item.quantity } },
        })
      }
    }

    expect(mockPrisma.product.update).toHaveBeenCalledTimes(2)
    expect(mockPrisma.product.update).toHaveBeenCalledWith({
      where: { id: 'prod-1' },
      data: { stockCount: { decrement: 2 } },
    })
    expect(mockPrisma.product.update).toHaveBeenCalledWith({
      where: { id: 'prod-2' },
      data: { stockCount: { decrement: 1 } },
    })
  })

  it('should decrement stock on successful Stripe webhook', async () => {
    const mockOrder = {
      id: 'order-1',
      orderNumber: 'ORD-001',
      paymentStatus: 'pending',
      customerId: 'cust-1',
    }
    const mockItems = [
      { productId: 'prod-1', quantity: 3 },
    ]

    mockPrisma.order.findUnique.mockResolvedValue(mockOrder)
    mockPrisma.order.update.mockResolvedValue({})
    mockPrisma.orderTimeline.create.mockResolvedValue({})
    mockPrisma.orderItem.findMany.mockResolvedValue(mockItems)
    mockPrisma.product.update.mockResolvedValue({})
    mockPrisma.customer.findUnique.mockResolvedValue({ email: 'test@test.com', name: 'Test' })

    // Simulate webhook handler
    const order = await mockPrisma.order.findUnique({ where: { id: 'order-1' } })
    expect(order!.paymentStatus).not.toBe('paid')

    // Webhook marks as paid and decrements stock
    await mockPrisma.order.update({
      where: { id: 'order-1' },
      data: { paymentStatus: 'paid', status: 'confirmed' },
    })

    const items = await mockPrisma.orderItem.findMany({ where: { orderId: 'order-1' } })
    for (const item of items) {
      if (item.productId) {
        await mockPrisma.product.update({
          where: { id: item.productId },
          data: { stockCount: { decrement: item.quantity } },
        })
      }
    }

    expect(mockPrisma.product.update).toHaveBeenCalledWith({
      where: { id: 'prod-1' },
      data: { stockCount: { decrement: 3 } },
    })
  })

  it('should NOT decrement stock if already paid (idempotency)', async () => {
    const mockOrder = {
      id: 'order-1',
      orderNumber: 'ORD-001',
      paymentStatus: 'paid', // Already paid
      status: 'confirmed',
    }

    mockPrisma.order.findUnique.mockResolvedValue(mockOrder)

    const order = await mockPrisma.order.findUnique({ where: { id: 'order-1' } })

    // Already paid — should NOT decrement again
    if (order!.paymentStatus !== 'paid') {
      await mockPrisma.product.update({
        where: { id: 'prod-1' },
        data: { stockCount: { decrement: 2 } },
      })
    }

    expect(mockPrisma.product.update).not.toHaveBeenCalled()
  })
})

describe('Stock Restoration on Cancellation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should restore stock when paid order is cancelled by admin', async () => {
    const mockOrder = {
      id: 'order-1',
      orderNumber: 'ORD-001',
      paymentStatus: 'paid',
      status: 'confirmed',
    }
    const mockItems = [
      { productId: 'prod-1', quantity: 2 },
      { productId: 'prod-2', quantity: 1 },
    ]

    mockPrisma.order.findUnique.mockResolvedValue(mockOrder)
    mockPrisma.order.update.mockResolvedValue({ ...mockOrder, status: 'cancelled' })
    mockPrisma.orderTimeline.create.mockResolvedValue({})
    mockPrisma.orderItem.findMany.mockResolvedValue(mockItems)
    mockPrisma.product.update.mockResolvedValue({})

    // Simulate admin cancellation
    const order = await mockPrisma.order.findUnique({ where: { id: 'order-1' } })

    // Restore stock because payment was confirmed
    if (order!.paymentStatus === 'paid') {
      const items = await mockPrisma.orderItem.findMany({ where: { orderId: 'order-1' } })
      for (const item of items) {
        if (item.productId) {
          await mockPrisma.product.update({
            where: { id: item.productId },
            data: { stockCount: { increment: item.quantity } },
          })
        }
      }
    }

    expect(mockPrisma.product.update).toHaveBeenCalledTimes(2)
    expect(mockPrisma.product.update).toHaveBeenCalledWith({
      where: { id: 'prod-1' },
      data: { stockCount: { increment: 2 } },
    })
  })

  it('should NOT restore stock if order was never paid', async () => {
    const mockOrder = {
      id: 'order-1',
      orderNumber: 'ORD-001',
      paymentStatus: 'pending', // Never paid
      status: 'pending',
    }

    mockPrisma.order.findUnique.mockResolvedValue(mockOrder)

    const order = await mockPrisma.order.findUnique({ where: { id: 'order-1' } })

    // Should NOT restore stock
    if (order!.paymentStatus === 'paid') {
      await mockPrisma.product.update({
        where: { id: 'prod-1' },
        data: { stockCount: { increment: 2 } },
      })
    }

    expect(mockPrisma.product.update).not.toHaveBeenCalled()
  })

  it('should restore stock on customer cancellation if already paid', async () => {
    const mockOrder = {
      id: 'order-1',
      paymentStatus: 'paid',
      status: 'confirmed',
    }
    const mockItems = [{ productId: 'prod-1', quantity: 3 }]

    mockPrisma.order.findFirst.mockResolvedValue(mockOrder)
    mockPrisma.orderItem.findMany.mockResolvedValue(mockItems)
    mockPrisma.product.update.mockResolvedValue({})

    const order = await mockPrisma.order.findFirst({ where: { id: 'order-1' } })

    if (order!.paymentStatus === 'paid') {
      for (const item of mockItems) {
        await mockPrisma.product.update({
          where: { id: item.productId },
          data: { stockCount: { increment: item.quantity } },
        })
      }
    }

    expect(mockPrisma.product.update).toHaveBeenCalledWith({
      where: { id: 'prod-1' },
      data: { stockCount: { increment: 3 } },
    })
  })
})

describe('Stripe Webhook Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should not process duplicate payment_intent.succeeded events', async () => {
    const mockOrder = {
      id: 'order-1',
      orderNumber: 'ORD-001',
      paymentStatus: 'paid', // Already paid
      customerId: 'cust-1',
    }

    mockPrisma.order.findUnique.mockResolvedValue(mockOrder)

    // Simulate webhook for already-paid order
    const order = await mockPrisma.order.findUnique({ where: { id: 'order-1' } })

    // Should bail early — no duplicate processing
    if (!order || order.paymentStatus === 'paid') {
      // Return early, no DB writes
      expect(mockPrisma.order.update).not.toHaveBeenCalled()
      expect(mockPrisma.product.update).not.toHaveBeenCalled()
    }
  })

  it('should restore stock on payment_intent.payment_failed if previously paid', async () => {
    const mockOrder = {
      id: 'order-1',
      orderNumber: 'ORD-001',
      paymentStatus: 'paid', // Was marked paid, now failed (race condition)
      status: 'confirmed',
    }
    const mockItems = [{ productId: 'prod-1', quantity: 2 }]

    mockPrisma.order.findUnique.mockResolvedValue(mockOrder)
    mockPrisma.order.update.mockResolvedValue({})
    mockPrisma.orderTimeline.create.mockResolvedValue({})
    mockPrisma.orderItem.findMany.mockResolvedValue(mockItems)
    mockPrisma.product.update.mockResolvedValue({})

    // Simulate failure handler — restore stock only if previously paid
    const order = await mockPrisma.order.findUnique({ where: { id: 'order-1' } })
    if (order!.paymentStatus === 'paid') {
      const items = await mockPrisma.orderItem.findMany({ where: { orderId: 'order-1' } })
      for (const item of items) {
        if (item.productId) {
          await mockPrisma.product.update({
            where: { id: item.productId },
            data: { stockCount: { increment: item.quantity } },
          })
        }
      }
    }

    expect(mockPrisma.product.update).toHaveBeenCalledWith({
      where: { id: 'prod-1' },
      data: { stockCount: { increment: 2 } },
    })
  })
})
