import { describe, it, expect, vi, beforeEach } from 'vitest'

// Hoisted so both the vi.mock factory and the test bodies can reference it.
const { mockSendMail } = vi.hoisted(() => ({ mockSendMail: vi.fn() }))

vi.hoisted(() => {
  // No SMTP config at import time → the initially-imported module exercises
  // the dry-run path. The SMTP tests below re-import with vars set.
  process.env.SMTP_HOST = ''
  process.env.SMTP_USER = ''
  process.env.SMTP_PASS = ''
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

vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(() => ({ sendMail: mockSendMail })),
  },
}))

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

describe('SMTP transport', () => {
  // Re-import email.js with SMTP env set, so getTransporter() builds a real
  // (mocked) nodemailer transport instead of the dry-run path.
  async function importWithSmtp() {
    vi.resetModules()
    process.env.SMTP_HOST = 'smtp.hostinger.com'
    process.env.SMTP_USER = 'noreply@test.com'
    process.env.SMTP_PASS = 'mailbox-password'
    return import('../services/email.js')
  }

  beforeEach(() => vi.clearAllMocks())

  it('sends via nodemailer SMTP when configured', async () => {
    const mod = await importWithSmtp()
    mockSendMail.mockResolvedValue({ messageId: 'msg-1' })

    mockPrisma.emailQueue.create.mockResolvedValue({ id: 'queue-1', status: 'pending' })
    mockPrisma.emailQueue.findUnique.mockResolvedValue({
      id: 'queue-1', status: 'pending', attempts: 0, maxAttempts: 3,
      toEmail: 'buyer@test.com', subject: 'Order Confirmed', htmlBody: '<p>Hi</p>', textBody: null,
    })
    mockPrisma.emailQueue.update.mockResolvedValue({})

    await mod.queueEmail({ to: 'buyer@test.com', subject: 'Order Confirmed', html: '<p>Hi</p>' })

    expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
      from: 'noreply@test.com',
      to: 'buyer@test.com',
      subject: 'Order Confirmed',
      html: '<p>Hi</p>',
    }))
    expect(mockPrisma.emailQueue.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'sent' }) }),
    )
  })

  it('marks email retrying when SMTP delivery fails', async () => {
    const mod = await importWithSmtp()
    mockSendMail.mockRejectedValue(new Error('Invalid login: 535 5.7.8'))

    mockPrisma.emailQueue.create.mockResolvedValue({ id: 'queue-1', status: 'pending' })
    mockPrisma.emailQueue.findUnique.mockResolvedValue({
      id: 'queue-1', status: 'pending', attempts: 0, maxAttempts: 3,
      toEmail: 'buyer@test.com', subject: 'Hi', htmlBody: '<p>Hi</p>', textBody: null,
    })
    mockPrisma.emailQueue.update.mockResolvedValue({})

    await mod.queueEmail({ to: 'buyer@test.com', subject: 'Hi', html: '<p>Hi</p>' })

    expect(mockPrisma.emailQueue.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'retrying', lastError: 'Invalid login: 535 5.7.8' }),
      }),
    )
  })
})
