import { fromLocalInputValue, isSaleWindowValid } from '../../lib/utils'

/**
 * Single source of truth for the offer error messages.
 * The modal renders these verbatim (via result.error), so tests assert the
 * rendered inline error equals these constants to guarantee they stay in sync.
 */
export const OFFER_ERRORS = {
  salePriceInvalid: 'Enter a valid sale price greater than 0.',
  salePriceNotLower: 'Sale price must be lower than the regular price.',
  saleEndsBeforeStart: 'Sale end date must be after the start date.',
  minOfferPriceInvalid: 'Enter a valid minimum offer price greater than 0.',
} as const

export interface OfferValidationInput {
  saleOn: boolean
  salePrice: string
  regularPrice: number
  saleStartsAt: string
  saleEndsAt: string
  makeOfferEnabled: boolean
  minimumOfferPrice: string
}

export interface OfferValidationResult {
  error: string | null
  salePrice: number | null
  saleStartsAt: string | null
  saleEndsAt: string | null
  minimumOfferPrice: number | null
}

/**
 * Pure validation + normalization for the "Run Offer" modal.
 * Returns an error message (first failure wins) or the normalized
 * payload ready to be saved to the product.
 */
export function validateOfferInput(input: OfferValidationInput): OfferValidationResult {
  const { saleOn, salePrice, regularPrice, saleStartsAt, saleEndsAt, makeOfferEnabled, minimumOfferPrice } = input

  const saleValNum = saleOn && salePrice !== '' ? Number(salePrice) : null
  if (saleOn && (salePrice === '' || Number.isNaN(saleValNum) || (saleValNum ?? 0) <= 0)) {
    return { error: OFFER_ERRORS.salePriceInvalid, salePrice: null, saleStartsAt: null, saleEndsAt: null, minimumOfferPrice: null }
  }
  if (saleOn && regularPrice > 0 && (saleValNum ?? 0) >= regularPrice) {
    return { error: OFFER_ERRORS.salePriceNotLower, salePrice: null, saleStartsAt: null, saleEndsAt: null, minimumOfferPrice: null }
  }
  if (saleOn && !isSaleWindowValid(saleStartsAt, saleEndsAt)) {
    return { error: OFFER_ERRORS.saleEndsBeforeStart, salePrice: null, saleStartsAt: null, saleEndsAt: null, minimumOfferPrice: null }
  }

  const minVal = makeOfferEnabled && minimumOfferPrice !== '' ? Number(minimumOfferPrice) : null
  if (makeOfferEnabled && minimumOfferPrice !== '' && (Number.isNaN(minVal) || (minVal ?? 0) <= 0)) {
    return { error: OFFER_ERRORS.minOfferPriceInvalid, salePrice: null, saleStartsAt: null, saleEndsAt: null, minimumOfferPrice: null }
  }

  return {
    error: null,
    salePrice: saleOn ? saleValNum : null,
    saleStartsAt: saleOn ? fromLocalInputValue(saleStartsAt) : null,
    saleEndsAt: saleOn ? fromLocalInputValue(saleEndsAt) : null,
    minimumOfferPrice: makeOfferEnabled && minVal ? minVal : null,
  }
}
