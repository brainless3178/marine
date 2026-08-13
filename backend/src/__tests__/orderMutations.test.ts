import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.hoisted(() => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-for-unit-tests'
  process.env.DEFAULT_SHIPPING_COST = '25'
  process.env.DEFAULT_TAX_RATE = '0.08'
})

const mockPrisma = {
  order: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  orderItem: { findMany: vi.fn() },
  orderTimeline: { create: vi.fn() },
  product: { findUnique: vi.fn() },
  customer: { findUnique: vi.fn() },
  storeSetting: { findUnique: vi.fn() },
  $executeRawUnsafe: vi.fn(),
  auditLog: { create: vi.fn() },
}

vi.mock('../server.js', () => ({ prisma: mockPrisma }))

vi.mock('../utils/helpers.js', () => ({
  generateOrderNumber: () => 'AT-ORD-999',
}))

vi.mock('../utils/prisma-helpers.js', () => ({
  orderInclude: { items: true, timeline: true, customer: true },
}))

vi.mock('../utils/logger.js', () => ({
  default: {
    info: vi.fn(), warn: vi.fn(), error: vi.fn(),
    child: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
  },
}))

vi.mock('../utils/paypal.js', () => ({
  processPaypalRefund: vi.fn().mockResolvedValue({ success: true }),
}))

vi.mock('../utils/html-escape.js', () => ({
  escapeHtml: (s: string) => s,
}))

vi.mock('../utils/audit.js', () => ({
  logAudit: vi.fn(),
}))

vi.mock('./emailSenders.js', () => ({
  sendOrderShipped: vi.fn().mockResolvedValue(undefined),
  sendOrderCancelled: vi.fn().mockResolvedValue(undefined),
  sendOrderConfirmation: vi.fn().mockResolvedValue(undefined),
}))

const { createOrder, requestOrderCancellation, updateOrderStatus, updateTracking, cancelOrder, generateInvoiceHtml } = await import('../services/orderMutations.js')
const mockActor = { id: 'admin-uuid', email: 'admin@test.com', role: 'admin' }

