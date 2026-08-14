import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.hoisted(() => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-for-unit-tests'
  process.env.COMPANY_EMAIL = 'info@test.com'
  process.env.FRONTEND_URL = 'http://localhost:5173'
  process.env.SALES_EMAIL = 'sales@test.com'
  process.env.WHATSAPP_NUMBER = '918799095041'
})

const mockPrisma = {
  rfq: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn() },
  rfqNote: { create: vi.fn() },
  adminUser: { findUnique: vi.fn() },
  offer: { create: vi.fn() },
  order: { create: vi.fn() },
  auditLog: { create: vi.fn() },
}

vi.mock('../server.js', () => ({ prisma: mockPrisma }))

vi.mock('../utils/helpers.js', () => ({
  generateRfqNumber: () => 'RFQ-001',
  generateOrderNumber: () => 'ORD-001',
  generateOfferNumber: () => 'OFF-001',
  paginationParams: () => ({ page: 1, limit: 24, skip: 0 }),
  paginationResponse: () => ({ total: 0, page: 1, limit: 24, totalPages: 0, hasNext: false, hasPrev: false }),
}))

vi.mock('../utils/prisma-helpers.js', () => ({
  rfqInclude: { notes: { include: { author: { select: { id: true, name: true, email: true } } } } },
}))

vi.mock('../utils/audit.js', () => ({ logAudit: vi.fn() }))

vi.mock('../utils/logger.js', () => ({
  default: {
    info: vi.fn(), warn: vi.fn(), error: vi.fn(),
    child: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
  },
}))

const mockSendRfqReceived = vi.fn().mockResolvedValue(undefined)

vi.mock('../services/email.js', () => ({
  sendRfqReceived: mockSendRfqReceived,
  sendRfqResponse: vi.fn().mockResolvedValue(undefined),
}))

const { createRfq, listRfqs, getRfq, updateRfqStatus, assignRfq, addRfqNote, respondToRfq, convertRfqToOffer, convertRfqToOrder } = await import('../services/rfqService.js')

const mockActor = { id: 'admin-uuid', email: 'admin@test.com', role: 'admin' }

describe('createRfq', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates an RFQ with basic fields', async () => {
    mockPrisma.rfq.create.mockResolvedValue({ id: 'rfq-1', rfqNumber: 'RFQ-001', status: 'new' })

    const result = await createRfq({
      fullName: 'John Doe', email: 'john@test.com',
      productDescription: 'Hydraulic Pump HP-200', consent: true,
    })

    expect(mockPrisma.rfq.create).toHaveBeenCalled()
    expect(result.status).toBe('new')
  })

  it('sets response deadline for emergency/urgent RFQs', async () => {
    mockPrisma.rfq.create.mockImplementation(({ data }: any) =>
      Promise.resolve({ id: 'rfq-1', rfqNumber: 'RFQ-001', ...data })
    )

    const emergency = await createRfq({
      fullName: 'Jane', email: 'jane@test.com',
      productDescription: 'Engine part', urgency: 'emergency', consent: true,
    })
    expect(emergency.responseDeadline).toBeTruthy()

    const normal = await createRfq({
      fullName: 'Bob', email: 'bob@test.com',
      productDescription: 'Filter', consent: true,
    })
    expect(normal.responseDeadline).toBeNull()
  })

  it('sends admin notification email', async () => {
    mockPrisma.rfq.create.mockResolvedValue({ id: 'rfq-1', rfqNumber: 'RFQ-001' })

    await createRfq({
      fullName: 'John', email: 'john@test.com',
      productDescription: 'Pump', consent: true,
    })

    expect(mockSendRfqReceived).toHaveBeenCalled()
  })
})

describe('listRfqs', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns paginated RFQs', async () => {
    mockPrisma.rfq.findMany.mockResolvedValue([])
    mockPrisma.rfq.count.mockResolvedValue(0)

    const result = await listRfqs({})
    expect(result.rfqs).toEqual([])
    expect(result.pagination).toBeDefined()
  })

  it('filters by status and urgency', async () => {
    mockPrisma.rfq.findMany.mockResolvedValue([])
    mockPrisma.rfq.count.mockResolvedValue(0)

    await listRfqs({ status: 'new', urgency: 'emergency' })

    expect(mockPrisma.rfq.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: 'new', urgency: 'emergency' },
      })
    )
  })
})

describe('getRfq', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns RFQ when found', async () => {
    mockPrisma.rfq.findUnique.mockResolvedValue({ id: 'rfq-1', rfqNumber: 'RFQ-001' })
    const result = await getRfq('rfq-1')
    expect(result.rfqNumber).toBe('RFQ-001')
  })

  it('throws 404 when not found', async () => {
    mockPrisma.rfq.findUnique.mockResolvedValue(null)
    await expect(getRfq('nonexistent')).rejects.toMatchObject({ status: 404 })
  })
})

