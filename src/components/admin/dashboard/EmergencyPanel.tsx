import { AlertTriangle, Phone, Mail, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

interface Props {
  alerts: any[]
  rfqs: any[]
}

export function EmergencyPanel({ alerts, rfqs }: Props) {
  const emergencyRfqs = rfqs.filter(
    r => r.urgency === 'emergency' && r.status !== 'closed' && r.status !== 'won'
  )
  const dangerAlerts = alerts.filter(a => a.type === 'danger')
  const hasUrgent = emergencyRfqs.length > 0 || dangerAlerts.length > 0

  if (!hasUrgent) return null

  return (
    <div className="rounded-2xl border-2 border-[var(--danger)]/30 bg-[var(--danger)]/5 p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="relative">
          <AlertTriangle size={18} className="text-[var(--danger)]" />
          <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-[var(--danger)] animate-ping" />
        </div>
        <h2 className="font-display text-sm font-bold text-[var(--danger)]">
          Emergency Alerts
        </h2>
        <span className="ml-auto rounded-full bg-[var(--danger)] px-2 py-0.5 text-[0.5rem] font-bold text-[var(--btn-danger-text)]">
          {emergencyRfqs.length + dangerAlerts.length} urgent
        </span>
      </div>

      <div className="space-y-2">
        {/* Emergency RFQs */}
        {emergencyRfqs.slice(0, 5).map((rfq: any) => (
          <div
            key={rfq.id}
            className="flex items-center justify-between rounded-xl bg-white/60 dark:bg-black/20 px-4 py-2.5"
          >
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-[var(--text-primary)] truncate">
                {rfq.fullName || rfq.company || 'Unknown Customer'}
              </p>
              <p className="text-[0.625rem] text-[var(--text-muted)] truncate">
                {rfq.productDescription?.slice(0, 80) || 'Emergency RFQ request'} — {rfq.country || ''}
              </p>
            </div>
            <div className="flex gap-1.5 shrink-0 ml-3">
              {rfq.phone && (
                <a
                  href={`tel:${rfq.phone}`}
                  className="rounded-lg bg-[var(--accent-blue)]/10 p-1.5 text-[var(--accent-blue)] hover:bg-[var(--accent-blue)]/20 transition-colors"
                  title="Call customer"
                >
                  <Phone size={12} />
                </a>
              )}
              {rfq.email && (
                <a
                  href={`mailto:${rfq.email}`}
                  className="rounded-lg bg-[var(--accent-gold)]/10 p-1.5 text-[var(--accent-gold)] hover:bg-[var(--accent-gold)]/20 transition-colors"
                  title="Email customer"
                >
                  <Mail size={12} />
                </a>
              )}
            </div>
          </div>
        ))}

        {/* Danger alerts */}
        {dangerAlerts.slice(0, 3).map((a: any, i: number) => (
          <div
            key={`alert-${i}`}
            className="flex items-center gap-2 rounded-xl bg-white/60 dark:bg-black/20 px-4 py-2.5"
          >
            <AlertTriangle size={14} className="text-[var(--danger)] shrink-0" />
            <span className="text-xs text-[var(--text-secondary)] font-medium">
              {a.message || 'Critical alert'}
            </span>
          </div>
        ))}
      </div>

      {/* View all link */}
      <div className="mt-3 flex gap-3">
        <Link
          to="/admin/rfqs?urgency=emergency"
          className="flex items-center gap-1 text-xs font-bold text-[var(--danger)] hover:underline"
        >
          View Emergency RFQs <ArrowRight size={12} />
        </Link>
        <Link
          to="/admin/products?filter=out-of-stock"
          className="flex items-center gap-1 text-xs font-bold text-[var(--danger)] hover:underline"
        >
          Out of Stock Items <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  )
}
