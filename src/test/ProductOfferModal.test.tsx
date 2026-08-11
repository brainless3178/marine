import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ProductOfferModal } from '../components/admin/ProductOfferModal'
import { OFFER_ERRORS } from '../components/admin/offerValidation'
import type { ApiProduct } from '../lib/api-types'

// Mock lucide icons as silent empty spans so they never contribute text to
// accessible names (e.g. the Apply Offer button, the Put on Sale label).
vi.mock('lucide-react', () => {
  const silent = (name: string) => ({ size }: { size?: number }) => (
    <span data-testid={`icon-${name}`} data-size={size} />
  )
  return {
    X: silent('x'),
    BadgePercent: silent('badge'),
    Tag: silent('tag'),
    Star: silent('star'),
    Sparkles: silent('sparkles'),
    Loader2: silent('loader'),
    CheckCircle: silent('check'),
    Info: silent('info'),
  }
})

const baseProduct: ApiProduct = {
  id: 'prod-1',
  name: 'Hydraulic Pump HP-200',
  sku: 'HP-200',
  slug: 'hydraulic-pump-hp-200',
  regularPrice: 1200,
  currency: 'USD',
  salePrice: null,
  saleStartsAt: null,
  saleEndsAt: null,
  makeOfferEnabled: false,
  minimumOfferPrice: null,
  isFeatured: false,
  isNewArrival: false,
  customLabel: null,
  customLabelColor: null,
} as unknown as ApiProduct

function renderModal(product: ApiProduct = baseProduct, onSave = vi.fn(), onClose = vi.fn()) {
  render(
    <ProductOfferModal
      open
      product={product}
      saving={false}
      onClose={onClose}
      onSave={onSave}
    />
  )
  return { onSave, onClose }
}

describe('ProductOfferModal — validation errors on Apply Offer', () => {
  it('does not render anything when closed', () => {
    render(
      <ProductOfferModal open={false} product={baseProduct} saving={false} onClose={vi.fn()} onSave={vi.fn()} />
    )
    expect(screen.queryByText('Run Offer')).not.toBeInTheDocument()
  })

  it('shows "enter a valid sale price" when sale is on but price is empty', () => {
    const { onSave } = renderModal()
    fireEvent.click(screen.getByLabelText(/Put on Sale/))
    fireEvent.click(screen.getByRole('button', { name: 'Apply Offer' }))
    expect(screen.getByText(OFFER_ERRORS.salePriceInvalid)).toBeInTheDocument()
    expect(onSave).not.toHaveBeenCalled()
  })

  it('shows "enter a valid sale price" for a non-numeric value', () => {
    renderModal()
    fireEvent.click(screen.getByLabelText(/Put on Sale/))
    fireEvent.change(screen.getByLabelText('Sale price'), { target: { value: 'abc' } })
    fireEvent.click(screen.getByRole('button', { name: 'Apply Offer' }))
    expect(screen.getByText(OFFER_ERRORS.salePriceInvalid)).toBeInTheDocument()
  })

  it('shows "sale price must be lower" when sale price equals/exceeds regular price', () => {
    renderModal()
    fireEvent.click(screen.getByLabelText(/Put on Sale/))
    fireEvent.change(screen.getByLabelText('Sale price'), { target: { value: '1500' } })
    fireEvent.click(screen.getByRole('button', { name: 'Apply Offer' }))
    expect(screen.getByText(OFFER_ERRORS.salePriceNotLower)).toBeInTheDocument()
  })

  it('shows the date-order error when the sale ends before it starts', () => {
    renderModal()
    fireEvent.click(screen.getByLabelText(/Put on Sale/))
    fireEvent.change(screen.getByLabelText('Sale price'), { target: { value: '950' } })
    fireEvent.change(screen.getByLabelText('Sale starts'), { target: { value: '2026-08-10T18:00' } })
    fireEvent.change(screen.getByLabelText('Sale ends'), { target: { value: '2026-08-01T09:00' } })
    fireEvent.click(screen.getByRole('button', { name: 'Apply Offer' }))
    expect(screen.getByText(OFFER_ERRORS.saleEndsBeforeStart)).toBeInTheDocument()
  })

  it('shows the min-offer error when offers are enabled and minimum is invalid', () => {
    renderModal()
    fireEvent.click(screen.getByLabelText(/Accept Customer Offers/))
    fireEvent.change(screen.getByLabelText('Minimum offer price'), { target: { value: '0' } })
    fireEvent.click(screen.getByRole('button', { name: 'Apply Offer' }))
    expect(screen.getByText(OFFER_ERRORS.minOfferPriceInvalid)).toBeInTheDocument()
  })

  it('clears the previous error and saves after the input is fixed', () => {
    const { onSave } = renderModal()
    fireEvent.click(screen.getByLabelText(/Put on Sale/))
    fireEvent.click(screen.getByRole('button', { name: 'Apply Offer' }))
    expect(screen.getByText(OFFER_ERRORS.salePriceInvalid)).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Sale price'), { target: { value: '950' } })
    fireEvent.click(screen.getByRole('button', { name: 'Apply Offer' }))
    expect(screen.queryByText(OFFER_ERRORS.salePriceInvalid)).not.toBeInTheDocument()
    expect(onSave).toHaveBeenCalledTimes(1)
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ salePrice: 950 }))
  })

  it('calls onClose when Cancel is clicked', () => {
    const { onClose, onSave } = renderModal()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onSave).not.toHaveBeenCalled()
  })
})

