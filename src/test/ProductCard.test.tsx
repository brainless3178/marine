import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { ProductCard } from '../components/ui/ProductCard'
import type { Product } from '../types'

// Mock useStoreSettings
vi.mock('../hooks/useStoreSettings', () => ({
  useStoreSettings: () => ({ whatsappNumber: '918799095041' }),
}))

// Mock OptimizedImage
vi.mock('../components/ui/OptimizedImage', () => ({
  OptimizedImage: ({ alt, className }: { alt: string; className?: string }) =>
    <img alt={alt} className={className} data-testid="optimized-image" />,
}))

// Mock lucide icons
vi.mock('lucide-react', () => ({
  Check: ({ size }: { size?: number }) => <span data-testid="icon-check" data-size={size}>✓</span>,
  Clock: ({ size }: { size?: number }) => <span data-testid="icon-clock" data-size={size}>⏰</span>,
  MessageCircle: ({ size }: { size?: number }) => <span data-testid="icon-whatsapp" data-size={size}>💬</span>,
  PackageCheck: ({ size }: { size?: number }) => <span data-testid="icon-package" data-size={size}>📦</span>,
  ShoppingCart: ({ size }: { size?: number }) => <span data-testid="icon-cart" data-size={size}>🛒</span>,
  Sparkles: ({ size }: { size?: number }) => <span data-testid="icon-sparkles" data-size={size}>✨</span>,
}))

const baseProduct: Product = {
  id: 'prod-1',
  name: 'Hydraulic Pump HP-200',
  sku: 'HP-200',
  description: 'High-pressure hydraulic pump',
  price: 1200,
  salePrice: undefined,
  onSale: false,
  inStock: true,
  stockCount: 15,
  brand: 'Yokohama',
  category: 'Pumps' as any,
  condition: 'new',
  availability: 'in-stock',
  makeOffer: false,
  customLabel: undefined,
  customLabelColor: undefined,
  filename: 'pump.jpg',
  images: [],
  industry: [],
  specs: {},
}

function renderProductCard(product = baseProduct, options?: { added?: boolean; onAddToCart?: any; compact?: boolean }) {
  const t = ((key: string, _vars?: any) => {
    const translations: Record<string, string> = {
      'product.emergency': 'EMERGENCY',
      'product.inStock': 'In Stock',
      'product.inStockCount': `${(_vars as any)?.count || 0} in stock`,
      'product.outOfStock': 'Out of Stock',
      'product.outOfStockCount': 'Out of stock',
      'product.addToCart': 'Add to Cart',
      'product.added': 'Added',
      'product.sale': 'OFF',
      'product.saleEndsIn': 'Sale ends in',
      'product.endsSoon': 'Ending soon',
    }
    return translations[key] || key
  }) as any

  return render(
    <BrowserRouter>
      <ProductCard
        product={product}
        t={t}
        added={options?.added}
        onAddToCart={options?.onAddToCart}
        compact={options?.compact}
      />
    </BrowserRouter>
  )
}

