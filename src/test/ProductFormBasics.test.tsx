import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ProductFormBasics } from '../components/admin/ProductFormBasics'
import { buildProductSkuBase } from '../lib/utils'
import type { ProductFormData } from '../hooks/useProductForm'

// Mock lucide icons as silent empty spans so they never pollute accessible names
vi.mock('lucide-react', () => {
  const silent = (name: string) => () => <span data-testid={`icon-${name}`} />
  return {
    AlertCircle: silent('alert'),
    Wand2: silent('wand'),
  }
})

// BrandCombobox is mocked — brand selection is not under test here
vi.mock('../components/admin/BrandCombobox', () => ({
  BrandCombobox: () => <div data-testid="brand-combobox" />,
}))

function makeForm(overrides: Partial<ProductFormData> = {}): ProductFormData {
  return {
    name: 'Hydraulic Pump HP-200',
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

function renderBasics(form: ProductFormData = makeForm(), updateField = vi.fn()) {
  render(
    <ProductFormBasics
      form={form}
      updateField={updateField}
      markTouched={vi.fn()}
      showError={() => false}
      getFieldClass={(field: string) => `test-input ${field}`}
      getSelectClass={() => 'test-select'}
      labelClass={labelClass}
      errorClass=""
      errors={{}}
      brandList={[]}
      categoryList={[]}
      industryList={[]}
      toggleIndustry={vi.fn()}
    />
  )
  return updateField
}

describe('ProductFormBasics — live auto-SKU preview', () => {
  it('shows the auto-SKU chip with the deterministic base while SKU is empty', () => {
    renderBasics(makeForm({ name: 'Hydraulic Pump HP-200', sku: '' }))
    const chip = screen.getByText(/Auto SKU:/)
    expect(chip.textContent).toContain(buildProductSkuBase('Hydraulic Pump HP-200'))
    // 7-char suffix placeholder — matches the real generated suffix format
    expect(chip.textContent).toContain('XXXXXXX')
  })

  it('renders the chip base from whatever name is currently in the form', () => {
    renderBasics(makeForm({ name: 'Marine GPS Navigator', sku: '' }))
    const chip = screen.getByText(/Auto SKU:/)
    expect(chip.textContent).toContain(buildProductSkuBase('Marine GPS Navigator'))
  })

  it('shows no chip before a name exists', () => {
    renderBasics(makeForm({ name: '', sku: '' }))
    expect(screen.queryByText(/Auto SKU:/)).not.toBeInTheDocument()
  })

  it('hides the chip once the admin provides their own SKU', () => {
    renderBasics(makeForm({ name: 'Hydraulic Pump HP-200', sku: 'HP-200-MS' }))
    expect(screen.queryByText(/Auto SKU:/)).not.toBeInTheDocument()
  })

  it('fills the editable SKU field when "Use & edit" is clicked', () => {
    const updateField = renderBasics(makeForm({ name: 'Hydraulic Pump HP-200', sku: '' }))
    fireEvent.click(screen.getByText('Use & edit'))

    expect(updateField).toHaveBeenCalledTimes(1)
    const [field, value] = updateField.mock.calls[0]
    expect(field).toBe('sku')
    // The generated SKU starts with the deterministic base and has a suffix
    expect(value).toMatch(
      new RegExp(`^${buildProductSkuBase('Hydraulic Pump HP-200')}-[A-Z0-9]{7}$`)
    )
  })

  it('focuses the SKU input after "Use & edit" so the value is editable immediately', () => {
    renderBasics(makeForm({ name: 'Hydraulic Pump HP-200', sku: '' }))
    fireEvent.click(screen.getByText('Use & edit'))
    expect(document.activeElement).toHaveAttribute('type', 'text')
    expect((document.activeElement as HTMLInputElement).value).toBe('')
  })
})
