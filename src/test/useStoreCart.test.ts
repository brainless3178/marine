import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../lib/api', () => ({
  adminAuth: { login: vi.fn(), logout: vi.fn(), me: vi.fn() },
  customerAuth: { login: vi.fn(), register: vi.fn(), logout: vi.fn(), me: vi.fn() },
  getAdminToken: vi.fn(() => null),
  getCustomerToken: vi.fn(() => null),
  refreshAdminSession: vi.fn(),
  refreshCustomerSession: vi.fn(),
  setAdminToken: vi.fn(),
  setCustomerToken: vi.fn(),
  storefront: {
    products: { list: vi.fn(), get: vi.fn() },
    settings: vi.fn(),
  },
}))

import { storefront } from '../lib/api'

const mockList = storefront.products.list as ReturnType<typeof vi.fn>
const mockGet = storefront.products.get as ReturnType<typeof vi.fn>

function freshApiProduct(id: string, price: number) {
  return {
    id, name: `Product ${id}`, sku: `SKU-${id}`, slug: id, status: 'published',
    availability: 'in-stock', condition: 'new', regularPrice: price,
    salePrice: null, stockCount: 10, currency: 'USD', showPrice: true,
    makeOfferEnabled: false, isNewArrival: false, isFeatured: false,
    sortPriority: 0, images: [], specs: [], industries: [],
  }
}

function staleCartItem(productId: string, stalePrice: number) {
  return {
    product: { id: productId, name: `Product ${productId}`, price: stalePrice, onSale: false, inStock: true, stockCount: 9 },
    quantity: 1,
  }
}

describe('useStore — refreshCartPrices', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  async function loadStoreWithCart(cart: unknown) {
    localStorage.setItem('alka-cart', JSON.stringify(cart))
    vi.resetModules()
    const { useStore } = await import('../store/useStore')
    return useStore
  }

  it('replaces stale persisted prices with fresh API prices', async () => {
    mockList.mockResolvedValue({ products: [freshApiProduct('prod-1', 250)] })
    const useStore = await loadStoreWithCart([
      { ...staleCartItem('prod-1', 100), quantity: 2 },
    ])

    await useStore.getState().refreshCartPrices()

    const state = useStore.getState()
    expect(state.cart).toHaveLength(1)
    expect(state.cart[0].product.price).toBe(250)
    expect(state.cartTotal).toBe(500) // 250 × 2
    const persisted = JSON.parse(localStorage.getItem('alka-cart')!)
    expect(persisted[0].product.price).toBe(250)
  })

  it('fetches individually any item missing from the list page', async () => {
    mockList.mockResolvedValue({ products: [freshApiProduct('prod-1', 10)] })
    mockGet.mockResolvedValue({ product: freshApiProduct('prod-2', 400), related: [] })
    const useStore = await loadStoreWithCart([
      staleCartItem('prod-1', 1),
      staleCartItem('prod-2', 2),
    ])

    await useStore.getState().refreshCartPrices()

    expect(mockGet).toHaveBeenCalledWith('prod-2')
    expect(useStore.getState().cart.map((i) => i.product.price)).toEqual([10, 400])
  })

  it('drops items whose product no longer exists', async () => {
    mockList.mockResolvedValue({ products: [freshApiProduct('prod-1', 50)] })
    mockGet.mockResolvedValue({ product: freshApiProduct('prod-1', 50), related: [] })
    const useStore = await loadStoreWithCart([
      staleCartItem('prod-1', 1),
      staleCartItem('gone', 1),
    ])

    await useStore.getState().refreshCartPrices()

    expect(useStore.getState().cart).toHaveLength(1)
    expect(useStore.getState().cart[0].product.id).toBe('prod-1')
  })

  it('does not call the API when the cart is empty', async () => {
    const useStore = await loadStoreWithCart([])

    await useStore.getState().refreshCartPrices()

    expect(mockList).not.toHaveBeenCalled()
  })

  it('keeps cached prices when the refresh fails', async () => {
    mockList.mockRejectedValue(new Error('network down'))
    const useStore = await loadStoreWithCart([staleCartItem('prod-1', 100)])

    await useStore.getState().refreshCartPrices()

    expect(useStore.getState().cart[0].product.price).toBe(100)
  })
})
