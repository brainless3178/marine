import { useState, useEffect } from 'react'
import { X, ChevronRight, Target, Activity, DollarSign, ShoppingCart, Package, Users, BarChart3, Map, TrendingUp, Shield, Settings, Layers, type LucideIcon } from 'lucide-react'

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

export { SECTIONS }

export function InsightsTableOfContents({ onClose }: { onClose: () => void }) {
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
