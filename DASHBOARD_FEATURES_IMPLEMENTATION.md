# Dashboard Features — Implementation Guide

> **Scope:** All features below use **existing backend API endpoints** (no new backend work).
> **Stack:** React + TypeScript + Tailwind CSS + Lucide icons + existing `admin.*` API client.
> **Pattern:** Each feature is a standalone React component in `src/components/admin/dashboard/` with a custom hook in `src/hooks/` if it needs data fetching.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Shared Utilities](#2-shared-utilities)
3. [Tier 1 — Quick Wins (< 1 hour each)](#3-tier-1--quick-wins)
4. [Tier 2 — Medium Effort (1–3 hours each)](#4-tier-2--medium-effort)
5. [Tier 3 — Composite Features (3–6 hours)](#5-tier-3--composite-features)
6. [Routing & Navigation](#6-routing--navigation)
7. [Testing Strategy](#7-testing-strategy)

---

## 1. Architecture Overview

### File Structure

```
src/
├── components/
│   └── admin/
│       └── dashboard/
│           ├── BusinessHealthScore.tsx      # Composite health score
│           ├── ExecutiveDashboard.tsx        # CEO-focused overview
│           ├── RevenuePulse.tsx              # Revenue over time chart
│           ├── StockHealthMonitor.tsx        # Stock breakdown visual
│           ├── DeadStockAnalyzer.tsx         # Products with no sales
│           ├── AuditLogViewer.tsx            # Searchable audit table
│           ├── CEOBrief.tsx                  # Morning summary card
│           ├── DailySnapshot.tsx             # Yesterday/today comparison
│           ├── OrderFulfillment.tsx          # Pipeline view
│           ├── FinancialCenter.tsx           # Revenue/cost/profit
│           ├── EmergencyPanel.tsx            # Alert集中面板
│           ├── LiveSalesTracker.tsx          # Real-time order feed
│           ├── CustomerActivityFeed.tsx      # Activity timeline
│           ├── OrderTimeline.tsx             # Single order history
│           ├── RestockPredictor.tsx          # Stock replenishment
│           ├── MoneyLeakDetector.tsx         # Revenue leakage
│           ├── PaymentHealth.tsx             # Payment status pie
│           ├── ReturnAnalytics.tsx           # Returns/cancellations
│           ├── CustomerLifetimeValue.tsx     # CLV ranking
│           ├── VIPMonitor.tsx                # Top customers
│           ├── ChurnPredictor.tsx            # Inactive customers
│           ├── SalesTrendAnalyzer.tsx        # Trend lines
│           ├── ProductPerformance.tsx        # Revenue × stock matrix
│           ├── BestsellerInsights.tsx        # Top sellers
│           ├── SlowSellerAnalyzer.tsx        # Bottom sellers
│           ├── CartAbandonment.tsx           # Cart vs order ratio
│           ├── DeliveryPerformance.tsx       # Shipping times
│           ├── RegionalHeatmap.tsx           # Sales by country
│           ├── CustomerSegmentation.tsx      # RFM groups
│           ├── GoalTracker.tsx               # Targets vs actuals
│           ├── ProfitMeter.tsx               # Revenue margin
│           ├── SmartKPIs.tsx                 # KPI cards
│           ├── InventoryRisk.tsx             # Risk flags
│           └── RealTimeStream.tsx            # Live event feed
├── hooks/
│   ├── useDashboardData.ts                  # Shared data fetching
│   ├── useLiveOrders.ts                     # Polling hook
│   ├── useLiveActivity.ts                   # Activity polling
│   └── useGoalTracker.ts                    # Goal persistence
└── pages/admin/
    └── AdminInsights.tsx                    # New page: all features
```

### Data Flow

```
Backend API → admin.* method → Custom Hook → Component → UI
```

Every feature follows this pattern:
1. Call an existing `admin.*` API method (see `src/lib/api.ts`)
2. Transform the response into the format the component needs
3. Render with Tailwind CSS using existing CSS variables (`--accent-gold`, `--surface`, etc.)

### Available API Endpoints (Already Implemented)

| Endpoint | Returns | Used By |
|----------|---------|---------|
| `admin.dashboard.stats()` | totalProducts, inStock, outOfStock, lowStock, brands, categories, conditions | Health Score, KPIs |
| `admin.dashboard.alerts()` | Stock alerts, missing images, urgent RFQs | Emergency Panel |
| `admin.dashboard.activity(limit)` | Recent actions (entityType, action, entityName, createdAt) | Activity Feed |
| `admin.orders.list(params)` | Orders with items, totals, status, country, dates | Revenue, Sales, Delivery |
| `admin.rfqs.list(params)` | RFQs with urgency, status, customer, dates | RFQ metrics |
| `admin.offers.list(params)` | Offers with prices, status, dates | Offer metrics |
| `admin.customers.list(params)` | Customers with orders, spend, dates | CLV, Segmentation |
| `admin.products.list(params)` | Products with stock, price, category, brand | Stock, Dead Stock |
| `admin.audit.list(params)` | Audit logs with action, entity, actor, timestamp | Audit Viewer |
| `admin.messages.list(params)` | Contact messages with status | Message metrics |
| `storefront.orders.list(params)` | Customer orders (with auth) | Return Analytics |

---

## 2. Shared Utilities

### `src/hooks/useDashboardData.ts` — Centralized Data Hook

```typescript
import { useState, useEffect, useCallback } from 'react'
import { admin } from '../lib/api'

interface DashboardData {
  stats: any
  alerts: any[]
  activity: any[]
  orders: any[]
  rfqs: any[]
  offers: any[]
  products: any[]
  customers: any[]
  auditLogs: any[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useDashboardData(): DashboardData {
  const [stats, setStats] = useState<any>(null)
  const [alerts, setAlerts] = useState<any[]>([])
  const [activity, setActivity] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [rfqs, setRfqs] = useState<any[]>([])
  const [offers, setOffers] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [statsRes, alertsRes, activityRes, ordersRes, rfqsRes, offersRes, productsRes, customersRes] =
        await Promise.allSettled([
          admin.dashboard.stats(),
          admin.dashboard.alerts(),
          admin.dashboard.activity(50),
          admin.orders.list({ limit: '200' }),
          admin.rfqs.list({ limit: '100' }),
          admin.offers.list({ limit: '100' }),
          admin.products.list({ limit: '500' }),
          admin.customers.list({ limit: '200' }),
        ])

      if (statsRes.status === 'fulfilled') setStats(statsRes.value)
      if (alertsRes.status === 'fulfilled') setAlerts(alertsRes.value.alerts || [])
      if (activityRes.status === 'fulfilled') setActivity(activityRes.value.activity || [])
      if (ordersRes.status === 'fulfilled') setOrders(ordersRes.value.orders || [])
      if (rfqsRes.status === 'fulfilled') setRfqs(rfqsRes.value.rfqs || [])
      if (offersRes.status === 'fulfilled') setOffers(offersRes.value.offers || [])
      if (productsRes.status === 'fulfilled') setProducts(productsRes.value.products || [])
      if (customersRes.status === 'fulfilled') setCustomers(customersRes.value.customers || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  // Fetch audit logs separately (only when needed)
  const fetchAuditLogs = useCallback(async (params?: Record<string, string>) => {
    try {
      const res = await admin.audit.list(params)
      setAuditLogs(res.logs || [])
    } catch { /* ignore */ }
  }, [])

  return { stats, alerts, activity, orders, rfqs, offers, products, customers, auditLogs, loading, error, refresh, fetchAuditLogs }
}
```

### `src/hooks/useLiveOrders.ts` — Polling Hook for Live Data

```typescript
import { useState, useEffect, useCallback, useRef } from 'react'
import { admin } from '../lib/api'

export function useLiveOrders(intervalMs = 30000) {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchOrders = useCallback(async () => {
    try {
      const res = await admin.orders.list({ limit: '20', sort: 'newest' })
      setOrders(res.orders || [])
    } catch { /* retry on next tick */ }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchOrders()
    intervalRef.current = setInterval(fetchOrders, intervalMs)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [fetchOrders, intervalMs])

  return { orders, loading, refresh: fetchOrders }
}
```

### CSS Variables Already Available (from `src/index.css`)

| Variable | Light Value | Dark Value | Use |
|----------|------------|------------|-----|
| `--accent-gold` | `#E8AA24` | `#E8AA24` | Primary accent, buttons, highlights |
| `--accent-blue` | `#3B82F6` | `#60A5FA` | Info, links |
| `--accent-teal` | `#14B8A6` | `#2DD4BF` | Success states |
| `--success` | `#22C55E` | `#4ADE80` | Positive metrics |
| `--danger` | `#EF4444` | `#F87171` | Negative metrics, alerts |
| `--surface` | `#FFFFFF` | `#111827` | Card backgrounds |
| `--surface-soft` | `#F3F4F6` | `#1F2937` | Subtle backgrounds |
| `--text-primary` | `#061522` | `#F9FAFB` | Main text |
| `--text-muted` | `#6B7280` | `#9CA3AF` | Secondary text |
| `--border` | `#E5E7EB` | `#374151` | Borders |

---

## 3. Tier 1 — Quick Wins

### 3.1 Business Health Score

**File:** `src/components/admin/dashboard/BusinessHealthScore.tsx`
**API:** `admin.dashboard.stats()`
**Time:** 30 minutes

#### Algorithm

```
healthScore = (
  (inStockProducts / totalProducts) * 30 +       // Stock health (0-30)
  (1 - lowStockProducts / totalProducts) * 25 +   // Stock risk (0-25)
  (1 - outOfStockProducts / totalProducts) * 25 + // Availability (0-25)
  ((totalProducts - missingImageProducts) / totalProducts) * 20  // Data quality (0-20)
)
```

Score ranges: 0-40 Critical, 41-60 Needs Attention, 61-80 Good, 81-100 Excellent

#### Component

```tsx
import { useMemo } from 'react'
import { ShieldCheck, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react'

interface Props { stats: any }

export function BusinessHealthScore({ stats }: Props) {
  const score = useMemo(() => {
    if (!stats?.totalProducts) return 0
    const total = stats.totalProducts
    const stockHealth = ((stats.inStockProducts || 0) / total) * 30
    const riskReduction = (1 - (stats.lowStockProducts?.length || 0) / total) * 25
    const availability = (1 - (stats.outOfStockProducts || 0) / total) * 25
    const dataQuality = ((total - (stats.missingImageProducts?.length || 0)) / total) * 20
    return Math.round(stockHealth + riskReduction + availability + dataQuality)
  }, [stats])

  const config = score >= 81
    ? { label: 'Excellent', color: 'text-[var(--success)]', bg: 'bg-[var(--success)]/10', icon: ShieldCheck }
    : score >= 61
    ? { label: 'Good', color: 'text-[var(--accent-blue)]', bg: 'bg-[var(--accent-blue)]/10', icon: TrendingUp }
    : score >= 41
    ? { label: 'Needs Attention', color: 'text-[var(--accent-gold)]', bg: 'bg-[var(--accent-gold)]/10', icon: AlertTriangle }
    : { label: 'Critical', color: 'text-[var(--danger)]', bg: 'bg-[var(--danger)]/10', icon: TrendingDown }

  const Icon = config.icon

  return (
    <div className="admin-stat-card">
      <div className="flex items-center gap-3">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${config.bg} ${config.color}`}>
          <Icon size={24} />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Business Health</p>
          <div className="flex items-baseline gap-2">
            <p className="font-display text-3xl font-extrabold text-[var(--text-primary)]">{score}</p>
            <span className={`text-xs font-bold ${config.color}`}>{config.label}</span>
          </div>
        </div>
      </div>
      {/* Breakdown bar */}
      <div className="mt-3 h-2 w-full rounded-full bg-[var(--surface-soft)] overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${config.bg.replace('/10', '')}`}
             style={{ width: `${score}%` }} />
      </div>
      <div className="mt-2 grid grid-cols-4 gap-1 text-[0.5rem]">
        <span className="text-[var(--text-muted)]">Stock</span>
        <span className="text-[var(--text-muted)]">Risk</span>
        <span className="text-[var(--text-muted)]">Avail.</span>
        <span className="text-[var(--text-muted)]">Data</span>
      </div>
    </div>
  )
}
```

---

### 3.2 Smart KPI Center

**File:** `src/components/admin/dashboard/SmartKPIs.tsx`
**API:** `admin.dashboard.stats()`, `admin.orders.list()`, `admin.rfqs.list()`
**Time:** 45 minutes

#### KPIs to Show

| KPI | Formula | Icon | Color |
|-----|---------|------|-------|
| Total Products | `stats.totalProducts` | Package | accent-blue |
| In-Stock Rate | `(inStock / total * 100) + '%'` | CheckCircle | success |
| Stock Value | `sum(product.price * product.stockCount)` | DollarSign | accent-gold |
| Emergency Items | `stats.emergencyProducts` | AlertTriangle | danger |
| New Arrivals | `stats.newArrivals` | Sparkles | accent-teal |
| On Sale Items | `stats.saleProducts` | Tag | accent-gold |
| Open RFQs | `rfqs.filter(r => r.status === 'new').length` | FileText | accent-blue |
| Avg Order Value | `sum(orders.map(o => o.total)) / orders.length` | BarChart3 | accent-teal |

#### Component Structure

```tsx
import { Package, CheckCircle, DollarSign, AlertTriangle, Sparkles, Tag, FileText, BarChart3 } from 'lucide-react'

interface KPI {
  label: string
  value: string
  icon: typeof Package
  color: string
  bg: string
  subtitle?: string
}

interface Props { stats: any; orders: any[]; rfqs: any[]; products: any[] }

export function SmartKPIs({ stats, orders, rfqs, products }: Props) {
  const kpis: KPI[] = useMemo(() => {
    const stockValue = products.reduce((sum, p) => sum + (p.regularPrice || 0) * (p.stockCount || 0), 0)
    const avgOrder = orders.length > 0
      ? orders.reduce((sum, o) => sum + (o.total || 0), 0) / orders.length
      : 0

    return [
      { label: 'Total Products', value: String(stats?.totalProducts || 0), icon: Package, color: 'text-[var(--accent-blue)]', bg: 'bg-[var(--accent-blue)]/10' },
      { label: 'In-Stock Rate', value: `${stats?.totalProducts ? Math.round((stats.inStockProducts / stats.totalProducts) * 100) : 0}%`, icon: CheckCircle, color: 'text-[var(--success)]', bg: 'bg-[var(--success)]/10', subtitle: `${stats?.inStockProducts || 0} of ${stats?.totalProducts || 0}` },
      { label: 'Stock Value', value: `$${stockValue.toLocaleString()}`, icon: DollarSign, color: 'text-[var(--accent-gold)]', bg: 'bg-[var(--accent-gold)]/10' },
      { label: 'Emergency Items', value: String(stats?.emergencyProducts || 0), icon: AlertTriangle, color: 'text-[var(--danger)]', bg: 'bg-[var(--danger)]/10' },
      { label: 'New Arrivals', value: String(stats?.newArrivals || 0), icon: Sparkles, color: 'text-[var(--accent-teal)]', bg: 'bg-[var(--accent-teal)]/10' },
      { label: 'On Sale', value: String(stats?.saleProducts || 0), icon: Tag, color: 'text-[var(--accent-gold)]', bg: 'bg-[var(--accent-gold)]/10' },
      { label: 'Open RFQs', value: String(rfqs.filter((r: any) => r.status === 'new').length), icon: FileText, color: 'text-[var(--accent-blue)]', bg: 'bg-[var(--accent-blue)]/10' },
      { label: 'Avg Order Value', value: `$${Math.round(avgOrder)}`, icon: BarChart3, color: 'text-[var(--accent-teal)]', bg: 'bg-[var(--accent-teal)]/10' },
    ]
  }, [stats, orders, rfqs, products])

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {kpis.map(kpi => {
        const Icon = kpi.icon
        return (
          <div key={kpi.label} className="admin-stat-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">{kpi.label}</p>
                <p className="mt-2 font-display text-2xl font-extrabold text-[var(--text-primary)]">{kpi.value}</p>
                {kpi.subtitle && <p className="mt-1 text-[0.625rem] text-[var(--text-muted)]">{kpi.subtitle}</p>}
              </div>
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${kpi.bg} ${kpi.color}`}>
                <Icon size={18} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

---

### 3.3 CEO Morning Brief

**File:** `src/components/admin/dashboard/CEOBrief.tsx`
**API:** `admin.dashboard.stats()`, `admin.orders.list()`, `admin.rfqs.list()`
**Time:** 45 minutes

#### Layout

```
┌──────────────────────────────────────────────────┐
│  📋 CEO Morning Brief — July 6, 2026            │
├──────────────────────────────────────────────────┤
│                                                  │
│  Revenue Today: $12,450    Orders Today: 8      │
│  RFQs Pending: 3           Stock Alerts: 2      │
│                                                  │
│  ── Top Products (by revenue) ──                 │
│  1. Hydraulic Pump HP-200    $4,200             │
│  2. Marine GPS Garmin        $2,800             │
│  3. ABB Motor VFD-100       $1,999             │
│                                                  │
│  ── Urgent Items ──                              │
│  ⚠️ 2 products critically low stock             │
│  🚨 1 emergency RFQ needs response              │
│                                                  │
│  ── Quick Actions ──                             │
│  [View Orders] [View RFQs] [Check Inventory]    │
└──────────────────────────────────────────────────┘
```

#### Component

```tsx
import { ClipboardList, ShoppingCart, FileText, AlertTriangle, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

interface Props { stats: any; orders: any[]; rfqs: any[]; alerts: any[] }

export function CEOBrief({ stats, orders, rfqs, alerts }: Props) {
  const today = new Date().toISOString().split('T')[0]
  const todayOrders = orders.filter(o => o.createdAt?.startsWith(today))
  const todayRevenue = todayOrders.reduce((sum: number, o: any) => sum + (o.total || 0), 0)
  const pendingRfqs = rfqs.filter((r: any) => r.status === 'new' || r.status === 'in-progress')
  const urgentRfqs = rfqs.filter((r: any) => r.urgency === 'emergency')
  const criticalAlerts = alerts.filter((a: any) => a.type === 'danger')

  const topProducts = [...orders]
    .flatMap((o: any) => o.items || [])
    .reduce((acc: Record<string, { name: string; revenue: number; qty: number }>, item: any) => {
      const key = item.productName || item.name || 'Unknown'
      if (!acc[key]) acc[key] = { name: key, revenue: 0, qty: 0 }
      acc[key].revenue += (item.price || 0) * (item.quantity || 1)
      acc[key].qty += item.quantity || 1
      return acc
    }, {})
  const topProductsList = Object.values(topProducts).sort((a, b) => b.revenue - a.revenue).slice(0, 5)

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <div className="flex items-center gap-2 mb-4">
        <ClipboardList size={20} className="text-[var(--accent-gold)]" />
        <h2 className="font-display text-lg font-extrabold text-[var(--text-primary)]">CEO Morning Brief</h2>
        <span className="ml-auto text-xs text-[var(--text-muted)]">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="rounded-xl bg-[var(--surface-soft)] p-3 text-center">
          <ShoppingCart size={16} className="mx-auto text-[var(--accent-gold)] mb-1" />
          <p className="font-display text-xl font-extrabold text-[var(--text-primary)]">${todayRevenue.toLocaleString()}</p>
          <p className="text-[0.625rem] text-[var(--text-muted)]">Revenue Today</p>
        </div>
        <div className="rounded-xl bg-[var(--surface-soft)] p-3 text-center">
          <FileText size={16} className="mx-auto text-[var(--accent-blue)] mb-1" />
          <p className="font-display text-xl font-extrabold text-[var(--text-primary)]">{todayOrders.length}</p>
          <p className="text-[0.625rem] text-[var(--text-muted)]">Orders Today</p>
        </div>
        <div className="rounded-xl bg-[var(--surface-soft)] p-3 text-center">
          <FileText size={16} className="mx-auto text-[var(--accent-teal)] mb-1" />
          <p className="font-display text-xl font-extrabold text-[var(--text-primary)]">{pendingRfqs.length}</p>
          <p className="text-[0.625rem] text-[var(--text-muted)]">Pending RFQs</p>
        </div>
        <div className="rounded-xl bg-[var(--surface-soft)] p-3 text-center">
          <AlertTriangle size={16} className="mx-auto text-[var(--danger)] mb-1" />
          <p className="font-display text-xl font-extrabold text-[var(--text-primary)]">{criticalAlerts.length + urgentRfqs.length}</p>
          <p className="text-[0.625rem] text-[var(--text-muted)]">Alerts</p>
        </div>
      </div>

      {/* Top Products */}
      {topProductsList.length > 0 && (
        <div className="mb-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">Top Products by Revenue</h3>
          <div className="space-y-1.5">
            {topProductsList.map((p, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-[var(--text-secondary)] font-medium">{i + 1}. {p.name}</span>
                <span className="font-mono font-bold text-[var(--text-primary)]">${p.revenue.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Urgent Items */}
      {urgentRfqs.length > 0 && (
        <div className="rounded-xl border border-[var(--danger)]/20 bg-[var(--danger)]/5 p-3 mb-4">
          <p className="text-xs font-bold text-[var(--danger)]">
            🚨 {urgentRfqs.length} emergency RFQ{urgentRfqs.length !== 1 ? 's' : ''} need immediate response
          </p>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Link to="/admin/orders" className="admin-quick-action"><ShoppingCart size={14} /> View Orders <ArrowRight size={12} /></Link>
        <Link to="/admin/rfqs" className="admin-quick-action"><FileText size={14} /> View RFQs <ArrowRight size={12} /></Link>
        <Link to="/admin/products?filter=low-stock" className="admin-quick-action"><AlertTriangle size={14} /> Check Inventory <ArrowRight size={12} /></Link>
      </div>
    </div>
  )
}
```

---

### 3.4 Stock Health Monitor

**File:** `src/components/admin/dashboard/StockHealthMonitor.tsx`
**API:** `admin.dashboard.stats()`, `admin.products.list()`
**Time:** 30 minutes

#### Component

```tsx
import { Boxes, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

interface Props { stats: any }

export function StockHealthMonitor({ stats }: Props) {
  const total = stats?.totalProducts || 1
  const segments = [
    { label: 'In Stock', count: stats?.inStockProducts || 0, color: 'bg-[var(--success)]', icon: CheckCircle },
    { label: 'Low Stock', count: stats?.lowStockProducts?.length || 0, color: 'bg-[var(--accent-gold)]', icon: AlertTriangle },
    { label: 'Out of Stock', count: stats?.outOfStockProducts || 0, color: 'bg-[var(--danger)]', icon: XCircle },
    { label: 'Emergency', count: stats?.emergencyProducts || 0, color: 'bg-[var(--accent-blue)]', icon: Boxes },
  ]

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <h2 className="font-display text-sm font-bold text-[var(--text-primary)] mb-4">Stock Health</h2>

      {/* Stacked bar */}
      <div className="h-4 w-full rounded-full bg-[var(--surface-soft)] overflow-hidden flex">
        {segments.map(s => (
          <div key={s.label} className={`${s.color} transition-all duration-500`}
               style={{ width: `${(s.count / total) * 100}%` }} />
        ))}
      </div>

      {/* Legend */}
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {segments.map(s => {
          const Icon = s.icon
          return (
            <div key={s.label} className="flex items-center gap-2">
              <div className={`h-2.5 w-2.5 rounded-full ${s.color}`} />
              <span className="text-xs text-[var(--text-muted)]">{s.label}</span>
              <span className="font-mono text-xs font-bold text-[var(--text-primary)]">{s.count}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

---

### 3.5 Audit Log Viewer

**File:** `src/components/admin/dashboard/AuditLogViewer.tsx`
**API:** `admin.audit.list(params)`
**Time:** 45 minutes

#### Component

```tsx
import { useState, useEffect } from 'react'
import { History, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react'
import { admin } from '../../../lib/api'

interface AuditEntry {
  id: string; action: string; entityType: string; entityName: string
  actorName: string; timestamp: string; details?: string
}

export function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [entityFilter, setEntityFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    setLoading(true)
    const params: Record<string, string> = { page: String(page), limit: '20' }
    if (search) params.search = search
    if (entityFilter) params.entityType = entityFilter
    admin.audit.list(params)
      .then((res: any) => { setLogs(res.logs || []); setTotalPages(res.pagination?.totalPages || 1) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [page, search, entityFilter])

  const actionColor = (action: string) => {
    if (action.includes('create') || action.includes('add')) return 'text-[var(--success)]'
    if (action.includes('delete') || action.includes('remove')) return 'text-[var(--danger)]'
    if (action.includes('update') || action.includes('edit')) return 'text-[var(--accent-blue)]'
    return 'text-[var(--text-muted)]'
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="flex items-center gap-2 mb-4">
        <History size={16} className="text-[var(--accent-gold)]" />
        <h2 className="font-display text-sm font-bold text-[var(--text-primary)]">Audit Log</h2>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
                 placeholder="Search audit logs..."
                 className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] py-2 pl-9 pr-3 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-gold)]" />
        </div>
        <select value={entityFilter} onChange={e => { setEntityFilter(e.target.value); setPage(1) }}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-xs text-[var(--text-primary)] outline-none">
          <option value="">All entities</option>
          <option value="product">Products</option>
          <option value="order">Orders</option>
          <option value="rfq">RFQs</option>
          <option value="offer">Offers</option>
          <option value="customer">Customers</option>
          <option value="settings">Settings</option>
        </select>
      </div>

      {/* Log entries */}
      <div className="space-y-2">
        {loading ? (
          <p className="text-center text-xs text-[var(--text-muted)] py-8">Loading...</p>
        ) : logs.length === 0 ? (
          <p className="text-center text-xs text-[var(--text-muted)] py-8">No audit logs found</p>
        ) : (
          logs.map(log => (
            <div key={log.id} className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-[var(--surface-soft)] transition-colors">
              <span className={`font-mono text-[0.625rem] font-bold uppercase ${actionColor(log.action)}`}>{log.action}</span>
              <span className="text-xs font-semibold text-[var(--text-primary)]">{log.entityName || log.entityType}</span>
              <span className="text-[0.625rem] text-[var(--text-muted)]">by {log.actorName}</span>
              <span className="ml-auto text-[0.625rem] text-[var(--text-muted)] whitespace-nowrap">
                {new Date(log.timestamp).toLocaleString()}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                className="rounded-lg p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-30">
          <ChevronLeft size={16} />
        </button>
        <span className="text-xs text-[var(--text-muted)]">Page {page} of {totalPages}</span>
        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                className="rounded-lg p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-30">
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
```

---

### 3.6 Order Fulfillment Monitor

**File:** `src/components/admin/dashboard/OrderFulfillment.tsx`
**API:** `admin.orders.list()`
**Time:** 40 minutes

#### Component

```tsx
import { Package, Truck, CheckCircle, Clock, XCircle } from 'lucide-react'

interface Props { orders: any[] }

const stages = [
  { key: 'pending', label: 'Pending', icon: Clock, color: 'text-[var(--accent-gold)]', bg: 'bg-[var(--accent-gold)]/10' },
  { key: 'confirmed', label: 'Confirmed', icon: Package, color: 'text-[var(--accent-blue)]', bg: 'bg-[var(--accent-blue)]/10' },
  { key: 'processing', label: 'Processing', icon: Package, color: 'text-[var(--accent-teal)]', bg: 'bg-[var(--accent-teal)]/10' },
  { key: 'shipped', label: 'Shipped', icon: Truck, color: 'text-[var(--accent-gold)]', bg: 'bg-[var(--accent-gold)]/10' },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle, color: 'text-[var(--success)]', bg: 'bg-[var(--success)]/10' },
]

export function OrderFulfillment({ orders }: Props) {
  const counts = stages.reduce((acc, s) => {
    acc[s.key] = orders.filter(o => o.status === s.key).length
    return acc
  }, {} as Record<string, number>)
  const cancelled = orders.filter(o => o.status === 'cancelled').length

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <h2 className="font-display text-sm font-bold text-[var(--text-primary)] mb-4">Order Fulfillment Pipeline</h2>
      <div className="flex items-center gap-2 overflow-x-auto">
        {stages.map((s, i) => {
          const Icon = s.icon
          return (
            <div key={s.key} className="flex items-center gap-2 shrink-0">
              <div className={`flex flex-col items-center rounded-xl px-4 py-3 ${s.bg} min-w-[80px]`}>
                <Icon size={18} className={s.color} />
                <span className="font-display text-lg font-extrabold text-[var(--text-primary)] mt-1">{counts[s.key] || 0}</span>
                <span className="text-[0.5rem] font-bold text-[var(--text-muted)] uppercase">{s.label}</span>
              </div>
              {i < stages.length - 1 && (
                <div className="text-[var(--text-muted)]">→</div>
              )}
            </div>
          )
        })}
      </div>
      {cancelled > 0 && (
        <div className="mt-3 flex items-center gap-2 text-xs text-[var(--danger)]">
          <XCircle size={14} />
          <span>{cancelled} cancelled order{cancelled !== 1 ? 's' : ''}</span>
        </div>
      )}
    </div>
  )
}
```

---

### 3.7 Emergency Alert Panel

**File:** `src/components/admin/dashboard/EmergencyPanel.tsx`
**API:** `admin.dashboard.alerts()`, `admin.rfqs.list()`
**Time:** 30 minutes

#### Component

```tsx
import { AlertTriangle, Phone, Mail, Clock, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

interface Props { alerts: any[]; rfqs: any[] }

export function EmergencyPanel({ alerts, rfqs }: Props) {
  const emergencyRfqs = rfqs.filter(r => r.urgency === 'emergency' && r.status !== 'closed')
  const dangerAlerts = alerts.filter(a => a.type === 'danger')
  const hasUrgent = emergencyRfqs.length > 0 || dangerAlerts.length > 0

  if (!hasUrgent) return null

  return (
    <div className="rounded-2xl border-2 border-[var(--danger)]/30 bg-[var(--danger)]/5 p-5">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle size={18} className="text-[var(--danger)] animate-pulse" />
        <h2 className="font-display text-sm font-bold text-[var(--danger)]">Emergency Alerts</h2>
        <span className="ml-auto rounded-full bg-[var(--danger)] px-2 py-0.5 text-[0.5rem] font-bold text-white">
          {emergencyRfqs.length + dangerAlerts.length}
        </span>
      </div>

      <div className="space-y-2">
        {emergencyRfqs.map(rfq => (
          <div key={rfq.id} className="flex items-center justify-between rounded-xl bg-white/50 dark:bg-black/20 px-3 py-2">
            <div>
              <p className="text-xs font-bold text-[var(--text-primary)]">{rfq.fullName || rfq.company || 'Unknown'} — {rfq.productDescription?.slice(0, 60) || 'RFQ Request'}</p>
              <p className="text-[0.625rem] text-[var(--text-muted)]">{rfq.country} · {rfq.email}</p>
            </div>
            <div className="flex gap-1">
              <a href={`tel:${rfq.phone}`} className="rounded-lg bg-[var(--accent-blue)]/10 p-1.5 text-[var(--accent-blue)] hover:bg-[var(--accent-blue)]/20"><Phone size={12} /></a>
              <a href={`mailto:${rfq.email}`} className="rounded-lg bg-[var(--accent-gold)]/10 p-1.5 text-[var(--accent-gold)] hover:bg-[var(--accent-gold)]/20"><Mail size={12} /></a>
            </div>
          </div>
        ))}
        {dangerAlerts.map((a, i) => (
          <div key={i} className="flex items-center gap-2 rounded-xl bg-white/50 dark:bg-black/20 px-3 py-2">
            <AlertTriangle size={14} className="text-[var(--danger)] shrink-0" />
            <span className="text-xs text-[var(--text-secondary)]">{a.message || 'Stock alert'}</span>
          </div>
        ))}
      </div>

      <Link to="/admin/rfqs?urgency=emergency" className="mt-3 flex items-center gap-1 text-xs font-bold text-[var(--danger)] hover:underline">
        View all emergency RFQs <ArrowRight size={12} />
      </Link>
    </div>
  )
}
```

---

### 3.8 Daily Business Snapshot

**File:** `src/components/admin/dashboard/DailySnapshot.tsx`
**API:** `admin.orders.list()`, `admin.rfqs.list()`, `admin.dashboard.stats()`
**Time:** 40 minutes

#### Component

```tsx
import { Calendar, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface Props { orders: any[]; rfqs: any[]; stats: any }

export function DailySnapshot({ orders, rfqs, stats }: Props) {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const todayStr = today.toISOString().split('T')[0]
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  const todayOrders = orders.filter(o => o.createdAt?.startsWith(todayStr))
  const yesterdayOrders = orders.filter(o => o.createdAt?.startsWith(yesterdayStr))
  const todayRevenue = todayOrders.reduce((s, o) => s + (o.total || 0), 0)
  const yesterdayRevenue = yesterdayOrders.reduce((s, o) => s + (o.total || 0), 0)

  const todayRfqs = rfqs.filter(r => r.createdAt?.startsWith(todayStr))
  const yesterdayRfqs = rfqs.filter(r => r.createdAt?.startsWith(yesterdayStr))

  const diff = (today: number, yesterday: number) => {
    if (yesterday === 0) return { value: today === 0 ? 0 : 100, direction: 'up' as const }
    const pct = ((today - yesterday) / yesterday) * 100
    return { value: Math.abs(Math.round(pct)), direction: pct > 0 ? 'up' as const : pct < 0 ? 'down' as const : 'flat' as const }
  }

  const metrics = [
    { label: 'Revenue', today: `$${todayRevenue.toLocaleString()}`, diff: diff(todayRevenue, yesterdayRevenue) },
    { label: 'Orders', today: String(todayOrders.length), diff: diff(todayOrders.length, yesterdayOrders.length) },
    { label: 'RFQs', today: String(todayRfqs.length), diff: diff(todayRfqs.length, yesterdayRfqs.length) },
  ]

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="flex items-center gap-2 mb-4">
        <Calendar size={16} className="text-[var(--accent-gold)]" />
        <h2 className="font-display text-sm font-bold text-[var(--text-primary)]">Daily Snapshot</h2>
        <span className="ml-auto text-[0.625rem] text-[var(--text-muted)]">vs yesterday</span>
      </div>
      <div className="space-y-3">
        {metrics.map(m => (
          <div key={m.label} className="flex items-center justify-between">
            <span className="text-xs text-[var(--text-secondary)]">{m.label}</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-[var(--text-primary)]">{m.today}</span>
              <span className={`flex items-center gap-0.5 text-[0.625rem] font-bold ${
                m.diff.direction === 'up' ? 'text-[var(--success)]' :
                m.diff.direction === 'down' ? 'text-[var(--danger)]' : 'text-[var(--text-muted)]'
              }`}>
                {m.diff.direction === 'up' ? <TrendingUp size={10} /> :
                 m.diff.direction === 'down' ? <TrendingDown size={10} /> : <Minus size={10} />}
                {m.diff.value}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

## 4. Tier 2 — Medium Effort

### 4.1 Revenue Pulse

**File:** `src/components/admin/dashboard/RevenuePulse.tsx`
**API:** `admin.orders.list({ limit: '200' })`
**Time:** 1.5 hours

#### Algorithm

Group orders by date, sum totals per day, render as a simple CSS bar chart (no chart library needed).

```tsx
// Pseudocode for grouping:
const revenueByDate = orders
  .filter(o => o.status !== 'cancelled')
  .reduce((acc, order) => {
    const date = order.createdAt?.split('T')[0]
    if (date) acc[date] = (acc[date] || 0) + (order.total || 0)
    return acc
  }, {} as Record<string, number>)

// Then render as horizontal bars:
// Each bar's width = (dayRevenue / maxRevenue) * 100%
```

#### Visual

```
Revenue Pulse — Last 30 Days
│
│ ██████████████████████  Jul 5  $8,420
│ ████████████████        Jul 4  $6,150
│ ████████████████████████ Jul 3  $9,200
│ ██████████████          Jul 2  $5,340
│ ████████                Jul 1  $3,100
│
│ Total: $32,210  |  Avg: $6,442/day  |  Peak: Jul 3
```

---

### 4.2 Dead Stock Analyzer

**File:** `src/components/admin/dashboard/DeadStockAnalyzer.tsx`
**API:** `admin.products.list({ limit: '500' })`, `admin.orders.list({ limit: '200' })`
**Time:** 1.5 hours

#### Algorithm

```tsx
// 1. Get all products
// 2. Get all orders from last 90 days
// 3. Extract product IDs that appear in any order
// 4. Dead stock = products NOT in any recent order AND stockCount > 0

const recentOrderProductIds = new Set(
  orders.flatMap(o => (o.items || []).map(item => item.productId).filter(Boolean))
)
const deadStock = products.filter(p =>
  p.stockCount > 0 && !recentOrderProductIds.has(p.id)
)
```

#### Display

Show as a table with columns: Product Name, SKU, Brand, Category, Stock Count, Last Listed Date, Action (archive / mark down / feature).

---

### 4.3 Live Sales Tracker

**File:** `src/components/admin/dashboard/LiveSalesTracker.tsx`
**Hook:** `src/hooks/useLiveOrders.ts`
**Time:** 1 hour

#### Component

```tsx
import { useLiveOrders } from '../../../hooks/useLiveOrders'
import { ShoppingCart, Loader2 } from 'lucide-react'

export function LiveSalesTracker() {
  const { orders, loading } = useLiveOrders(30000) // poll every 30s

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="flex items-center gap-2 mb-4">
        <ShoppingCart size={16} className="text-[var(--accent-teal)]" />
        <h2 className="font-display text-sm font-bold text-[var(--text-primary)]">Live Sales</h2>
        <span className="ml-2 h-2 w-2 rounded-full bg-[var(--success)] animate-pulse" />
      </div>
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-[var(--accent-gold)]" /></div>
      ) : (
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {orders.slice(0, 15).map(order => (
            <div key={order.id} className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-[var(--surface-soft)] transition-colors">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${
                  order.status === 'delivered' ? 'bg-[var(--success)]' :
                  order.status === 'shipped' ? 'bg-[var(--accent-blue)]' :
                  order.status === 'cancelled' ? 'bg-[var(--danger)]' :
                  'bg-[var(--accent-gold)]'
                }`} />
                <div>
                  <p className="text-xs font-semibold text-[var(--text-primary)]">{order.orderNumber || order.id}</p>
                  <p className="text-[0.625rem] text-[var(--text-muted)]">{order.customer?.name || order.email || 'Customer'}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-mono text-xs font-bold text-[var(--text-primary)]">${(order.total || 0).toLocaleString()}</p>
                <p className="text-[0.625rem] text-[var(--text-muted)]">{new Date(order.createdAt).toLocaleTimeString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

---

### 4.4 Money Leakage Detector

**File:** `src/components/admin/dashboard/MoneyLeakDetector.tsx`
**API:** `admin.orders.list({ limit: '200' })`
**Time:** 1.5 hours

#### Algorithm

```tsx
// Revenue leakage = sum of:
const cancelledRevenue = cancelledOrders.reduce((s, o) => s + (o.total || 0), 0)
const avgDiscount = totalOrders.length > 0
  ? totalOrders.reduce((s, o) => s + ((o.subtotal || 0) - (o.total || 0)), 0) / totalOrders.length
  : 0
const totalDiscounts = totalOrders.reduce((s, o) => s + Math.max(0, (o.subtotal || 0) - (o.total || 0)), 0)

// Display
// - Total cancelled revenue
// - Total discounts given
// - Average discount per order
// - Estimated monthly leakage
// - Recommendations: "3 orders cancelled > $500 — review return policy"
```

---

### 4.5 Customer Lifetime Value

**File:** `src/components/admin/dashboard/CustomerLifetimeValue.tsx`
**API:** `admin.orders.list({ limit: '500' })`, `admin.customers.list({ limit: '200' })`
**Time:** 1.5 hours

#### Algorithm

```tsx
// Group orders by customer email
const customerSpend = orders.reduce((acc, order) => {
  const email = order.email || order.customerEmail
  if (!email) return acc
  if (!acc[email]) acc[email] = { email, name: order.customerName || email, totalSpend: 0, orderCount: 0, firstOrder: order.createdAt, lastOrder: order.createdAt }
  acc[email].totalSpend += order.total || 0
  acc[email].orderCount++
  if (order.createdAt < acc[email].firstOrder) acc[email].firstOrder = order.createdAt
  if (order.createdAt > acc[email].lastOrder) acc[email].lastOrder = order.createdAt
  return acc
}, {} as Record<string, any>)

// Sort by total spend descending
const topCustomers = Object.values(customerSpend).sort((a, b) => b.totalSpend - a.totalSpend)
```

#### Display

Ranked table: Rank, Customer Name, Email, Total Spend, Order Count, Avg Order Value, Last Order, Status (Active / At Risk / Churned).

---

### 4.6 Churn Predictor

**File:** `src/components/admin/dashboard/ChurnPredictor.tsx`
**API:** `admin.orders.list({ limit: '500' })`, `admin.customers.list({ limit: '200' })`
**Time:** 1 hour

#### Algorithm

```tsx
// A customer is "churned" if their last order was > 60 days ago
// A customer is "at risk" if last order was 30-60 days ago
// A customer is "active" if last order was < 30 days ago

const now = Date.now()
const DAY = 86400000

const customersWithStatus = customerSpend.map(c => {
  const daysSinceLastOrder = (now - new Date(c.lastOrder).getTime()) / DAY
  return {
    ...c,
    status: daysSinceLastOrder < 30 ? 'active' : daysSinceLastOrder < 60 ? 'at-risk' : 'churned',
    daysSinceLastOrder: Math.round(daysSinceLastOrder),
  }
})
```

#### Display

Pie chart (CSS-based): Active (green), At Risk (gold), Churned (red). Below: table of at-risk and churned customers with "Send Win-Back" action buttons.

---

### 4.7 Regional Sales Heatmap

**File:** `src/components/admin/dashboard/RegionalHeatmap.tsx`
**API:** `admin.orders.list({ limit: '500' })`
**Time:** 1.5 hours

#### Algorithm

```tsx
const countryRevenue = orders.reduce((acc, order) => {
  const country = order.shipping?.country || order.country || 'Unknown'
  acc[country] = (acc[country] || 0) + (order.total || 0)
  return acc
}, {} as Record<string, number>)

// Sort by revenue descending, take top 10
const topCountries = Object.entries(countryRevenue)
  .sort(([, a], [, b]) => b - a)
  .slice(0, 10)
```

#### Display

Horizontal bar chart with country flag emoji, country name, revenue bar (width proportional to max), and percentage. Uses pure CSS, no charting library.

---

### 4.8 Customer Segmentation Hub

**File:** `src/components/admin/dashboard/CustomerSegmentation.tsx`
**API:** `admin.orders.list({ limit: '500' })`, `admin.customers.list({ limit: '200' })`
**Time:** 2 hours

#### Algorithm — RFM Segmentation

```tsx
// R = Recency: days since last order (lower = better)
// F = Frequency: total order count (higher = better)
// M = Monetary: total spend (higher = better)

// Score each dimension 1-5 (quintiles)
function scoreQuintile(values: number[], value: number): number {
  const sorted = [...values].sort((a, b) => a - b)
  const quintiles = [sorted.length * 0.2, sorted.length * 0.4, sorted.length * 0.6, sorted.length * 0.8]
  if (value <= sorted[quintiles[0]]) return 1
  if (value <= sorted[quintiles[1]]) return 2
  if (value <= sorted[quintiles[2]]) return 3
  if (value <= sorted[quintiles[3]]) return 4
  return 5
}

// Segments:
// Champions: R=5, F=4-5, M=4-5
// Loyal: F=4-5, M=3-5
// Potential Loyalists: R=3-4, F=2-3
// At Risk: R=1-2, F=3-5
// Hibernating: R=1-2, F=1-2
// Lost: R=1, F=1, M=1
```

#### Display

Grid of segment cards, each showing segment name, count, color, and list of customers. Click a segment to see its customers.

---

### 4.9 Payment Health Monitor

**File:** `src/components/admin/dashboard/PaymentHealth.tsx`
**API:** `admin.orders.list({ limit: '200' })`
**Time:** 45 minutes

#### Component

```tsx
interface Props { orders: any[] }

export function PaymentHealth({ orders }: Props) {
  const paymentStats = orders.reduce((acc, order) => {
    const method = order.paymentMethod || 'unknown'
    if (!acc[method]) acc[method] = { total: 0, paid: 0, pending: 0, failed: 0, revenue: 0 }
    acc[method].total++
    if (order.paymentStatus === 'paid' || order.status === 'confirmed' || order.status === 'shipped' || order.status === 'delivered') {
      acc[method].paid++
      acc[method].revenue += order.total || 0
    } else if (order.paymentStatus === 'pending') {
      acc[method].pending++
    } else if (order.paymentStatus === 'failed') {
      acc[method].failed++
    }
    return acc
  }, {} as Record<string, any>)

  // Render as cards per payment method with paid/pending/failed breakdown
  // Plus overall success rate percentage
}
```

---

### 4.10 Product Performance Matrix

**File:** `src/components/admin/dashboard/ProductPerformance.tsx`
**API:** `admin.products.list({ limit: '500' })`, `admin.orders.list({ limit: '500' })`
**Time:** 2 hours

#### Algorithm

```tsx
// For each product, calculate:
const productMetrics = products.map(p => {
  const productOrders = orders.filter(o => (o.items || []).some(i => i.productId === p.id))
  const totalSold = productOrders.reduce((s, o) => {
    const item = o.items.find(i => i.productId === p.id)
    return s + (item?.quantity || 0)
  }, 0)
  const revenue = productOrders.reduce((s, o) => {
    const item = o.items.find(i => i.productId === p.id)
    return s + (item?.price || 0) * (item?.quantity || 0)
  }, 0)

  return {
    ...p,
    totalSold,
    revenue,
    sellThroughRate: p.stockCount > 0 ? (totalSold / (totalSold + p.stockCount)) * 100 : 0,
    daysSinceAdded: (Date.now() - new Date(p.createdAt).getTime()) / 86400000,
    velocityPerDay: totalSold / Math.max(1, (Date.now() - new Date(p.createdAt).getTime()) / 86400000),
  }
})

// Score each product on a 2x2 matrix:
// X axis = Revenue (low → high)
// Y axis = Velocity (slow → fast)
//
// Quadrant 1 (High Revenue, High Velocity) = ⭐ Stars
// Quadrant 2 (Low Revenue, High Velocity) = 🌱 Rising Stars (promote more)
// Quadrant 3 (High Revenue, Low Velocity) = 💎 Cash Cows (maintain)
// Quadrant 4 (Low Revenue, Low Velocity) = ❓ Underperformers (review/markdown)
```

#### Display

Quadrant grid with products placed in each quadrant. Color-coded: Stars (gold), Rising Stars (teal), Cash Cows (blue), Underperformers (gray).

---

### 4.11 Cart Abandonment Tracker

**File:** `src/components/admin/dashboard/CartAbandonment.tsx`
**API:** `admin.orders.list()`
**Time:** 1 hour

#### Algorithm

```tsx
// If the store tracks cart sessions (storefront side), compare:
// - Carts created (storefront.sessions or a new endpoint)
// - Orders placed
// - Abandonment rate = (carts - orders) / carts * 100

// Fallback: use a simplified metric
// - Count unique visitors who reached checkout (from orders with status 'pending' that never progressed)
const abandonedCheckouts = orders.filter(o => o.status === 'pending' && daysSince(o.createdAt) > 7)
const completedOrders = orders.filter(o => ['confirmed', 'shipped', 'delivered'].includes(o.status))
const abandonmentRate = completedOrders.length > 0
  ? (abandonedCheckouts.length / (abandonedCheckouts.length + completedOrders.length)) * 100
  : 0
```

---

### 4.12 Delivery Performance Monitor

**File:** `src/components/admin/dashboard/DeliveryPerformance.tsx`
**API:** `admin.orders.list({ limit: '200' })`
**Time:** 1 hour

#### Algorithm

```tsx
const deliveredOrders = orders.filter(o => o.status === 'delivered' && o.deliveredAt)
const deliveryTimes = deliveredOrders.map(o => {
  const created = new Date(o.createdAt).getTime()
  const delivered = new Date(o.deliveredAt).getTime()
  return (delivered - created) / 86400000 // days
})

const avgDeliveryDays = deliveryTimes.length > 0
  ? deliveryTimes.reduce((s, d) => s + d, 0) / deliveryTimes.length
  : 0
const onTimeRate = deliveryTimes.filter(d => d <= 7).length / Math.max(1, deliveryTimes.length) * 100

// Display: average delivery time, on-time percentage, histogram of delivery times
```

---

### 4.13 Restock Predictor

**File:** `src/components/admin/dashboard/RestockPredictor.tsx`
**API:** `admin.products.list({ limit: '500' })`, `admin.orders.list({ limit: '500' })`
**Time:** 1.5 hours

#### Algorithm

```tsx
// For each low-stock product:
const lowStockProducts = products.filter(p => p.stockCount <= (p.lowStockThreshold || 10))

const restockRecommendations = lowStockProducts.map(p => {
  const productOrders = orders.filter(o =>
    o.status !== 'cancelled' && (o.items || []).some(i => i.productId === p.id)
  )
  const totalSold = productOrders.reduce((s, o) => {
    const item = (o.items || []).find(i => i.productId === p.id)
    return s + (item?.quantity || 0)
  }, 0)
  const daysOfHistory = 90 // assume 90-day window
  const avgDailySales = totalSold / daysOfHistory
  const daysUntilStockout = avgDailySales > 0 ? p.stockCount / avgDailySales : Infinity
  const reorderQuantity = Math.ceil(avgDailySales * 30) // 30-day buffer

  return {
    ...p,
    avgDailySales: Math.round(avgDailySales * 100) / 100,
    daysUntilStockout: Math.round(daysUntilStockout),
    reorderQuantity,
    priority: daysUntilStockout < 7 ? 'urgent' : daysUntilStockout < 14 ? 'soon' : 'normal',
  }
}).sort((a, b) => a.daysUntilStockout - b.daysUntilStockout)
```

---

### 4.14 Return Analytics

**File:** `src/components/admin/dashboard/ReturnAnalytics.tsx`
**API:** `admin.orders.list({ limit: '200' })`
**Time:** 1 hour

#### Algorithm

```tsx
const cancelledOrders = orders.filter(o => o.status === 'cancelled' || o.status === 'refunded')
const returnRate = orders.length > 0 ? (cancelledOrders.length / orders.length) * 100 : 0
const totalRefunded = cancelledOrders.reduce((s, o) => s + (o.total || 0), 0)

// Group by reason if available
const reasons = cancelledOrders.reduce((acc, o) => {
  const reason = o.cancellationReason || o.cancelReason || 'Not specified'
  acc[reason] = (acc[reason] || 0) + 1
  return acc
}, {} as Record<string, number>)

// Trend: returns by week
```

---

### 4.15 VIP Customer Monitor

**File:** `src/components/admin/dashboard/VIPMonitor.tsx`
**API:** `admin.orders.list({ limit: '500' })`
**Time:** 1 hour

#### Algorithm

```tsx
// Reuse CustomerLifetimeValue calculation
// Then show top 10 customers with:
// - Total spend
// - Order count
// - Average order value
// - Days since last order
// - Status badge (Gold VIP if spend > $10K, Silver if > $5K)
// - Trend arrow (up/down vs previous period)
```

---

### 4.16 Sales Trend Analyzer

**File:** `src/components/admin/dashboard/SalesTrendAnalyzer.tsx`
**API:** `admin.orders.list({ limit: '200' })`
**Time:** 1.5 hours

#### Algorithm

```tsx
// Group orders by week
const weeklyRevenue = orders
  .filter(o => o.status !== 'cancelled')
  .reduce((acc, order) => {
    const weekStart = getWeekStart(order.createdAt)
    acc[weekStart] = (acc[weekStart] || 0) + (order.total || 0)
    return acc
  }, {} as Record<string, number>)

// Compare current week vs previous week
// Calculate week-over-week growth rate
// Identify trending categories
// Show simple CSS sparkline (last 12 weeks)
```

---

## 5. Tier 3 — Composite Features

These combine multiple Tier 1/2 features into one page.

### 5.1 Executive Dashboard

**File:** `src/components/admin/dashboard/ExecutiveDashboard.tsx`
**Time:** 2 hours

Composes: BusinessHealthScore + SmartKPIs + CEOBrief + RevenuePulse + OrderFulfillment + EmergencyPanel

### 5.2 Financial Command Center

**File:** `src/components/admin/dashboard/FinancialCenter.tsx`
**Time:** 3 hours

Composes: RevenuePulse + PaymentHealth + ReturnAnalytics + MoneyLeakDetector + GoalTracker

### 5.3 Real-Time Activity Stream

**File:** `src/components/admin/dashboard/RealTimeStream.tsx`
**Time:** 1 hour

Composes: LiveSalesTracker + CustomerActivityFeed + AuditLogViewer (filtered to recent)

### 5.4 Inventory Risk Radar

**File:** `src/components/admin/dashboard/InventoryRisk.tsx`
**Time:** 2 hours

Composes: StockHealthMonitor + DeadStockAnalyzer + RestockPredictor + MoneyLeakDetector

### 5.5 Goal Tracker

**File:** `src/components/admin/dashboard/GoalTracker.tsx`
**Time:** 2 hours

#### Implementation

Goals are stored in `localStorage` (fast, free, no backend change needed):

```tsx
interface Goal {
  id: string
  label: string
  target: number
  current: number
  period: 'monthly' | 'quarterly' | 'yearly'
  category: 'revenue' | 'orders' | 'customers' | 'products'
}

// Load/save goals from localStorage
const GOALS_KEY = 'alka-admin-goals'

function loadGoals(): Goal[] {
  try { return JSON.parse(localStorage.getItem(GOALS_KEY) || '[]') } catch { return [] }
}

function saveGoals(goals: Goal[]) {
  localStorage.setItem(GOALS_KEY, JSON.stringify(goals))
}

// Calculate current values from order/product data
// Render as progress bars with percentage and ETA
```

---

## 6. Routing & Navigation

### Add to Admin Sidebar

Add a new "Insights" section to `src/components/admin/AdminSidebar.tsx`:

```tsx
// In the sidebar navigation items array, add:
{
  label: 'Insights',
  icon: <BarChart3 size={18} />,
  to: '/admin/insights',
  permission: 'dashboard', // reuse existing permission
}
```

### Add Route

In `src/App.tsx` (or wherever admin routes are defined):

```tsx
const AdminInsights = lazy(() => import('./pages/admin/AdminInsights'))

// In the admin routes:
<Route path="/admin/insights" element={<AdminInsights />} />
```

### AdminInsights Page Layout

```tsx
// src/pages/admin/AdminInsights.tsx
import { useDashboardData } from '../../hooks/useDashboardData'
import { BusinessHealthScore } from '../../components/admin/dashboard/BusinessHealthScore'
import { SmartKPIs } from '../../components/admin/dashboard/SmartKPIs'
import { CEOBrief } from '../../components/admin/dashboard/CEOBrief'
import { RevenuePulse } from '../../components/admin/dashboard/RevenuePulse'
// ... import all components

export default function AdminInsights() {
  const data = useDashboardData()

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-extrabold text-[var(--text-primary)]">Business Insights</h1>

      {/* Row 1: Health + KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <BusinessHealthScore stats={data.stats} />
        <div className="lg:col-span-2">
          <SmartKPIs stats={data.stats} orders={data.orders} rfqs={data.rfqs} products={data.products} />
        </div>
      </div>

      {/* Row 2: Emergency Panel (only shows if urgent) */}
      <EmergencyPanel alerts={data.alerts} rfqs={data.rfqs} />

      {/* Row 3: CEO Brief + Daily Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CEOBrief stats={data.stats} orders={data.orders} rfqs={data.rfqs} alerts={data.alerts} />
        <DailySnapshot orders={data.orders} rfqs={data.rfqs} stats={data.stats} />
      </div>

      {/* Row 4: Revenue + Order Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenuePulse orders={data.orders} />
        <OrderFulfillment orders={data.orders} />
      </div>

      {/* Row 5: Stock + Dead Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StockHealthMonitor stats={data.stats} />
        <DeadStockAnalyzer products={data.products} orders={data.orders} />
      </div>

      {/* Row 6: Customer Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <CustomerLifetimeValue orders={data.orders} />
        <VIPMonitor orders={data.orders} />
        <ChurnPredictor orders={data.orders} customers={data.customers} />
      </div>

      {/* Row 7: Financial */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PaymentHealth orders={data.orders} />
        <MoneyLeakDetector orders={data.orders} />
      </div>

      {/* Row 8: Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DeliveryPerformance orders={data.orders} />
        <RestockPredictor products={data.products} orders={data.orders} />
      </div>

      {/* Row 9: Geography + Segmentation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RegionalHeatmap orders={data.orders} />
        <CustomerSegmentation orders={data.orders} customers={data.customers} />
      </div>

      {/* Row 10: Product Performance */}
      <ProductPerformance products={data.products} orders={data.orders} />

      {/* Row 11: Audit Log */}
      <AuditLogViewer />
    </div>
  )
}
```

---

## 7. Testing Strategy

### Unit Tests

For each computation-heavy component, create a test file:

```
src/test/dashboard/
├── BusinessHealthScore.test.ts
├── DeadStockAnalyzer.test.ts
├── CustomerLifetimeValue.test.ts
├── ChurnPredictor.test.ts
├── RestockPredictor.test.ts
├── MoneyLeakDetector.test.ts
├── RegionalHeatmap.test.ts
├── CustomerSegmentation.test.ts
└── ProductPerformance.test.ts
```

Example test:

```typescript
// src/test/dashboard/DeadStockAnalyzer.test.ts
import { describe, it, expect } from 'vitest'

function findDeadStock(products: any[], orders: any[]) {
  const recentProductIds = new Set(
    orders.flatMap(o => (o.items || []).map((i: any) => i.productId).filter(Boolean))
  )
  return products.filter(p => p.stockCount > 0 && !recentProductIds.has(p.id))
}

describe('DeadStockAnalyzer', () => {
  it('identifies products with stock but no recent orders', () => {
    const products = [
      { id: 'p1', name: 'Active Product', stockCount: 10 },
      { id: 'p2', name: 'Dead Product', stockCount: 5 },
      { id: 'p3', name: 'Out of Stock', stockCount: 0 },
    ]
    const orders = [{ items: [{ productId: 'p1' }] }]
    const result = findDeadStock(products, orders)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('p2')
  })

  it('returns empty when all products have recent orders', () => {
    const products = [{ id: 'p1', stockCount: 10 }]
    const orders = [{ items: [{ productId: 'p1' }] }]
    expect(findDeadStock(products, orders)).toHaveLength(0)
  })

  it('excludes out-of-stock products', () => {
    const products = [{ id: 'p1', stockCount: 0 }]
    expect(findDeadStock(products, [])).toHaveLength(0)
  })
})
```

### Run Tests

```bash
npx vitest run src/test/dashboard/
```

---

## Implementation Priority Order

Build in this order for maximum impact with minimum effort:

| Phase | Features | Total Time |
|-------|----------|------------|
| **Phase 1** | BusinessHealthScore, SmartKPIs, CEOBrief, StockHealthMonitor, EmergencyPanel | ~2.5 hours |
| **Phase 2** | RevenuePulse, OrderFulfillment, LiveSalesTracker, DailySnapshot | ~4 hours |
| **Phase 3** | DeadStockAnalyzer, RestockPredictor, MoneyLeakDetector, PaymentHealth | ~5 hours |
| **Phase 4** | CustomerLifetimeValue, VIPMonitor, ChurnPredictor, CustomerSegmentation | ~5.5 hours |
| **Phase 5** | AuditLogViewer, DeliveryPerformance, ReturnAnalytics, RegionalHeatmap | ~5 hours |
| **Phase 6** | ProductPerformance, CartAbandonment, GoalTracker, SalesTrendAnalyzer | ~6 hours |
| **Phase 7** | AdminInsights page, routing, sidebar, tests | ~3 hours |

**Total: ~31 hours for all 35 features** — achievable in 1-2 weeks of focused work.
