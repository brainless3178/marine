import { useState, useEffect, useCallback } from 'react'
import { admin } from '../lib/api'

export interface DashboardInsightData {
  stats: any
  alerts: any[]
  activity: any[]
  orders: any[]
  rfqs: any[]
  offers: any[]
  products: any[]
  customers: any[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useDashboardData(): DashboardInsightData {
  const [stats, setStats] = useState<any>(null)
  const [alerts, setAlerts] = useState<any[]>([])
  const [activity, setActivity] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [rfqs, setRfqs] = useState<any[]>([])
  const [offers, setOffers] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
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

      if (results[0].status === 'fulfilled') setStats(results[0].value)
      if (results[1].status === 'fulfilled') setAlerts((results[1].value as any)?.alerts || [])
      if (results[2].status === 'fulfilled') setActivity((results[2].value as any)?.logs || (results[2].value as any) || [])
      if (results[3].status === 'fulfilled') setOrders((results[3].value as any)?.orders || [])
      if (results[4].status === 'fulfilled') setRfqs((results[4].value as any)?.rfqs || [])
      if (results[5].status === 'fulfilled') setOffers((results[5].value as any)?.offers || [])
      if (results[6].status === 'fulfilled') setProducts((results[6].value as any)?.products || [])
      if (results[7].status === 'fulfilled') setCustomers((results[7].value as any)?.customers || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  return { stats, alerts, activity, orders, rfqs, offers, products, customers, loading, error, refresh }
}
