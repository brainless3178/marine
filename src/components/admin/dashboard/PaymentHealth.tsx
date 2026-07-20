import { useMemo } from 'react'
import { CreditCard, CheckCircle, Clock, XCircle, DollarSign } from 'lucide-react'

interface Props {
  orders: any[]
}

const paymentMethods = [
  { key: 'card', label: 'Card Payment', icon: CreditCard, color: 'text-[var(--accent-blue)]', bg: 'bg-[var(--accent-blue)]/10' },
  { key: 'paypal', label: 'PayPal', icon: DollarSign, color: 'text-[var(--accent-gold)]', bg: 'bg-[var(--accent-gold)]/10' },
  { key: 'bank_transfer', label: 'Bank Transfer', icon: CreditCard, color: 'text-[var(--accent-teal)]', bg: 'bg-[var(--accent-teal)]/10' },
  { key: 'cod', label: 'Cash on Delivery', icon: DollarSign, color: 'text-[var(--text-muted)]', bg: 'bg-[var(--surface-soft)]' },
]

export function PaymentHealth({ orders }: Props) {
  const data = useMemo(() => {
    // Group by payment method
    const byMethod: Record<string, { total: number; paid: number; pending: number; failed: number; revenue: number }> = {}

    for (const order of orders) {
      const method = order.paymentMethod || 'unknown'
      if (!byMethod[method]) {
        byMethod[method] = { total: 0, paid: 0, pending: 0, failed: 0, revenue: 0 }
      }
      byMethod[method].total++

      if (['confirmed', 'shipped', 'delivered'].includes(order.status)) {
        byMethod[method].paid++
        byMethod[method].revenue += order.total || 0
      } else if (order.status === 'pending') {
        byMethod[method].pending++
      } else if (order.status === 'cancelled') {
        byMethod[method].failed++
      } else {
        // Processing, etc — count as paid
        byMethod[method].paid++
        byMethod[method].revenue += order.total || 0
      }
    }

    // Overall stats
    const totalOrders = orders.length
    const paidOrders = orders.filter(o => ['confirmed', 'shipped', 'delivered', 'processing'].includes(o.status)).length
    const pendingOrders = orders.filter(o => o.status === 'pending').length
    const failedOrders = orders.filter(o => o.status === 'cancelled').length
    const successRate = totalOrders > 0 ? Math.round((paidOrders / totalOrders) * 100) : 0

    return { byMethod, totalOrders, paidOrders, pendingOrders, failedOrders, successRate }
  }, [orders])

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CreditCard size={16} className="text-[var(--accent-blue)]" />
          <h2 className="font-display text-sm font-bold text-[var(--text-primary)]">
            Payment Health
          </h2>
        </div>
        <span className={`text-[0.625rem] font-bold ${
          data.successRate >= 90 ? 'text-[var(--success)]' :
          data.successRate >= 70 ? 'text-[var(--accent-gold)]' :
          'text-[var(--danger)]'
        }`}>
          {data.successRate}% success rate
        </span>
      </div>

      {/* Success rate bar */}
      <div className="h-3 w-full rounded-full bg-[var(--surface-soft)] overflow-hidden mb-4">
        <div
          className="h-full rounded-full bg-[var(--success)] transition-all duration-500"
          style={{ width: `${data.successRate}%` }}
        />
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center rounded-xl bg-[var(--surface-soft)] p-2">
          <CheckCircle size={14} className="mx-auto text-[var(--success)] mb-1" />
          <p className="font-mono text-sm font-bold text-[var(--text-primary)]">{data.paidOrders}</p>
          <p className="text-[0.5rem] text-[var(--text-muted)]">Paid</p>
        </div>
        <div className="text-center rounded-xl bg-[var(--surface-soft)] p-2">
          <Clock size={14} className="mx-auto text-[var(--accent-gold)] mb-1" />
          <p className="font-mono text-sm font-bold text-[var(--text-primary)]">{data.pendingOrders}</p>
          <p className="text-[0.5rem] text-[var(--text-muted)]">Pending</p>
        </div>
        <div className="text-center rounded-xl bg-[var(--surface-soft)] p-2">
          <XCircle size={14} className="mx-auto text-[var(--danger)] mb-1" />
          <p className="font-mono text-sm font-bold text-[var(--text-primary)]">{data.failedOrders}</p>
          <p className="text-[0.5rem] text-[var(--text-muted)]">Failed</p>
        </div>
      </div>

      {/* By payment method */}
      <div className="space-y-2">
        {paymentMethods.map(pm => {
          const method = data.byMethod[pm.key]
          if (!method || method.total === 0) return null
          const Icon = pm.icon
          const successRate = method.total > 0 ? Math.round((method.paid / method.total) * 100) : 0

          return (
            <div key={pm.key} className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-[var(--surface-soft)] transition-colors">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${pm.bg} ${pm.color}`}>
                <Icon size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[var(--text-primary)]">{pm.label}</p>
                <p className="text-[0.625rem] text-[var(--text-muted)]">
                  {method.total} orders · ${method.revenue.toLocaleString()}
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className={`text-xs font-bold ${
                  successRate >= 90 ? 'text-[var(--success)]' :
                  successRate >= 70 ? 'text-[var(--accent-gold)]' :
                  'text-[var(--danger)]'
                }`}>
                  {successRate}%
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* No payment methods */}
      {Object.keys(data.byMethod).length === 0 && (
        <div className="text-center py-6">
          <CreditCard size={24} className="mx-auto text-[var(--text-muted)] mb-2" />
          <p className="text-xs text-[var(--text-muted)] font-medium">No payment data yet</p>
        </div>
      )}
    </div>
  )
}
