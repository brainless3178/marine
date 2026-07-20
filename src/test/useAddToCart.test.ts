import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAddToCart } from '../hooks/useAddToCart'
import { useStore } from '../store/useStore'
import type { Product } from '../types'

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'test-1',
    filename: 'product-001.jpg',
    name: 'Test Product',
    brand: 'TestBrand',
    sku: 'TEST-001',
    category: 'hydraulic-systems' as Product['category'],
    industry: [],
    availability: 'in-stock' as Product['availability'],
    specs: {},
    description: 'A test product',
    condition: 'used' as Product['condition'],
    price: 100,
    onSale: false,
    inStock: true,
    stockCount: 10,
    images: [{ url: '/images/test.jpg', alt: 'Test' }],
    isNewArrival: false,
    makeOffer: false,
    ...overrides,
  }
}

beforeEach(() => {
  useStore.setState({
    isLoggedIn: false,
    cart: [],
    showAuthModal: false,
    addToCart: vi.fn(),
    setShowAuthModal: vi.fn(),
  })
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useAddToCart', () => {
  it('returns handleAddToCart and addedIds', () => {
    const { result } = renderHook(() => useAddToCart())
    expect(typeof result.current.handleAddToCart).toBe('function')
    expect(result.current.addedIds).toBeInstanceOf(Set)
    expect(result.current.addedIds.size).toBe(0)
  })

  it('shows auth modal when user is not logged in', () => {
    const setShowAuthModal = vi.fn()
    useStore.setState({ isLoggedIn: false, setShowAuthModal })
    const { result } = renderHook(() => useAddToCart())

    act(() => {
      result.current.handleAddToCart(makeProduct())
    })

    expect(setShowAuthModal).toHaveBeenCalledWith(true)
  })

  it('adds product to cart when logged in', () => {
    const addToCart = vi.fn()
    useStore.setState({ isLoggedIn: true, addToCart })
    const { result } = renderHook(() => useAddToCart())
    const product = makeProduct()

    act(() => {
      result.current.handleAddToCart(product)
    })

    expect(addToCart).toHaveBeenCalledWith(product)
  })

  it('marks product as added after adding', () => {
    useStore.setState({ isLoggedIn: true, addToCart: vi.fn() })
    const { result } = renderHook(() => useAddToCart())
    const product = makeProduct()

    act(() => {
      result.current.handleAddToCart(product)
    })

    expect(result.current.addedIds.has(product.id)).toBe(true)
  })

  it('removes added mark after timeout', () => {
    useStore.setState({ isLoggedIn: true, addToCart: vi.fn() })
    const { result } = renderHook(() => useAddToCart())
    const product = makeProduct()

    act(() => {
      result.current.handleAddToCart(product)
    })
    expect(result.current.addedIds.has(product.id)).toBe(true)

    act(() => {
      vi.advanceTimersByTime(1500)
    })

    expect(result.current.addedIds.has(product.id)).toBe(false)
  })

  it('does not add out-of-stock products', () => {
    const addToCart = vi.fn()
    useStore.setState({ isLoggedIn: true, addToCart })
    const { result } = renderHook(() => useAddToCart())

    act(() => {
      result.current.handleAddToCart(makeProduct({ inStock: false }))
    })

    expect(addToCart).not.toHaveBeenCalled()
  })

  it('adds product multiple times when quantity > 1', () => {
    const addToCart = vi.fn()
    useStore.setState({ isLoggedIn: true, addToCart })
    const { result } = renderHook(() => useAddToCart())
    const product = makeProduct()

    act(() => {
      result.current.handleAddToCart(product, 3)
    })

    expect(addToCart).toHaveBeenCalledTimes(3)
    expect(addToCart).toHaveBeenCalledWith(product)
  })

  it('does not show auth modal for out-of-stock products even when not logged in', () => {
    const setShowAuthModal = vi.fn()
    useStore.setState({ isLoggedIn: false, setShowAuthModal })
    const { result } = renderHook(() => useAddToCart())

    act(() => {
      result.current.handleAddToCart(makeProduct({ inStock: false }))
    })

    expect(setShowAuthModal).not.toHaveBeenCalled()
  })
})
