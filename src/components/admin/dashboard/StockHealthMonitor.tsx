import { useMemo } from 'react'
import { CheckCircle, AlertTriangle, XCircle, Boxes } from 'lucide-react'

interface Props {
  stats: any
}

export function StockHealthMonitor({ stats }: Props) {
  const segments = useMemo(() => {
    const total = stats?.totalProducts || 0
    return [
      { label: 'In Stock', count: stats?.inStockProducts || 0, color: 'bg-[var(--success)]', icon: CheckCircle, iconColor: 'text-[var(--success)]' },
      { label: 'Low Stock', count: stats?.lowStockProducts?.length || 0, color: 'bg-[var(--accent-gold)]', icon: AlertTriangle, iconColor: 'text-[var(--accent-gold)]' },
      { label: 'Out of Stock', count: stats?.outOfStockProducts || 0, color: 'bg-[var(--danger)]', icon: XCircle, iconColor: 'text-[var(--danger)]' },
      { label: 'Emergency', count: stats?.emergencyProducts || 0, color: 'bg-[var(--accent-blue)]', icon: Boxes, iconColor: 'text-[var(--accent-blue)]' },
    ].map(s => ({
      ...s,
      percentage: total > 0 ? Math.round((s.count / total) * 100) : 0,
    }))
  }, [stats])

  const total = stats?.totalProducts || 0

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-sm font-bold text-[var(--text-primary)]">
          Stock Health
        </h2>
        <span className="text-[0.625rem] text-[var(--text-muted)] font-medium">
          {total} products
        </span>
      </div>

      {/* Stacked bar */}
      <div className="h-5 w-full rounded-full bg-[var(--surface-soft)] overflow-hidden flex">
        {segments.map(s => (
          s.count > 0 && (
            <div
              key={s.label}
              className={`${s.color} transition-all duration-500`}
              style={{ width: `${s.percentage}%` }}
              title={`${s.label}: ${s.count}`}
            />
          )
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        {segments.map(s => {
          const Icon = s.icon
          return (
            <div key={s.label} className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-sm ${s.color}`} />
              <Icon size={12} className={s.iconColor} />
              <span className="text-xs text-[var(--text-secondary)] font-medium">{s.label}</span>
              <span className="font-mono text-xs font-bold text-[var(--text-primary)] ml-auto">
                {s.count}
              </span>
              <span className="text-[0.5rem] text-[var(--text-muted)]">
                ({s.percentage}%)
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
