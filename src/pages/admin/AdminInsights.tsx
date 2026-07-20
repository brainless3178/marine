import { useState, useEffect, useCallback } from 'react'
import { useDashboardData } from '../../hooks/useDashboardData'
import { BusinessHealthScore } from '../../components/admin/dashboard/BusinessHealthScore'
import { SmartKPIs } from '../../components/admin/dashboard/SmartKPIs'
import { CEOBrief } from '../../components/admin/dashboard/CEOBrief'
import { StockHealthMonitor } from '../../components/admin/dashboard/StockHealthMonitor'
import { EmergencyPanel } from '../../components/admin/dashboard/EmergencyPanel'
import { RevenuePulse } from '../../components/admin/dashboard/RevenuePulse'
import { OrderFulfillment } from '../../components/admin/dashboard/OrderFulfillment'
import { LiveSalesTracker } from '../../components/admin/dashboard/LiveSalesTracker'
import { DailySnapshot } from '../../components/admin/dashboard/DailySnapshot'
import { DeadStockAnalyzer } from '../../components/admin/dashboard/DeadStockAnalyzer'
import { RestockPredictor } from '../../components/admin/dashboard/RestockPredictor'
import { MoneyLeakDetector } from '../../components/admin/dashboard/MoneyLeakDetector'
import { PaymentHealth } from '../../components/admin/dashboard/PaymentHealth'
import { CustomerLifetimeValue } from '../../components/admin/dashboard/CustomerLifetimeValue'
import { VIPMonitor } from '../../components/admin/dashboard/VIPMonitor'
import { ChurnPredictor } from '../../components/admin/dashboard/ChurnPredictor'
import { CustomerSegmentation } from '../../components/admin/dashboard/CustomerSegmentation'
import { AuditLogViewer } from '../../components/admin/dashboard/AuditLogViewer'
import { DeliveryPerformance } from '../../components/admin/dashboard/DeliveryPerformance'
import { ReturnAnalytics } from '../../components/admin/dashboard/ReturnAnalytics'
import { RegionalHeatmap } from '../../components/admin/dashboard/RegionalHeatmap'
import { ProductPerformance } from '../../components/admin/dashboard/ProductPerformance'
import { BestsellerInsights } from '../../components/admin/dashboard/BestsellerInsights'
import { SlowSellerAnalyzer } from '../../components/admin/dashboard/SlowSellerAnalyzer'
import { SalesTrendAnalyzer } from '../../components/admin/dashboard/SalesTrendAnalyzer'
import { GoalTracker } from '../../components/admin/dashboard/GoalTracker'
import { ExecutiveDashboard } from '../../components/admin/dashboard/ExecutiveDashboard'
import { OrderTimeline } from '../../components/admin/dashboard/OrderTimeline'
import { InventoryRiskRadar } from '../../components/admin/dashboard/InventoryRiskRadar'
import { ProfitMeter } from '../../components/admin/dashboard/ProfitMeter'
import { FinancialCommandCenter } from '../../components/admin/dashboard/FinancialCommandCenter'
import { CustomerActivityFeed } from '../../components/admin/dashboard/CustomerActivityFeed'
import { RealTimeActivityStream } from '../../components/admin/dashboard/RealTimeActivityStream'
import { CartAbandonmentTracker } from '../../components/admin/dashboard/CartAbandonmentTracker'
import { SmartNotificationCenter } from '../../components/admin/dashboard/SmartNotificationCenter'
import { ProductTrendRadar } from '../../components/admin/dashboard/ProductTrendRadar'
import { GeoSalesAnalytics } from '../../components/admin/dashboard/GeoSalesAnalytics'
import { SearchAnalytics } from '../../components/admin/dashboard/SearchAnalytics'
import { RevenueForecast } from '../../components/admin/dashboard/RevenueForecast'
import { DemandForecastEngine } from '../../components/admin/dashboard/DemandForecastEngine'
import { OKRDashboard } from '../../components/admin/dashboard/OKRDashboard'
import { LogisticsHealthDashboard } from '../../components/admin/dashboard/LogisticsHealthDashboard'
import { WarehouseHeatMap } from '../../components/admin/dashboard/WarehouseHeatMap'
import { WebsiteHealthMonitor } from '../../components/admin/dashboard/WebsiteHealthMonitor'
import { SecurityCommandCenter } from '../../components/admin/dashboard/SecurityCommandCenter'
import { FraudDetectionCenter } from '../../components/admin/dashboard/FraudDetectionCenter'
import { ApiStatusMonitor } from '../../components/admin/dashboard/ApiStatusMonitor'
import { SystemPerformanceDashboard } from '../../components/admin/dashboard/SystemPerformanceDashboard'
import { BusinessIntelligenceCenter } from '../../components/admin/dashboard/BusinessIntelligenceCenter'
import { ExecutiveControlTower } from '../../components/admin/dashboard/ExecutiveControlTower'
import { MissionControlDashboard } from '../../components/admin/dashboard/MissionControlDashboard'
import {
  Loader2, ChevronRight, ChevronDown, X, Target, Activity, DollarSign, ShoppingCart,
  Package, Users, BarChart3, Map, TrendingUp, Shield, Settings, Layers,
  ChevronsUpDown,
} from 'lucide-react'