describe('createOrder', () => {
  const baseInput = {
    items: [{ productId: 'prod-1', quantity: 2 }, { productId: 'prod-2', quantity: 1 }],
    shipping: {
      fullName: 'John Doe', addressLine1: '123 Main St',
      city: 'Dubai', country: 'UAE',
    },
    paymentMethod: 'bank-transfer',
    customerId: 'cust-1',
  }

  beforeEach(() => vi.clearAllMocks())

  it('creates an order with all required fields', async () => {
    mockPrisma.product.findUnique
      .mockResolvedValueOnce({ id: 'prod-1', name: 'Hydraulic Pump', sku: 'HP-200', regularPrice: 100, salePrice: null, stockCount: 10 })
      .mockResolvedValueOnce({ id: 'prod-2', name: 'Oil Filter', sku: 'OF-001', regularPrice: 50, salePrice: null, stockCount: 5 })
    mockPrisma.storeSetting.findUnique
      .mockResolvedValueOnce({ value: '25' })  // shipping
      .mockResolvedValueOnce({ value: '0.08' }) // tax
    mockPrisma.order.create.mockResolvedValue({
      id: 'order-1', orderNumber: 'AT-ORD-999', status: 'pending', items: [], timeline: [],
    })

    const result = await createOrder(baseInput)

    expect(mockPrisma.order.create).toHaveBeenCalled()
    expect(result.orderNumber).toBe('AT-ORD-999')
  })

  it('calculates subtotal, tax, shipping, and total correctly', async () => {
    mockPrisma.product.findUnique
      .mockResolvedValueOnce({ id: 'prod-1', name: 'Pump', sku: 'HP-200', regularPrice: 100, salePrice: null, stockCount: 10 })
      .mockResolvedValueOnce({ id: 'prod-2', name: 'Filter', sku: 'OF-001', regularPrice: 50, salePrice: null, stockCount: 5 })
    mockPrisma.storeSetting.findUnique
      .mockResolvedValueOnce({ value: '25' })
      .mockResolvedValueOnce({ value: '0.08' })
    mockPrisma.order.create.mockResolvedValue({ id: 'order-1', orderNumber: 'AT-ORD-999' })

    await createOrder(baseInput)

    const callData = mockPrisma.order.create.mock.calls[0][0].data
    // subtotal: (100*2) + (50*1) = 250
    expect(callData.subtotal).toBe(250)
    // tax: 250 * 0.08 = 20
    expect(callData.tax).toBe(20)
    // shipping: 25
    expect(callData.shippingCost).toBe(25)
    // total: 250 + 25 + 20 = 295
    expect(callData.total).toBe(295)
  })

  it('charges shipping below the free-shipping threshold', async () => {
    mockPrisma.product.findUnique.mockResolvedValue({ id: 'prod-1', name: 'Pump', sku: 'HP-200', regularPrice: 499.99, salePrice: null, stockCount: 10 })
    mockPrisma.storeSetting.findUnique
      .mockResolvedValueOnce({ value: '25' })   // shipping
      .mockResolvedValueOnce({ value: '0.08' }) // tax
      .mockResolvedValueOnce({ value: '500' })  // free shipping threshold
    mockPrisma.order.create.mockResolvedValue({ id: 'order-1', orderNumber: 'AT-ORD-999' })

    await createOrder({ ...baseInput, items: [{ productId: 'prod-1', quantity: 1 }] })

    const callData = mockPrisma.order.create.mock.calls[0][0].data
    expect(callData.subtotal).toBe(499.99)
    expect(callData.shippingCost).toBe(25)
  })

  it('waives shipping at exactly the free-shipping threshold', async () => {
    mockPrisma.product.findUnique.mockResolvedValue({ id: 'prod-1', name: 'Pump', sku: 'HP-200', regularPrice: 500, salePrice: null, stockCount: 10 })
    mockPrisma.storeSetting.findUnique
      .mockResolvedValueOnce({ value: '25' })
      .mockResolvedValueOnce({ value: '0.08' })
      .mockResolvedValueOnce({ value: '500' })
    mockPrisma.order.create.mockResolvedValue({ id: 'order-1', orderNumber: 'AT-ORD-999' })

    await createOrder({ ...baseInput, items: [{ productId: 'prod-1', quantity: 1 }] })

    const callData = mockPrisma.order.create.mock.calls[0][0].data
    expect(callData.subtotal).toBe(500)
    expect(callData.shippingCost).toBe(0)
  })

  it('waives shipping above the free-shipping threshold', async () => {
    mockPrisma.product.findUnique.mockResolvedValue({ id: 'prod-1', name: 'Pump', sku: 'HP-200', regularPrice: 600, salePrice: null, stockCount: 10 })
    mockPrisma.storeSetting.findUnique
      .mockResolvedValueOnce({ value: '25' })
      .mockResolvedValueOnce({ value: '0.08' })
      .mockResolvedValueOnce({ value: '500' })
    mockPrisma.order.create.mockResolvedValue({ id: 'order-1', orderNumber: 'AT-ORD-999' })

    await createOrder({ ...baseInput, items: [{ productId: 'prod-1', quantity: 1 }] })

    const callData = mockPrisma.order.create.mock.calls[0][0].data
    expect(callData.subtotal).toBe(600)
    expect(callData.shippingCost).toBe(0)
  })

  it('returns existing order on idempotency key match', async () => {
    const idempInput = { ...baseInput, idempotencyKey: 'idem-123' }
    mockPrisma.order.findFirst.mockResolvedValue({ id: 'existing-order', items: [] })

    const result = await createOrder(idempInput)

    expect(mockPrisma.order.create).not.toHaveBeenCalled()
    expect(result.id).toBe('existing-order')
  })

  it('throws when product is out of stock', async () => {
    mockPrisma.product.findUnique.mockResolvedValue({ id: 'prod-1', name: 'Pump', stockCount: 1 })

    await expect(createOrder({
      ...baseInput,
      items: [{ productId: 'prod-1', quantity: 5 }],
    })).rejects.toMatchObject({ status: 400 })
  })

  it('fails with a clear 409 when no cart items are available (empty catalog)', async () => {
    mockPrisma.product.findUnique.mockResolvedValue(null)

    await expect(createOrder(baseInput)).rejects.toMatchObject({
      status: 409,
      message: expect.stringContaining('no longer available'),
    })
    expect(mockPrisma.order.create).not.toHaveBeenCalled()
  })

  it('skips unavailable items and still creates the order with the available ones', async () => {
    // prod-1 exists, prod-2 is missing from the (emptied) catalog.
    mockPrisma.product.findUnique
      .mockResolvedValueOnce({ id: 'prod-1', name: 'Hydraulic Pump', sku: 'HP-200', regularPrice: 100, salePrice: null, stockCount: 10 })
      .mockResolvedValueOnce(null)
    mockPrisma.storeSetting.findUnique
      .mockResolvedValueOnce({ value: '25' })  // shipping
      .mockResolvedValueOnce({ value: '0.08' }) // tax
      .mockResolvedValueOnce({ value: '500' })  // free shipping threshold
    mockPrisma.order.create.mockResolvedValue({ id: 'order-1', orderNumber: 'AT-ORD-999', status: 'pending', items: [], timeline: [] })

    const result = await createOrder(baseInput)

    expect(result.orderNumber).toBe('AT-ORD-999')
    const callData = mockPrisma.order.create.mock.calls[0][0].data
    // Only the available line is ordered; it is priced from the product table.
    expect(callData.items.create).toHaveLength(1)
    expect(callData.items.create[0]).toMatchObject({ productId: 'prod-1', quantity: 2, unitPrice: 100 })
    expect(callData.subtotal).toBe(200)
    // The skipped line is recorded on the timeline for admin visibility.
    expect(callData.timeline.create.note).toContain('prod-2')
    expect(callData.timeline.create.note).toContain('Skipped unavailable')
  })
})

