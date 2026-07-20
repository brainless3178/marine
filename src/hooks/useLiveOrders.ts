import { useState, useEffect, useCallback, useRef } from 'react'
import { admin } from '../lib/api'

export function useLiveOrders(intervalMs = 30000) {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchOrders = useCallback(async () => {
    try {
      const res = await admin.orders.list({ limit: '20', sort: 'newest' })
      setOrders((res as any)?.orders || [])
    } catch {
      // Retry on next tick
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchOrders()
    intervalRef.current = setInterval(fetchOrders, intervalMs)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [fetchOrders, intervalMs])

  return { orders, loading, refresh: fetchOrders }
}
