import { describe, it, expect } from 'vitest'

/**
 * Format price for display
 * Simple helper — can be moved to a utils file if reused
 */
function formatPrice(price: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price)
}

describe('formatPrice', () => {
  it('formats a whole number price', () => {
    expect(formatPrice(100)).toBe('$100.00')
  })

  it('formats a decimal price', () => {
    expect(formatPrice(99.95)).toBe('$99.95')
  })

  it('formats zero', () => {
    expect(formatPrice(0)).toBe('$0.00')
  })

  it('handles negative prices', () => {
    expect(formatPrice(-10)).toBe('-$10.00')
  })

  it('supports EUR currency', () => {
    expect(formatPrice(50, 'EUR')).toBe('€50.00')
  })
})
