import { Mail, Phone, MapPin, Building, Globe, Calendar, ShoppingCart, DollarSign, FileText, X } from 'lucide-react'
import type { CustomerStatus, CustomerOrder, CustomerType } from './types'

const statusConfig: Record<CustomerStatus, { label: string; color: string; bg: string }> = {
  active: { label: 'Active', color: 'text-[var(--success)]', bg: 'bg-[var(--success)]/10' },
  inactive: { label: 'Inactive', color: 'text-[var(--text-muted)]', bg: 'bg-[var(--text-muted)]/10' },
  vip: { label: 'VIP', color: 'text-[var(--accent-gold)]', bg: 'bg-[var(--accent-gold)]/10' },
  new: { label: 'New', color: 'text-[var(--accent-teal)]', bg: 'bg-[var(--accent-teal)]/10' },
}

const orderStatusConfig: Record<CustomerOrder['status'], { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: 'text-[var(--accent-gold)]', bg: 'bg-[var(--accent-gold)]/10' },
  confirmed: { label: 'Confirmed', color: 'text-[var(--accent-blue)]', bg: 'bg-[var(--accent-blue)]/10' },
  shipped: { label: 'Shipped', color: 'text-[var(--accent-teal)]', bg: 'bg-[var(--accent-teal)]/10' },
  delivered: { label: 'Delivered', color: 'text-[var(--success)]', bg: 'bg-[var(--success)]/10' },
  cancelled: { label: 'Cancelled', color: 'text-[var(--danger)]', bg: 'bg-[var(--danger)]/10' },
}

interface CustomerDetailSlideoverProps {
  customer: CustomerType
  onClose: () => void
  onStatusChange: (id: string, status: CustomerStatus) => Promise<void>
  onToast: (message: string, type: 'success' | 'error' | 'info') => void
  onCustomersUpdate: (updater: (prev: CustomerType[]) => CustomerType[]) => void
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function CustomerDetailSlideover({ customer, onClose, onStatusChange, onToast, onCustomersUpdate }: CustomerDetailSlideoverProps) {
  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-xl max-md:max-w-full max-md:rounded-none bg-[var(--surface)] shadow-2xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-6 py-4">
          <div>
            <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">{customer.name}</h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">{customer.id} · {customer.company}</p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-soft)] transition-colors"><X size={16} /></button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status + Tags */}
          <div className="flex items-center gap-3">
            <select
              value={customer.status}
              onChange={async (e) => {
                const newStatus = e.target.value as CustomerStatus
                try {
                  await onStatusChange(customer.id, newStatus)
                  onCustomersUpdate((prev) => prev.map((c) => c.id === customer.id ? { ...c, status: newStatus } : c))
                  onToast('Customer status updated', 'success')
                } catch (err: unknown) {
                  onToast(err instanceof Error ? err.message : 'Failed to update status', 'error')
                }
              }}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-xs font-bold focus:border-[var(--accent-gold)]"
            >
              {(Object.keys(statusConfig) as CustomerStatus[]).map((s) => (
                <option key={s} value={s}>{statusConfig[s].label}</option>
              ))}
            </select>
            {customer.tags.map((tag: string) => (
              <span key={tag} className="rounded-md bg-[var(--surface-soft)] border border-[var(--border)] px-2 py-1 text-[0.625rem] font-bold text-[var(--text-secondary)]">{tag}</span>
            ))}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total Orders', value: customer.totalOrders.toString(), icon: ShoppingCart },
              { label: 'Total Spent', value: `$${customer.totalSpent.toLocaleString()}`, icon: DollarSign },
              { label: 'Avg Order', value: `$${customer.avgOrderValue.toLocaleString()}`, icon: FileText },
            ].map((stat) => {
              const Icon = stat.icon
              return (
                <div key={stat.label} className="rounded-xl border border-[var(--border)] p-3 text-center">
                  <Icon size={14} className="mx-auto text-[var(--text-muted)] mb-1" />
                  <p className="text-sm font-bold font-mono text-[var(--text-primary)]">{stat.value}</p>
                  <p className="text-[0.625rem] text-[var(--text-muted)]">{stat.label}</p>
                </div>
              )
            })}
          </div>

          {/* Contact Details */}
          <div className="rounded-xl border border-[var(--border)] p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Contact Details</h3>
            <div className="grid grid-cols-1 gap-2.5">
              <div className="flex items-center gap-2"><Mail size={12} className="text-[var(--text-muted)] shrink-0" /><span className="text-xs text-[var(--text-secondary)]">{customer.email}</span></div>
              <div className="flex items-center gap-2"><Phone size={12} className="text-[var(--text-muted)] shrink-0" /><span className="text-xs text-[var(--text-secondary)]">{customer.phone}</span></div>
              <div className="flex items-center gap-2"><Globe size={12} className="text-[var(--text-muted)] shrink-0" /><a href={customer.website} className="text-xs text-[var(--accent-blue)] hover:underline">{customer.website}</a></div>
              <div className="flex items-center gap-2"><MapPin size={12} className="text-[var(--text-muted)] shrink-0" /><span className="text-xs text-[var(--text-secondary)]">{customer.address}</span></div>
              <div className="flex items-center gap-2"><Building size={12} className="text-[var(--text-muted)] shrink-0" /><span className="text-xs text-[var(--text-secondary)]">{customer.company}</span></div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="rounded-xl border border-[var(--border)] p-4 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Customer Info</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2"><Calendar size={12} className="text-[var(--text-muted)]" /><div><p className="text-[0.625rem] text-[var(--text-muted)]">Joined</p><p className="text-xs font-bold text-[var(--text-primary)]">{formatDate(customer.joinedDate)}</p></div></div>
              <div className="flex items-center gap-2"><ShoppingCart size={12} className="text-[var(--text-muted)]" /><div><p className="text-[0.625rem] text-[var(--text-muted)]">Last Order</p><p className="text-xs font-bold text-[var(--text-primary)]">{formatDate(customer.lastOrderDate)}</p></div></div>
            </div>
          </div>

          {/* Order History */}
          <div className="rounded-xl border border-[var(--border)] p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">Order History ({customer.orders.length})</h3>
            {customer.orders.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] text-center py-4">No orders yet</p>
            ) : (
              <div className="space-y-2">
                {customer.orders.map((order: CustomerOrder) => (
                  <div key={order.id} className="flex items-center justify-between py-2.5 border-b border-[var(--border)] last:border-0">
                    <div>
                      <p className="text-xs font-bold font-mono text-[var(--accent-blue)]">{order.id}</p>
                      <p className="text-[0.625rem] text-[var(--text-muted)]">{formatDate(order.date)} · {order.itemCount} items</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`rounded-md px-2 py-0.5 text-[0.625rem] font-bold ${orderStatusConfig[order.status]?.bg || ''} ${orderStatusConfig[order.status]?.color || ''}`}>{orderStatusConfig[order.status]?.label || order.status}</span>
                      <span className="font-mono text-xs font-bold text-[var(--text-primary)]">${order.total.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 pt-2">
            <button onClick={() => onToast(`Email opened for ${customer.email}`, 'info')} className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-xs font-bold text-[var(--text-secondary)] hover:border-[var(--accent-gold)] transition-colors"><Mail size={12} /> Send Email</button>
            <button onClick={() => onToast(`New order started for ${customer.name}`, 'success')} className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-xs font-bold text-[var(--text-secondary)] hover:border-[var(--accent-teal)] transition-colors"><ShoppingCart size={12} /> New Order</button>
          </div>
        </div>
      </div>
    </div>
  )
}
