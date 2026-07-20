import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  Search,
  Package,
  Truck,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  X,
  CreditCard,
  MapPin,
  User,
  FileText,
  Calendar,
  AlertTriangle,
  Loader2,
} from 'lucide-react'
import { admin, getAdminToken } from '../../lib/api'
import { useToast } from '../../components/admin/Toast'
import { AdminPagination } from '../../components/admin/AdminPagination'

type OrderStatus = 'pending' | 'confirmed' | 'paid' | 'processing' | 'packed' | 'shipped' | 'delivered' | 'cancelled'

interface Order {
  id: string
  customerName: string
  customerEmail: string
  company: string
  country: string
  items: { productName: string; sku: string; quantity: number; price: number }[]
  subtotal: number
  shipping: number
  tax: number
  total: number
  status: OrderStatus
  paymentMethod: string
  paymentStatus: 'pending' | 'paid' | 'refunded'
  shippingAddress: string
  trackingNumber: string
  courier: string
  createdAt: string
  notes: string
  timeline: { status: OrderStatus; date: string; note: string }[]
}

const STATUS_FLOW: OrderStatus[] = ['pending', 'confirmed', 'paid', 'processing', 'packed', 'shipped', 'delivered']

// Seeded PRNG for stable mock data across remounts
function mapApiOrder(o: any): Order {
  const items = (o.items || o.orderItems || []).map((item: any) => ({
    productName: item.product?.name || item.productName || 'Unknown Product',
    sku: item.product?.sku || item.sku || '',
    quantity: item.quantity || 1,
    price: item.price || item.unitPrice || 0,
  }))
  return {
    id: o.orderNumber || o.id,
    customerName: o.customer?.name || o.customerName || '',
    customerEmail: o.customer?.email || o.customerEmail || '',
    company: o.company || '',
    country: o.shippingCountry || o.country || '',
    items,
    subtotal: o.subtotal ?? 0,
    shipping: o.shippingCost ?? 0,
    tax: o.tax ?? 0,
    total: o.total ?? 0,
    status: (o.status || 'pending') as OrderStatus,
    paymentMethod: o.paymentMethod || 'Bank Transfer',
    paymentStatus: (o.paymentStatus || 'pending') as 'pending' | 'paid' | 'refunded',
    shippingAddress: o.shippingAddress || '',
    trackingNumber: o.trackingNumber || '',
    courier: o.courier || '',
    createdAt: o.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
    notes: o.notes || '',
    timeline: (o.timeline || []).map((t: any) => ({
      status: (t.status || 'pending') as OrderStatus,
      date: t.date || t.createdAt || new Date().toISOString(),
      note: t.note || t.message || '',
    })),
  }
}

const statusConfig: Record<OrderStatus, { label: string; color: string; bg: string; icon: typeof Package }> = {
  pending: { label: 'Pending', color: 'text-[var(--accent-gold)]', bg: 'bg-[var(--accent-gold)]/10', icon: Clock },
  confirmed: { label: 'Confirmed', color: 'text-[var(--accent-blue)]', bg: 'bg-[var(--accent-blue)]/10', icon: CheckCircle },
  paid: { label: 'Paid', color: 'text-[var(--success)]', bg: 'bg-[var(--success)]/10', icon: CreditCard },
  processing: { label: 'Processing', color: 'text-[var(--accent-teal)]', bg: 'bg-[var(--accent-teal)]/10', icon: Package },
  packed: { label: 'Packed', color: 'text-[var(--accent-blue)]', bg: 'bg-[var(--accent-blue)]/10', icon: Package },
  shipped: { label: 'Shipped', color: 'text-[var(--accent-teal)]', bg: 'bg-[var(--accent-teal)]/10', icon: Truck },
  delivered: { label: 'Delivered', color: 'text-[var(--success)]', bg: 'bg-[var(--success)]/10', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'text-[var(--danger)]', bg: 'bg-[var(--danger)]/10', icon: XCircle },
}

/** Get the next valid status transitions for a given status */
function getNextStatuses(current: OrderStatus): { status: OrderStatus; label: string }[] {
  if (current === 'cancelled') return []
  const idx = STATUS_FLOW.indexOf(current as OrderStatus)
  if (idx === -1 || idx === STATUS_FLOW.length - 1) {
    if (current === 'delivered') return []
    return []
  }
  const next = STATUS_FLOW[idx + 1]
  return [
    { status: next, label: statusConfig[next].label },
  ]
}

