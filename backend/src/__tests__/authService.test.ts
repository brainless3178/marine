import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.hoisted(() => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-for-unit-tests-32ch'
  process.env.FRONTEND_URL = 'http://localhost:5173'
})

const mockPrisma = {
  customer: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
  adminUser: { findUnique: vi.fn(), update: vi.fn() },
  auditLog: { create: vi.fn() },
}

vi.mock('../server.js', () => ({ prisma: mockPrisma }))

vi.mock('../utils/audit.js', () => ({
  logAudit: vi.fn(),
}))

vi.mock('../utils/logger.js', () => ({
  default: {
    info: vi.fn(), warn: vi.fn(), error: vi.fn(),
    child: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
  },
}))

vi.mock('./email.js', () => ({
  sendWelcome: vi.fn().mockResolvedValue(undefined),
  sendPasswordReset: vi.fn().mockResolvedValue(undefined),
}))

const {
  registerCustomer, loginCustomer,
  forgotPassword, resetPassword,
  loginAdmin, refreshAdminToken,
  logoutAdmin, getAdminProfile,
  getCustomerProfile, updateCustomerProfile,
} = await import('../services/authService.js')

describe('registerCustomer', () => {
  beforeEach(() => vi.clearAllMocks())

  it('registers a new customer and returns tokens', async () => {
    mockPrisma.customer.findUnique.mockResolvedValue(null)
    mockPrisma.customer.create.mockResolvedValue({
      id: 'cust-uuid', name: 'John', email: 'john@test.com',
    })

    const result = await registerCustomer({
      name: 'John', email: 'john@test.com', password: 'securePass123',
    })

    expect(mockPrisma.customer.create).toHaveBeenCalled()
    expect(result.accessToken).toBeTruthy()
    expect(result.refreshToken).toBeTruthy()
    expect(result.user.name).toBe('John')
  })

  it('throws when email already registered', async () => {
    mockPrisma.customer.findUnique.mockResolvedValue({ id: 'existing', email: 'john@test.com' })

    await expect(
      registerCustomer({ name: 'John', email: 'john@test.com', password: 'pass' })
    ).rejects.toMatchObject({ status: 400, message: 'Email already registered' })
  })
})

describe('loginCustomer', () => {
  beforeEach(() => vi.clearAllMocks())

  it('logs in with valid credentials', async () => {
    const bcrypt = await import('bcryptjs')
    const hash = await bcrypt.hash('correctPassword', 12)

    mockPrisma.customer.findUnique.mockResolvedValue({
      id: 'cust-uuid', email: 'john@test.com', name: 'John',
      passwordHash: hash,
    })
    mockPrisma.customer.update.mockResolvedValue({})

    const result = await loginCustomer('john@test.com', 'correctPassword')

    expect(result.accessToken).toBeTruthy()
    expect(mockPrisma.customer.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ lastLoginAt: expect.any(Date) }) })
    )
  })

  it('throws on invalid email', async () => {
    mockPrisma.customer.findUnique.mockResolvedValue(null)
    await expect(
      loginCustomer('wrong@test.com', 'pass')
    ).rejects.toMatchObject({ status: 401 })
  })

  it('throws on wrong password', async () => {
    const bcrypt = await import('bcryptjs')
    const hash = await bcrypt.hash('correctPassword', 12)

    mockPrisma.customer.findUnique.mockResolvedValue({
      id: 'cust-uuid', email: 'john@test.com', passwordHash: hash,
    })

    await expect(
      loginCustomer('john@test.com', 'wrongPassword')
    ).rejects.toMatchObject({ status: 401 })
  })
})

describe('forgotPassword', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns success even when email not found (prevents enumeration)', async () => {
    mockPrisma.customer.findUnique.mockResolvedValue(null)

    const result = await forgotPassword('nonexistent@test.com')
    expect(result.message).toContain('If an account exists')
  })

  it('generates reset token and sends email when customer found', async () => {
    const bcrypt = await import('bcryptjs')
    const hash = await bcrypt.hash('currentPassword', 12)

    mockPrisma.customer.findUnique.mockResolvedValue({
      id: 'cust-uuid', email: 'john@test.com', name: 'John',
      passwordHash: hash,
    })

    const result = await forgotPassword('john@test.com')
    expect(result.message).toContain('If an account exists')
  })
})

