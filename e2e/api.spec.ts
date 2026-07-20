import { test, expect } from '@playwright/test'

// ─── API Health ──────────────────────────────────────────────────────────────

test.describe('API Health', () => {
  test('health endpoint returns OK', async ({ request }) => {
    const response = await request.get('/api/health')
    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    expect(data).toHaveProperty('status')
  })
})

// ─── Storefront Products API ─────────────────────────────────────────────────

test.describe('Storefront Products API', () => {
  test('GET /api/storefront/products returns product list', async ({ request }) => {
    const response = await request.get('/api/storefront/products')
    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    expect(data).toHaveProperty('products')
    expect(Array.isArray(data.products)).toBeTruthy()
  })

  test('GET /api/storefront/products supports pagination', async ({ request }) => {
    const response = await request.get('/api/storefront/products?page=1&limit=5')
    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    expect(data).toHaveProperty('pagination')
    expect(data.pagination).toHaveProperty('total')
    expect(data.pagination).toHaveProperty('page')
  })

  test('GET /api/storefront/products supports search', async ({ request }) => {
    const response = await request.get('/api/storefront/products?search=pump')
    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    expect(data).toHaveProperty('products')
  })

  test('GET /api/storefront/products/featured returns featured products', async ({ request }) => {
    const response = await request.get('/api/storefront/products/featured')
    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    expect(data).toHaveProperty('products')
  })

  test('GET /api/storefront/products/new-arrivals returns new arrivals', async ({ request }) => {
    const response = await request.get('/api/storefront/products/new-arrivals')
    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    expect(data).toHaveProperty('products')
  })

  test('GET /api/storefront/products/emergency returns emergency products', async ({ request }) => {
    const response = await request.get('/api/storefront/products/emergency')
    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    expect(data).toHaveProperty('products')
  })
})

// ─── Storefront Categories API ───────────────────────────────────────────────

test.describe('Storefront Categories API', () => {
  test('GET /api/storefront/categories returns category list', async ({ request }) => {
    const response = await request.get('/api/storefront/categories')
    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    expect(data).toHaveProperty('categories')
    expect(Array.isArray(data.categories)).toBeTruthy()
  })
})

// ─── Storefront Brands API ───────────────────────────────────────────────────

test.describe('Storefront Brands API', () => {
  test('GET /api/storefront/brands returns brand list', async ({ request }) => {
    const response = await request.get('/api/storefront/brands')
    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    expect(data).toHaveProperty('brands')
    expect(Array.isArray(data.brands)).toBeTruthy()
  })
})

// ─── Storefront Industries API ───────────────────────────────────────────────

test.describe('Storefront Industries API', () => {
  test('GET /api/storefront/industries returns industry list', async ({ request }) => {
    const response = await request.get('/api/storefront/industries')
    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    expect(data).toHaveProperty('industries')
    expect(Array.isArray(data.industries)).toBeTruthy()
  })
})

// ─── Storefront Settings API ─────────────────────────────────────────────────

test.describe('Storefront Settings API', () => {
  test('GET /api/storefront/settings returns store settings', async ({ request }) => {
    const response = await request.get('/api/storefront/settings')
    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    expect(data).toHaveProperty('settings')
  })
})

// ─── Storefront Search API ───────────────────────────────────────────────────

test.describe('Storefront Search API', () => {
  test('GET /api/storefront/search returns search results', async ({ request }) => {
    const response = await request.get('/api/storefront/search?q=pump')
    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    expect(data).toHaveProperty('results')
    expect(data).toHaveProperty('total')
  })
})

// ─── Storefront Testimonials API ─────────────────────────────────────────────

test.describe('Storefront Testimonials API', () => {
  test('GET /api/storefront/testimonials returns testimonials', async ({ request }) => {
    const response = await request.get('/api/storefront/testimonials')
    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    expect(data).toHaveProperty('testimonials')
  })
})

// ─── Storefront Homepage API ─────────────────────────────────────────────────

test.describe('Storefront Homepage API', () => {
  test('GET /api/storefront/homepage returns homepage sections', async ({ request }) => {
    const response = await request.get('/api/storefront/homepage')
    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    expect(data).toHaveProperty('sections')
  })
})

