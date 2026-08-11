/**
 * Standard API response envelope types.
 *
 * These define the shape of every API response. Use these to replace
 * ad-hoc response typing throughout the codebase.
 */

// ─── Pagination ───────────────────────────────────────────────

export interface Pagination {
  total: number
  page: number
  limit: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface ProductListResponse {
  products: unknown[]
  pagination: Pagination
  filters?: {
    categories: { id: string; name: string; count: number }[]
    brands: { id: string; name: string; count: number }[]
    priceRange: { min: number; max: number }
  }
}
