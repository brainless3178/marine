import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { ApiProduct, Pagination, ProductListFilters } from '../lib/api-types'

// ─── Query Key Factory ─────────────────────────────────────────
// Stable, predictable query keys for cache invalidation.

const queryKeys = {
  products: {
    list: (params?: Record<string, string>) => ['products', 'list', params] as const,
    featured: () => ['products', 'featured'] as const,
    newArrivals: () => ['products', 'new-arrivals'] as const,
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


