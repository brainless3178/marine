/**
 * Centralized API client for Alka Traders.
 *
 * Every frontend call goes through this module. It handles:
 * - Base URL resolution (dev proxy vs production)
 * - Auth token injection (admin JWT + customer JWT)
 * - Token refresh via httpOnly cookie flow
 * - Consistent error handling
 * - JSON content-type defaults
 */

import type {
  ApiProduct, ApiBrand, ApiCategory, ApiIndustry, ApiOrder,
  ApiRfq, ApiOffer, ApiCustomer, ApiMessage, ApiMediaAsset, ApiAdminUser,
  ApiAuditLog, ApiStoreSettings, ApiHomepageSection,
  ApiTestimonial, Pagination, ProductListResponse, ApiSearchResult,
} from './api-types'

const API_BASE = '/api'

// ─── Token Storage (in-memory, NOT localStorage for security) ───

let adminAccessToken: string | null = null
let customerAccessToken: string | null = null

// ─── CSRF Token Cache ───────────────────────────────────────────
const CSRF_TOKEN_TTL_MS = 50 * 60 * 1000 // Refresh at 50 min (token expires at 60 min)
let csrfToken: string | null = null
let csrfTokenFetchedAt = 0
let csrfTokenPromise: Promise<string | null> | null = null

// Track ongoing refresh to deduplicate concurrent 401 retries
let refreshInProgress: Promise<boolean> | null = null

async function getCsrfToken(): Promise<string | null> {
  // Return cached token if still fresh (refresh at 50 min, expires at 60 min)
  if (csrfToken && Date.now() - csrfTokenFetchedAt < CSRF_TOKEN_TTL_MS) return csrfToken

  // Deduplicate concurrent fetches
  if (csrfTokenPromise) return csrfTokenPromise

  csrfTokenPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE}/csrf-token`, {
        credentials: 'include',
      })
      if (!res.ok) return null
      const data = await res.json()
      csrfToken = data.csrfToken || null
      csrfTokenFetchedAt = Date.now()
      return csrfToken
    } catch {
      // If fetch fails, reset promise so next caller retries
      // Silently fail — CSRF token is optional; the server will reject if needed
      csrfTokenPromise = null
      return null
    } finally {
      csrfTokenPromise = null
    }
  })()

  return csrfTokenPromise
}

export function clearCsrfToken() {
  csrfToken = null
  csrfTokenFetchedAt = 0
}

export function setAdminToken(token: string | null) {
  adminAccessToken = token
}

export function setCustomerToken(token: string | null) {
  customerAccessToken = token
}



// ─── Core Fetch Wrapper ─────────────────────────────────────────

interface ApiOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  auth?: 'admin' | 'customer'
}

export class ApiError extends Error {
  status: number
  details?: { field: string; message: string }[]

  constructor(status: number, message: string, details?: { field: string; message: string }[]) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

async function apiFetch<T = unknown>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  const { auth, body, headers: customHeaders, ...rest } = options

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((customHeaders as Record<string, string>) || {}),
  }

  // Inject auth token
  if (auth === 'admin' && adminAccessToken) {
    headers['Authorization'] = `Bearer ${adminAccessToken}`
  } else if (auth === 'customer' && customerAccessToken) {
    headers['Authorization'] = `Bearer ${customerAccessToken}`
  }

  // Inject CSRF token on state-changing requests
  if (!['GET', 'HEAD', 'OPTIONS'].includes(options.method || 'GET')) {
    const token = await getCsrfToken()
    if (token) {
      headers['X-CSRF-Token'] = token
    }
  }

  // Don't set Content-Type for FormData (browser sets multipart boundary)
  if (body instanceof FormData) {
    delete headers['Content-Type']
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers,
    body: body instanceof FormData ? body : body != null ? JSON.stringify(body) : undefined,
    credentials: 'include', // send httpOnly refresh cookie
  })

  // Handle 401 — try token refresh (deduplicated)
  if (res.status === 401) {
    let refreshed = false
    if (auth === 'admin' && adminAccessToken) {
      if (!refreshInProgress) {
        refreshInProgress = tryRefreshAdmin().finally(() => { refreshInProgress = null })
      }
      refreshed = await refreshInProgress
    } else if (auth === 'customer' && customerAccessToken) {
      if (!refreshInProgress) {
        refreshInProgress = tryRefreshCustomer().finally(() => { refreshInProgress = null })
      }
      refreshed = await refreshInProgress
    }
    if (refreshed) {
      const token = auth === 'admin' ? adminAccessToken : customerAccessToken
      headers['Authorization'] = `Bearer ${token}`
      const retryHeaders: Record<string, string> = { ...headers }
      if (body instanceof FormData) {
        delete retryHeaders['Content-Type']
      }
      const retryRes = await fetch(`${API_BASE}${path}`, {
        ...rest,
        headers: retryHeaders,
        body: body instanceof FormData ? body : body != null ? JSON.stringify(body) : undefined,
        credentials: 'include',
      })
      return handleResponse<T>(retryRes)
    }
  }

  return handleResponse<T>(res)
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Request failed (${res.status})`
    let details: { field: string; message: string }[] | undefined

    try {
      const json = await res.json()
      message = json.error || message
      details = json.details
    } catch {
      // Response body is not JSON — use default message
    }

    throw new ApiError(res.status, message, details)
  }

  // Handle 204 No Content
  if (res.status === 204) {
    return undefined as T
  }

  // Only parse JSON if content-type indicates it
  const ct = res.headers.get('content-type') || ''
  if (ct.includes('application/json')) {
    return res.json() as Promise<T>
  }

  // For non-JSON (e.g. CSV, HTML), return text wrapped in a string type
  return res.text() as unknown as T
}