describe('ProductOfferModal — successful save', () => {
  it('calls onSave with the normalized payload for a valid offer', () => {
    const { onSave } = renderModal()
    fireEvent.click(screen.getByLabelText(/Put on Sale/))
    fireEvent.change(screen.getByLabelText('Sale price'), { target: { value: '950' } })
    fireEvent.change(screen.getByLabelText('Sale starts'), { target: { value: '2026-08-01T09:00' } })
    fireEvent.change(screen.getByLabelText('Sale ends'), { target: { value: '2026-08-10T18:00' } })
    fireEvent.click(screen.getByLabelText(/Accept Customer Offers/))
    fireEvent.change(screen.getByLabelText('Minimum offer price'), { target: { value: '300' } })
    fireEvent.click(screen.getByRole('button', { name: 'Apply Offer' }))

    expect(onSave).toHaveBeenCalledTimes(1)
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      salePrice: 950,
      saleStartsAt: expect.any(String), // ISO string
      saleEndsAt: expect.any(String),
      makeOfferEnabled: true,
      minimumOfferPrice: 300,
      isFeatured: false,
      isNewArrival: false,
      customLabel: null,
      customLabelColor: null,
    }))
    expect(screen.queryByText(/Enter a valid|must be lower|must be after/)).not.toBeInTheDocument()
  })

  it('sends null sale fields when the sale stays off', () => {
    const { onSave } = renderModal()
    fireEvent.click(screen.getByRole('button', { name: 'Apply Offer' }))
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      salePrice: null,
      saleStartsAt: null,
      saleEndsAt: null,
      makeOfferEnabled: false,
      minimumOfferPrice: null,
    }))
  })

  it('prefills the form from an on-sale product', () => {
    const onSaleProduct = {
      ...baseProduct,
      salePrice: 950,
      saleStartsAt: '2026-08-01T09:00:00.000Z',
      saleEndsAt: '2026-08-10T18:00:00.000Z',
      makeOfferEnabled: true,
      minimumOfferPrice: 300,
    } as unknown as ApiProduct
    renderModal(onSaleProduct)

    expect((screen.getByLabelText(/Put on Sale/) as HTMLInputElement).checked).toBe(true)
    expect(screen.getByLabelText('Sale price').getAttribute('value')).toBe('950')
    expect(screen.getByLabelText('Minimum offer price').getAttribute('value')).toBe('300')
  })
})
