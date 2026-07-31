import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.hoisted(() => {
  process.env.RESEND_API_KEY = ''
  process.env.EMAIL_FROM = 'noreply@test.com'
})

const mockPrisma = {
  emailQueue: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
  },
}

vi.mock('../server.js', () => ({ prisma: mockPrisma }))

vi.mock('../utils/logger.js', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    child: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
  },
}))

const { queueEmail, startEmailQueueProcessor, stopEmailQueueProcessor } = await import('../services/email.js')

describe('queueEmail', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates email queue record and attempts immediate send', async () => {
    mockPrisma.emailQueue.create.mockResolvedValue({ id: 'queue-1', status: 'pending' })
    mockPrisma.emailQueue.findUnique.mockResolvedValue({ id: 'queue-1', status: 'pending', attempts: 0, maxAttempts: 3 })

    await queueEmail({
      to: 'test@test.com',
      subject: 'Test Subject',
      html: '<p>Hello</p>',
    })

    expect(mockPrisma.emailQueue.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          toEmail: 'test@test.com',
          subject: 'Test Subject',
          status: 'pending',
        }),
      })
    )
  })

  it('handles database error gracefully', async () => {
    mockPrisma.emailQueue.create.mockRejectedValue(new Error('DB connection lost'))

    // Should not throw
    await queueEmail({
      to: 'test@test.com', subject: 'Test', html: '<p>Hi</p>',
    })
    // Test passes if no exception is thrown
  })
})

describe('startEmailQueueProcessor / stopEmailQueueProcessor', () => {
  beforeEach(() => {
    stopEmailQueueProcessor()
    vi.clearAllMocks()
  })

  it('starts and stops the processor', () => {
    // Should not throw
    startEmailQueueProcessor(1000)
    expect(() => startEmailQueueProcessor(1000)).not.toThrow() // idempotent
    stopEmailQueueProcessor()
  })

  it('processes retrying emails on interval', async () => {
    mockPrisma.emailQueue.findMany.mockResolvedValue([
      { id: 'queue-1', status: 'retrying', attempts: 1, maxAttempts: 3 },
    ])
    mockPrisma.emailQueue.findUnique.mockResolvedValue({
      id: 'queue-1', status: 'retrying', attempts: 1, maxAttempts: 3, toEmail: 't@t.com',
    })

    startEmailQueueProcessor(50) // Fast interval for test
    await new Promise((r) => setTimeout(r, 150))
    stopEmailQueueProcessor()

    expect(mockPrisma.emailQueue.findMany).toHaveBeenCalled()
  })
})