// ─── Token Refresh ──────────────────────────────────────────────

async function tryRefreshAdmin(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/admin/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    })
    if (!res.ok) {
      adminAccessToken = null
      return false
    }
    const data = await res.json()
    adminAccessToken = data.accessToken
    return true
  } catch {
    // Admin token refresh failed silently — caller will handle expired session
    adminAccessToken = null
    return false
  }
}

async function tryRefreshCustomer(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    })
    if (!res.ok) {
      customerAccessToken = null
      return false
    }
    const data = await res.json()
    customerAccessToken = data.accessToken
    return true
  } catch {
    // Customer token refresh failed silently — caller will handle expired session
    customerAccessToken = null
    return false
  }
}

// ─── Convenience Methods ────────────────────────────────────────

export const api = {
  get: <T = unknown>(path: string, opts?: Omit<ApiOptions, 'method' | 'body'>) =>
    apiFetch<T>(path, { ...opts, method: 'GET' }),

  post: <T = unknown>(path: string, body?: unknown, opts?: Omit<ApiOptions, 'method'>) =>
    apiFetch<T>(path, { ...opts, method: 'POST', body }),

  put: <T = unknown>(path: string, body?: unknown, opts?: Omit<ApiOptions, 'method'>) =>
    apiFetch<T>(path, { ...opts, method: 'PUT', body }),

  patch: <T = unknown>(path: string, body?: unknown, opts?: Omit<ApiOptions, 'method'>) =>
    apiFetch<T>(path, { ...opts, method: 'PATCH', body }),

  del: <T = unknown>(path: string, opts?: Omit<ApiOptions, 'method' | 'body'>) =>
    apiFetch<T>(path, { ...opts, method: 'DELETE' }),
}

// ─── Typed API Endpoints ────────────────────────────────────────
// These match the backend route files exactly.

