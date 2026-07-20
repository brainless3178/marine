import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Package, Eye, Clock, Truck, CheckCircle, XCircle, ChevronRight } from 'lucide-react'
import { storefront } from '../../lib/api'
import { useStore } from '../../store/useStore'

interface Order {
  id: string
  orderNumber: string
  status: string
  paymentStatus: string
  grandTotal: number
  currency: string
  createdAt: string
  items: { productName: string; quantity: number; unitPrice: number }[]
  shipping: { fullName: string; city: string; country: string }
}

const statusConfig: Record<string, { color: string; icon: typeof Package }> = {
  pending: { color: 'text-[var(--text-muted)]', icon: Clock },
  confirmed: { color: 'text-[var(--accent-blue)]', icon: CheckCircle },
  'payment-pending': { color: 'text-[var(--accent-gold)]', icon: Clock },
  paid: { color: 'text-[var(--accent-blue)]', icon: CheckCircle },
  processing: { color: 'text-[var(--accent-blue)]', icon: Package },
  packed: { color: 'text-[var(--accent-blue)]', icon: Package },
  shipped: { color: 'text-[var(--accent-teal)]', icon: Truck },
  delivered: { color: 'text-[var(--success)]', icon: CheckCircle },
  cancelled: { color: 'text-[var(--danger)]', icon: XCircle },
}

export default function OrderHistory() {
  const navigate = useNavigate()
  const user = useStore((s) => s.user)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) {
      navigate('/')
      return
    }
    storefront.orders.list()
      .then((res) => setOrders(res.orders))
      .catch((err) => setError(err.message || 'Failed to load orders'))
      .finally(() => setLoading(false))
  }, [user, navigate])

  if (!user) return null

  return (
    <div className="min-h-screen bg-[var(--primary-bg)]">
      {/* Header */}
      <section className="bg-[var(--secondary-bg)] py-12">
        <div className="max-w-[1024px] mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-2 mb-2 text-xs text-[var(--text-muted)]">
            <Link to="/" className="hover:text-[var(--text-secondary)]">Home</Link>
            <ChevronRight size={12} />
            <span className="text-[var(--text-secondary)]">My Orders</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-[var(--text-primary)]">Order History</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">View and track your past orders</p>
        </div>
      </section>

      <section className="py-10">
        <div className="max-w-[1024px] mx-auto px-4 sm:px-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-[var(--accent-blue)] border-t-transparent animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-sm text-[var(--danger)]">{error}</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-20">
              <Package size={48} className="text-[var(--text-muted)] mx-auto mb-4" />
              <h2 className="font-display text-xl font-bold text-[var(--text-primary)] mb-2">No orders yet</h2>
              <p className="text-sm text-[var(--text-secondary)] mb-6">Start shopping to see your orders here.</p>
              <Link
                to="/products"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--accent-blue)] text-[var(--btn-blue-text)] font-semibold text-sm rounded-full hover:bg-[var(--accent-blue)]/90 transition-all"
              >
                Browse Products
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const status = statusConfig[order.status] || statusConfig.pending
                const StatusIcon = status.icon
                return (
                  <div
                    key={order.id}
                    className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 hover:border-[var(--accent-blue)]/30 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-mono text-sm font-bold text-[var(--text-primary)]">#{order.orderNumber}</span>
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold ${status.color}`}>
                            <StatusIcon size={12} />
                            {order.status.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--text-muted)]">
                          {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                          {order.items.length > 0 && (
                            <> · {order.items.length} item{order.items.length > 1 ? 's' : ''}</>
                          )}
                        </p>
                        {order.items.length > 0 && (
                          <p className="text-xs text-[var(--text-secondary)] mt-1 truncate">
                            {order.items.slice(0, 3).map((i) => i.productName).join(', ')}
                            {order.items.length > 3 && ` +${order.items.length - 3} more`}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-display text-lg font-bold text-[var(--text-primary)]">
                          ${order.grandTotal.toFixed(2)}
                        </span>
                        <Link
                          to={`/track-order?id=${order.orderNumber}`}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold border border-[var(--border)] text-[var(--accent-blue)] hover:bg-[var(--accent-blue)]/5 rounded-lg transition-all"
                        >
                          <Eye size={12} /> Track
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
