import { describe, it, expect } from 'vitest'
import { apiProductToFrontend, apiProductsToFrontend } from '../lib/adapters'

function makeApiProduct(overrides: Record<string, any> = {}) {
  return {
    id: 'test-id-1',
    name: 'Hydraulic Pump HP-200',
    sku: 'HP-200-MS',
    slug: 'hydraulic-pump-hp-200',
    brand: { id: 'b1', name: 'Rexroth', slug: 'rexroth' },
    category: { id: 'c1', name: 'Hydraulic Systems', slug: 'hydraulic-systems' },
    status: 'published',
    availability: 'in-stock',
    condition: 'used',
    shortDescription: 'Brief description',
    description: 'Full description of the pump',
    regularPrice: 1200,
    salePrice: null,
    saleStartsAt: null,
    saleEndsAt: null,
    currency: 'USD',
    showPrice: true,
    makeOfferEnabled: true,
    stockCount: 5,
    lowStockThreshold: 10,
    warehouseLocation: 'Dubai Hub',
    publicItemLocation: null,
    leadTime: '2-3 days',
    isNewArrival: true,
    isFeatured: false,
    customLabel: 'SALE',
    customLabelColor: '#ff0000',
    sortPriority: 1,
    images: [
      { id: 'img1', url: '/images/product-001_electrical.jpg', altText: 'HP-200 front', label: 'Main', isMain: true, sortOrder: 0 },
      { id: 'img2', url: '/images/product-001-side.jpg', altText: 'HP-200 side', label: 'Side', isMain: false, sortOrder: 1 },
    ],
    specs: [
      { name: 'Power', value: '200 HP' },
      { name: 'Weight', value: '150 kg' },
    ],
    industries: [
      { industry: { id: 'ind1', name: 'Marine Shipping', slug: 'marine-shipping' } },
      { industry: { id: 'ind2', name: 'Oil & Gas', slug: 'oil-gas' } },
    ],
    ...overrides,
  }
}

describe('apiProductToFrontend', () => {
  it('maps basic fields correctly', () => {
    const result = apiProductToFrontend(makeApiProduct())
    expect(result.id).toBe('test-id-1')
    expect(result.name).toBe('Hydraulic Pump HP-200')
    expect(result.sku).toBe('HP-200-MS')
    expect(result.brand).toBe('Rexroth')
    expect(result.category).toBe('hydraulic-systems')
    expect(result.description).toBe('Full description of the pump')
  })

  it('uses regular price when no sale', () => {
    const result = apiProductToFrontend(makeApiProduct({ salePrice: null }))
    expect(result.price).toBe(1200)
    expect(result.onSale).toBe(false)
    expect(result.salePrice).toBeUndefined()
  })

  it('detects active sale price', () => {
    const result = apiProductToFrontend(
      makeApiProduct({ salePrice: 900, saleStartsAt: null, saleEndsAt: null })
    )
    expect(result.price).toBe(900)
    expect(result.onSale).toBe(true)
    expect(result.salePrice).toBe(900)
  })

  it('does not show sale if salePrice >= regularPrice', () => {
    const result = apiProductToFrontend(
      makeApiProduct({ regularPrice: 100, salePrice: 120 })
    )
    expect(result.price).toBe(100)
    expect(result.onSale).toBe(false)
  })

  it('does not show sale if saleEndsAt is in the past', () => {
    const pastDate = new Date(Date.now() - 86400000).toISOString()
    const result = apiProductToFrontend(
      makeApiProduct({ salePrice: 800, saleEndsAt: pastDate })
    )
    expect(result.price).toBe(1200)
    expect(result.onSale).toBe(false)
  })

  it('computes inStock from stockCount', () => {
    expect(apiProductToFrontend(makeApiProduct({ stockCount: 5 })).inStock).toBe(true)
    expect(apiProductToFrontend(makeApiProduct({ stockCount: 0 })).inStock).toBe(false)
  })

  it('maps specs to an object', () => {
    const result = apiProductToFrontend(makeApiProduct())
    expect(result.specs).toEqual({ Power: '200 HP', Weight: '150 kg' })
  })

  it('maps industries from nested relation', () => {
    const result = apiProductToFrontend(makeApiProduct())
    expect(result.industry).toEqual(['marine-shipping', 'oil-gas'])
  })

  it('extracts filename from image URL', () => {
    const result = apiProductToFrontend(makeApiProduct())
    expect(result.filename).toBe('products/product-001_electrical.jpg')
  })

  it('maps images array with alt text', () => {
    const result = apiProductToFrontend(makeApiProduct())
    expect(result.images).toHaveLength(2)
    expect(result.images[0].alt).toBe('HP-200 front')
    expect(result.images[0].label).toBe('Main')
    expect(result.images[1].label).toBe('Side')
  })

  it('uses shortDescription as fallback when description is missing', () => {
    const result = apiProductToFrontend(
      makeApiProduct({ description: null, shortDescription: 'Short desc' })
    )
    expect(result.description).toBe('Short desc')
  })

  it('uses Unknown brand when brand is null', () => {
    const result = apiProductToFrontend(makeApiProduct({ brand: null }))
    expect(result.brand).toBe('Unknown')
  })

  it('maps makeOfferEnabled to makeOffer', () => {
    expect(apiProductToFrontend(makeApiProduct({ makeOfferEnabled: true })).makeOffer).toBe(true)
    expect(apiProductToFrontend(makeApiProduct({ makeOfferEnabled: false })).makeOffer).toBe(false)
  })

  it('handles empty images array', () => {
    const result = apiProductToFrontend(makeApiProduct({ images: [] }))
    // With no image URL, falls back to ID-based mapping: test-id-1 → product-002_electrical.jpg
    expect(result.filename).toBe('products/product-002_electrical.jpg')
    // Empty images array also triggers the fallback image
    expect(result.images).toHaveLength(1)
    expect(result.images[0].url).toContain('product-002_electrical.jpg')
  })

  it('uses fallback images when images is null/undefined', () => {
    const result = apiProductToFrontend(makeApiProduct({ images: undefined }))
    // With no image URL, falls back to ID-based mapping: test-id-1 → product-002_electrical.jpg
    expect(result.filename).toBe('products/product-002_electrical.jpg')
    expect(result.images).toHaveLength(1)
    expect(result.images[0].url).toContain('product-002_electrical.jpg')
  })

  it('handles missing specs', () => {
    const result = apiProductToFrontend(makeApiProduct({ specs: [] }))
    expect(result.specs).toEqual({})
  })

  it('handles missing industries', () => {
    const result = apiProductToFrontend(makeApiProduct({ industries: [] }))
    expect(result.industry).toEqual([])
  })
})

describe('apiProductsToFrontend', () => {
  it('maps an array of products', () => {
    const apiProducts = [
      makeApiProduct({ id: 'p1', name: 'Product A' }),
      makeApiProduct({ id: 'p2', name: 'Product B' }),
    ]
    const results = apiProductsToFrontend(apiProducts)
    expect(results).toHaveLength(2)
    expect(results[0].id).toBe('p1')
    expect(results[1].id).toBe('p2')
  })

  it('returns empty array for empty input', () => {
    expect(apiProductsToFrontend([])).toEqual([])
  })
})
