import { useState, useEffect, useCallback } from 'react'
import { admin } from '../lib/api'

export interface DashboardStats {
  totalProducts: number
  inStockProducts: number
  outOfStockProducts: number
  emergencyProducts: number
  saleProducts: number
  newArrivals: number
  totalBrands: number
  totalCategories: number
  totalIndustries: number
  totalStockUnits: number
  lowStockProducts: ProductAlert[]
  missingImageProducts: ProductAlert[]
  categoryBreakdown: CategoryBreakdown[]
  brandBreakdown: BrandBreakdown[]
  conditionBreakdown: ConditionBreakdown[]
}

export interface ProductAlert {
  id: string
  name: string
  sku: string
  brand: string
  category: string
  stockCount: number
  availability: string
  hasImage: boolean
}

export interface CategoryBreakdown {
  id: string
  name: string
  count: number
  percentage: number
}

export interface BrandBreakdown {
  name: string
  count: number
  percentage: number
}

export interface ConditionBreakdown {
  condition: string
  count: number
  percentage: number
}

export interface DashboardActivity {
  id: string
  action: string
  entityType: string
  entityName: string
  actorEmail: string
  createdAt: string
}

export interface DashboardAlert {
  type: 'danger' | 'warning' | 'info'
  message: string
  entityType?: string
}

export function useAdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [activity, setActivity] = useState<DashboardActivity[]>([])
  const [alerts, setAlerts] = useState<DashboardAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboard = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [statsRes, alertsRes, activityRes] = await Promise.allSettled([
        admin.dashboard.stats(),
        admin.dashboard.alerts(),
        admin.dashboard.activity(20),
      ])

      // Process stats
      if (statsRes.status === 'fulfilled') {
        const s = statsRes.value as any
        const total = s.totalProducts || 0
        setStats({
          totalProducts: total,
          inStockProducts: s.inStockProducts || 0,
          outOfStockProducts: s.outOfStockProducts || 0,
          emergencyProducts: s.emergencyProducts || 0,
          saleProducts: s.saleProducts || 0,
          newArrivals: s.newArrivals || 0,
          totalBrands: s.totalBrands || 0,
          totalCategories: s.totalCategories || 0,
          totalIndustries: s.totalIndustries || 0,
          totalStockUnits: s.totalStockUnits || 0,
          lowStockProducts: (s.lowStockProducts || []).map((p: any) => ({
            id: p.id,
            name: p.name,
            sku: p.sku,
            brand: p.brand?.name || p.brand || 'Unknown',
            category: p.category?.name || p.category || 'Unknown',
            stockCount: p.stockCount ?? 0,
            availability: p.availability || 'unknown',
            hasImage: !!(p.images?.length && p.images[0]?.url),
          })),
          missingImageProducts: (s.missingImageProducts || []).map((p: any) => ({
            id: p.id,
            name: p.name,
            sku: p.sku,
            brand: p.brand?.name || p.brand || 'Unknown',
            category: p.category?.name || p.category || 'Unknown',
            stockCount: p.stockCount ?? 0,
            availability: p.availability || 'unknown',
            hasImage: false,
          })),
          categoryBreakdown: (s.categoryBreakdown || []).map((c: any, i: number) => ({
            id: c.id || `cat-${i}`,
            name: c.name || c.category || 'Unknown',
            count: c.count || c._count || 0,
            percentage: total > 0 ? Math.round(((c.count || c._count || 0) / total) * 100) : 0,
          })).sort((a: CategoryBreakdown, b: CategoryBreakdown) => b.count - a.count),
          brandBreakdown: (s.brandBreakdown || []).map((b: any) => ({
            name: b.name || 'Unknown',
            count: b.count || b._count || 0,
            percentage: total > 0 ? Math.round(((b.count || b._count || 0) / total) * 100) : 0,
          })).sort((a: BrandBreakdown, b: BrandBreakdown) => b.count - a.count).slice(0, 15),
          conditionBreakdown: (s.conditionBreakdown || []).map((c: any) => ({
            condition: c.condition || 'unknown',
            count: c.count || 0,
            percentage: total > 0 ? Math.round(((c.count || 0) / total) * 100) : 0,
          })).sort((a: ConditionBreakdown, b: ConditionBreakdown) => b.count - a.count),
        })
      } else {
        // Fallback: compute from empty state
        setStats({
          totalProducts: 0, inStockProducts: 0, outOfStockProducts: 0,
          emergencyProducts: 0, saleProducts: 0, newArrivals: 0,
          totalBrands: 0, totalCategories: 0, totalIndustries: 0,
          totalStockUnits: 0, lowStockProducts: [], missingImageProducts: [],
          categoryBreakdown: [], brandBreakdown: [], conditionBreakdown: [],
        })
      }

      // Process alerts
      if (alertsRes.status === 'fulfilled') {
        const a = alertsRes.value as any
        const result: DashboardAlert[] = []
        if (a.lowStockProducts?.length) {
          result.push({ type: 'warning', message: `${a.lowStockProducts.length} products are low on stock`, entityType: 'product' })
        }
        if (a.overdueRfqs?.length) {
          result.push({ type: 'danger', message: `${a.overdueRfqs.length} RFQs have exceeded response SLA`, entityType: 'rfq' })
        }
        if (a.outOfStockCount > 0) {
          result.push({ type: 'danger', message: `${a.outOfStockCount} products are out of stock`, entityType: 'product' })
        }
        setAlerts(result)
      }

      // Process activity
      if (activityRes.status === 'fulfilled') {
        const act = activityRes.value as any
        setActivity((act.logs || act || []).map((l: any) => ({
          id: l.id,
          action: l.action || 'unknown',
          entityType: l.entityType || 'unknown',
          entityName: l.entityName || l.entityType || '',
          actorEmail: l.actorEmail || 'system',
          createdAt: l.createdAt || new Date().toISOString(),
        })))
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard')
      // Set empty defaults so the UI still renders
      setStats({
        totalProducts: 0, inStockProducts: 0, outOfStockProducts: 0,
        emergencyProducts: 0, saleProducts: 0, newArrivals: 0,
        totalBrands: 0, totalCategories: 0, totalIndustries: 0,
        totalStockUnits: 0, lowStockProducts: [], missingImageProducts: [],
        categoryBreakdown: [], brandBreakdown: [], conditionBreakdown: [],
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  return {
    stats: stats || {
      totalProducts: 0, inStockProducts: 0, outOfStockProducts: 0,
      emergencyProducts: 0, saleProducts: 0, newArrivals: 0,
      totalBrands: 0, totalCategories: 0, totalIndustries: 0,
      totalStockUnits: 0, lowStockProducts: [], missingImageProducts: [],
      categoryBreakdown: [], brandBreakdown: [], conditionBreakdown: [],
    },
    activity,
    alerts,
    loading,
    error,
  }
}
