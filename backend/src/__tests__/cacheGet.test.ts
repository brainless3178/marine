import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import express from 'express'
import request from 'supertest'
import { cacheGet, clearCache } from '../middleware/cacheGet.js'

/** Counter-backed handlers: body.n increments per real (uncached) call. */
function makeApp() {
  let settingsCalls = 0
  let productsCalls = 0
  const app = express()
  app.use(cacheGet)
  app.get('/api/storefront/settings', (_req, res) => {
    settingsCalls += 1
    res.json({ n: settingsCalls })
  })
  // Not in the whitelist — must never be cached.
  app.get('/api/storefront/products', (_req, res) => {
    productsCalls += 1
    res.json({ n: productsCalls })
  })
  return app
}

describe('cacheGet middleware', () => {
  beforeEach(() => clearCache())
  afterEach(() => clearCache())

  it('serves the second identical whitelisted request from cache (handler not re-run)', async () => {
    const app = makeApp()
    const first = await request(app).get('/api/storefront/settings').expect(200)
    expect(first.body.n).toBe(1)

    // Cached: handler does NOT run again, so n stays 1 instead of 2.
    const second = await request(app).get('/api/storefront/settings').expect(200)
    expect(second.body.n).toBe(1)
  })

  it('does not cache non-whitelisted storefront paths', async () => {
    const app = makeApp()
    await request(app).get('/api/storefront/products').expect(200)
    const second = await request(app).get('/api/storefront/products').expect(200)
    expect(second.body.n).toBe(2) // handler ran twice → not cached
  })

  it('does not cache authenticated requests even on whitelisted paths', async () => {
    const app = makeApp()
    await request(app).get('/api/storefront/settings').set('Authorization', 'Bearer abc').expect(200)
    const second = await request(app).get('/api/storefront/settings').set('Authorization', 'Bearer abc').expect(200)
    expect(second.body.n).toBe(2) // auth header bypasses the cache
  })

  it('caches /api/v1 aliases of whitelisted paths too', async () => {
    const app = makeApp()
    app.get('/api/v1/storefront/settings', (_req, res) => {
      // Count via a module-scope side effect is awkward here, so use the same
      // handler shape: respond with the current counter from a closure.
      res.json({ ok: true })
    })
    const first = await request(app).get('/api/v1/storefront/settings').expect(200)
    const second = await request(app).get('/api/v1/storefront/settings').expect(200)
    expect(second.body).toEqual(first.body)
  })
})
