import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { api, storefront } from '../lib/api'
import { apiProductToFrontend } from '../lib/adapters'
import { products as staticProducts } from '../data/products'
import type { ApiProduct, Pagination, ProductListFilters } from '../lib/api-types'
import type { Product } from '../types'

// ─── Query Key Factory ─────────────────────────────────────────
// Stable, predictable query keys for cache invalidation.

const queryKeys = {
  products: {
    list: (params?: Record<string, string>) => ['products', 'list', params] as const,
    featured: () => ['products', 'featured'] as const,
    newArrivals: () => ['products', 'new-arrivals'] as const,
    detail: (id?: string) => ['products', 'detail', id] as const,
  },
  categories: {
    all: ['categories'] as const,
  },
  brands: {
    all: ['brands'] as const,
  },
}

// ─── Product Queries ───────────────────────────────────────────

export function useProductList(params?: Record<string, string>) {
  return useQuery({
    queryKey: queryKeys.products.list(params),
    queryFn: () => api.get<{ products: ApiProduct[]; pagination: Pagination; filters?: ProductListFilters }>(
      `/storefront/products${params ? '?' + new URLSearchParams(params).toString() : ''}`
    ),
    // Keep the previous page/filter results visible while the next set loads
    placeholderData: keepPreviousData,
  })
}

export function useFeaturedProducts() {
  return useQuery({
    queryKey: queryKeys.products.featured(),
    queryFn: () => api.get<{ products: ApiProduct[] }>('/storefront/products/featured'),
    staleTime: 10 * 60 * 1000, // Featured products change rarely — cache 10 min
  })
}

export function useNewArrivals() {
  return useQuery({
    queryKey: queryKeys.products.newArrivals(),
    queryFn: () => api.get<{ products: ApiProduct[] }>('/storefront/products/new-arrivals'),
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Product detail with the same API→static fallback ProductDetail used before,
 * now as a cacheable query — so hover-prefetching (usePrefetchOnHover) makes
 * product pages open instantly, and revisits never re-fetch.
 */
export function useProductDetail(id?: string) {
  return useQuery({
    queryKey: queryKeys.products.detail(id),
    queryFn: async () => {
      if (!id) return { product: null as Product | null, related: [] as Product[] }
      try {
        const res = await storefront.products.get(id)
        if (res.product) {
          return {
            product: apiProductToFrontend(res.product),
            related: (res.related || []).map(apiProductToFrontend).slice(0, 4),
          }
        }
      } catch {
        console.warn('[ProductDetail] API fetch failed — falling back to static product data')
      }
      const cleanId = id.toLowerCase().replace(/^prod-/, '')
      const staticProduct = staticProducts.find(
        (p) => p.id === id || p.id === `prod-${cleanId}` || p.id.replace('prod-', '') === cleanId,
      )
      return {
        product: staticProduct || null,
        related: staticProduct
          ? staticProducts
              .filter((p) => p.id !== staticProduct.id && p.category === staticProduct.category)
              .slice(0, 4)
          : [],
      }
    },
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })
}

// ─── Category Queries ──────────────────────────────────────────

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: () => api.get<{ categories: any[] }>('/storefront/categories'),
    staleTime: 15 * 60 * 1000, // Categories rarely change
  })
}

// ─── Brand Queries ─────────────────────────────────────────────

export function useBrands() {
  return useQuery({
    queryKey: queryKeys.brands.all,
    queryFn: () => api.get<{ brands: any[] }>('/storefront/brands'),
    staleTime: 15 * 60 * 1000,
  })
}


