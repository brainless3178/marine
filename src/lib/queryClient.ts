import { QueryClient } from '@tanstack/react-query'

// ─── Global Query Client ───────────────────────────────────────
// Provides caching, deduplication, and background refetching
// for all API data fetching across the app.

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes — data is fresh for 5 min
      gcTime: 10 * 60 * 1000, // 10 minutes — keep in cache for 10 min
      retry: 2, // Retry failed queries twice
      refetchOnWindowFocus: false, // Don't refetch on focus (save bandwidth)
      refetchOnReconnect: true, // Refetch on reconnect (stale data)
    },
    mutations: {
      retry: 0, // Don't retry mutations (don't duplicate orders, etc.)
    },
  },
})