describe('ProductCard', () => {
  it('renders product name', () => {
    renderProductCard()
    expect(screen.getByText('Hydraulic Pump HP-200')).toBeInTheDocument()
  })

  it('renders brand name', () => {
    renderProductCard()
    expect(screen.getByText('Yokohama')).toBeInTheDocument()
  })

  it('renders SKU', () => {
    renderProductCard()
    expect(screen.getByText('HP-200')).toBeInTheDocument()
  })

  it('renders price', () => {
    renderProductCard()
    expect(screen.getByText('$1200.00')).toBeInTheDocument()
  })

  it('renders stock count', () => {
    renderProductCard()
    expect(screen.getByText('15 in stock')).toBeInTheDocument()
  })

  it('renders add to cart button', () => {
    renderProductCard(baseProduct, { onAddToCart: vi.fn() })
    expect(screen.getByText('Add to Cart')).toBeInTheDocument()
  })

  it('shows added state when product is in cart', () => {
    renderProductCard(baseProduct, { added: true, onAddToCart: vi.fn() })
    expect(screen.getByText('Added')).toBeInTheDocument()
  })

  it('shows sale price when product is on sale', () => {
    const saleProduct = {
      ...baseProduct,
      onSale: true,
      salePrice: 950,
      price: 1200,
    }
    renderProductCard(saleProduct)
    expect(screen.getByText('$950.00')).toBeInTheDocument()
    expect(screen.getByText('$1200.00')).toBeInTheDocument() // Strikethrough original
  })

  it('shows SALE percentage badge for on-sale products', () => {
    const saleProduct = {
      ...baseProduct,
      onSale: true,
      salePrice: 950,
      regularPrice: 1200,
      price: 950, // effective price is the sale price
    }
    renderProductCard(saleProduct)
    expect(screen.getByText('-21% OFF')).toBeInTheDocument()
  })

  it('shows countdown when sale has a future end date', () => {
    const future = new Date(Date.now() + 2 * 86_400_000 + 3_600_000).toISOString()
    const saleProduct = {
      ...baseProduct,
      onSale: true,
      salePrice: 950,
      regularPrice: 1200,
      price: 950,
      saleEndsAt: future,
    }
    renderProductCard(saleProduct)
    expect(screen.getByText('Sale ends in')).toBeInTheDocument()
    expect(screen.getByText(/\d+d \d{2}:\d{2}:\d{2}/)).toBeInTheDocument()
  })

  it('highlights the countdown as ending soon when under 24h remain', () => {
    const soon = new Date(Date.now() + 3_600_000).toISOString()
    const saleProduct = {
      ...baseProduct,
      onSale: true,
      salePrice: 950,
      regularPrice: 1200,
      price: 950,
      saleEndsAt: soon,
    }
    renderProductCard(saleProduct)
    expect(screen.getByText('Ending soon')).toBeInTheDocument()
    // The urgent strip uses a pulsing danger treatment, not the calm one
    expect(screen.getByText('Ending soon').closest('div')).toHaveClass('animate-danger-pulse')
  })

  it('hides sale badge and countdown for non-sale products', () => {
    renderProductCard()
    expect(screen.queryByText(/-\d+% OFF/)).not.toBeInTheDocument()
    expect(screen.queryByText('Sale ends in')).not.toBeInTheDocument()
  })

  it('shows out of stock overlay when not in stock', () => {
    const outOfStock = { ...baseProduct, inStock: false, stockCount: 0 }
    renderProductCard(outOfStock)
    const outOfStockElements = screen.getAllByText('Out of Stock')
    expect(outOfStockElements.length).toBeGreaterThanOrEqual(1)
  })

  it('shows condition label', () => {
    renderProductCard()
    expect(screen.getByText('New')).toBeInTheDocument()
  })

  it('shows emergency badge for emergency availability', () => {
    const emergency = { ...baseProduct, availability: 'emergency' as const }
    renderProductCard(emergency)
    expect(screen.getByText('EMERGENCY')).toBeInTheDocument()
  })

  it('has product detail link', () => {
    renderProductCard()
    const link = screen.getByText('Details')
    expect(link).toHaveAttribute('href', '/product/prod-1')
  })

  it('calls onAddToCart when add to cart is clicked', () => {
    const onAddToCart = vi.fn()
    renderProductCard(baseProduct, { onAddToCart })
    fireEvent.click(screen.getByText('Add to Cart'))
    expect(onAddToCart).toHaveBeenCalledWith(baseProduct)
  })

  it('has WhatsApp button with correct link', () => {
    renderProductCard()
    const whatsappLink = screen.getByLabelText('WhatsApp quote for Hydraulic Pump HP-200')
    expect(whatsappLink).toHaveAttribute('href', expect.stringContaining('wa.me/918799095041'))
    expect(whatsappLink).toHaveAttribute('target', '_blank')
  })
})
