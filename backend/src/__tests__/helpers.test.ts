import { describe, it, expect } from 'vitest'

const helpers = await import('../utils/helpers.js')

describe('generateSlug', () => {
  it('converts text to lowercase slug', () => {
    expect(helpers.generateSlug('Hello World')).toBe('hello-world')
  })

  it('removes special characters', () => {
    expect(helpers.generateSlug('Hydraulic Pump #200!')).toBe('hydraulic-pump-200')
  })

  it('replaces spaces with hyphens', () => {
    expect(helpers.generateSlug('Marine   Engine  Parts')).toBe('marine-engine-parts')
  })

  it('trims leading and trailing hyphens', () => {
    expect(helpers.generateSlug('  -hello-  ')).toBe('hello')
  })

  it('handles single word', () => {
    expect(helpers.generateSlug('Pump')).toBe('pump')
  })

  it('handles empty string', () => {
    expect(helpers.generateSlug('')).toBe('')
  })

  it('replaces underscores with hyphens', () => {
    expect(helpers.generateSlug('marine_parts')).toBe('marine-parts')
  })
})

describe('paginationParams', () => {
  it('returns defaults when no params provided', () => {
    const result = helpers.paginationParams()
    expect(result.page).toBe(1)
    expect(result.limit).toBe(24)
    expect(result.skip).toBe(0)
  })

  it('computes skip correctly', () => {
    const result = helpers.paginationParams(3, 10)
    expect(result.page).toBe(3)
    expect(result.limit).toBe(10)
    expect(result.skip).toBe(20) // (3-1) * 10
  })

  it('clamps limit to max 100', () => {
    const result = helpers.paginationParams(1, 500)
    expect(result.limit).toBe(100)
  })

  it('ensures minimum page is 1', () => {
    const result = helpers.paginationParams(0, 10)
    expect(result.page).toBe(1)
  })

  it('ensures minimum limit is 1', () => {
    const result = helpers.paginationParams(1, -5)
    expect(result.limit).toBe(1)
  })

  it('handles undefined page gracefully', () => {
    const result = helpers.paginationParams(undefined, 10)
    expect(result.page).toBe(1)
    expect(result.limit).toBe(10)
  })

  it('handles NaN values gracefully', () => {
    const result = helpers.paginationParams(NaN, NaN)
    expect(result.page).toBe(1)
    expect(result.limit).toBe(24)
  })
})

describe('paginationResponse', () => {
  it('returns correct pagination metadata', () => {
    const result = helpers.paginationResponse(100, 1, 10)
    expect(result.total).toBe(100)
    expect(result.page).toBe(1)
    expect(result.limit).toBe(10)
    expect(result.totalPages).toBe(10)
    expect(result.hasNext).toBe(true)
    expect(result.hasPrev).toBe(false)
  })

  it('hasNext is false on last page', () => {
    const result = helpers.paginationResponse(100, 10, 10)
    expect(result.hasNext).toBe(false)
    expect(result.hasPrev).toBe(true)
  })

  it('handles 0 total gracefully', () => {
    const result = helpers.paginationResponse(0, 1, 10)
    expect(result.totalPages).toBe(0)
    expect(result.hasNext).toBe(false)
  })
})

describe('getEffectivePrice', () => {
  const baseProduct = { regularPrice: 1000 }

  it('returns regular price when no sale price', () => {
    expect(helpers.getEffectivePrice(baseProduct)).toBe(1000)
  })

  it('returns sale price when active', () => {
    const product = {
      regularPrice: 1000,
      salePrice: 800,
      saleStartsAt: new Date(Date.now() - 86400000), // 1 day ago
      saleEndsAt: new Date(Date.now() + 86400000),   // 1 day from now
    }
    expect(helpers.getEffectivePrice(product)).toBe(800)
  })

  it('returns regular price before sale starts', () => {
    const product = {
      regularPrice: 1000,
      salePrice: 800,
      saleStartsAt: new Date(Date.now() + 86400000), // 1 day from now
    }
    expect(helpers.getEffectivePrice(product)).toBe(1000)
  })

  it('returns regular price after sale ends', () => {
    const product = {
      regularPrice: 1000,
      salePrice: 800,
      saleEndsAt: new Date(Date.now() - 86400000), // 1 day ago
    }
    expect(helpers.getEffectivePrice(product)).toBe(1000)
  })

  it('returns regular price when sale > regular', () => {
    const product = {
      regularPrice: 1000,
      salePrice: 1200,
      saleStartsAt: new Date(Date.now() - 86400000),
    }
    expect(helpers.getEffectivePrice(product)).toBe(1000)
  })

  it('handles string price values', () => {
    const product = { regularPrice: '1000', salePrice: '750' }
    expect(helpers.getEffectivePrice(product)).toBe(750)
  })

  it('handles null salePrice', () => {
    const product = { regularPrice: 500, salePrice: null }
    expect(helpers.getEffectivePrice(product)).toBe(500)
  })
})

describe('isOnSale', () => {
  it('returns false when no active sale', () => {
    expect(helpers.isOnSale({ regularPrice: 100 })).toBe(false)
  })

  it('returns true when active sale', () => {
    const product = {
      regularPrice: 1000,
      salePrice: 750,
      saleStartsAt: new Date(Date.now() - 86400000),
      saleEndsAt: new Date(Date.now() + 86400000),
    }
    expect(helpers.isOnSale(product)).toBe(true)
  })

  it('returns false when sale not yet started', () => {
    const product = {
      regularPrice: 1000,
      salePrice: 750,
      saleStartsAt: new Date(Date.now() + 86400000),
    }
    expect(helpers.isOnSale(product)).toBe(false)
  })
})