interface Section {
  id: string
  label: string
  icon: React.ReactNode
}

const SECTIONS: Section[] = [
  { id: 'health-score', label: 'Business Health', icon: <Target size={14} /> },
  { id: 'kpi-ceo', label: 'KPIs & CEO Brief', icon: <Activity size={14} /> },
  { id: 'revenue-fulfillment', label: 'Revenue & Orders', icon: <DollarSign size={14} /> },
  { id: 'live-sales', label: 'Live Sales & Snapshot', icon: <ShoppingCart size={14} /> },
  { id: 'inventory-risks', label: 'Inventory Risks', icon: <Package size={14} /> },
  { id: 'financial-health', label: 'Financial Health', icon: <DollarSign size={14} /> },
  { id: 'customer-intelligence', label: 'Customer Intel', icon: <Users size={14} /> },
  { id: 'customer-segmentation', label: 'Segmentation', icon: <Users size={14} /> },
  { id: 'operations', label: 'Operations', icon: <Settings size={14} /> },
  { id: 'regional-sales', label: 'Regional Sales', icon: <Map size={14} /> },
  { id: 'sales-trend', label: 'Sales Trends', icon: <TrendingUp size={14} /> },
  { id: 'product-insights', label: 'Product Insights', icon: <BarChart3 size={14} /> },
  { id: 'product-performance', label: 'Performance Matrix', icon: <BarChart3 size={14} /> },
  { id: 'goals', label: 'Goals & OKR', icon: <Target size={14} /> },
  { id: 'executive-profit', label: 'Executive & Profit', icon: <Layers size={14} /> },
  { id: 'financial-cart', label: 'Finance & Cart', icon: <DollarSign size={14} /> },
  { id: 'inventory-trend', label: 'Inventory & Trends', icon: <Package size={14} /> },
  { id: 'activity', label: 'Activity Feeds', icon: <Activity size={14} /> },
  { id: 'geo-search', label: 'Geo & Search', icon: <Map size={14} /> },
  { id: 'timeline-notifications', label: 'Timeline & Alerts', icon: <Shield size={14} /> },
  { id: 'forecasts', label: 'Forecasts', icon: <TrendingUp size={14} /> },
  { id: 'okr-logistics', label: 'OKR & Logistics', icon: <Target size={14} /> },
  { id: 'warehouse-website', label: 'Warehouse & Health', icon: <Settings size={14} /> },
  { id: 'security-fraud', label: 'Security & Fraud', icon: <Shield size={14} /> },
  { id: 'composites', label: 'Executive Dashboards', icon: <Layers size={14} /> },
  { id: 'api-audit', label: 'API & Audit', icon: <Settings size={14} /> },
]