describe('resetPassword', () => {
  beforeEach(() => vi.clearAllMocks())

  it('resets password with valid token', async () => {
    const bcrypt = await import('bcryptjs')
    const jwt = await import('jsonwebtoken')
    const currentHash = await bcrypt.hash('oldPassword', 12)

    mockPrisma.customer.findUnique.mockResolvedValue({
      id: 'cust-uuid', email: 'john@test.com', passwordHash: currentHash,
    })
    mockPrisma.customer.update.mockResolvedValue({})

    // Generate a real reset token
    const resetToken = jwt.default.sign(
      { id: 'cust-uuid', email: 'john@test.com', type: 'customer', reset: true },
      process.env.JWT_SECRET + currentHash,
      { expiresIn: '1h' }
    )

    const result = await resetPassword(resetToken, 'newPassword123')
    expect(result.message).toContain('Password has been reset')
  })

  it('rejects token without reset flag', async () => {
    const jwt = await import('jsonwebtoken')
    const fakeToken = jwt.default.sign(
      { id: 'cust-uuid', email: 'john@test.com', type: 'customer' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    )

    await expect(
      resetPassword(fakeToken, 'newPass123')
    ).rejects.toMatchObject({ status: 400 })
  })
})

describe('loginAdmin', () => {
  beforeEach(() => vi.clearAllMocks())

  it('logs in admin with valid credentials', async () => {
    const bcrypt = await import('bcryptjs')
    const hash = await bcrypt.hash('adminPass', 12)

    mockPrisma.adminUser.findUnique.mockResolvedValue({
      id: 'admin-uuid', email: 'admin@test.com', name: 'Admin',
      role: 'admin', isActive: true, passwordHash: hash,
    })
    mockPrisma.adminUser.update.mockResolvedValue({})

    const result = await loginAdmin('admin@test.com', 'adminPass', '127.0.0.1', 'test-agent')

    expect(result.accessToken).toBeTruthy()
    expect(result.user.role).toBe('admin')
  })

  it('rejects deactivated admin', async () => {
    mockPrisma.adminUser.findUnique.mockResolvedValue({
      id: 'admin-uuid', email: 'admin@test.com',
      isActive: false, passwordHash: 'hash',
    })

    await expect(
      loginAdmin('admin@test.com', 'pass', '::1', 'agent')
    ).rejects.toMatchObject({ status: 403 })
  })
})

describe('refreshAdminToken', () => {
  beforeEach(() => vi.clearAllMocks())

  it('refreshes with valid refresh token', async () => {
    const jwt = await import('jsonwebtoken')
    const refreshToken = jwt.default.sign(
      { id: 'admin-uuid', email: 'admin@test.com', role: 'admin', refresh: true },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    )

    mockPrisma.adminUser.findUnique.mockResolvedValue({
      id: 'admin-uuid', email: 'admin@test.com', name: 'Admin',
      role: 'admin', isActive: true,
    })

    const result = await refreshAdminToken(refreshToken)
    expect(result.accessToken).toBeTruthy()
  })

  it('rejects when no token provided', async () => {
    await expect(refreshAdminToken(undefined)).rejects.toMatchObject({ status: 401 })
  })

  it('rejects token without refresh flag', async () => {
    const jwt = await import('jsonwebtoken')
    const fakeToken = jwt.default.sign(
      { id: 'admin-uuid', email: 'admin@test.com', role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    )

    await expect(refreshAdminToken(fakeToken)).rejects.toMatchObject({ status: 401 })
  })
})

describe('logoutAdmin', () => {
  it('returns success message', async () => {
    const result = await logoutAdmin(undefined, '127.0.0.1')
    expect(result.message).toContain('Logged out')
  })
})

describe('getAdminProfile', () => {
  it('returns admin profile when found', async () => {
    mockPrisma.adminUser.findUnique.mockResolvedValue({
      id: 'admin-uuid', name: 'Admin', email: 'admin@test.com',
      role: 'admin', avatarUrl: null, lastLoginAt: new Date(),
    })

    const result = await getAdminProfile('admin-uuid')
    expect(result.user.name).toBe('Admin')
  })

  it('throws when not found', async () => {
    mockPrisma.adminUser.findUnique.mockResolvedValue(null)
    await expect(getAdminProfile('nonexistent')).rejects.toMatchObject({ status: 404 })
  })
})

describe('getCustomerProfile / updateCustomerProfile', () => {
  beforeEach(() => vi.clearAllMocks())

  it('gets customer profile', async () => {
    mockPrisma.customer.findUnique.mockResolvedValue({
      id: 'cust-uuid', name: 'John', email: 'john@test.com',
    })

    const result = await getCustomerProfile('cust-uuid')
    expect(result.user.name).toBe('John')
  })

  it('updates customer profile', async () => {
    mockPrisma.customer.update.mockResolvedValue({
      id: 'cust-uuid', name: 'John Updated', email: 'john@test.com',
    })

    const result = await updateCustomerProfile('cust-uuid', { name: 'John Updated' })
    expect(result.user.name).toBe('John Updated')
  })
})
