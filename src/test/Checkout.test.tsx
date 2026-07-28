import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import React from 'react'

// Mock framer-motion
vi.mock('framer-motion', () => {
  const MockMotion = ({ children, ...props }: any) => {
    const strip = ['variants','initial','animate','exit','transition','whileHover','whileTap','layout','layoutId','key']
    const safe: Record<string, any> = {}
    for (const [k, v] of Object.entries(props)) { if (!strip.includes(k)) safe[k] = v }
    return React.createElement('div', safe, children)
  }
  return {
    motion: new Proxy({}, { get: () => MockMotion }),
    AnimatePresence: ({ children }: any) => React.createElement(React.Fragment, null, children),
  }
})

// Mock store
vi.mock('../store/useStore', () => ({
  useStore: vi.fn(),
}))

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'checkout.headerLabel': 'Secure Checkout',
        'checkout.headerTitle': 'Complete Your Order',
        'checkout.badgeSecure': 'Secure Payment',
        'checkout.badgeGlobal': 'Global Shipping',
        'checkout.shippingLabel': 'Shipping',
        'checkout.paymentLabel': 'Payment',
        'checkout.reviewLabel': 'Review',
      }
      return translations[key] || key
    },
  }),
}))

// Mock react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

// Mock PayPal
vi.mock('@paypal/react-paypal-js', () => ({
  PayPalScriptProvider: ({ children }: any) => <>{children}</>,
  PayPalButtons: () => <div data-testid="paypal-buttons">PayPal</div>,
  usePayPalScriptReducer: () => [{ isPending: false }],
}))

// Mock SEO
vi.mock('../components/seo/SEO', () => ({
  SEO: () => null,
}))

// Mock checkout sub-components — vitest resolves mock paths relative to test file
vi.mock('../pages/checkout/CheckoutSuccess', () => ({
  CheckoutSuccess: () => <div data-testid="checkout-success">Order Placed</div>,
}))
vi.mock('../pages/checkout/CheckoutShipping', () => ({
  CheckoutShipping: ({ goToStep }: any) => <div data-testid="checkout-shipping"><button onClick={() => goToStep(2)}>Continue</button></div>,
}))
vi.mock('../pages/checkout/CheckoutPayment', () => ({
  CheckoutPayment: ({ goToStep }: any) => <div data-testid="checkout-payment"><button onClick={() => goToStep(3)}>Continue</button></div>,
}))
vi.mock('../pages/checkout/CheckoutReview', () => ({
  CheckoutReview: () => <div data-testid="checkout-review">Review Order</div>,
}))

// Mock store settings
vi.mock('../hooks/useStoreSettings', () => ({
  useStoreSettings: () => ({ shippingCost: 25, taxRate: 0.05 }),
}))

// Mock api
vi.mock('../lib/api', () => ({
  storefront: {
    orders: { create: vi.fn().mockResolvedValue({ order: { id: 'order-1' } }) },
    payments: {
      createPaypalOrder: vi.fn().mockResolvedValue({ paypalOrderId: 'PAYPAL-ORDER-1' }),
      capturePaypalOrder: vi.fn().mockResolvedValue({}),
    },
  },
}))

import { useStore } from '../store/useStore'

describe('Checkout Page', () => {
  const baseStore = {
    cart: [{ product: { id: 'p1', name: 'Test Product', price: 100, salePrice: null, onSale: false, inStock: true, stockCount: 5, filename: '', brand: 'B', sku: 'S', condition: 'new' as const, availability: 'in-stock' as const, customLabel: null, customLabelColor: null, makeOffer: false, category: 'C' }, quantity: 1 }],
    user: { id: 'user-1', name: 'Test User', email: 'test@test.com', role: 'customer' },
    getCartTotal: vi.fn().mockReturnValue(100),
    getCartCount: vi.fn().mockReturnValue(1),
    clearCart: vi.fn(),
    checkoutStep: 1,
    setCheckoutStep: vi.fn(),
    orderPlaced: false,
    setOrderPlaced: vi.fn(),
    orderId: null,
    generateOrderId: vi.fn(),
    setCancelRequested: vi.fn(),
    cancelReason: '',
    setCancelReason: vi.fn(),
  }

  let CheckoutPage: any

  beforeAll(async () => {
    const mod = await import('../pages/Checkout')
    CheckoutPage = mod.default
  })

  beforeEach(() => {
    vi.clearAllMocks()
    // Checkout calls useStore() without selector (destructures full state)
    vi.mocked(useStore).mockImplementation((selector?: any) => {
      return selector ? selector(baseStore) : baseStore
    })
  })

  function renderCheckout() {
    return render(<MemoryRouter><CheckoutPage /></MemoryRouter>)
  }

  it('redirects to products when cart is empty', () => {
    vi.mocked(useStore).mockImplementation((selector?: any) => {
      return selector ? selector({ ...baseStore, cart: [] }) : { ...baseStore, cart: [] }
    })
    renderCheckout()
    expect(mockNavigate).toHaveBeenCalledWith('/products')
  })

  it('redirects to products when user is not logged in', () => {
    vi.mocked(useStore).mockImplementation((selector?: any) => {
      return selector ? selector({ ...baseStore, user: null }) : { ...baseStore, user: null }
    })
    renderCheckout()
    expect(mockNavigate).toHaveBeenCalledWith('/products')
  })

  it('renders checkout page when cart has items and user is logged in', () => {
    renderCheckout()
    expect(screen.getByText('Complete Your Order')).toBeInTheDocument()
  })

  it('shows step progress indicators', () => {
    renderCheckout()
    expect(screen.getByText('Shipping')).toBeInTheDocument()
    expect(screen.getByText('Payment')).toBeInTheDocument()
    expect(screen.getByText('Review')).toBeInTheDocument()
  })

  it('shows secure payment and global shipping badges', () => {
    renderCheckout()
    expect(screen.getByText('Secure Payment')).toBeInTheDocument()
    expect(screen.getByText('Global Shipping')).toBeInTheDocument()
  })

  it('renders shipping form on step 1', () => {
    renderCheckout()
    expect(screen.getByTestId('checkout-shipping')).toBeInTheDocument()
  })

  it('renders success page when order is placed', () => {
    vi.mocked(useStore).mockImplementation((selector?: any) => {
      return selector ? selector({ ...baseStore, orderPlaced: true }) : { ...baseStore, orderPlaced: true }
    })
    renderCheckout()
    expect(screen.getByTestId('checkout-success')).toBeInTheDocument()
  })
})
