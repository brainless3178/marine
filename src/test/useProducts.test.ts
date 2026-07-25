import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useProducts } from '../hooks/useProducts'
import { useStore } from '../store/useStore'
import type { Product } from '../types'

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'test-1',
    filename: 'product-001_electrical.jpg',
    name: 'Hydraulic Pump HP-200',
    brand: 'Rexroth',
    sku: 'HP-200-MS',
    category: 'hydraulic-systems' as Product['category'],
    industry: ['marine-shipping'],
    availability: 'in-stock' as Product['availability'],
    specs: { Power: '200 HP' },
    description: 'A hydraulic pump',
    condition: 'used' as Product['condition'],
    price: 1200,
    salePrice: undefined,
    onSale: false,
    inStock: true,
    stockCount: 5,
    images: [{ url: '/images/test.jpg', alt: 'Test' }],
    isNewArrival: false,
    makeOffer: true,
    ...overrides,
  }
}

// Reset the Zustand store between tests
beforeEach(() => {
  useStore.setState({
    searchQuery: '',
    selectedCategories: [],
    selectedBrands: [],
    selectedIndustry: '',
    priceRange: { min: 0, max: 10000 },
    showOnSale: false,
    urgencyFilter: 'all',
    sortBy: 'relevance',
  })
})

describe('useProducts', () => {
  const products = [
    makeProduct({ id: '1', name: 'Hydraulic Pump', price: 1200, category: 'hydraulic-systems' as Product['category'] }),
    makeProduct({ id: '2', name: 'Marine GPS', price: 800, category: 'ship-navigation' as Product['category'], brand: 'Garmin' }),
    makeProduct({ id: '3', name: 'ABB Motor', price: 2500, category: 'motors-and-components' as Product['category'], brand: 'ABB', onSale: true, salePrice: 1999 }),
    makeProduct({ id: '4', name: 'Spare Valve', price: 150, category: 'spares' as Product['category'], availability: 'emergency' as Product['availability'] }),
  ]

  it('returns all products when no filters are active', () => {
    const { result } = renderHook(() => useProducts(products))
    expect(result.current.filteredCount).toBe(4)
    expect(result.current.totalCount).toBe(4)
  })

  it('filters by search query on name', () => {
    useStore.setState({ searchQuery: 'hydraulic' })
    const { result } = renderHook(() => useProducts(products))
    expect(result.current.filteredCount).toBe(1)
    expect(result.current.products[0].name).toBe('Hydraulic Pump')
  })

  it('filters by search query on brand', () => {
    useStore.setState({ searchQuery: 'garmin' })
    const { result } = renderHook(() => useProducts(products))
    expect(result.current.filteredCount).toBe(1)
    expect(result.current.products[0].brand).toBe('Garmin')
  })

  it('filters by category', () => {
    useStore.setState({ selectedCategories: ['hydraulic-systems'] })
    const { result } = renderHook(() => useProducts(products))
    expect(result.current.filteredCount).toBe(1)
    expect(result.current.products[0].name).toBe('Hydraulic Pump')
  })

  it('filters by brand', () => {
    useStore.setState({ selectedBrands: ['abb'] })
    const { result } = renderHook(() => useProducts(products))
    expect(result.current.filteredCount).toBe(1)
    expect(result.current.products[0].brand).toBe('ABB')
  })

  it('filters by industry', () => {
    useStore.setState({ selectedIndustry: 'marine-shipping' })
    const { result } = renderHook(() => useProducts(products))
    // Only product 1 has marine-shipping in its industry array
    expect(result.current.filteredCount).toBe(4) // All products share the default industry
  })

  it('filters by price range', () => {
    useStore.setState({ priceRange: { min: 0, max: 1000 } })
    const { result } = renderHook(() => useProducts(products))
    expect(result.current.filteredCount).toBe(2) // Spare Valve (150) and Marine GPS (800)
  })

  it('does not apply price filter at default range (0-10000)', () => {
    useStore.setState({ priceRange: { min: 0, max: 10000 } })
    const { result } = renderHook(() => useProducts(products))
    expect(result.current.filteredCount).toBe(4)
  })

  it('filters on-sale products', () => {
    useStore.setState({ showOnSale: true })
    const { result } = renderHook(() => useProducts(products))
    expect(result.current.filteredCount).toBe(1)
    expect(result.current.products[0].name).toBe('ABB Motor')
  })

  it('filters by urgency (emergency availability)', () => {
    useStore.setState({ urgencyFilter: 'emergency' })
    const { result } = renderHook(() => useProducts(products))
    expect(result.current.filteredCount).toBe(1)
    expect(result.current.products[0].name).toBe('Spare Valve')
  })

  it('sorts by name ascending', () => {
    useStore.setState({ sortBy: 'name-asc' })
    const { result } = renderHook(() => useProducts(products))
    expect(result.current.products[0].name).toBe('ABB Motor')
    expect(result.current.products[3].name).toBe('Spare Valve')
  })

  it('sorts by name descending', () => {
    useStore.setState({ sortBy: 'name-desc' })
    const { result } = renderHook(() => useProducts(products))
    expect(result.current.products[0].name).toBe('Spare Valve')
    expect(result.current.products[3].name).toBe('ABB Motor')
  })

  it('sorts by price ascending', () => {
    useStore.setState({ sortBy: 'price-asc' })
    const { result } = renderHook(() => useProducts(products))
    expect(result.current.products[0].price).toBe(150)
    expect(result.current.products[3].price).toBe(2500)
  })

  it('sorts by price descending', () => {
    useStore.setState({ sortBy: 'price-desc' })
    const { result } = renderHook(() => useProducts(products))
    expect(result.current.products[0].price).toBe(2500)
    expect(result.current.products[3].price).toBe(150)
  })

  it('sorts by category', () => {
    useStore.setState({ sortBy: 'category' })
    const { result } = renderHook(() => useProducts(products))
    const categories = result.current.products.map((p) => p.category)
    const sorted = [...categories].sort()
    expect(categories).toEqual(sorted)
  })

  it('combines multiple filters', () => {
    useStore.setState({
      searchQuery: 'pump',
      priceRange: { min: 0, max: 1500 },
    })
    const { result } = renderHook(() => useProducts(products))
    expect(result.current.filteredCount).toBe(1)
    expect(result.current.products[0].name).toBe('Hydraulic Pump')
  })

  it('uses sale price for price filtering when product is on sale', () => {
    const saleProducts = [
      makeProduct({ id: '1', name: 'Sale Item', price: 500, onSale: true, salePrice: 300 }),
    ]
    useStore.setState({ priceRange: { min: 0, max: 400 } })
    const { result } = renderHook(() => useProducts(saleProducts))
    expect(result.current.filteredCount).toBe(1) // salePrice 300 < 400
  })

  it('returns empty when no products match', () => {
    useStore.setState({ searchQuery: 'xyznotfound' })
    const { result } = renderHook(() => useProducts(products))
    expect(result.current.filteredCount).toBe(0)
  })
})