function TableOfContents({ onClose }: { onClose: () => void }) {
  const [active, setActive] = useState('health-score')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id)
          }
        }
      },
      { rootMargin: '-20% 0px -70% 0px' }
    )
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    onClose()
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <span className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
          Jump to Section
        </span>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-[var(--bg)] transition-colors"
        >
          <X size={14} className="text-[var(--text-muted)]" />
        </button>
      </div>
      <nav className="max-h-[60vh] overflow-y-auto p-2 space-y-0.5">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => scrollTo(s.id)}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left ${
              active === s.id
                ? 'bg-[var(--accent-gold)]/10 text-[var(--accent-gold)] border border-[var(--accent-gold)]/20'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg)] hover:text-[var(--text-primary)]'
            }`}
          >
            {s.icon}
            <span className="truncate">{s.label}</span>
            {active === s.id && <ChevronRight size={10} className="ml-auto shrink-0" />}
          </button>
        ))}
      </nav>
    </div>
  )
}

export default function AdminInsights() {
  const { stats, alerts, orders, rfqs, products, customers, loading, error, refresh } = useDashboardData()
  const [showTOC, setShowTOC] = useState(false)
  const [collapsed, setCollapsed] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('alka-insights-collapsed')
      return saved ? new Set(JSON.parse(saved)) : new Set()
    } catch { return new Set() }
  })

  const toggleSection = useCallback((id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      localStorage.setItem('alka-insights-collapsed', JSON.stringify([...next]))
      return next
    })
  }, [])

  const collapseAll = useCallback(() => {
    const all = new Set(SECTIONS.map((s) => s.id))
    setCollapsed(all)
    localStorage.setItem('alka-insights-collapsed', JSON.stringify([...all]))
  }, [])

  const expandAll = useCallback(() => {
    setCollapsed(new Set())
    localStorage.setItem('alka-insights-collapsed', '[]')
  }, [])

  const isCollapsed = useCallback((id: string) => collapsed.has(id), [collapsed])

  // Sync with URL hash on mount
  useEffect(() => {
    const hash = window.location.hash.slice(1)
    if (hash) {
      requestAnimationFrame(() => {
        const el = document.getElementById(hash)
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    }
  }, [loading])

  // Update URL hash when navigating
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            window.history.replaceState(null, '', `#${entry.target.id}`)
          }
        }
      },
      { rootMargin: '-20% 0px -70% 0px' }
    )
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [loading])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-[var(--accent-gold)]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-[var(--danger)]/20 bg-[var(--danger)]/5 p-8 text-center">
        <p className="text-sm font-bold text-[var(--danger)]">Failed to load insights</p>
        <p className="text-xs text-[var(--text-muted)] mt-1">{error}</p>
        <button
          onClick={refresh}
          className="mt-3 rounded-xl bg-[var(--accent-gold)] px-4 py-2 text-xs font-bold text-navy-deep hover:bg-[var(--gold-light)] transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6 relative">
      {/* Floating TOC Toggle Button */}
      <button
        onClick={() => setShowTOC(!showTOC)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-[var(--accent-gold)] text-navy-deep shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center"
        title="Jump to section"
      >
        <Layers size={20} />
      </button>

      {/* Floating Table of Contents Panel */}
      {showTOC && (
        <div className="fixed bottom-20 right-6 z-50 w-72 animate-in slide-in-from-bottom-4 duration-200">
          <TableOfContents onClose={() => setShowTOC(false)} />
        </div>
      )}

      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-[var(--text-primary)]">
            Business Insights
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Real-time analytics and business intelligence — no external services required
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTOC(!showTOC)}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-xs font-bold text-[var(--text-secondary)] hover:border-[var(--accent-gold)] transition-colors"
          >
            <Layers size={14} />
            Sections
          </button>
          <button
            onClick={refresh}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-xs font-bold text-[var(--text-secondary)] hover:border-[var(--accent-gold)] transition-colors"
          >
            Refresh Data
          </button>
        </div>
      </div>

      {/* Emergency Panel — only shows when urgent items exist */}
      <EmergencyPanel alerts={alerts} rfqs={rfqs} />

      {/* Collapse/Expand All Controls */}
      <div className="flex items-center gap-2">
        <button onClick={collapseAll} className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-[10px] font-bold text-[var(--text-secondary)] hover:border-[var(--accent-gold)] hover:text-[var(--accent-gold)] transition-colors">
          <ChevronsUpDown size={12} /> Collapse All
        </button>
        <button onClick={expandAll} className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-[10px] font-bold text-[var(--text-secondary)] hover:border-[var(--accent-gold)] hover:text-[var(--accent-gold)] transition-colors">
          <ChevronsUpDown size={12} className="rotate-90" /> Expand All
        </button>
        {collapsed.size > 0 && (
          <span className="text-[10px] text-[var(--text-muted)]">{collapsed.size} section{collapsed.size !== 1 ? 's' : ''} collapsed</span>
        )}
      </div>

      {/* Section 1: Health Score + Smart KPIs */}
      <section id="health-score" className="scroll-mt-24">
        <SectionHeader title="Business Health Score" collapsed={isCollapsed('health-score')} onToggle={() => toggleSection('health-score')} />
        {!isCollapsed('health-score') && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <BusinessHealthScore stats={stats} />
            <div className="lg:col-span-2">
              <SmartKPIs stats={stats} orders={orders} rfqs={rfqs} products={products} />
            </div>
          </div>
        )}
      </section>

      {/* Section 2: CEO Brief + Stock Health */}
      <section id="kpi-ceo" className="scroll-mt-24">
        <SectionHeader title="KPIs & CEO Brief" collapsed={isCollapsed('kpi-ceo')} onToggle={() => toggleSection('kpi-ceo')} />
        {!isCollapsed('kpi-ceo') && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CEOBrief orders={orders} rfqs={rfqs} alerts={alerts} />
            <StockHealthMonitor stats={stats} />
          </div>
        )}
      </section>

      {/* Section 3: Revenue Pulse + Order Pipeline */}
      <section id="revenue-fulfillment" className="scroll-mt-24">
        <SectionHeader title="Revenue & Order Fulfillment" collapsed={isCollapsed('revenue-fulfillment')} onToggle={() => toggleSection('revenue-fulfillment')} />
        {!isCollapsed('revenue-fulfillment') && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RevenuePulse orders={orders} />
            <OrderFulfillment orders={orders} />
          </div>
        )}
      </section>

      {/* Section 4: Live Sales + Daily Snapshot */}
      <section id="live-sales" className="scroll-mt-24">
        <SectionHeader title="Live Sales & Daily Snapshot" collapsed={isCollapsed('live-sales')} onToggle={() => toggleSection('live-sales')} />
        {!isCollapsed('live-sales') && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LiveSalesTracker orders={orders} loading={loading} />
            <DailySnapshot orders={orders} rfqs={rfqs} />
          </div>
        )}
      </section>

      {/* Section 5: Inventory Risks */}
      <section id="inventory-risks" className="scroll-mt-24">
        <SectionHeader title="Inventory Risk Analysis" collapsed={isCollapsed('inventory-risks')} onToggle={() => toggleSection('inventory-risks')} />
        {!isCollapsed('inventory-risks') && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DeadStockAnalyzer products={products} orders={orders} />
            <RestockPredictor products={products} orders={orders} />
          </div>
        )}
      </section>

      {/* Section 6: Financial Health */}
      <section id="financial-health" className="scroll-mt-24">
        <SectionHeader title="Financial Health" collapsed={isCollapsed('financial-health')} onToggle={() => toggleSection('financial-health')} />
        {!isCollapsed('financial-health') && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MoneyLeakDetector orders={orders} />
            <PaymentHealth orders={orders} />
          </div>
        )}
      </section>

      {/* Section 7: Customer Intelligence */}
      <section id="customer-intelligence" className="scroll-mt-24">
        <SectionHeader title="Customer Intelligence" collapsed={isCollapsed('customer-intelligence')} onToggle={() => toggleSection('customer-intelligence')} />
        {!isCollapsed('customer-intelligence') && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <CustomerLifetimeValue orders={orders} />
            <VIPMonitor orders={orders} />
            <ChurnPredictor orders={orders} customers={customers} />
          </div>
        )}
      </section>

      {/* Section 8: Customer Segmentation */}
      <section id="customer-segmentation" className="scroll-mt-24">
        <SectionHeader title="Customer Segmentation" collapsed={isCollapsed('customer-segmentation')} onToggle={() => toggleSection('customer-segmentation')} />
        {!isCollapsed('customer-segmentation') && <CustomerSegmentation orders={orders} />}
      </section>

      {/* Section 9: Operations Intelligence */}
      <section id="operations" className="scroll-mt-24">
        <SectionHeader title="Operations Intelligence" collapsed={isCollapsed('operations')} onToggle={() => toggleSection('operations')} />
        {!isCollapsed('operations') && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DeliveryPerformance orders={orders} />
            <ReturnAnalytics orders={orders} />
          </div>
        )}
      </section>

      {/* Section 10: Regional Sales */}
      <section id="regional-sales" className="scroll-mt-24">
        <SectionHeader title="Regional Sales Heatmap" collapsed={isCollapsed('regional-sales')} onToggle={() => toggleSection('regional-sales')} />
        {!isCollapsed('regional-sales') && <RegionalHeatmap orders={orders} />}
      </section>

      {/* Section 11: Sales Trend */}
      <section id="sales-trend" className="scroll-mt-24">
        <SectionHeader title="Sales Trend Analysis" collapsed={isCollapsed('sales-trend')} onToggle={() => toggleSection('sales-trend')} />
        {!isCollapsed('sales-trend') && <SalesTrendAnalyzer orders={orders} />}
      </section>

      {/* Section 12: Product Insights */}
      <section id="product-insights" className="scroll-mt-24">
        <SectionHeader title="Product Insights" collapsed={isCollapsed('product-insights')} onToggle={() => toggleSection('product-insights')} />
        {!isCollapsed('product-insights') && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BestsellerInsights products={products} orders={orders} />
            <SlowSellerAnalyzer products={products} orders={orders} />
          </div>
        )}
      </section>

      {/* Section 13: Product Performance Matrix */}
      <section id="product-performance" className="scroll-mt-24">
        <SectionHeader title="Product Performance Matrix" collapsed={isCollapsed('product-performance')} onToggle={() => toggleSection('product-performance')} />
        {!isCollapsed('product-performance') && <ProductPerformance products={products} orders={orders} />}
      </section>

      {/* Section 14: Goal Tracker + OKR */}
      <section id="goals" className="scroll-mt-24">
        <SectionHeader title="Goals & OKR" collapsed={isCollapsed('goals')} onToggle={() => toggleSection('goals')} />
        {!isCollapsed('goals') && <GoalTracker orders={orders} products={products} />}
      </section>

      {/* Section 15: Executive + Profit */}
      <section id="executive-profit" className="scroll-mt-24">
        <SectionHeader title="Executive Dashboard & Profit" collapsed={isCollapsed('executive-profit')} onToggle={() => toggleSection('executive-profit')} />
        {!isCollapsed('executive-profit') && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ExecutiveDashboard stats={stats} orders={orders} rfqs={rfqs} alerts={alerts} products={products} />
            <ProfitMeter orders={orders} products={products} />
          </div>
        )}
      </section>

      {/* Section 16: Financial + Cart Abandonment */}
      <section id="financial-cart" className="scroll-mt-24">
        <SectionHeader title="Financial Command & Cart Abandonment" collapsed={isCollapsed('financial-cart')} onToggle={() => toggleSection('financial-cart')} />
        {!isCollapsed('financial-cart') && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FinancialCommandCenter orders={orders} />
            <CartAbandonmentTracker orders={orders} />
          </div>
        )}
      </section>

      {/* Section 17: Inventory Risk + Product Trend */}
      <section id="inventory-trend" className="scroll-mt-24">
        <SectionHeader title="Inventory Risk & Product Trends" collapsed={isCollapsed('inventory-trend')} onToggle={() => toggleSection('inventory-trend')} />
        {!isCollapsed('inventory-trend') && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <InventoryRiskRadar products={products} orders={orders} />
            <ProductTrendRadar products={products} orders={orders} />
          </div>
        )}
      </section>

      {/* Section 18: Activity Feed + Activity Stream */}
      <section id="activity" className="scroll-mt-24">
        <SectionHeader title="Activity Feeds" collapsed={isCollapsed('activity')} onToggle={() => toggleSection('activity')} />
        {!isCollapsed('activity') && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CustomerActivityFeed orders={orders} rfqs={rfqs} />
            <RealTimeActivityStream orders={orders} rfqs={rfqs} alerts={alerts} />
          </div>
        )}
      </section>

      {/* Section 19: Geo Sales + Search Analytics */}
      <section id="geo-search" className="scroll-mt-24">
        <SectionHeader title="Geographic & Search Analytics" collapsed={isCollapsed('geo-search')} onToggle={() => toggleSection('geo-search')} />
        {!isCollapsed('geo-search') && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GeoSalesAnalytics orders={orders} />
            <SearchAnalytics products={products} orders={orders} />
          </div>
        )}
      </section>

      {/* Section 20: Order Timeline + Smart Notifications */}
      <section id="timeline-notifications" className="scroll-mt-24">
        <SectionHeader title="Order Timeline & Notifications" collapsed={isCollapsed('timeline-notifications')} onToggle={() => toggleSection('timeline-notifications')} />
        {!isCollapsed('timeline-notifications') && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <OrderTimeline orders={orders} />
            <SmartNotificationCenter alerts={alerts} rfqs={rfqs} orders={orders} />
          </div>
        )}
      </section>

      {/* Section 21: Revenue + Demand Forecast */}
      <section id="forecasts" className="scroll-mt-24">
        <SectionHeader title="Forecasting" collapsed={isCollapsed('forecasts')} onToggle={() => toggleSection('forecasts')} />
        {!isCollapsed('forecasts') && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RevenueForecast orders={orders} />
            <DemandForecastEngine products={products} orders={orders} />
          </div>
        )}
      </section>

      {/* Section 22: OKR + Logistics */}
      <section id="okr-logistics" className="scroll-mt-24">
        <SectionHeader title="OKR & Logistics Health" collapsed={isCollapsed('okr-logistics')} onToggle={() => toggleSection('okr-logistics')} />
        {!isCollapsed('okr-logistics') && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <OKRDashboard orders={orders} products={products} customers={customers} />
            <LogisticsHealthDashboard orders={orders} />
          </div>
        )}
      </section>

      {/* Section 23: Warehouse + Website Health */}
      <section id="warehouse-website" className="scroll-mt-24">
        <SectionHeader title="Warehouse & Website Health" collapsed={isCollapsed('warehouse-website')} onToggle={() => toggleSection('warehouse-website')} />
        {!isCollapsed('warehouse-website') && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <WarehouseHeatMap products={products} />
            <WebsiteHealthMonitor />
          </div>
        )}
      </section>

      {/* Section 24: Security + Fraud */}
      <section id="security-fraud" className="scroll-mt-24">
        <SectionHeader title="Security & Fraud Detection" collapsed={isCollapsed('security-fraud')} onToggle={() => toggleSection('security-fraud')} />
        {!isCollapsed('security-fraud') && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SecurityCommandCenter orders={orders} rfqs={rfqs} />
            <FraudDetectionCenter orders={orders} />
          </div>
        )}
      </section>

      {/* Section 25: Composite Dashboards */}
      <section id="composites" className="scroll-mt-24">
        <SectionHeader title="Executive Dashboards" collapsed={isCollapsed('composites')} onToggle={() => toggleSection('composites')} />
        {!isCollapsed('composites') && (
          <>
            <MissionControlDashboard stats={stats} orders={orders} rfqs={rfqs} products={products} customers={customers} alerts={alerts} />
            <ExecutiveControlTower stats={stats} orders={orders} rfqs={rfqs} products={products} customers={customers} alerts={alerts} />
          </>
        )}
      </section>

      {/* Section 26: BI + System + API + Audit */}
      <section id="api-audit" className="scroll-mt-24">
        <SectionHeader title="Intelligence, System & Audit" collapsed={isCollapsed('api-audit')} onToggle={() => toggleSection('api-audit')} />
        {!isCollapsed('api-audit') && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BusinessIntelligenceCenter stats={stats} orders={orders} rfqs={rfqs} products={products} customers={customers} />
              <SystemPerformanceDashboard />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <ApiStatusMonitor />
              <AuditLogViewer />
            </div>
          </>
        )}
      </section>
    </div>
  )
}

function SectionHeader({ title, collapsed, onToggle }: { title: string; collapsed?: boolean; onToggle?: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="mb-4 w-full flex items-center gap-2 group cursor-pointer select-none"
    >
      <div className="w-1 h-5 rounded-full bg-[var(--accent-gold)] group-hover:h-6 transition-all" />
      <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">{title}</h2>
      {onToggle && (
        <ChevronDown
          size={14}
          className={`ml-auto text-[var(--text-muted)] group-hover:text-[var(--accent-gold)] transition-all ${collapsed ? '-rotate-90' : 'rotate-0'}`}
        />
      )}
    </button>
  )
}