// ─── Storefront Offices API ──────────────────────────────────────────────────

test.describe('Storefront Offices API', () => {
  test('GET /api/storefront/offices returns office locations', async ({ request }) => {
    const response = await request.get('/api/storefront/offices')
    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    expect(data).toHaveProperty('offices')
  })
})

// ─── CSRF Token API ──────────────────────────────────────────────────────────

test.describe('CSRF Token API', () => {
  test('GET /api/csrf-token returns CSRF token', async ({ request }) => {
    const response = await request.get('/api/csrf-token')
    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    expect(data).toHaveProperty('csrfToken')
  })
})

// ─── Admin Auth API ──────────────────────────────────────────────────────────

test.describe('Admin Auth API', () => {
  test('POST /api/admin/auth/login returns error for invalid credentials', async ({ request }) => {
    const response = await request.post('/api/admin/auth/login', {
      data: { email: 'wrong@example.com', password: 'wrongpassword' },
    })
    // Should return 401 or similar error
    expect(response.ok()).toBeFalsy()
  })

  test('POST /api/admin/auth/login requires email and password', async ({ request }) => {
    const response = await request.post('/api/admin/auth/login', {
      data: {},
    })
    expect(response.ok()).toBeFalsy()
  })
})

// ─── Admin Products API (unauthenticated) ────────────────────────────────────

test.describe('Admin Products API (unauthenticated)', () => {
  test('GET /api/admin/products returns 401 without auth', async ({ request }) => {
    const response = await request.get('/api/admin/products')
    expect(response.ok()).toBeFalsy()
  })
})

// ─── Admin Orders API (unauthenticated) ──────────────────────────────────────

test.describe('Admin Orders API (unauthenticated)', () => {
  test('GET /api/admin/orders returns 401 without auth', async ({ request }) => {
    const response = await request.get('/api/admin/orders')
    expect(response.ok()).toBeFalsy()
  })
})

// ─── Storefront Contact API ──────────────────────────────────────────────────

test.describe('Storefront Contact API', () => {
  test('POST /api/storefront/contact validates required fields', async ({ request }) => {
    const response = await request.post('/api/storefront/contact', {
      data: {},
    })
    expect(response.ok()).toBeFalsy()
  })

  test('POST /api/storefront/contact accepts valid submission', async ({ request }) => {
    const response = await request.post('/api/storefront/contact', {
      data: {
        name: 'Test User',
        email: 'test@example.com',
        subject: 'Test Subject',
        message: 'This is a test message from Playwright API tests.',
      },
    })
    expect(response.ok()).toBeTruthy()
  })
})

// ─── Storefront RFQ API ──────────────────────────────────────────────────────

test.describe('Storefront RFQ API', () => {
  test('POST /api/storefront/rfq validates required fields', async ({ request }) => {
    const response = await request.post('/api/storefront/rfq', {
      data: {},
    })
    expect(response.ok()).toBeFalsy()
  })

  test('POST /api/storefront/rfq accepts valid submission', async ({ request }) => {
    const response = await request.post('/api/storefront/rfq', {
      data: {
        fullName: 'Test User',
        email: 'test@example.com',
        productDescription: 'Marine diesel engine spare parts',
        quantity: 10,
        urgency: 'standard',
        consent: true,
      },
    })
    expect(response.ok()).toBeTruthy()
  })
})

// ─── Storefront Offers API ───────────────────────────────────────────────────

test.describe('Storefront Offers API', () => {
  test('POST /api/storefront/offers validates required fields', async ({ request }) => {
    const response = await request.post('/api/storefront/offers', {
      data: {},
    })
    expect(response.ok()).toBeFalsy()
  })
})

// ─── PayPal Client ID API ────────────────────────────────────────────────────

test.describe('PayPal API', () => {
  test('GET /api/storefront/payments/client-id returns client ID', async ({ request }) => {
    const response = await request.get('/api/storefront/payments/client-id')
    // Should return 200 with client ID or 503 if not configured
    const data = await response.json()
    if (response.ok()) {
      expect(data).toHaveProperty('clientId')
    } else {
      expect(data).toHaveProperty('error')
    }
  })
})