export const storefront = {
  // Products
  products: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : ''
      return api.get<ProductListResponse>(`/storefront/products${qs}`)
    },
    featured: () =>
      api.get<{ products: ApiProduct[] }>('/storefront/products/featured'),
    newArrivals: () =>
      api.get<{ products: ApiProduct[] }>('/storefront/products/new-arrivals'),
    emergency: () =>
      api.get<{ products: ApiProduct[] }>('/storefront/products/emergency'),
    get: (id: string) =>
      api.get<{ product: ApiProduct; related: ApiProduct[] }>(`/storefront/products/${id}`),
    related: (id: string) =>
      api.get<{ products: ApiProduct[] }>(`/storefront/products/${id}/related`),
  },

  // Categories
  categories: {
    list: () =>
      api.get<{ categories: ApiCategory[] }>('/storefront/categories'),
    get: (slug: string) =>
      api.get<{ category: ApiCategory }>(`/storefront/categories/${slug}`),
  },

  // Brands
  brands: {
    list: () =>
      api.get<{ brands: ApiBrand[] }>('/storefront/brands'),
    get: (slug: string) =>
      api.get<{ brand: ApiBrand }>(`/storefront/brands/${slug}`),
  },

  // Industries
  industries: {
    list: () =>
      api.get<{ industries: ApiIndustry[] }>('/storefront/industries'),
    get: (slug: string) =>
      api.get<{ industry: ApiIndustry }>(`/storefront/industries/${slug}`),
  },

  // Search
  search: (q: string) =>
    api.get<{ results: ApiSearchResult[]; total: number; query: string }>(`/storefront/search?q=${encodeURIComponent(q)}`),

  // Settings
  settings: () =>
      api.get<{ settings: ApiStoreSettings }>('/storefront/settings'),

  // Testimonials
  testimonials: () =>
    api.get<{ testimonials: ApiTestimonial[] }>('/storefront/testimonials'),

  // Homepage
  homepage: () =>
    api.get<{ sections: ApiHomepageSection[] }>('/storefront/homepage'),

  // RFQ
  rfq: {
    submit: (data: {
      fullName: string; company?: string; email: string; phone?: string
      country?: string; role?: string; productDescription: string
      partNumber?: string; brand?: string; quantity?: number
      deliveryLocation?: string; urgency?: string; notes?: string
      source?: string; consent: boolean
    }) => api.post<{ message: string; rfqNumber: string; id: string }>('/storefront/rfq', data),
  },

  // Payments
  payments: {
    clientId: () => api.get<{ clientId: string }>('/storefront/payments/client-id'),
    createPaypalOrder: (data: { orderId: string }) =>
      api.post<{ paypalOrderId: string }>('/storefront/payments/create-order', data, { auth: 'customer' }),
    capturePaypalOrder: (data: { paypalOrderId: string; orderId: string }) =>
      api.post<{ status: string; orderId: string }>('/storefront/payments/capture-order', data, { auth: 'customer' }),
  },

  // Offers
  offers: {
    submit: (data: {
      productId: string; customerEmail: string; offeredPrice: number
      quantity?: number; message?: string
    }) => api.post<{ message: string; offerNumber: string; id: string }>('/storefront/offers', data),
  },

  // Contact
  contact: {
    submit: (data: { name: string; email: string; subject?: string; message: string }) =>
      api.post<{ message: string; id: string }>('/storefront/contact', data),
    emergency: (data: {
      name: string; phone: string; partDescription: string; vesselName?: string
    }) => api.post<{ message: string; id: string; rfqNumber: string }>('/storefront/contact/emergency', data),
  },

  // Orders (customer auth required)
  orders: {
    create: (data: {
      items: { productId: string; quantity: number; price?: number }[]
      shipping: {
        fullName: string; addressLine1: string; addressLine2?: string
        city: string; state?: string; postalCode?: string; country: string
      }
      paymentMethod: string; customerNotes?: string
      subtotal?: number; tax?: number; total?: number
    }) => api.post<{ order: ApiOrder }>('/storefront/orders', data, { auth: 'customer' }),

    get: (id: string) =>
      api.get<{ order: ApiOrder }>(`/storefront/orders/${id}`, { auth: 'customer' }),

    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : ''
      return api.get<{ orders: ApiOrder[]; pagination: Pagination }>(`/storefront/orders${qs}`, { auth: 'customer' })
    },

    cancel: (id: string, reason?: string) =>
      api.post<{ order: ApiOrder }>(`/storefront/orders/${id}/cancel`, { reason }, { auth: 'customer' }),
  },
}

// ─── Customer Auth ──────────────────────────────────────────────

