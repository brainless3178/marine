import { describe, it, expect, vi } from 'vitest'
import jwt from 'jsonwebtoken'
import express from 'express'
import request from 'supertest'

vi.hoisted(() => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-for-admin-auth-tests-32ch'
})

// The real admin router imports orderService → prisma. Both are mocked so the
// test exercises only the auth boundary (the request never reaches the service
// for the customer-token case, and the mock serves the positive control).
vi.mock('../server.js', () => ({ prisma: {} }))
vi.mock('../services/orderService.js', () => ({
  listOrders: vi.fn().mockResolvedValue({ orders: [], pagination: {} }),
}))

const { default: adminOrderRoutes } = await import('../routes/admin/orders.js')

function buildApp() {
  const app = express()
  app.use('/api/admin/orders', adminOrderRoutes)
  return app
}

// Mirrors generateCustomerAccessToken in authService.ts: the exact payload a
// successful /api/storefront/auth/login (customer) issues.
function customerToken(): string {
  return jwt.sign(
    { id: 'cust-uuid', email: 'customer@test.com', role: 'customer', type: 'customer' },
    process.env.JWT_SECRET as string,
    { expiresIn: '7d' }
  )
}

function adminToken(): string {
  return jwt.sign(
    { id: 'admin-uuid', email: 'admin@test.com', role: 'owner', type: 'admin' },
    process.env.JWT_SECRET as string,
    { expiresIn: '15m' }
  )
}

describe('P0-1 regression: customer JWT on admin routes', () => {
  it('rejects a customer JWT with 403 on GET /api/admin/orders', async () => {
    const app = buildApp()

    const res = await request(app)
      .get('/api/admin/orders')
      .set('Authorization', `Bearer ${customerToken()}`)

    expect(res.status).toBe(403)
    expect(res.body.error).toBe('Admin access required')
  })

  it('rejects a customer JWT even on an admin route that has no role guard', async () => {
    // GET /api/admin/orders has no requireRole guard — only authenticateAdmin —
    // so this proves the type check in authenticateAdmin itself is the barrier.
    const app = buildApp()

    const res = await request(app)
      .get('/api/admin/orders')
      .set('Authorization', `Bearer ${customerToken()}`)

    expect(res.status).toBe(403)
  })

  it('still allows a valid admin JWT through to the route (positive control)', async () => {
    const app = buildApp()

    const res = await request(app)
      .get('/api/admin/orders')
      .set('Authorization', `Bearer ${adminToken()}`)

    expect(res.status).toBe(200)
  })
})
