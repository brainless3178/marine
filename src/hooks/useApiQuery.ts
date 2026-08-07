import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { ApiProduct, Pagination, ProductListFilters } from '../lib/api-types'

// ─── Query Key Factory ─────────────────────────────────────────
// Stable, predictable query keys for cache invalidation.

export const queryKeys = {
  products: {
    all: ['products'] as const,
    list: (params?: Record<string, string>) => ['products', 'list', params] as const,
    detail: (id: string) => ['products', id] as const,
    featured: () => ['products', 'featured'] as const,
    newArrivals: () => ['products', 'new-arrivals'] as const,
    emergency: () => ['products', 'emergency'] as const,
    search: (q: string) => ['products', 'search', q] as const,
  },
  categories: {
    all: ['categories'] as const,
  },
  brands: {
    all: ['brands'] as const,
  },
  settings: {
    all: ['settings'] as const,
  },
  testimonials: {
    all: ['testimonials'] as const,
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

export function useProduct(id: string) {
  return useQuery({
    queryKey: queryKeys.products.detail(id),
    queryFn: () => api.get<{ product: ApiProduct; related: ApiProduct[] }>(`/storefront/products/${id}`),
    enabled: !!id,
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

export function useEmergencyProducts() {
  return useQuery({
    queryKey: queryKeys.products.emergency(),
    queryFn: () => api.get<{ products: ApiProduct[] }>('/storefront/products/emergency'),
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

// ─── Settings Query ────────────────────────────────────────────

export function useSettingsQuery() {
  return useQuery({
    queryKey: queryKeys.settings.all,
    queryFn: () => api.get<{ settings: any }>('/storefront/settings'),
    staleTime: 30 * 60 * 1000, // Settings change very rarely
  })
}

// ─── Testimonials Query ────────────────────────────────────────

export function useTestimonialsQuery() {
  return useQuery({
    queryKey: queryKeys.testimonials.all,
    queryFn: () => api.get<{ testimonials: any[] }>('/storefront/testimonials'),
    staleTime: 15 * 60 * 1000,
  })
}

// ─── Search Query ──────────────────────────────────────────────

export function useSearchQuery(q: string) {
  return useQuery({
    queryKey: queryKeys.products.search(q),
    queryFn: () => api.get<{ results: any[]; total: number; query: string }>(
      `/storefront/search?q=${encodeURIComponent(q)}`
    ),
    enabled: q.trim().length > 0,
    staleTime: 60 * 1000, // Search results are more dynamic — cache 1 min
  })
}

// ─── Generic Mutation Runner ───────────────────────────────────

export function useApiMutation<TData, TVariables>(
  queryKey: string[],
  mutationFn: (variables: TVariables) => Promise<TData>,
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => {
      // Invalidate related queries to refetch
      queryClient.invalidateQueries({ queryKey })
    },
  })
}