describe('updateOrderStatus', () => {
  beforeEach(() => vi.clearAllMocks())

  it('advances status forward', async () => {
    mockPrisma.order.findUnique.mockResolvedValue({ id: 'order-1', status: 'confirmed', paymentMethod: 'card', paymentStatus: 'pending' })
    mockPrisma.order.update.mockResolvedValue({ id: 'order-1', status: 'paid' })
    mockPrisma.orderItem.findMany.mockResolvedValue([])

    const result = await updateOrderStatus('order-1', 'paid', undefined, mockActor)

    expect(mockPrisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'paid' } })
    )
    expect(result.status).toBe('paid')
  })

  it('rejects moving status backward', async () => {
    mockPrisma.order.findUnique.mockResolvedValue({ id: 'order-1', status: 'shipped' })

    await expect(
      updateOrderStatus('order-1', 'confirmed', undefined, mockActor)
    ).rejects.toMatchObject({ status: 400 })
  })

  it('decrements stock on paid status change', async () => {
    mockPrisma.order.findUnique.mockResolvedValue({ id: 'order-1', status: 'confirmed', paymentMethod: 'bank-transfer', paymentStatus: 'pending', customerId: 'cust-1' })
    mockPrisma.order.update.mockResolvedValue({ id: 'order-1', status: 'paid' })
    mockPrisma.orderItem.findMany.mockResolvedValue([
      { productId: 'prod-1', quantity: 2 },
    ])
    mockPrisma.$executeRawUnsafe.mockResolvedValue(1)

    await updateOrderStatus('order-1', 'paid', undefined, mockActor)

    expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalledWith(
      'UPDATE products SET stock_count = stock_count - $1 WHERE id = $2::uuid AND stock_count >= $1',
      2, 'prod-1'
    )
  })

  it('restores stock on cancellation of paid order', async () => {
    mockPrisma.order.findUnique.mockResolvedValue({ id: 'order-1', status: 'paid', paymentStatus: 'paid', paymentMethod: 'card', customerId: 'cust-1', total: 100, currency: 'USD' })
    mockPrisma.order.update.mockResolvedValue({ id: 'order-1', status: 'cancelled' })
    mockPrisma.orderItem.findMany.mockResolvedValue([
      { productId: 'prod-1', quantity: 1 },
    ])
    mockPrisma.$executeRawUnsafe.mockResolvedValue(1)

    await updateOrderStatus('order-1', 'cancelled', 'Out of stock', mockActor)

    // Stock restore
    expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalledWith(
      'UPDATE products SET stock_count = stock_count + $1 WHERE id = $2::uuid',
      1, 'prod-1'
    )
  })

  it('reverts the paid status when the stock decrement fails during confirmation', async () => {
    mockPrisma.order.findUnique.mockResolvedValue({ id: 'order-1', status: 'confirmed', paymentMethod: 'bank-transfer', paymentStatus: 'pending', customerId: 'cust-1' })
    mockPrisma.order.update.mockResolvedValue({ id: 'order-1', status: 'paid' })
    mockPrisma.orderItem.findMany.mockResolvedValue([
      { productId: 'prod-1', quantity: 2 },
    ])
    mockPrisma.$executeRawUnsafe.mockResolvedValue(0) // atomic guard rejects the decrement

    await expect(
      updateOrderStatus('order-1', 'paid', undefined, mockActor)
    ).rejects.toMatchObject({ status: 409 })

    // The order must be reverted to its previous status — never left silently paid
    expect(mockPrisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'confirmed' } })
    )
  })

  it('does not mark the order refunded when the PayPal refund fails', async () => {
    const { processPaypalRefund } = await import('../utils/paypal.js')
    ;(processPaypalRefund as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ success: false, error: 'refund rejected' })

    mockPrisma.order.findUnique.mockResolvedValue({
      id: 'order-1', status: 'paid', paymentStatus: 'paid', paymentMethod: 'paypal',
      paymentIntentId: 'PAY-1', customerId: 'cust-1', total: 100, currency: 'USD',
    })
    mockPrisma.order.update.mockResolvedValue({ id: 'order-1', status: 'cancelled' })
    mockPrisma.orderItem.findMany.mockResolvedValue([
      { productId: 'prod-1', quantity: 1 },
    ])
    mockPrisma.$executeRawUnsafe.mockResolvedValue(1)

    await updateOrderStatus('order-1', 'cancelled', 'Refund test', mockActor)

    // No update call should set paymentStatus — the order must NOT show as refunded
    const refundUpdate = mockPrisma.order.update.mock.calls.find((c: any[]) => c[0].data?.paymentStatus)
    expect(refundUpdate).toBeUndefined()
  })
})

