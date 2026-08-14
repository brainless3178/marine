import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { ProductPreviewModal } from '../components/admin/ProductPreviewModal'
import { buildPreviewProduct } from '../components/admin/buildPreviewProduct'
import type { ProductFormData } from '../hooks/useProductForm'

// i18n — ProductCard receives the real t from the modal's useTranslation
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

// useStoreSettings — ProductCard reads whatsappNumber for its WhatsApp link
vi.mock('../hooks/useStoreSettings', () => ({
  useStoreSettings: () => ({ whatsappNumber: '918799095041' }),
}))

// OptimizedImage — renders a plain img so the preview image URL is testable
vi.mock('../components/ui/OptimizedImage', () => ({
  OptimizedImage: ({ alt, className, src }: { alt: string; className?: string; src?: string }) =>
    <img alt={alt} className={className} src={src} data-testid="optimized-image" />,
}))

// lucide icons as silent empty spans (never pollute accessible names)
vi.mock('lucide-react', () => ({
  X: () => <span data-testid="icon-x" />,
  Eye: () => <span data-testid="icon-eye" />,
  Check: () => <span data-testid="icon-check" />,
  Clock: () => <span data-testid="icon-clock" />,
  PackageCheck: () => <span data-testid="icon-package" />,
  ShoppingCart: () => <span data-testid="icon-cart" />,
  Sparkles: () => <span data-testid="icon-sparkles" />,
  MessageCircle: () => <span data-testid="icon-whatsapp" />,
}))

function makeForm(overrides: Partial<ProductFormData> = {}): ProductFormData {
  return {
    name: 'Hydraulic Pump HP-200',
    sku: 'HP-200-MS',
    brand: 'brand-yokohama',
    category: 'cat-pumps',
    industries: [],
    condition: 'new',
    availability: 'in-stock',
    shortDescription: 'High-pressure hydraulic pump',
    description: 'Verified marine pump, ready for export.',
    images: [{ url: 'https://res.cloudinary.com/x/image/upload/v1/alka/products/product-106', alt: 'Pump photo', label: 'Main' }],
    regularPrice: '1200',
    salePrice: '950',
    saleStartsAt: '2026-08-01T09:00',
    saleEndsAt: '2099-12-31T23:59',
    makeOfferEnabled: true,
    minimumOfferPrice: '300',
    currency: 'USD',
    inStock: true,
    stockCount: '15',
    lowStockThreshold: '5',
    warehouseLocation: 'Alang',
    leadTime: '7 days',
    specs: [{ name: 'Flow', value: '200 L/min' }],
    keyFeatures: ['Certified'],
    compatibilityNotes: '',
    warrantyNotes: '',
    conditionNotes: '',
    includedItems: ['Manual'],
    excludedItems: [],
    seoTitle: '',
    seoDescription: '',
    searchKeywords: '',
    internalNotes: '',
    isNewArrival: false,
    isFeatured: false,
    customLabel: 'NEW',
    customLabelColor: '#159a67',
    ...overrides,
  }
}

const brandList = [{ id: 'brand-yokohama', name: 'Yokohama' }]

function renderModal(form = makeForm()) {
  return render(
    <BrowserRouter>
      <ProductPreviewModal form={form} brandList={brandList} onClose={vi.fn()} />
    </BrowserRouter>
  )
}

describe('buildPreviewProduct', () => {
  it('maps form data to a storefront Product (name, brand, sku, price)', () => {
    const product = buildPreviewProduct(makeForm(), brandList)
    expect(product.name).toBe('Hydraulic Pump HP-200')
    expect(product.brand).toBe('Yokohama')
    expect(product.sku).toBe('HP-200-MS')
    expect(product.price).toBe(950) // sale price wins while window is open
    expect(product.regularPrice).toBe(1200)
    expect(product.onSale).toBe(true)
    expect(product.salePrice).toBe(950)
    expect(product.makeOffer).toBe(true)
  })

  it('uses the first image URL as the card filename', () => {
    const product = buildPreviewProduct(makeForm(), brandList)
    expect(product.filename).toBe('https://res.cloudinary.com/x/image/upload/v1/alka/products/product-106')
  })

  it('is not on sale when the sale window has not started or has ended', () => {
    const notStarted = buildPreviewProduct(makeForm({ saleStartsAt: '2099-01-01T00:00' }), brandList)
    expect(notStarted.onSale).toBe(false)
    expect(notStarted.price).toBe(1200)

    const ended = buildPreviewProduct(makeForm({ saleEndsAt: '2020-01-01T00:00' }), brandList)
    expect(ended.onSale).toBe(false)
    expect(ended.price).toBe(1200)
  })

  it('falls back to regular price and brand text when values are empty', () => {
    const bare = buildPreviewProduct(makeForm({ name: '', regularPrice: '', brand: '', sku: '' }), [])
    expect(bare.name).toBe('Product name')
    expect(bare.brand).toBe('Brand')
    expect(bare.price).toBe(0)
    expect(bare.onSale).toBe(false)
  })

  it('maps custom label, stock and condition through', () => {
    const product = buildPreviewProduct(makeForm(), brandList)
    expect(product.customLabel).toBe('NEW')
    expect(product.customLabelColor).toBe('#159a67')
    expect(product.inStock).toBe(true)
    expect(product.stockCount).toBe(15)
    expect(product.condition).toBe('new')
  })
})

describe('ProductPreviewModal', () => {
  it('renders the real ProductCard with the filled data', () => {
    renderModal()
    expect(screen.getByText('Hydraulic Pump HP-200')).toBeInTheDocument()
    expect(screen.getByText('Yokohama')).toBeInTheDocument()
    expect(screen.getByText('HP-200-MS')).toBeInTheDocument()
    // On-sale price shown at the sale value
    expect(screen.getByText('$950.00')).toBeInTheDocument()
  })

  it('shows the uploaded image via the card image', () => {
    renderModal()
    const img = screen.getByTestId('optimized-image')
    expect(img).toHaveAttribute('src', 'https://res.cloudinary.com/x/image/upload/v1/alka/products/product-106')
    expect(img).toHaveAttribute('alt', 'Hydraulic Pump HP-200')
  })

  it('shows a warning when no image has been added', () => {
    renderModal(makeForm({ images: [{ url: '', alt: '', label: 'Main' }] }))
    expect(screen.getByText(/placeholder image will be shown/i)).toBeInTheDocument()
  })

  it('renders the card as non-interactive so the preview never navigates away', () => {
    renderModal()
    // The card wrapper is pointer-events-none — clicking the card's Links (e.g.
    // to /product/preview-product) must not navigate the admin out of the modal.
    const cardLink = screen.getByText('Details').closest('a')
    expect(cardLink).toHaveAttribute('href', '/product/preview-product')
    const cardWrapper = cardLink!.closest('.pointer-events-none')
    expect(cardWrapper).not.toBeNull()
  })

  it('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn()
    render(
      <BrowserRouter>
        <ProductPreviewModal form={makeForm()} brandList={brandList} onClose={onClose} />
      </BrowserRouter>
    )
    fireEvent.click(screen.getByLabelText('Close preview'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose on Escape', () => {
    const onClose = vi.fn()
    render(
      <BrowserRouter>
        <ProductPreviewModal form={makeForm()} brandList={brandList} onClose={onClose} />
      </BrowserRouter>
    )
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