describe('updateRfqStatus', () => {
  beforeEach(() => vi.clearAllMocks())

  it('updates status and adds note', async () => {
    mockPrisma.rfq.findUnique.mockResolvedValue({ id: 'rfq-1', rfqNumber: 'RFQ-001', status: 'new' })
    mockPrisma.rfq.update.mockResolvedValue({ id: 'rfq-1', status: 'reviewing' })

    const result = await updateRfqStatus('rfq-1', 'reviewing', 'Starting review', mockActor)

    expect(result.status).toBe('reviewing')
    expect(mockPrisma.rfqNote.create).toHaveBeenCalled()
  })
})

describe('assignRfq', () => {
  beforeEach(() => vi.clearAllMocks())

  it('assigns RFQ to an admin', async () => {
    mockPrisma.rfq.findUnique.mockResolvedValue({ id: 'rfq-1', rfqNumber: 'RFQ-001', status: 'new' })
    mockPrisma.adminUser.findUnique.mockResolvedValue({ id: 'admin-2', name: 'Support Agent' })
    mockPrisma.rfq.update.mockResolvedValue({ id: 'rfq-1', assignedTo: 'admin-2' })

    const result = await assignRfq('rfq-1', 'admin-2', mockActor)
    expect(result.assignedTo).toBe('admin-2')
  })

  it('throws when assignee not found', async () => {
    mockPrisma.rfq.findUnique.mockResolvedValue({ id: 'rfq-1', rfqNumber: 'RFQ-001' })
    mockPrisma.adminUser.findUnique.mockResolvedValue(null)

    await expect(assignRfq('rfq-1', 'nonexistent', mockActor)).rejects.toMatchObject({ status: 400 })
  })
})

describe('addRfqNote', () => {
  beforeEach(() => vi.clearAllMocks())

  it('adds an internal note to RFQ', async () => {
    mockPrisma.rfq.findUnique.mockResolvedValue({ id: 'rfq-1', rfqNumber: 'RFQ-001' })
    mockPrisma.rfqNote.create.mockResolvedValue({ id: 'note-1', note: 'Test note', author: {} })

    const result = await addRfqNote('rfq-1', 'Test note', true, mockActor)
    expect(result.note).toBe('Test note')
  })
})

describe('respondToRfq', () => {
  beforeEach(() => vi.clearAllMocks())

  it('sends response and updates status to quote-sent', async () => {
    mockPrisma.rfq.findUnique.mockResolvedValue({
      id: 'rfq-1', rfqNumber: 'RFQ-001', email: 'cust@test.com',
      fullName: 'Customer', status: 'new',
    })
    mockPrisma.rfq.update.mockResolvedValue({ id: 'rfq-1', status: 'quote-sent' })

    await respondToRfq('rfq-1', 'Here is our quote', mockActor)

    expect(mockPrisma.rfq.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'quote-sent' } })
    )
  })
})

describe('convertRfqToOffer', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates an offer from RFQ and updates RFQ status', async () => {
    mockPrisma.rfq.findUnique.mockResolvedValue({
      id: 'rfq-1', rfqNumber: 'RFQ-001', email: 'cust@test.com',
      fullName: 'Customer', quantity: 2, status: 'new',
    })
    mockPrisma.offer.create.mockResolvedValue({ id: 'offer-1', offerNumber: 'OFF-001' })
    mockPrisma.rfq.update.mockResolvedValue({ id: 'rfq-1', status: 'quote-sent' })

    const result = await convertRfqToOffer('rfq-1', 500, 'Special offer', mockActor)
    expect(result.offerNumber).toBe('OFF-001')
  })
})

describe('convertRfqToOrder', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates an order from RFQ and updates RFQ status to won', async () => {
    mockPrisma.rfq.findUnique.mockResolvedValue({
      id: 'rfq-1', rfqNumber: 'RFQ-001', fullName: 'Customer',
      productDescription: 'Pump', partNumber: 'HP-200',
      quantity: 1, deliveryLocation: 'Dubai', country: 'UAE',
      status: 'new',
    })
    mockPrisma.order.create.mockResolvedValue({ id: 'order-1', orderNumber: 'ORD-001' })
    mockPrisma.rfq.update.mockResolvedValue({ id: 'rfq-1', status: 'won' })

    const result = await convertRfqToOrder('rfq-1', 500, 500, mockActor)
    expect(result.orderNumber).toBe('ORD-001')
  })
})