export const customerAuth = {
  register: (data: { name: string; email: string; password: string; phone?: string; company?: string; country?: string }) =>
    api.post<{ accessToken: string; user: { id: string; name: string; email: string } }>('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post<{ accessToken: string; user: { id: string; name: string; email: string } }>('/auth/login', data),

  logout: () =>
    api.post<{ message: string }>('/auth/logout', undefined, { auth: 'customer' }),

  me: () =>
    api.get<{ user: { id: string; name: string; email: string; phone?: string; company?: string; country?: string } }>('/auth/me', { auth: 'customer' }),

  updateProfile: (data: { name?: string; phone?: string; company?: string; country?: string }) =>
    api.put<{ user: { id: string; name: string; email: string; phone?: string; company?: string; country?: string } }>('/auth/me', data, { auth: 'customer' }),

  forgotPassword: (email: string) =>
    api.post<{ message: string }>('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    api.post<{ message: string }>('/auth/reset-password', { token, password }),
}

// ─── Admin Auth ─────────────────────────────────────────────────

export const adminAuth = {
  login: (data: { email: string; password: string }) =>
    api.post<{ accessToken: string; user: { id: string; name: string; email: string; role: string; avatarUrl?: string } }>('/admin/auth/login', data),

  refresh: () =>
    api.post<{ accessToken: string }>('/admin/auth/refresh'),

  logout: () =>
    api.post<{ message: string }>('/admin/auth/logout', undefined, { auth: 'admin' }),

  me: () =>
    api.get<{ user: { id: string; name: string; email: string; role: string; avatarUrl?: string; lastLoginAt?: string } }>('/admin/auth/me', { auth: 'admin' }),
}

// ─── Admin Endpoints ────────────────────────────────────────────

export const admin = {
  // Dashboard
  dashboard: {
    stats: () => api.get<any>('/admin/dashboard/stats', { auth: 'admin' }),
    alerts: () => api.get<any>('/admin/dashboard/alerts', { auth: 'admin' }),
    activity: (limit?: number) =>
      api.get<any>(`/admin/dashboard/activity${limit ? `?limit=${limit}` : ''}`, { auth: 'admin' }),
  },

  // Products
  products: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : ''
      return api.get<{ products: ApiProduct[]; pagination: Pagination }>(`/admin/products${qs}`, { auth: 'admin' })
    },
    get: (id: string) =>
      api.get<{ product: ApiProduct }>(`/admin/products/${id}`, { auth: 'admin' }),
    create: (data: Partial<ApiProduct>) =>
      api.post<{ product: ApiProduct }>('/admin/products', data, { auth: 'admin' }),
    update: (id: string, data: Partial<ApiProduct>) =>
      api.put<{ product: ApiProduct }>(`/admin/products/${id}`, data, { auth: 'admin' }),
    delete: (id: string) =>
      api.del<{ message: string }>(`/admin/products/${id}`, { auth: 'admin' }),
    bulk: (ids: string[], action: string, value?: string) =>
      api.patch<{ updated: number }>('/admin/products/bulk', { ids, action, value }, { auth: 'admin' }),
    duplicate: (id: string) =>
      api.post<{ product: ApiProduct }>(`/admin/products/${id}/duplicate`, undefined, { auth: 'admin' }),
    importCsv: (rows: any[]) =>
      api.post<{ created: number; skipped: number; errors: string[] }>('/admin/products/import/csv', { rows }, { auth: 'admin' }),
    exportCsv: async () => {
      const res = await fetch(`${API_BASE}/admin/products/export/csv`, {
        headers: adminAccessToken ? { Authorization: `Bearer ${adminAccessToken}` } : undefined,
        credentials: 'include',
      })
      if (!res.ok) throw new ApiError(res.status, 'Export failed')
      return res.text()
    },
  },

  // Categories
  categories: {
    list: () => api.get<{ categories: ApiCategory[] }>('/admin/categories', { auth: 'admin' }),
    create: (data: Partial<ApiCategory>) => api.post<{ category: ApiCategory }>('/admin/categories', data, { auth: 'admin' }),
    update: (id: string, data: Partial<ApiCategory>) => api.put<{ category: ApiCategory }>(`/admin/categories/${id}`, data, { auth: 'admin' }),
    delete: (id: string) => api.del<{ message: string }>(`/admin/categories/${id}`, { auth: 'admin' }),
    reorder: (id: string, sortOrder: number) =>
      api.patch<{ category: ApiCategory }>(`/admin/categories/${id}/reorder`, { sortOrder }, { auth: 'admin' }),
  },

  // Brands
  brands: {
    list: () => api.get<{ brands: ApiBrand[] }>('/admin/brands', { auth: 'admin' }),
    create: (data: Partial<ApiBrand>) => api.post<{ brand: ApiBrand }>('/admin/brands', data, { auth: 'admin' }),
    update: (id: string, data: Partial<ApiBrand>) => api.put<{ brand: ApiBrand }>(`/admin/brands/${id}`, data, { auth: 'admin' }),
    delete: (id: string) => api.del<{ message: string }>(`/admin/brands/${id}`, { auth: 'admin' }),
  },

  // Industries
  industries: {
    list: () => api.get<{ industries: ApiIndustry[] }>('/admin/industries', { auth: 'admin' }),
    create: (data: Partial<ApiIndustry>) => api.post<{ industry: ApiIndustry }>('/admin/industries', data, { auth: 'admin' }),
    update: (id: string, data: Partial<ApiIndustry>) => api.put<{ industry: ApiIndustry }>(`/admin/industries/${id}`, data, { auth: 'admin' }),
    delete: (id: string) => api.del<{ message: string }>(`/admin/industries/${id}`, { auth: 'admin' }),
  },

  // Orders
  orders: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : ''
      return api.get<{ orders: ApiOrder[]; pagination: Pagination }>(`/admin/orders${qs}`, { auth: 'admin' })
    },
    get: (id: string) => api.get<{ order: ApiOrder }>(`/admin/orders/${id}`, { auth: 'admin' }),
    updateStatus: (id: string, status: string, note?: string) =>
      api.patch<{ order: ApiOrder }>(`/admin/orders/${id}/status`, { status, note }, { auth: 'admin' }),
    updateTracking: (id: string, trackingNumber: string, courier: string) =>
      api.patch<{ order: ApiOrder }>(`/admin/orders/${id}/tracking`, { trackingNumber, courier }, { auth: 'admin' }),
    cancel: (id: string, reason?: string) =>
      api.post<{ order: ApiOrder }>(`/admin/orders/${id}/cancel`, { reason }, { auth: 'admin' }),
    exportCsv: async () => {
      const res = await fetch(`${API_BASE}/admin/orders/export/csv`, {
        headers: adminAccessToken ? { Authorization: `Bearer ${adminAccessToken}` } : undefined,
        credentials: 'include',
      })
      if (!res.ok) throw new ApiError(res.status, 'Export failed')
      return res.text()
    },
  },

  // RFQs
  rfqs: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : ''
      return api.get<{ rfqs: ApiRfq[]; pagination: Pagination }>(`/admin/rfqs${qs}`, { auth: 'admin' })
    },
    get: (id: string) => api.get<{ rfq: ApiRfq }>(`/admin/rfqs/${id}`, { auth: 'admin' }),
    updateStatus: (id: string, status: string) =>
      api.patch<{ rfq: ApiRfq }>(`/admin/rfqs/${id}/status`, { status }, { auth: 'admin' }),
    assign: (id: string, assignedTo: string) =>
      api.patch<{ rfq: ApiRfq }>(`/admin/rfqs/${id}/assign`, { assignedTo }, { auth: 'admin' }),
    addNote: (id: string, note: string, isInternal = true) =>
      api.post<{ note: { id: string; note: string; isInternal: boolean } }>(`/admin/rfqs/${id}/notes`, { note, isInternal }, { auth: 'admin' }),
    respond: (id: string, message?: string) =>
      api.patch<{ rfq: ApiRfq }>(`/admin/rfqs/${id}/respond`, { message }, { auth: 'admin' }),
  },

  // Offers
  offers: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : ''
      return api.get<{ offers: ApiOffer[]; pagination: Pagination }>(`/admin/offers${qs}`, { auth: 'admin' })
    },
    get: (id: string) => api.get<{ offer: ApiOffer }>(`/admin/offers/${id}`, { auth: 'admin' }),
    accept: (id: string) => api.patch<{ offer: ApiOffer }>(`/admin/offers/${id}/accept`, undefined, { auth: 'admin' }),
    reject: (id: string) => api.patch<{ offer: ApiOffer }>(`/admin/offers/${id}/reject`, undefined, { auth: 'admin' }),
    counter: (id: string, counterPrice: number) =>
      api.patch<{ offer: ApiOffer }>(`/admin/offers/${id}/counter`, { counterPrice }, { auth: 'admin' }),
    convertToOrder: (id: string) =>
      api.post<{ order: ApiOrder }>(`/admin/offers/${id}/convert-to-order`, undefined, { auth: 'admin' }),
  },

  // Customers
  customers: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : ''
      return api.get<{ customers: ApiCustomer[]; pagination: Pagination }>(`/admin/customers${qs}`, { auth: 'admin' })
    },
    get: (id: string) => api.get<{ customer: ApiCustomer }>(`/admin/customers/${id}`, { auth: 'admin' }),
    create: (data: { name: string; email: string; phone?: string; company?: string; country?: string; city?: string }) =>
      api.post<{ customer: ApiCustomer }>('/admin/customers', data, { auth: 'admin' }),
    updateStatus: (id: string, status: string) =>
      api.patch<{ customer: ApiCustomer }>(`/admin/customers/${id}/status`, { status }, { auth: 'admin' }),
  },

  // Messages
  messages: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : ''
      return api.get<{ messages: ApiMessage[]; pagination: Pagination }>(`/admin/messages${qs}`, { auth: 'admin' })
    },
    get: (id: string) => api.get<{ message: ApiMessage }>(`/admin/messages/${id}`, { auth: 'admin' }),
    markRead: (id: string) => api.patch<{ message: ApiMessage }>(`/admin/messages/${id}/read`, undefined, { auth: 'admin' }),
    archive: (id: string) => api.patch<{ message: ApiMessage }>(`/admin/messages/${id}/archive`, undefined, { auth: 'admin' }),
    delete: (id: string) => api.del<{ message: string }>(`/admin/messages/${id}`, { auth: 'admin' }),
  },

  // Media
  media: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : ''
      return api.get<{ assets: ApiMediaAsset[]; pagination: Pagination }>(`/admin/media${qs}`, { auth: 'admin' })
    },
    usage: (id: string) => api.get<{ id: string; productName: string }[]>(`/admin/media/${id}/usage`, { auth: 'admin' }),
    delete: (id: string) => api.del<{ message: string }>(`/admin/media/${id}`, { auth: 'admin' }),
    upload: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch(`${API_BASE}/admin/media/upload`, {
        method: 'POST',
        body: formData,
        headers: adminAccessToken ? { Authorization: `Bearer ${adminAccessToken}` } : undefined,
        credentials: 'include',
      })
      return handleResponse<{ asset: any }>(res)
    },
  },

  // Settings
  settings: {
    get: () => api.get<{ settings: ApiStoreSettings; flat: { key: string; value: string; category: string }[] }>('/admin/settings', { auth: 'admin' }),
    update: (settings: ApiStoreSettings) =>
      api.put<{ message: string; count: number }>('/admin/settings', { settings }, { auth: 'admin' }),
  },

  // Homepage
  homepage: {
    get: () => api.get<{ sections: ApiHomepageSection[] }>('/admin/homepage', { auth: 'admin' }),
    update: (sections: ApiHomepageSection[]) =>
      api.put<{ sections: ApiHomepageSection[] }>('/admin/homepage', { sections }, { auth: 'admin' }),
  },

  // Users (owner only)
  users: {
    list: () => api.get<{ users: ApiAdminUser[] }>('/admin/users', { auth: 'admin' }),
    create: (data: { name: string; email: string; password: string; role: string; avatarUrl?: string }) =>
      api.post<{ user: ApiAdminUser }>('/admin/users', data, { auth: 'admin' }),
    update: (id: string, data: { name?: string; email?: string; avatarUrl?: string; isActive?: boolean }) =>
      api.put<{ user: ApiAdminUser }>(`/admin/users/${id}`, data, { auth: 'admin' }),
    deactivate: (id: string) => api.del<{ message: string }>(`/admin/users/${id}`, { auth: 'admin' }),
    changeRole: (id: string, role: string) =>
      api.patch<{ user: ApiAdminUser }>(`/admin/users/${id}/role`, { role }, { auth: 'admin' }),
  },

  // Audit
  audit: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : ''
      return api.get<{ logs: ApiAuditLog[]; pagination: Pagination }>(`/admin/audit${qs}`, { auth: 'admin' })
    },
  },
}
