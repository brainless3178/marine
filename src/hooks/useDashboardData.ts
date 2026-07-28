import { useState, useEffect, useCallback } from 'react'
import { admin } from '../lib/api'
import type {
  ApiDashboardStats, ApiOrder, ApiRfq, ApiOffer, ApiProduct, ApiCustomer,
} from '../lib/api-types'

export interface DashboardAlert {
  id: string
  type: string
  message: string
  severity?: string
  [key: string]: unknown
}

export interface DashboardActivityLog {
  id: string
  action: string
  actorEmail?: string
  entityType?: string
  entityName?: string
  createdAt: string
  [key: string]: unknown
}

export interface DashboardInsightData {
  stats: ApiDashboardStats | null
  alerts: DashboardAlert[]
  activity: DashboardActivityLog[]
  orders: ApiOrder[]
  rfqs: ApiRfq[]
  offers: ApiOffer[]
  products: ApiProduct[]
  customers: ApiCustomer[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useDashboardData(): DashboardInsightData {
  const [stats, setStats] = useState<ApiDashboardStats | null>(null)
  const [alerts, setAlerts] = useState<DashboardAlert[]>([])
  const [activity, setActivity] = useState<DashboardActivityLog[]>([])
  const [orders, setOrders] = useState<ApiOrder[]>([])
  const [rfqs, setRfqs] = useState<ApiRfq[]>([])
  const [offers, setOffers] = useState<ApiOffer[]>([])
  const [products, setProducts] = useState<ApiProduct[]>([])
  const [customers, setCustomers] = useState<ApiCustomer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const results = await Promise.allSettled([
        admin.dashboard.stats(),
        admin.dashboard.alerts(),
        admin.dashboard.activity(50),
        admin.orders.list({ limit: '200' }),
        admin.rfqs.list({ limit: '100' }),
        admin.offers.list({ limit: '100' }),
        admin.products.list({ limit: '500' }),
        admin.customers.list({ limit: '200' }),
      ])

      if (results[0].status === 'fulfilled') setStats(results[0].value as ApiDashboardStats)
      if (results[1].status === 'fulfilled') {
        const val = results[1].value as { alerts?: DashboardAlert[] }
        setAlerts(val?.alerts || [])
      }
      if (results[2].status === 'fulfilled') {
        const val = results[2].value as { logs?: DashboardActivityLog[] } | DashboardActivityLog[]
        setActivity(Array.isArray(val) ? val : (val?.logs || []))
      }
      if (results[3].status === 'fulfilled') {
        const val = results[3].value as { orders?: ApiOrder[] }
        setOrders(val?.orders || [])
      }
      if (results[4].status === 'fulfilled') {
        const val = results[4].value as { rfqs?: ApiRfq[] }
        setRfqs(val?.rfqs || [])
      }
      if (results[5].status === 'fulfilled') {
        const val = results[5].value as { offers?: ApiOffer[] }
        setOffers(val?.offers || [])
      }
      if (results[6].status === 'fulfilled') {
        const val = results[6].value as { products?: ApiProduct[] }
        setProducts(val?.products || [])
      }
      if (results[7].status === 'fulfilled') {
        const val = results[7].value as { customers?: ApiCustomer[] }
        setCustomers(val?.customers || [])
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  return { stats, alerts, activity, orders, rfqs, offers, products, customers, loading, error, refresh }
}