describe('requestOrderCancellation', () => {
  beforeEach(() => vi.clearAllMocks())

  it('sets cancelRequested flag', async () => {
    mockPrisma.order.findFirst.mockResolvedValue({ id: 'order-1', status: 'pending', orderNumber: 'ORD-001' })
    mockPrisma.order.update.mockResolvedValue({ id: 'order-1', cancelRequested: true })
    mockPrisma.customer.findUnique.mockResolvedValue({ email: 'test@test.com', name: 'Test User' })

    const result = await requestOrderCancellation('order-1', 'cust-1', 'Changed my mind')

    expect(result.cancelRequested).toBe(true)
  })

  it('throws for non-existent order', async () => {
    mockPrisma.order.findFirst.mockResolvedValue(null)
    await expect(
      requestOrderCancellation('order-1', 'cust-1')
    ).rejects.toMatchObject({ status: 404 })
  })

  it('throws for already cancelled order', async () => {
    mockPrisma.order.findFirst.mockResolvedValue({ id: 'order-1', status: 'cancelled' })
    await expect(
      requestOrderCancellation('order-1', 'cust-1')
    ).rejects.toMatchObject({ status: 400 })
  })
})

describe('updateTracking', () => {
  beforeEach(() => vi.clearAllMocks())

  it('updates tracking and sends shipment email', async () => {
    mockPrisma.order.update.mockResolvedValue({
      id: 'order-1', orderNumber: 'ORD-001', customerId: 'cust-1',
    })
    mockPrisma.customer.findUnique.mockResolvedValue({ email: 'cust@test.com', name: 'Customer' })

    const result = await updateTracking('order-1', 'DHL-123', 'DHL', mockActor)

    expect(result.id).toBe('order-1')
  })

  it('handles missing customer gracefully', async () => {
    mockPrisma.order.update.mockResolvedValue({
      id: 'order-1', orderNumber: 'ORD-001', customerId: null,
    })

    const result = await updateTracking('order-1', 'DHL-123', 'DHL', mockActor)
    expect(result.id).toBe('order-1')
  })
})

describe('cancelOrder (admin)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('cancels a non-cancelled order', async () => {
    mockPrisma.order.findUnique.mockResolvedValue({ id: 'order-1', status: 'confirmed', paymentStatus: 'pending' })
    mockPrisma.order.update.mockResolvedValue({ id: 'order-1', status: 'cancelled' })

    const result = await cancelOrder('order-1', 'Admin decision', mockActor)

    expect(mockPrisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'cancelled' }) })
    )
    expect(result.status).toBe('cancelled')
  })

  it('throws for already cancelled order', async () => {
    mockPrisma.order.findUnique.mockResolvedValue({ id: 'order-1', status: 'cancelled' })
    await expect(
      cancelOrder('order-1', 'Reason', mockActor)
    ).rejects.toMatchObject({ status: 400 })
  })
})

describe('generateInvoiceHtml', () => {
  beforeEach(() => vi.clearAllMocks())

  it('generates invoice HTML for an order', async () => {
    mockPrisma.order.findUnique.mockResolvedValue({
      id: 'order-1', orderNumber: 'ORD-001', status: 'paid',
      paymentMethod: 'bank-transfer', paymentStatus: 'paid',
      subtotal: 250, shippingCost: 25, tax: 20, total: 295,
      shippingFullName: 'John Doe',
      shippingAddressLine1: '123 Main St',
      shippingCity: 'Dubai', shippingCountry: 'UAE',
      createdAt: new Date('2025-01-01'),
      items: [
        { id: 'item-1', productName: 'Pump', sku: 'HP-200', quantity: 1, unitPrice: 100 },
      ],
      customer: { name: 'John Doe', email: 'john@test.com' },
    })

    const html = await generateInvoiceHtml('order-1')

    expect(html).toContain('INVOICE')
    expect(html).toContain('ORD-001')
    expect(html).toContain('$295.00')
  })

  it('throws when order not found', async () => {
    mockPrisma.order.findUnique.mockResolvedValue(null)
    await expect(generateInvoiceHtml('nonexistent')).rejects.toMatchObject({ status: 404 })
  })
})
