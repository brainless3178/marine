import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// Mock framer-motion — function-based mock to avoid JSX transform issues in vi.mock callback
vi.mock('framer-motion', () => {
  const ReactMock = require('react')
  const MockMotion = ({ children, ...props }: any) => {
    // Remove framer-motion-specific props
    const strip = ['variants','initial','animate','exit','transition','whileHover','whileTap','layout','layoutId','key']
    const safe: Record<string, any> = {}
    for (const [k, v] of Object.entries(props)) {
      if (!strip.includes(k)) safe[k] = v
    }
    return ReactMock.createElement('div', safe, children)
  }
  return {
    motion: new Proxy({}, { get: () => MockMotion }),
    AnimatePresence: ({ children }: any) => ReactMock.createElement(ReactMock.Fragment, null, children),
  }
})

// Mock the store
vi.mock('../store/useStore', () => ({
  useStore: vi.fn(),
}))

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'cart.yourCart': 'Your Cart',
        'cart.empty': 'Your cart is empty',
        'cart.emptySub': 'Add items to get started',
        'cart.startShopping': 'Start Shopping',
        'cart.subtotal': 'Subtotal',
        'cart.shippingCalc': 'Shipping calculated at checkout',
        'cart.checkout': 'Checkout',
        'cart.clearCart': 'Clear Cart',
        'cart.each': 'each',
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

// Mock OptimizedImage
vi.mock('../components/ui/OptimizedImage', () => ({
  OptimizedImage: ({ alt, className }: { alt: string; className?: string }) =>
    <img alt={alt} className={className} data-testid="optimized-image" />,
}))

// Mock lucide icons
vi.mock('lucide-react', () => ({
  X: ({ className }: any) => <span data-testid="icon-x" className={className}>X</span>,
  Trash2: ({ className }: any) => <span data-testid="icon-trash" className={className}>🗑</span>,
  ShoppingBag: ({ className }: any) => <span data-testid="icon-bag" className={className}>🛍</span>,
  Plus: ({ className }: any) => <span data-testid="icon-plus" className={className}>+</span>,
  Minus: ({ className }: any) => <span data-testid="icon-minus" className={className}>-</span>,
}))

function renderCartDrawer() {
  return render(
    <MemoryRouter>
      <CartDrawer />
    </MemoryRouter>
  )
}

import { CartDrawer } from '../components/cart/CartDrawer'
import { useStore } from '../store/useStore'

describe('CartDrawer', () => {
  const baseStore = {
    cart: [],
    showCartDrawer: true,
    setShowCartDrawer: vi.fn(),
    removeFromCart: vi.fn(),
    updateQuantity: vi.fn(),
    clearCart: vi.fn(),
    getCartTotal: vi.fn().mockReturnValue(0),
    getCartCount: vi.fn().mockReturnValue(0),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useStore).mockImplementation((selector: any) => selector(baseStore))
  })

  it('does not render when showCartDrawer is false', () => {
    vi.mocked(useStore).mockImplementation((selector: any) => selector({ ...baseStore, showCartDrawer: false }))
    const { container } = renderCartDrawer()
    expect(container.querySelector('[role="dialog"]')).toBeNull()
  })

  it('renders the dialog when showCartDrawer is true', () => {
    renderCartDrawer()
    expect(screen.getByRole('dialog', { name: 'Shopping cart' })).toBeInTheDocument()
  })

  it('shows empty state when cart has no items', () => {
    renderCartDrawer()
    expect(screen.getByText('Your Cart')).toBeInTheDocument()
    expect(screen.getByText('Your cart is empty')).toBeInTheDocument()
  })

  it('renders cart items when cart has products', () => {
    const storeWithItems = {
      ...baseStore,
      cart: [{
        product: {
          id: 'prod-1', name: 'Hydraulic Pump HP-200', brand: 'Yokohama', sku: 'YP-200',
          price: 1200, salePrice: null, onSale: false, inStock: true, stockCount: 10,
          filename: 'pump.jpg', condition: 'new' as const, customLabel: null, customLabelColor: null,
          availability: 'in-stock' as const, makeOffer: false, category: 'Pumps',
        },
        quantity: 2,
      }],
      getCartTotal: vi.fn().mockReturnValue(2400),
      getCartCount: vi.fn().mockReturnValue(2),
    }
    vi.mocked(useStore).mockImplementation((selector: any) => selector(storeWithItems))
    renderCartDrawer()
    expect(screen.getByText('Hydraulic Pump HP-200')).toBeInTheDocument()
    const priceElements = screen.getAllByText(/2400\.00/)
    expect(priceElements.length).toBeGreaterThanOrEqual(1)
  })

  it('shows checkout and clear cart buttons when cart has items', () => {
    vi.mocked(useStore).mockImplementation((selector: any) => selector({
      ...baseStore,
      cart: [{ product: { id: 'p1', name: 'Test', brand: 'B', sku: 'S', price: 100, condition: 'new' as const, availability: 'in-stock' as const, inStock: true, stockCount: 5, filename: '', salePrice: null, onSale: false, customLabel: null, customLabelColor: null, makeOffer: false, category: 'C' }, quantity: 1 }],
      getCartTotal: vi.fn().mockReturnValue(100),
      getCartCount: vi.fn().mockReturnValue(1),
    }))
    renderCartDrawer()
    expect(screen.getByText('Checkout')).toBeInTheDocument()
    expect(screen.getByText('Clear Cart')).toBeInTheDocument()
  })

  it('closes drawer when close button is clicked', () => {
    const setShowCartDrawer = vi.fn()
    vi.mocked(useStore).mockImplementation((selector: any) => selector({ ...baseStore, setShowCartDrawer }))
    renderCartDrawer()
    fireEvent.click(screen.getByLabelText('Close cart'))
    expect(setShowCartDrawer).toHaveBeenCalledWith(false)
  })

  it('navigates to checkout on checkout button click', () => {
    vi.mocked(useStore).mockImplementation((selector: any) => selector({
      ...baseStore,
      cart: [{ product: { id: 'p1', name: 'Test', brand: 'B', sku: 'S', price: 100, condition: 'new' as const, availability: 'in-stock' as const, inStock: true, stockCount: 5, filename: '', salePrice: null, onSale: false, customLabel: null, customLabelColor: null, makeOffer: false, category: 'C' }, quantity: 1 }],
      getCartTotal: vi.fn().mockReturnValue(100),
      getCartCount: vi.fn().mockReturnValue(1),
    }))
    renderCartDrawer()
    fireEvent.click(screen.getByText('Checkout'))
    expect(mockNavigate).toHaveBeenCalledWith('/checkout')
  })
})
