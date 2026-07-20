/**
 * Typed API response interfaces for Alka Traders.
 *
 * These match the backend Prisma models and route responses exactly.
 * Replace `any` casts throughout the frontend with these types.
 */

// ─── Shared / Pagination ─────────────────────────────────────

export interface Pagination {
  total: number
  page: number
  limit: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

// ─── Product ─────────────────────────────────────────────────

export interface ApiProductImage {
  id: string
  url: string
  altText?: string
  label?: string
  isMain: boolean
  sortOrder: number
}

export interface ApiProductSpec {
  id?: string
  name: string
  value: string
  sortOrder?: number
  isPublic?: boolean
}

export interface ApiProduct {
  id: string
  slug: string
  name: string
  sku: string
  brandId?: string
  categoryId?: string
  status: string
  availability: string
  condition: string
  shortDescription?: string
  description?: string
  regularPrice: number
  salePrice?: number | null
  saleStartsAt?: string | null
  saleEndsAt?: string | null
  currency: string
  showPrice: boolean
  makeOfferEnabled: boolean
  stockCount: number
  lowStockThreshold: number
  warehouseLocation?: string
  publicItemLocation?: string
  leadTime?: string
  isNewArrival: boolean
  isFeatured: boolean
  customLabel?: string
  customLabelColor?: string
  sortPriority: number
  seoTitle?: string
  seoDescription?: string
  ogImageUrl?: string
  createdAt?: string
  updatedAt?: string
  // Relations
  brand?: { id: string; name: string; slug: string } | null
  category?: { id: string; name: string; slug: string } | null
  images: ApiProductImage[]
  specs: ApiProductSpec[]
  industries: { industry: { id: string; name: string; slug: string } }[]
  // Computed
  price?: number
  onSale?: boolean
  inStock?: boolean
}

// ─── Brand ───────────────────────────────────────────────────

export interface ApiBrand {
  id: string
  name: string
  slug: string
  logoUrl?: string | null
  sectors?: string[]
  description?: string | null
  website?: string | null
  country?: string | null
  seoTitle?: string | null
  seoDescription?: string | null
  isVisible?: boolean
  sortOrder?: number
  createdAt?: string
  _count?: { products: number }
  productCount?: number
}

// ─── Category ────────────────────────────────────────────────

export interface ApiCategory {
  id: string
  name: string
  slug: string
  description?: string | null
  parentId?: string | null
  icon?: string | null
  seoTitle?: string | null
  seoDescription?: string | null
  sortOrder?: number
  isVisible?: boolean
  createdAt?: string
  _count?: { products: number }
  productCount?: number
}

// ─── Industry ────────────────────────────────────────────────

export interface ApiIndustry {
  id: string
  name: string
  slug: string
  icon?: string | null
  description?: string | null
  painPoints?: string[]
  seoTitle?: string | null
  seoDescription?: string | null
  sortOrder?: number
  isVisible?: boolean
  createdAt?: string
  _count?: { products: number }
  productCount?: number
}

// ─── Order ───────────────────────────────────────────────────

export interface ApiOrderItem {
  id: string
  productId?: string
  productName: string
  productSku?: string
  quantity: number
  unitPrice: number
  totalPrice: number
  price?: number
  sku?: string
  product?: { name: string; sku: string } | null
}

export interface ApiOrderTimeline {
  id: string
  status: string
  note?: string
  createdBy?: string
  createdAt: string
}

export interface ApiOrder {
  id: string
  orderNumber: string
  customerId?: string
  status: string
  paymentMethod?: string
  paymentStatus: string
  subtotal: number
  shippingCost: number
  shipping: { fullName: string; city: string; country: string }
  tax: number
  total: number
  grandTotal: number
  currency: string
  shippingFullName?: string
  shippingAddressLine1?: string
  shippingAddressLine2?: string
  shippingCity?: string
  shippingState?: string
  shippingPostalCode?: string
  shippingCountry?: string
  trackingNumber?: string
  courier?: string
  customerNotes?: string
  cancelRequested?: boolean
  cancelReason?: string
  paymentIntentId?: string
  createdAt: string
  updatedAt?: string
  items: ApiOrderItem[]
  orderItems?: ApiOrderItem[]
  timeline?: ApiOrderTimeline[]
  customer?: { id: string; name: string; email: string } | null
}

// ─── RFQ ─────────────────────────────────────────────────────

export interface ApiRfq {
  id: string
  rfqNumber: string
  fullName: string
  company?: string
  email: string
  phone?: string
  country?: string
  role?: string
  productDescription: string
  partNumber?: string
  brand?: string
  quantity?: number
  deliveryLocation?: string
  urgency: string
  notes?: string
  source?: string
  consent?: boolean
  status: string
  assignedTo?: string
  responseDeadline?: string
  createdAt: string
  updatedAt?: string
}

export interface ApiRfqNote {
  id: string
  rfqId: string
  note: string
  isInternal: boolean
  createdBy?: string
  createdAt: string
}

// ─── Offer ───────────────────────────────────────────────────

export interface ApiOfferItem {
  id: string
  productId?: string
  productName?: string
  quantity?: number
  unitPrice?: number
  price?: number
}

export interface ApiOffer {
  id: string
  offerNumber?: string
  productId?: string
  customerEmail: string
  offeredPrice: number
  counterPrice?: number
  message?: string
  status: string
  createdAt: string
  updatedAt?: string
  product?: { name: string; sku: string; regularPrice: number } | null
  items?: ApiOfferItem[]
}

// ─── Customer ────────────────────────────────────────────────

export interface ApiCustomer {
  id: string
  name: string
  email: string
  phone?: string
  company?: string
  country?: string
  city?: string
  address?: string
  website?: string
  status?: string
  lastLoginAt?: string
  createdAt: string
  _count?: {
    orders?: number
    rfqs?: number
  }
}

// ─── Message ─────────────────────────────────────────────────

export interface ApiMessage {
  id: string
  name: string
  email: string
  subject?: string
  message: string
  status?: string
  internalNotes?: string
  createdAt: string
  updatedAt?: string
}

// ─── Media Asset ─────────────────────────────────────────────

export interface ApiMediaAsset {
  id: string
  filename: string
  originalName?: string
  url: string
  mimeType?: string
  size?: number
  width?: number
  height?: number
  altText?: string
  label?: string
  createdAt: string
}

// ─── Admin User ──────────────────────────────────────────────

export interface ApiAdminUser {
  id: string
  name: string
  email: string
  role: string
  avatarUrl?: string
  isActive: boolean
  lastLoginAt?: string
  createdAt: string
}

// ─── Audit Log ───────────────────────────────────────────────

export interface ApiAuditLog {
  id: string
  action: string
  entityType?: string
  entityId?: string
  entityName?: string
  actorId?: string
  actorName?: string
  actorEmail?: string
  ipAddress?: string
  userAgent?: string
  newValue?: Record<string, unknown>
  oldValue?: Record<string, unknown>
  metadata?: Record<string, unknown>
  createdAt: string
}

// ─── Dashboard ───────────────────────────────────────────────

export interface ApiDashboardStats {
  totalProducts: number
  publishedProducts: number
  draftProducts: number
  hiddenProducts: number
  outOfStockProducts: number
  emergencyProducts: number
  totalOrders: number
  pendingOrders: number
  totalRevenue: number
  totalCustomers: number
  totalRfqs: number
  newRfqs: number
  urgentRfqs: number
  emergencyRfqs: number
  totalOffers: number
  newOffers: number
  lowStockProducts?: { id: string; name: string; sku: string; stockCount: number }[]
  missingImageProducts?: { id: string; name: string; sku: string }[]
  categoryBreakdown?: { name: string; count: number }[]
  brandBreakdown?: { name: string; count: number }[]
  conditionBreakdown?: { name: string; count: number }[]
}

// ─── Settings ────────────────────────────────────────────────

export interface ApiStoreSettings {
  [key: string]: string | number | boolean
}

// ─── Homepage Section ────────────────────────────────────────

export interface ApiHomepageSection {
  id: string
  type: string
  title?: string
  content?: Record<string, unknown>
  sortOrder?: number
  isVisible?: boolean
}

// ─── Testimonial ─────────────────────────────────────────────

export interface ApiTestimonial {
  id: string
  name: string
  role?: string
  company?: string
  avatarUrl?: string
  text: string
  rating?: number
  sortOrder?: number
  isVisible?: boolean
}

// ─── Office ──────────────────────────────────────────────────

export interface ApiOffice {
  id?: string
  city: string
  country: string
  address?: string
  timezone?: string
  phone?: string
  email?: string
  coordinatesLat?: number
  coordinatesLng?: number
  sortOrder?: number
  isVisible?: boolean
}

// ─── User ────────────────────────────────────────────────────

export interface ApiUser {
  id: string
  name: string
  email: string
  role: string
  avatarUrl?: string
  isActive?: boolean
  lastLoginAt?: string
  createdAt: string
}

// ─── Search ─────────────────────────────────────────────────

export interface ApiSearchResult {
  type: 'product' | 'brand' | 'category' | 'page'
  id: string
  name?: string
  title?: string
  slug?: string
  sku?: string
  brand?: string
  description?: string
  productCount?: number
}

// ─── Wrapper types for list responses ────────────────────────

export interface ListResponse<T> {
  items: T[]
  pagination: Pagination
}

export interface ProductListResponse {
  products: ApiProduct[]
  pagination: Pagination
  filters?: {
    categories: { id: string; name: string; count: number }[]
    brands: { id: string; name: string; count: number }[]
    priceRange: { min: number; max: number }
  }
}
