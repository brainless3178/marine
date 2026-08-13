import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'checkout.orderPlaced': 'Order Placed Successfully!',
        'checkout.orderConfirmation': 'Thank you for your order! Estimated delivery:',
        'checkout.estimatedDelivery': '5-7 Business Days',
        'checkout.orderSummary': 'Order Summary',
        'checkout.subtotal': 'Subtotal',
        'checkout.shipping': 'Shipping',
        'checkout.tax': 'Tax',
        'checkout.grandTotal': 'Grand Total',
        'checkout.skippedHeading': 'Some items were removed from your order',
        'checkout.skippedDesc': 'The following products are no longer available',
        'checkout.cancelHeading': 'Need to Cancel Order?',
        'checkout.cancelPlaceholder': 'Tell us why...',
        'checkout.cancelSubmitBtn': 'Request Order Cancellation',
        'checkout.continueShopping': 'Continue Shopping',
        'checkout.trackOrder': 'Track Order',
      }
      return translations[key] || key
    },
  }),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => vi.fn() }
})

// Mock store settings
vi.mock('../hooks/useStoreSettings', () => ({
  useStoreSettings: () => ({ shippingCost: 25, taxRate: 0.05, freeShippingThreshold: 500 }),
}))

// Mock store — CheckoutSuccess reads order state directly from useStore()
vi.mock('../store/useStore', () => ({
  useStore: vi.fn(),
}))

import { useStore } from '../store/useStore'
import { CheckoutSuccess } from '../pages/checkout/CheckoutSuccess'

function renderSuccess(overrides: Record<string, unknown> = {}) {
  const base = {
    orderId: 'AT-ORD-12345',
    orderSummary: null,
    orderSkippedItems: [],
    setCancelRequested: vi.fn(),
  }
  vi.mocked(useStore).mockReturnValue({ ...base, ...overrides } as any)
  return render(
    <MemoryRouter>
      <CheckoutSuccess
        subtotal={100}
        cancelSubmitted={false}
        cancelReason=""
        setCancelReason={vi.fn()}
        setCancelSubmitted={vi.fn()}
        handleContinueShopping={vi.fn()}
      />
    </MemoryRouter>
  )
}

describe('CheckoutSuccess — skipped items surface', () => {
  it('shows the dropped products when the server skipped cart lines', () => {
    renderSuccess({
      orderSkippedItems: [
        { productId: 'p-missing-1', productName: 'Hydraulic Pump', quantity: 2 },
        { productId: 'p-missing-2', productName: 'Oil Filter', quantity: 1 },
      ],
    })

    expect(screen.getByText('Some items were removed from your order')).toBeInTheDocument()
    expect(screen.getByText('Hydraulic Pump')).toBeInTheDocument()
    expect(screen.getByText('×2')).toBeInTheDocument()
    expect(screen.getByText('Oil Filter')).toBeInTheDocument()
    expect(screen.getByText('×1')).toBeInTheDocument()
  })

  it('hides the banner when nothing was skipped', () => {
    renderSuccess()

    expect(screen.queryByText('Some items were removed from your order')).not.toBeInTheDocument()
  })

  it('shows server-authoritative totals when the order summary is present', () => {
    renderSuccess({
      orderSummary: { subtotal: 200, shippingCost: 0, tax: 16, total: 216, currency: 'USD' },
    })

    // Subtotal from the server (200), not the client estimate (100)
    expect(screen.getByText('$200.00')).toBeInTheDocument()
    expect(screen.getByText('$0.00')).toBeInTheDocument() // shipping
    expect(screen.getByText('$16.00')).toBeInTheDocument() // tax
    expect(screen.getByText('$216.00')).toBeInTheDocument() // grand total
  })

  it('falls back to the client estimate when no order summary exists', () => {
    renderSuccess()

    // subtotal 100 + shipping 25 + tax 5 = 130
    expect(screen.getByText('$100.00')).toBeInTheDocument()
    expect(screen.getByText('$25.00')).toBeInTheDocument()
    expect(screen.getByText('$5.00')).toBeInTheDocument()
    expect(screen.getByText('$130.00')).toBeInTheDocument()
  })
})
