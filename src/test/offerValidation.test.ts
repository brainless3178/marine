import { describe, it, expect } from 'vitest'
import { validateOfferInput, OFFER_ERRORS } from '../components/admin/offerValidation'
import type { OfferValidationInput } from '../components/admin/offerValidation'

function makeInput(overrides: Partial<OfferValidationInput> = {}): OfferValidationInput {
  return {
    saleOn: true,
    salePrice: '950',
    regularPrice: 1200,
    saleStartsAt: '',
    saleEndsAt: '',
    makeOfferEnabled: false,
    minimumOfferPrice: '',
    ...overrides,
  }
}

describe('validateOfferInput — sale price', () => {
  it('accepts a valid sale price below the regular price', () => {
    const result = validateOfferInput(makeInput())
    expect(result.error).toBeNull()
    expect(result.salePrice).toBe(950)
  })

  it('rejects an empty sale price when the sale is on', () => {
    const result = validateOfferInput(makeInput({ salePrice: '' }))
    expect(result.error).toBe(OFFER_ERRORS.salePriceInvalid)
    // Error path returns a fully null payload
    expect(result.salePrice).toBeNull()
    expect(result.saleStartsAt).toBeNull()
    expect(result.saleEndsAt).toBeNull()
    expect(result.minimumOfferPrice).toBeNull()
  })

  it('rejects a sale price of zero', () => {
    const result = validateOfferInput(makeInput({ salePrice: '0' }))
    expect(result.error).toBe(OFFER_ERRORS.salePriceInvalid)
  })

  it('rejects a negative sale price', () => {
    const result = validateOfferInput(makeInput({ salePrice: '-5' }))
    expect(result.error).toBe(OFFER_ERRORS.salePriceInvalid)
  })

  it('rejects a non-numeric sale price', () => {
    const result = validateOfferInput(makeInput({ salePrice: 'abc' }))
    expect(result.error).toBe(OFFER_ERRORS.salePriceInvalid)
  })

  it('rejects a sale price equal to the regular price', () => {
    const result = validateOfferInput(makeInput({ salePrice: '1200' }))
    expect(result.error).toBe(OFFER_ERRORS.salePriceNotLower)
  })

  it('rejects a sale price above the regular price', () => {
    const result = validateOfferInput(makeInput({ salePrice: '1500' }))
    expect(result.error).toBe(OFFER_ERRORS.salePriceNotLower)
  })

  it('does not enforce the lower-than-regular rule when regular price is 0 (contact-for-price)', () => {
    const result = validateOfferInput(makeInput({ regularPrice: 0, salePrice: '500' }))
    expect(result.error).toBeNull()
    expect(result.salePrice).toBe(500)
  })

  it('clears sale fields entirely when the sale is turned off', () => {
    const result = validateOfferInput(makeInput({
      saleOn: false,
      salePrice: '950',
      saleStartsAt: '2026-08-01T09:00',
      saleEndsAt: '2026-08-10T18:00',
    }))
    expect(result.error).toBeNull()
    expect(result.salePrice).toBeNull()
    expect(result.saleStartsAt).toBeNull()
    expect(result.saleEndsAt).toBeNull()
  })
})

