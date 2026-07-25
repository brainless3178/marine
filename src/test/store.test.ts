import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useStore } from '../store/useStore'
import type { Product } from '../types'

// Mock i18next since it's used by the store
vi.mock('i18next', () => ({
  default: {
    changeLanguage: vi.fn(),
  },
}))

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'test-1',
    filename: 'product-001_electrical.jpg',
    name: 'Test Product',
    brand: 'TestBrand',
    sku: 'TEST-001',
    category: 'hydraulic',
    industry: [],
    availability: 'in-stock',
    specs: {},
    description: 'A test product',
    condition: 'used',
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

describe('useStore', () => {
  beforeEach(() => {
    useStore.setState({
      cart: [],
      cartTotal: 0,
      cartCount: 0,
      showCartDrawer: false,
      isLoggedIn: false,
      user: null,
      showAuthModal: false,
      language: 'en',
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

  describe('Cart operations', () => {
    it('adds product to cart', () => {
      const product = makeProduct()
      useStore.getState().addToCart(product)

      const cart = useStore.getState().cart
      expect(cart).toHaveLength(1)
      expect(cart[0].product.id).toBe('test-1')
      expect(cart[0].quantity).toBe(1)
    })

    it('increases quantity when adding same product', () => {
      const product = makeProduct()
      useStore.getState().addToCart(product)
      useStore.getState().addToCart(product)

      const cart = useStore.getState().cart
      expect(cart).toHaveLength(1)
      expect(cart[0].quantity).toBe(2)
    })

    it('adds different products separately', () => {
      const product1 = makeProduct({ id: 'p1', name: 'Product 1' })
      const product2 = makeProduct({ id: 'p2', name: 'Product 2' })

      useStore.getState().addToCart(product1)
      useStore.getState().addToCart(product2)

      const cart = useStore.getState().cart
      expect(cart).toHaveLength(2)
    })

    it('removes product from cart', () => {
      const product = makeProduct()
      useStore.getState().addToCart(product)
      useStore.getState().removeFromCart('test-1')

      const cart = useStore.getState().cart
      expect(cart).toHaveLength(0)
    })

    it('updates quantity', () => {
      const product = makeProduct()
      useStore.getState().addToCart(product)
      useStore.getState().updateQuantity('test-1', 5)

      const cart = useStore.getState().cart
      expect(cart[0].quantity).toBe(5)
    })

    it('removes product when quantity is 0', () => {
      const product = makeProduct()
      useStore.getState().addToCart(product)
      useStore.getState().updateQuantity('test-1', 0)

      const cart = useStore.getState().cart
      expect(cart).toHaveLength(0)
    })

    it('clears cart', () => {
      useStore.getState().addToCart(makeProduct({ id: 'p1' }))
      useStore.getState().addToCart(makeProduct({ id: 'p2' }))
      useStore.getState().clearCart()

      const cart = useStore.getState().cart
      expect(cart).toHaveLength(0)
    })

    it('calculates cart total correctly', () => {
      const product1 = makeProduct({ id: 'p1', price: 100 })
      const product2 = makeProduct({ id: 'p2', price: 200 })

      useStore.getState().addToCart(product1)
      useStore.getState().addToCart(product2)

      expect(useStore.getState().cartTotal).toBe(300)
    })

    it('calculates cart count correctly', () => {
      const product = makeProduct()
      useStore.getState().addToCart(product)
      useStore.getState().addToCart(product)

      expect(useStore.getState().cartCount).toBe(2)
    })
  })

  describe('UI state', () => {
    it('toggles cart drawer visibility', () => {
      expect(useStore.getState().showCartDrawer).toBe(false)

      useStore.getState().setShowCartDrawer(true)
      expect(useStore.getState().showCartDrawer).toBe(true)

      useStore.getState().setShowCartDrawer(false)
      expect(useStore.getState().showCartDrawer).toBe(false)
    })

    it('toggles auth modal', () => {
      expect(useStore.getState().showAuthModal).toBe(false)

      useStore.getState().setShowAuthModal(true)
      expect(useStore.getState().showAuthModal).toBe(true)
    })

    it('toggles command palette', () => {
      expect(useStore.getState().commandOpen).toBe(false)

      useStore.getState().setCommandOpen(true)
      expect(useStore.getState().commandOpen).toBe(true)
    })
  })

  describe('Filter state', () => {
    it('sets search query', () => {
      useStore.getState().setSearchQuery('hydraulic')
      expect(useStore.getState().searchQuery).toBe('hydraulic')
    })

    it('sets categories', () => {
      useStore.getState().setSelectedCategories(['marine', 'hydraulic'])
      expect(useStore.getState().selectedCategories).toEqual(['marine', 'hydraulic'])
    })

    it('sets brands', () => {
      useStore.getState().setSelectedBrands(['abb', 'siemens'])
      expect(useStore.getState().selectedBrands).toEqual(['abb', 'siemens'])
    })

    it('sets price range', () => {
      useStore.getState().setPriceRange({ min: 100, max: 5000 })
      expect(useStore.getState().priceRange).toEqual({ min: 100, max: 5000 })
    })

    it('sets sort order', () => {
      useStore.getState().setSortBy('price-asc')
      expect(useStore.getState().sortBy).toBe('price-asc')
    })

    it('clears all filters', () => {
      useStore.getState().setSelectedCategories(['test'])
      useStore.getState().setSelectedBrands(['test'])
      useStore.getState().setSearchQuery('test')
      useStore.getState().clearFilters()

      expect(useStore.getState().selectedCategories).toEqual([])
      expect(useStore.getState().selectedBrands).toEqual([])
      expect(useStore.getState().searchQuery).toBe('')
    })
  })

  describe('Language', () => {
    it('changes language', () => {
      useStore.getState().setLanguage('ar')
      expect(useStore.getState().language).toBe('ar')
    })
  })

  describe('RFQ Form', () => {
    it('sets RFQ step', () => {
      useStore.getState().setRfqStep(2)
      expect(useStore.getState().rfqStep).toBe(2)
    })

    it('sets RFQ submitted state', () => {
      useStore.getState().setRfqSubmitted(true)
      expect(useStore.getState().rfqSubmitted).toBe(true)
    })

    it('generates RFQ ID', () => {
      useStore.getState().generateRfqId()
      const rfqId = useStore.getState().rfqId
      expect(rfqId).toMatch(/^AT-\d{5}$/)
    })
  })

  describe('Checkout', () => {
    it('sets checkout step', () => {
      useStore.getState().setCheckoutStep(3)
      expect(useStore.getState().checkoutStep).toBe(3)
    })

    it('sets order placed state', () => {
      useStore.getState().setOrderPlaced(true)
      expect(useStore.getState().orderPlaced).toBe(true)
    })

    it('generates order ID', () => {
      useStore.getState().generateOrderId()
      const orderId = useStore.getState().orderId
      expect(orderId).toMatch(/^AT-ORD-\d{5}$/)
    })
  })
})