const ITEMS_PER_PAGE = 15

export default function AdminOrders() {
  const { toast } = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [page, setPage] = useState(1)
  const [showTrackingModal, setShowTrackingModal] = useState(false)
  const [trackingNumber, setTrackingNumber] = useState('')
  const [courier, setCourier] = useState('DHL')

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (search.trim()) params.search = search.trim()
      if (statusFilter) params.status = statusFilter
      if (dateFrom) params.from = dateFrom
      if (dateTo) params.to = dateTo
      params.page = String(page)
      params.limit = String(ITEMS_PER_PAGE)
      const res = await admin.orders.list(params)
      setOrders((res.orders || []).map(mapApiOrder))
    } catch (err: any) {
      console.error('Failed to load orders:', err)
      toast('Failed to load orders', 'error')
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, dateFrom, dateTo, page, toast])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  const filteredOrders = useMemo(() => {
    let result = [...orders]
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.company.toLowerCase().includes(q) ||
          o.items.some((i) => i.sku.toLowerCase().includes(q))
      )
    }
    if (statusFilter) {
      result = result.filter((o) => o.status === statusFilter)
    }
    if (dateFrom) {
      result = result.filter((o) => o.createdAt >= dateFrom)
    }
    if (dateTo) {
      result = result.filter((o) => o.createdAt <= dateTo)
    }
    return result
  }, [orders, search, statusFilter, dateFrom, dateTo])

  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE)
  const paginatedOrders = filteredOrders.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  const statusCounts = useMemo(() => {
    const counts = new Map<string, number>()
    orders.forEach((o) => counts.set(o.status, (counts.get(o.status) || 0) + 1))
    return counts
  }, [orders])

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const handleExportCsv = () => {
    const headers = ['Order ID', 'Customer', 'Company', 'Country', 'Items', 'Subtotal', 'Shipping', 'Tax', 'Total', 'Status', 'Payment', 'Payment Status', 'Created', 'Tracking']
    const rows = filteredOrders.map((o) => [
      o.id, o.customerName, o.company, o.country,
      o.items.length.toString(), o.subtotal.toString(), o.shipping.toString(), o.tax.toString(), o.total.toString(),
      o.status, o.paymentMethod, o.paymentStatus, o.createdAt, o.trackingNumber,
    ])
    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `orders-export-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleAdvanceStatus = async (orderId: string) => {
    const order = orders.find((o) => o.id === orderId)
    if (!order) return
    const next = getNextStatuses(order.status)
    if (next.length === 0) return
    try {
      await admin.orders.updateStatus(orderId, next[0].status)
      toast(`Order ${orderId} → ${next[0].label}`, 'success')
      fetchOrders()
    } catch (err: any) {
      toast(err.message || 'Failed to update status', 'error')
    }
  }

  const handleCancelOrder = async (orderId: string) => {
    try {
      await admin.orders.cancel(orderId, 'Cancelled by admin')
      toast(`Order ${orderId} cancelled`, 'success')
      fetchOrders()
    } catch (err: any) {
      toast(err.message || 'Failed to cancel order', 'error')
    }
  }

  const hasActiveFilters = search.trim() || statusFilter || dateFrom || dateTo

  return (
    <div className="space-y-5">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-[var(--text-primary)]">
            Orders
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {filteredOrders.length} of {orders.length} orders
          </p>
        </div>
        <button
          onClick={handleExportCsv}
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2.5 text-xs font-bold text-[var(--text-secondary)] transition-all hover:border-[var(--accent-teal)] hover:text-[var(--accent-teal)]"
        >
          <Download size={14} />
          Export CSV
        </button>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => { setStatusFilter(''); setPage(1) }}
          className={`shrink-0 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
            statusFilter === ''
              ? 'bg-[var(--accent-gold)] text-navy-deep shadow-[0_4px_12px_rgba(232,170,36,0.2)]'
              : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-gold)]'
          }`}
        >
          All ({orders.length})
        </button>
        {(Object.keys(statusConfig) as OrderStatus[]).map((status) => (
          <button
            key={status}
            onClick={() => { setStatusFilter(status === statusFilter ? '' : status); setPage(1) }}
            className={`shrink-0 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
              statusFilter === status
                ? `${statusConfig[status].bg} ${statusConfig[status].color} border border-current/20`
                : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-gold)]'
            }`}
          >
            {statusConfig[status].label} ({statusCounts.get(status) || 0})
          </button>
        ))}
      </div>

      {/* Search + Date Filters */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search by order ID, customer, company, or SKU..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] py-2.5 pl-10 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition-all focus:border-[var(--accent-gold)] focus:shadow-[0_0_0_3px_rgba(232,170,36,0.1)]"
            />
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-[var(--text-muted)] shrink-0" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
              placeholder="From"
              className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] py-2.5 px-3 text-xs text-[var(--text-primary)] outline-none transition-all focus:border-[var(--accent-gold)]"
            />
            <span className="text-xs text-[var(--text-muted)]">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
              placeholder="To"
              className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] py-2.5 px-3 text-xs text-[var(--text-primary)] outline-none transition-all focus:border-[var(--accent-gold)]"
            />
            {hasActiveFilters && (
              <button
                onClick={() => { setSearch(''); setStatusFilter(''); setDateFrom(''); setDateTo(''); setPage(1) }}
                className="inline-flex items-center gap-1 rounded-lg bg-[var(--danger)]/10 px-2.5 py-2 text-xs font-bold text-[var(--danger)] hover:bg-[var(--danger)]/20 transition-colors"
              >
                <X size={10} /> Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-[var(--accent-gold)]" />
            <span className="ml-3 text-sm text-[var(--text-muted)]">Loading orders...</span>
          </div>
        ) : (
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Date</th>
                <th className="w-20">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <Package size={32} className="mx-auto text-[var(--text-muted)] mb-3" />
                    <p className="text-sm font-semibold text-[var(--text-muted)]">No orders found</p>
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="cursor-pointer hover:bg-[var(--surface-soft)]"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <td className="font-mono text-xs font-bold text-[var(--accent-blue)]">{order.id}</td>
                    <td>
                      <div>
                        <p className="text-xs font-semibold text-[var(--text-primary)]">{order.company}</p>
                        <p className="text-[0.625rem] text-[var(--text-muted)]">{order.country}</p>
                      </div>
                    </td>
                    <td className="text-xs">{order.items.length} items</td>
                    <td className="font-mono text-xs font-bold">${order.total.toLocaleString()}</td>
                    <td>
                      <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[0.625rem] font-bold ${statusConfig[order.status].bg} ${statusConfig[order.status].color}`}>
                        {(() => {
                          const Icon = statusConfig[order.status].icon
                          return <Icon size={10} />
                        })()}
                        {statusConfig[order.status].label}
                      </span>
                    </td>
                    <td>
                      <span className={`text-[0.625rem] font-bold ${
                        order.paymentStatus === 'paid' ? 'text-[var(--success)]' :
                        order.paymentStatus === 'refunded' ? 'text-[var(--danger)]' :
                        'text-[var(--accent-gold)]'
                      }`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="text-xs text-[var(--text-muted)]">{formatDate(order.createdAt)}</td>
                    <td>
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedOrder(order) }}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--accent-gold)] hover:bg-[var(--gold-muted)] transition-colors"
                      >
                        <Eye size={12} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        )}

        <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      {/* Tracking Update Modal */}
      {showTrackingModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[var(--surface)] w-full max-w-[400px] rounded-2xl shadow-2xl border border-[var(--border)] p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Update Tracking</h3>
              <button onClick={() => setShowTrackingModal(false)} className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-soft)]">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">Tracking Number</label>
                <input type="text" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="e.g. 1234567890" className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-teal)] font-mono" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">Courier</label>
                <select value={courier} onChange={(e) => setCourier(e.target.value)} className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-teal)]">
                  <option value="DHL">DHL</option>
                  <option value="FedEx">FedEx</option>
                  <option value="UPS">UPS</option>
                  <option value="TNT">TNT</option>
                  <option value="Maersk">Maersk</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowTrackingModal(false)} className="flex-1 py-2.5 border border-[var(--border)] bg-transparent text-[var(--text-secondary)] font-semibold text-xs rounded-xl hover:border-[var(--danger)] hover:text-[var(--danger)] transition-colors">
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!trackingNumber.trim()) { toast('Enter a tracking number', 'error'); return }
                  if (!selectedOrder) return
                  admin.orders.updateTracking(selectedOrder.id, trackingNumber, courier)
                    .then(() => { toast('Tracking updated', 'success'); fetchOrders(); setShowTrackingModal(false); setSelectedOrder(null) })
                    .catch((err: any) => toast(err.message || 'Failed to update tracking', 'error'))
                }}
                disabled={!trackingNumber.trim()}
                className="flex-1 py-2.5 bg-[var(--accent-teal)] text-[var(--btn-blue-text)] font-semibold text-xs rounded-xl hover:bg-[var(--accent-teal)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Tracking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Detail Slide-over */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-black/50 backdrop-blur-sm" onClick={() => setSelectedOrder(null)}>
          <div
            className="relative w-full max-w-xl max-md:max-w-full max-md:rounded-none bg-[var(--surface)] shadow-2xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-6 py-4">
              <div>
                <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">
                  {selectedOrder.id}
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {formatDate(selectedOrder.createdAt)} · {selectedOrder.company}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-soft)] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status + Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold ${statusConfig[selectedOrder.status].bg} ${statusConfig[selectedOrder.status].color}`}>
                    {(() => {
                      const Icon = statusConfig[selectedOrder.status].icon
                      return <Icon size={12} />
                    })()}
                    {statusConfig[selectedOrder.status].label}
                  </span>
                  <span className={`text-xs font-bold ${
                    selectedOrder.paymentStatus === 'paid' ? 'text-[var(--success)]' :
                    selectedOrder.paymentStatus === 'refunded' ? 'text-[var(--danger)]' :
                    'text-[var(--accent-gold)]'
                  }`}>
                    Payment: {selectedOrder.paymentStatus}
                  </span>
                </div>
              </div>

              {/* Status Update Buttons */}
              {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'delivered' && (
                <div className="rounded-xl border border-[var(--accent-gold)]/20 bg-[var(--accent-gold)]/5 p-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">Update Status</h3>
                  <div className="flex flex-wrap gap-2">
                    {getNextStatuses(selectedOrder.status).map((next) => {
                      const cfg = statusConfig[next.status]
                      const Icon = cfg.icon
                      return (
                        <button
                          key={next.status}
                          onClick={() => handleAdvanceStatus(selectedOrder.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-current/20 bg-[var(--success)]/10 px-3 py-2 text-xs font-bold text-[var(--success)] hover:bg-[var(--success)]/20 transition-colors"
                        >
                          <Icon size={12} /> Mark as {cfg.label}
                        </button>
                      )
                    })}
                    <button
                      onClick={() => handleCancelOrder(selectedOrder.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--danger)]/20 bg-[var(--danger)]/10 px-3 py-2 text-xs font-bold text-[var(--danger)] hover:bg-[var(--danger)]/20 transition-colors"
                    >
                      <XCircle size={12} /> Cancel Order
                    </button>
                  </div>
                </div>
              )}

              {selectedOrder.status === 'delivered' && (
                <div className="rounded-xl border border-[var(--success)]/20 bg-[var(--success)]/5 p-4 text-center">
                  <CheckCircle size={20} className="mx-auto text-[var(--success)] mb-1" />
                  <p className="text-xs font-bold text-[var(--success)]">Order Delivered</p>
                </div>
              )}

              {selectedOrder.status === 'cancelled' && (
                <div className="rounded-xl border border-[var(--danger)]/20 bg-[var(--danger)]/5 p-4 text-center">
                  <AlertTriangle size={20} className="mx-auto text-[var(--danger)] mb-1" />
                  <p className="text-xs font-bold text-[var(--danger)]">Order Cancelled</p>
                </div>
              )}

              {/* Customer Info */}
              <div className="rounded-xl border border-[var(--border)] p-4 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Customer</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <User size={12} className="text-[var(--text-muted)]" />
                    <span className="text-xs text-[var(--text-secondary)]">{selectedOrder.customerName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText size={12} className="text-[var(--text-muted)]" />
                    <span className="text-xs text-[var(--text-secondary)]">{selectedOrder.customerEmail}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard size={12} className="text-[var(--text-muted)]" />
                    <span className="text-xs text-[var(--text-secondary)]">{selectedOrder.paymentMethod}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={12} className="text-[var(--text-muted)]" />
                    <span className="text-xs text-[var(--text-secondary)]">{selectedOrder.country}</span>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="rounded-xl border border-[var(--border)] p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">Items</h3>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
                      <div>
                        <p className="text-xs font-semibold text-[var(--text-primary)]">{item.productName}</p>
                        <p className="text-[0.625rem] text-[var(--text-muted)] font-mono">{item.sku}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-[var(--text-primary)]">${(item.price * item.quantity).toLocaleString()}</p>
                        <p className="text-[0.625rem] text-[var(--text-muted)]">{item.quantity} × ${item.price}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-[var(--border)] space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--text-muted)]">Subtotal</span>
                    <span className="font-mono font-bold">${selectedOrder.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--text-muted)]">Shipping</span>
                    <span className="font-mono font-bold">${selectedOrder.shipping.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--text-muted)]">Tax</span>
                    <span className="font-mono font-bold">${selectedOrder.tax.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold pt-1 border-t border-[var(--border)]">
                    <span>Total</span>
                    <span className="font-mono text-[var(--accent-gold)]">${selectedOrder.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Shipping */}
              <div className="rounded-xl border border-[var(--border)] p-4 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Shipping</h3>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <MapPin size={12} className="text-[var(--text-muted)] mt-0.5 shrink-0" />
                    <span className="text-xs text-[var(--text-secondary)]">{selectedOrder.shippingAddress}</span>
                  </div>
                  {selectedOrder.trackingNumber && (
                    <div className="flex items-center gap-2">
                      <Truck size={12} className="text-[var(--text-muted)]" />
                      <span className="text-xs text-[var(--text-secondary)]">
                        {selectedOrder.courier} · <span className="font-mono font-bold">{selectedOrder.trackingNumber}</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Tracking Timeline */}
              <div className="rounded-xl border border-[var(--border)] p-4 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Tracking Timeline</h3>
                <div className="space-y-0">
                  {selectedOrder.timeline.map((event, i) => {
                    const cfg = statusConfig[event.status]
                    const Icon = cfg.icon
                    const isLast = i === selectedOrder.timeline.length - 1
                    return (
                      <div key={i} className="flex gap-3">
                        {/* Vertical line + dot */}
                        <div className="flex flex-col items-center">
                          <div className={`flex h-6 w-6 items-center justify-center rounded-full ${cfg.bg} ${cfg.color} shrink-0`}>
                            <Icon size={10} />
                          </div>
                          {!isLast && <div className="w-px flex-1 bg-[var(--border)] my-1" />}
                        </div>
                        {/* Content */}
                        <div className={`pb-4 ${isLast ? '' : ''}`}>
                          <p className={`text-xs font-bold ${cfg.color}`}>{cfg.label}</p>
                          <p className="text-[0.625rem] text-[var(--text-muted)]">{formatDateTime(event.date)}</p>
                          <p className="text-xs text-[var(--text-secondary)] mt-0.5">{event.note}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center gap-2 pt-2">
                <button onClick={async () => {
                  const realOrder = orders.find((o) => o.id === selectedOrder.id)
                  const orderId = realOrder?.id || selectedOrder.id
                  try {
                    const token = getAdminToken()
                    const res = await fetch(`/api/admin/orders/${orderId}/invoice`, {
                      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                      credentials: 'include',
                    })
                    const html = await res.text()
                    const blob = new Blob([html], { type: 'text/html' })
                    const url = URL.createObjectURL(blob)
                    window.open(url, '_blank')
                    setTimeout(() => URL.revokeObjectURL(url), 60000)
                  } catch (err: any) {
                    toast(err.message || 'Failed to generate invoice', 'error')
                  }
                }} className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-xs font-bold text-[var(--text-secondary)] hover:border-[var(--accent-gold)] transition-colors">
                  <Download size={12} /> Invoice
                </button>
                <button onClick={() => {
                  setTrackingNumber(selectedOrder.trackingNumber || '')
                  setCourier(selectedOrder.courier || 'DHL')
                  setShowTrackingModal(true)
                }} className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-xs font-bold text-[var(--text-secondary)] hover:border-[var(--accent-teal)] transition-colors">
                  <Truck size={12} /> Update Tracking
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
