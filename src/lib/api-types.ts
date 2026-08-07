/**
 * Typed API response interfaces for Alka Traders.
 *
 * These re-export types from `@shared/types` with the `Api` prefix
 * for backward compatibility. The canonical source of truth is now
 * `shared/types.ts`.
 *
 * New code should import directly from `@shared/types` or
 * `@shared/api-responses` instead.
 */

import type {
  Product,
  Brand,
  Category,
  Industry,
  Order,
  OrderItem,
  OrderTimeline,
  Rfq,
  RfqNote,
  Offer,
  OfferItem,
  Customer,
  Message,
  MediaAsset,
  AdminUser,
  AuditLog,
  DashboardStats,
  StoreSettings,
  HomepageSection,
  Testimonial,
  Office,
  UserProfile,
  SearchResult,
  ProductImage,
  ProductSpec,
} from '@shared/types'

import type {
  Pagination as ApiPagination,
  ListResponse as SharedListResponse,
  ProductListResponse as SharedProductListResponse,
} from '@shared/api-responses'

// ─── Shared / Pagination ─────────────────────────────────────

export type Pagination = ApiPagination

// ─── Product ─────────────────────────────────────────────────

export type ApiProductImage = ProductImage
export type ApiProductSpec = ProductSpec
export type ApiProduct = Product

// ─── Brand ───────────────────────────────────────────────────

export type ApiBrand = Brand

// ─── Category ────────────────────────────────────────────────

export type ApiCategory = Category

// ─── Industry ────────────────────────────────────────────────

export type ApiIndustry = Industry

// ─── Order ───────────────────────────────────────────────────

export type ApiOrderItem = OrderItem
export type ApiOrderTimeline = OrderTimeline
export type ApiOrder = Order

// ─── RFQ ─────────────────────────────────────────────────────

export type ApiRfq = Rfq
export type ApiRfqNote = RfqNote

// ─── Offer ───────────────────────────────────────────────────

export type ApiOfferItem = OfferItem
export type ApiOffer = Offer

// ─── Customer ────────────────────────────────────────────────

export type ApiCustomer = Customer

// ─── Message ─────────────────────────────────────────────────

export type ApiMessage = Message

// ─── Media Asset ─────────────────────────────────────────────

export type ApiMediaAsset = MediaAsset

// ─── Admin User ──────────────────────────────────────────────

export type ApiAdminUser = AdminUser

// ─── Audit Log ───────────────────────────────────────────────

export type ApiAuditLog = AuditLog

// ─── Dashboard ───────────────────────────────────────────────

export type ApiDashboardStats = DashboardStats

// ─── Settings ────────────────────────────────────────────────

export type ApiStoreSettings = StoreSettings

// ─── Homepage Section ────────────────────────────────────────

export type ApiHomepageSection = HomepageSection

// ─── Testimonial ─────────────────────────────────────────────

export type ApiTestimonial = Testimonial

// ─── Office ──────────────────────────────────────────────────

export type ApiOffice = Office

// ─── User ────────────────────────────────────────────────────

export type ApiUser = UserProfile

// ─── Search ─────────────────────────────────────────────────

export type ApiSearchResult = SearchResult

// ─── Wrapper types for list responses ────────────────────────

export type ListResponse<T> = SharedListResponse<T>
export type ProductListResponse = SharedProductListResponse & {
  products: Product[]
}

/** Filter-option payload returned alongside the storefront product list
 * (full-catalog counts for the sidebar). */
export type ProductListFilters = NonNullable<SharedProductListResponse['filters']>
