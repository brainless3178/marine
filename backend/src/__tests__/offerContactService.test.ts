import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.hoisted(() => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-for-unit-tests'
  process.env.COMPANY_EMAIL = 'info@test.com'
  process.env.FRONTEND_URL = 'http://localhost:5173'
  process.env.SALES_EMAIL = 'sales@test.com'
  process.env.WHATSAPP_NUMBER = '918799095041'
})

const mockPrisma = {
  product: { findUnique: vi.fn() },
  offer: { create: vi.fn() },
  contactMessage: { create: vi.fn() },
  emergencyRequest: { create: vi.fn(), update: vi.fn() },
  rfq: { create: vi.fn() },
  auditLog: { create: vi.fn() },
}

vi.mock('../server.js', () => ({ prisma: mockPrisma }))

vi.mock('../utils/helpers.js', () => ({
  generateOfferNumber: () => 'OFF-001',
  generateRfqNumber: () => 'RFQ-001',
}))

vi.mock('../utils/audit.js', () => ({ logAudit: vi.fn() }))

vi.mock('../utils/logger.js', () => ({
  default: {
    info: vi.fn(), warn: vi.fn(), error: vi.fn(),
    child: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
  },
}))

const mockSendOfferReceived = vi.fn().mockResolvedValue(undefined)

vi.mock('../services/email.js', () => ({
  sendOfferReceived: mockSendOfferReceived,
  sendContactNotification: vi.fn().mockResolvedValue(undefined),
  sendEmergencyAlert: vi.fn().mockResolvedValue(undefined),
}))

const { submitOffer } = await import('../services/offerService.js')
const { submitContactForm, submitEmergencyRequest } = await import('../services/contactService.js')

describe('submitOffer', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates an offer for an existing product', async () => {
    mockPrisma.product.findUnique.mockResolvedValue({ id: 'prod-1', name: 'Hydraulic Pump', regularPrice: 100 })
    mockPrisma.offer.create.mockResolvedValue({
      id: 'offer-1', offerNumber: 'OFF-001', status: 'pending',
      product: { id: 'prod-1', name: 'Hydraulic Pump', regularPrice: 100 },
    })

    const result = await submitOffer({
      productId: 'prod-1', customerEmail: 'buyer@test.com', offeredPrice: 80,
    })

    expect(result.offerNumber).toBe('OFF-001')
    expect(result.status).toBe('pending')
  })

  it('throws 404 when product not found', async () => {
    mockPrisma.product.findUnique.mockResolvedValue(null)
    await expect(
      submitOffer({ productId: 'nonexistent', customerEmail: 't@t.com', offeredPrice: 50 })
    ).rejects.toMatchObject({ status: 404 })
  })

  it('sends admin notification', async () => {
    mockPrisma.product.findUnique.mockResolvedValue({ id: 'prod-1', name: 'Pump', regularPrice: 100 })
    mockPrisma.offer.create.mockResolvedValue({ id: 'offer-1', offerNumber: 'OFF-001', status: 'pending', product: {} })

    await submitOffer({ productId: 'prod-1', customerEmail: 'b@t.com', offeredPrice: 70 })

    expect(mockSendOfferReceived).toHaveBeenCalledWith(
      expect.objectContaining({ offerNumber: 'OFF-001', offeredPrice: 70 })
    )
  })
})

describe('submitContactForm', () => {
  beforeEach(() => vi.clearAllMocks())

  it('saves contact message and sends notification', async () => {
    mockPrisma.contactMessage.create.mockResolvedValue({
      id: 'msg-1', name: 'Alice', email: 'alice@test.com', subject: 'Inquiry', message: 'Hello',
    })

    const result = await submitContactForm({
      name: 'Alice', email: 'alice@test.com', subject: 'Inquiry', message: 'Hello',
    })

    expect(result.id).toBe('msg-1')
    expect(mockPrisma.contactMessage.create).toHaveBeenCalled()
  })
})

describe('submitEmergencyRequest', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates emergency request + emergency RFQ with 2h SLA', async () => {
    mockPrisma.emergencyRequest.create.mockResolvedValue({ id: 'em-1' })
    mockPrisma.rfq.create.mockResolvedValue({ id: 'rfq-1', rfqNumber: 'RFQ-001' })
    mockPrisma.emergencyRequest.update.mockResolvedValue({ id: 'em-1', rfqId: 'rfq-1' })

    const result = await submitEmergencyRequest({
      name: 'Capt. Smith', phone: '+971501234567',
      partDescription: 'Engine piston ring', vesselName: 'MV Ocean Star',
    })

    expect(result.rfqNumber).toBe('RFQ-001')
    expect(mockPrisma.rfq.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          urgency: 'emergency',
          responseDeadline: expect.any(Date),
        }),
      })
    )
  })
})
