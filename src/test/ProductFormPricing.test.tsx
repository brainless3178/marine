import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ProductFormPricing } from '../components/admin/ProductFormPricing'
import type { ProductFormData } from '../hooks/useProductForm'

// Mock lucide icons as silent empty spans so they never pollute accessible names
// (e.g. the HandCoins icon inside the "Enable Make Offer" label).
vi.mock('lucide-react', () => {
  const silent = (name: string) => ({ size }: { size?: number }) => (
    <span data-testid={`icon-${name}`} data-size={size} />
  )
  return {
    Info: silent('info'),
    CalendarRange: silent('calendar'),
    HandCoins: silent('hand-coins'),
  }
})

function makeForm(overrides: Partial<ProductFormData> = {}): ProductFormData {
  return {
    name: '',
    sku: '',
    brand: '',
    category: '',
    industries: [],
    condition: 'used',
    availability: 'in-stock',
    shortDescription: '',
    description: '',
    images: [{ url: '', alt: '', label: 'Main' }],
    regularPrice: '',
    salePrice: '',
    saleStartsAt: '',
    saleEndsAt: '',
    makeOfferEnabled: true,
    minimumOfferPrice: '',
    currency: 'USD',
    inStock: true,
    stockCount: '5',
    lowStockThreshold: '5',
    warehouseLocation: '',
    leadTime: '',
    specs: [{ name: '', value: '' }],
    keyFeatures: [''],
    compatibilityNotes: '',
    warrantyNotes: '',
    conditionNotes: '',
    includedItems: [''],
    excludedItems: [''],
    seoTitle: '',
    seoDescription: '',
    searchKeywords: '',
    internalNotes: '',
    isNewArrival: false,
    isFeatured: false,
    customLabel: '',
    customLabelColor: '#159a67',
    ...overrides,
  }
}

const labelClass = 'mb-1.5 block text-[0.6875rem] font-bold uppercase tracking-wider text-[var(--text-muted)]'

function renderPricing(form: ProductFormData = makeForm(), updateField = vi.fn()) {
  render(
    <ProductFormPricing
      form={form}
      updateField={updateField}
      getFieldClass={(field: string, extra = '') => `test-input ${field} ${extra}`}
      labelClass={labelClass}
    />
  )
  return updateField
}

describe('ProductFormPricing — rendered inputs', () => {
  it('renders all offer inputs with accessible labels', () => {
    renderPricing()
    expect(screen.getByLabelText('Regular price')).toBeInTheDocument()
    expect(screen.getByLabelText('Sale price')).toBeInTheDocument()
    expect(screen.getByLabelText('Sale starts')).toBeInTheDocument()
    expect(screen.getByLabelText('Sale ends')).toBeInTheDocument()
    expect(screen.getByLabelText('Minimum offer price')).toBeInTheDocument()
    expect(screen.getByLabelText('Currency')).toBeInTheDocument()
    expect(screen.getByLabelText(/Enable Make Offer/)).toBeInTheDocument()
  })

  it('prefills values from the form state', () => {
    renderPricing(makeForm({
      regularPrice: '1200',
      salePrice: '950',
      saleStartsAt: '2026-08-01T09:00',
      saleEndsAt: '2026-08-10T18:00',
      minimumOfferPrice: '300',
    }))
    expect((screen.getByLabelText('Regular price') as HTMLInputElement).value).toBe('1200')
    expect((screen.getByLabelText('Sale price') as HTMLInputElement).value).toBe('950')
    expect((screen.getByLabelText('Sale starts') as HTMLInputElement).value).toBe('2026-08-01T09:00')
    expect((screen.getByLabelText('Sale ends') as HTMLInputElement).value).toBe('2026-08-10T18:00')
    expect((screen.getByLabelText('Minimum offer price') as HTMLInputElement).value).toBe('300')
  })
})