describe('validateOfferInput — sale window dates', () => {
  it('accepts empty dates (unlimited sale)', () => {
    const result = validateOfferInput(makeInput())
    expect(result.error).toBeNull()
    expect(result.saleStartsAt).toBeNull()
    expect(result.saleEndsAt).toBeNull()
  })

  it('rejects an end date before the start date', () => {
    const result = validateOfferInput(makeInput({
      saleStartsAt: '2026-08-10T18:00',
      saleEndsAt: '2026-08-01T09:00',
    }))
    expect(result.error).toBe(OFFER_ERRORS.saleEndsBeforeStart)
  })

  it('accepts an end date equal to the start date', () => {
    const result = validateOfferInput(makeInput({
      saleStartsAt: '2026-08-10T18:00',
      saleEndsAt: '2026-08-10T18:00',
    }))
    expect(result.error).toBeNull()
  })

  it('accepts a start date with no end date (open-ended sale)', () => {
    const result = validateOfferInput(makeInput({
      saleStartsAt: '2026-08-01T09:00',
      saleEndsAt: '',
    }))
    expect(result.error).toBeNull()
    expect(result.saleStartsAt).not.toBeNull()
    expect(result.saleEndsAt).toBeNull()
  })

  it('accepts an end date with no start date (already-running sale)', () => {
    const result = validateOfferInput(makeInput({
      saleStartsAt: '',
      saleEndsAt: '2026-08-10T18:00',
    }))
    expect(result.error).toBeNull()
    expect(result.saleStartsAt).toBeNull()
    expect(result.saleEndsAt).not.toBeNull()
  })

  it('converts local datetime values to ISO strings', () => {
    const result = validateOfferInput(makeInput({
      saleStartsAt: '2026-08-01T09:00',
      saleEndsAt: '2026-08-10T18:00',
    }))
    expect(result.error).toBeNull()
    expect(result.saleStartsAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    expect(result.saleEndsAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    // Round-trips back to the same local wall-clock values
    expect(new Date(result.saleStartsAt as string).getFullYear()).toBe(2026)
    expect(new Date(result.saleEndsAt as string).getFullYear()).toBe(2026)
  })

  it('treats non-empty unparseable date strings as an invalid window (string comparison)', () => {
    // datetime-local inputs only ever produce YYYY-MM-DDTHH:mm or empty, but the
    // guard should fail closed (error) rather than silently accepting garbage.
    const result = validateOfferInput(makeInput({
      saleStartsAt: 'not-a-date',
      saleEndsAt: 'also-not-a-date',
    }))
    expect(result.error).toBe(OFFER_ERRORS.saleEndsBeforeStart)
  })
})

describe('validateOfferInput — minimum offer price', () => {
  it('accepts a valid minimum offer price', () => {
    const result = validateOfferInput(makeInput({ makeOfferEnabled: true, minimumOfferPrice: '300' }))
    expect(result.error).toBeNull()
    expect(result.minimumOfferPrice).toBe(300)
  })

  it('accepts an empty minimum offer price (no minimum)', () => {
    const result = validateOfferInput(makeInput({ makeOfferEnabled: true, minimumOfferPrice: '' }))
    expect(result.error).toBeNull()
    expect(result.minimumOfferPrice).toBeNull()
  })

  it('rejects a zero minimum offer price', () => {
    const result = validateOfferInput(makeInput({ makeOfferEnabled: true, minimumOfferPrice: '0' }))
    expect(result.error).toBe(OFFER_ERRORS.minOfferPriceInvalid)
  })

  it('rejects a negative minimum offer price', () => {
    const result = validateOfferInput(makeInput({ makeOfferEnabled: true, minimumOfferPrice: '-10' }))
    expect(result.error).toBe(OFFER_ERRORS.minOfferPriceInvalid)
  })

  it('rejects a non-numeric minimum offer price', () => {
    const result = validateOfferInput(makeInput({ makeOfferEnabled: true, minimumOfferPrice: 'abc' }))
    expect(result.error).toBe(OFFER_ERRORS.minOfferPriceInvalid)
  })

  it('ignores the minimum offer price when make-offer is disabled', () => {
    const result = validateOfferInput(makeInput({ makeOfferEnabled: false, minimumOfferPrice: '0' }))
    expect(result.error).toBeNull()
    expect(result.minimumOfferPrice).toBeNull()
  })
})

describe('validateOfferInput — combined payload', () => {
  it('returns a fully normalized payload for a valid offer', () => {
    const result = validateOfferInput(makeInput({
      salePrice: '850.50',
      saleStartsAt: '2026-08-01T09:00',
      saleEndsAt: '2026-08-31T23:59',
      makeOfferEnabled: true,
      minimumOfferPrice: '500',
    }))
    expect(result.error).toBeNull()
    expect(result.salePrice).toBe(850.5)
    expect(result.saleStartsAt).not.toBeNull()
    expect(result.saleEndsAt).not.toBeNull()
    expect(result.minimumOfferPrice).toBe(500)
  })

  it('reports the first validation failure (sale price checked before dates)', () => {
    const result = validateOfferInput(makeInput({
      salePrice: '1500', // too high
      saleStartsAt: '2026-08-10T18:00',
      saleEndsAt: '2026-08-01T09:00', // also invalid, but later in order
    }))
    expect(result.error).toBe(OFFER_ERRORS.salePriceNotLower)
  })
})