describe('ProductFormPricing — updateField wiring', () => {
  it('calls updateField with the field and value on each change', () => {
    const updateField = renderPricing()

    fireEvent.change(screen.getByLabelText('Regular price'), { target: { value: '1200' } })
    expect(updateField).toHaveBeenCalledWith('regularPrice', '1200')

    fireEvent.change(screen.getByLabelText('Sale price'), { target: { value: '950' } })
    expect(updateField).toHaveBeenCalledWith('salePrice', '950')

    fireEvent.change(screen.getByLabelText('Sale starts'), { target: { value: '2026-08-01T09:00' } })
    expect(updateField).toHaveBeenCalledWith('saleStartsAt', '2026-08-01T09:00')

    fireEvent.change(screen.getByLabelText('Sale ends'), { target: { value: '2026-08-10T18:00' } })
    expect(updateField).toHaveBeenCalledWith('saleEndsAt', '2026-08-10T18:00')

    fireEvent.change(screen.getByLabelText('Minimum offer price'), { target: { value: '300' } })
    expect(updateField).toHaveBeenCalledWith('minimumOfferPrice', '300')

    fireEvent.change(screen.getByLabelText('Currency'), { target: { value: 'EUR' } })
    expect(updateField).toHaveBeenCalledWith('currency', 'EUR')
  })

  it('toggles makeOfferEnabled through the checkbox', () => {
    const updateField = renderPricing(makeForm({ makeOfferEnabled: true }))
    fireEvent.click(screen.getByLabelText(/Enable Make Offer/))
    expect(updateField).toHaveBeenCalledWith('makeOfferEnabled', false)
  })
})

describe('ProductFormPricing — sale window enable/disable', () => {
  it('disables the sale window when no sale price is set', () => {
    renderPricing(makeForm({ salePrice: '' }))
    const startsInput = screen.getByLabelText('Sale starts')
    const grid = startsInput.closest('.grid') as HTMLElement
    expect(grid).toHaveAttribute('aria-disabled', 'true')
    expect(grid.className).toContain('pointer-events-none')
    expect(grid.className).toContain('opacity-40')
  })

  it('enables the sale window when a sale price is set', () => {
    renderPricing(makeForm({ salePrice: '950' }))
    const startsInput = screen.getByLabelText('Sale starts')
    const grid = startsInput.closest('.grid') as HTMLElement
    expect(grid).toHaveAttribute('aria-disabled', 'false')
    expect(grid.className).not.toContain('pointer-events-none')
    expect(grid.className).not.toContain('opacity-40')
  })
})

describe('ProductFormPricing — inline validation errors', () => {
  it('shows the date-order error when the sale ends before it starts', () => {
    renderPricing(makeForm({
      salePrice: '950',
      saleStartsAt: '2026-08-10T18:00',
      saleEndsAt: '2026-08-01T09:00',
    }))
    expect(screen.getByText('Sale end date must be after the start date')).toBeInTheDocument()
  })

  it('does not show the date-order error for a valid window', () => {
    renderPricing(makeForm({
      salePrice: '950',
      saleStartsAt: '2026-08-01T09:00',
      saleEndsAt: '2026-08-10T18:00',
    }))
    expect(screen.queryByText('Sale end date must be after the start date')).not.toBeInTheDocument()
  })

  it('shows the min-offer error when offers are enabled and minimum is invalid', () => {
    renderPricing(makeForm({ makeOfferEnabled: true, minimumOfferPrice: '0' }))
    expect(screen.getByText('Minimum offer price must be greater than 0')).toBeInTheDocument()
  })

  it('hides the min-offer error when the minimum is valid', () => {
    renderPricing(makeForm({ makeOfferEnabled: true, minimumOfferPrice: '300' }))
    expect(screen.queryByText('Minimum offer price must be greater than 0')).not.toBeInTheDocument()
  })

  it('shows the sale-must-be-lower error when sale price >= regular price', () => {
    renderPricing(makeForm({ regularPrice: '1000', salePrice: '1000' }))
    expect(screen.getByText('Sale price must be lower than regular price')).toBeInTheDocument()
  })
})

describe('ProductFormPricing — currency prefix', () => {
  it('uses the currency symbol as the input prefix', () => {
    renderPricing(makeForm({ currency: 'EUR' }))
    // Exactly 3 price inputs (regular, sale, min-offer) render the prefix
    expect(screen.getAllByText('€')).toHaveLength(3)
  })

  it('defaults to $ for USD', () => {
    renderPricing(makeForm({ currency: 'USD' }))
    expect(screen.getAllByText('$')).toHaveLength(3)
  })
})
