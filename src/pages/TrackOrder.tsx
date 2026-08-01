import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Package, Truck, CheckCircle, Clock, XCircle, Search } from 'lucide-react'
import { storefront } from '../lib/api'
import { useStoreSettings } from '../hooks/useStoreSettings'
import { SEO } from '../components/seo/SEO'

const statusSteps = [
  { key: 'pending', label: 'Order Placed', icon: Clock },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle },
  { key: 'processing', label: 'Processing', icon: Package },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle },
]

const statusIndex: Record<string, number> = {
  pending: 0, confirmed: 1, 'payment-pending': 1, paid: 1,
  processing: 2, packed: 2, shipped: 3, delivered: 4,
  cancelled: -1, 'cancel-requested': -1,
}

export default function TrackOrder() {
  const { whatsappNumber } = useStoreSettings()
  const [searchParams] = useSearchParams()
  const initialId = searchParams.get('id') || ''

  const [orderNumber, setOrderNumber] = useState(initialId)
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleTrack = async (num?: string) => {
    const search = num || orderNumber
    if (!search.trim()) { setError('Please enter an order number'); return }
    setLoading(true)
    setError('')
    setOrder(null)
    try {
      // Try direct ID lookup first, then search via list
      const res = await storefront.orders.list({ search: search.trim() })
      const found = res.orders?.find((o: any) =>
        o.orderNumber?.toLowerCase() === search.trim().toLowerCase() ||
        o.id?.toLowerCase() === search.trim().toLowerCase()
      )
      if (found) {
        setOrder(found)
      } else {
        setError('Order not found. Please check your order number.')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to look up order')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (initialId) handleTrack(initialId)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const currentStep = order ? (statusIndex[order.status] ?? -1) : -1

  return (
    <div className="min-h-screen bg-[var(--primary-bg)]">
      <SEO
        title="Track Your Order — Alka Traders"
        description="Track your marine and industrial equipment order. Enter your order number to see the current shipping status and delivery updates."
        canonical="/track-order"
      />
      {/* Header */}
      <section className="bg-[var(--secondary-bg)] py-12">
        <div className="max-w-[720px] mx-auto px-4 sm:px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <img
              src="/images/alka-traders-logo.jpeg"
              alt="Alka Traders Logo"
              className="w-8 h-8 rounded-xl object-cover shadow-sm"
            />
          </div>
          <h1 className="font-display text-3xl font-bold text-[var(--text-primary)] mb-2">Track Your Order</h1>
          <p className="text-sm text-[var(--text-secondary)]">Enter your order number to see the current status</p>
        </div>
      </section>

      <section className="py-10">
        <div className="max-w-[720px] mx-auto px-4 sm:px-6">
          {/* Search bar */}
          <div className="flex gap-3 mb-8">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
                placeholder="Enter order number (e.g. AT-12345)"
                className="w-full pl-10 pr-4 py-3.5 bg-[var(--input-bg)] border border-[var(--input-border)] text-sm text-[var(--input-text)] rounded-xl outline-none focus:border-[var(--accent-primary)] transition-all placeholder:text-[var(--input-placeholder)]"
              />
            </div>
            <button
              onClick={() => handleTrack()}
              disabled={loading}
              className="px-6 py-3.5 bg-[var(--accent-primary)] text-[var(--btn-blue-text)] font-semibold text-sm rounded-xl hover:bg-[var(--accent-primary-hover)] transition-all disabled:opacity-50 whitespace-nowrap"
            >
              {loading ? <div className="h-5 w-5 border-2 border-white border-t-transparent animate-spin" /> : 'Track'}
            </button>
          </div>

          {error && (
            <div className="bg-[var(--danger)]/10 border border-[var(--danger)]/20 text-[var(--danger)] text-sm px-4 py-3 rounded-xl mb-6 text-center">
              {error}
            </div>
          )}

          {/* Order result */}
          {order && (
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden">
              {/* Order header */}
              <div className="p-6 border-b border-[var(--border)]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-[var(--text-muted)] mb-1">Order Number</p>
                    <h2 className="font-mono text-lg font-bold text-[var(--text-primary)]">#{order.orderNumber}</h2>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[var(--text-muted)] mb-1">Status</p>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full ${
                      order.status === 'delivered' ? 'bg-[var(--success)]/10 text-[var(--success)]' :
                      order.status === 'shipped' ? 'bg-[var(--accent-teal)]/10 text-[var(--accent-teal)]' :
                      order.status === 'cancelled' ? 'bg-[var(--danger)]/10 text-[var(--danger)]' :
                      'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                    }`}>
                      {order.status === 'delivered' ? <CheckCircle size={12} /> :
                       order.status === 'shipped' ? <Truck size={12} /> :
                       order.status === 'cancelled' ? <XCircle size={12} /> :
                       <Clock size={12} />}
                      {order.status.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                    </span>
                  </div>
                </div>
                <div className="flex gap-6 mt-4 text-xs text-[var(--text-muted)]">
                  <span>Placed: {new Date(order.createdAt).toLocaleDateString()}</span>
                  <span>Total: <strong className="text-[var(--text-primary)]">${order.grandTotal?.toFixed(2)}</strong></span>
                </div>
              </div>

              {/* Progress steps */}
              {order.status !== 'cancelled' && (
                <div className="p-6">
                  <div className="flex items-start justify-between relative">
                    {/* Connection line */}
                    <div className="absolute top-5 left-0 right-0 h-0.5 bg-[var(--border)]" />
                    <div
                      className="absolute top-5 left-0 h-0.5 bg-[var(--accent-primary)] text-[var(--btn-blue-text)] transition-all duration-500"
                      style={{ width: `${Math.min(100, (currentStep / (statusSteps.length - 1)) * 100)}%` }}
                    />

                    {statusSteps.map((step, i) => {
                      const isCompleted = i <= currentStep
                      const isCurrent = i === currentStep
                      const StepIcon = step.icon
                      return (
                        <div key={step.key} className="relative flex flex-col items-center z-10" style={{ width: `${100 / statusSteps.length}%` }}>
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                            isCompleted
                              ? 'bg-[var(--accent-primary)] text-[var(--btn-blue-text)] border-[var(--accent-primary)]'
                              : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-muted)]'
                          } ${isCurrent ? 'ring-4 ring-[var(--focus-ring)]' : ''}`}>
                            <StepIcon size={16} />
                          </div>
                          <span className={`text-[10px] mt-2 text-center font-medium leading-tight ${
                            isCompleted ? 'text-[var(--accent-primary)]' : 'text-[var(--text-muted)]'
                          }`}>
                            {step.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Tracking info */}
              {order.trackingNumber && (
                <div className="px-6 pb-6">
                  <div className="bg-[var(--primary-bg)] border border-[var(--border)] rounded-xl p-4">
                    <p className="text-xs text-[var(--text-muted)] mb-1">Tracking Number</p>
                    <p className="font-mono text-sm font-bold text-[var(--accent-primary)]">{order.trackingNumber}</p>
                    {order.courier && <p className="text-xs text-[var(--text-muted)] mt-1">Carrier: {order.courier}</p>}
                  </div>
                </div>
              )}

              {/* Shipping address */}
              {order.shipping && (
                <div className="px-6 pb-6">
                  <p className="text-xs font-medium text-[var(--text-muted)] mb-2 uppercase tracking-wider">Shipping To</p>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {order.shipping.fullName}<br />
                    {order.shipping.addressLine1}{order.shipping.addressLine2 ? `, ${order.shipping.addressLine2}` : ''}<br />
                    {order.shipping.city}, {order.shipping.state} {order.shipping.postalCode}<br />
                    {order.shipping.country}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Help */}
          <div className="text-center mt-8">
            <p className="text-xs text-[var(--text-muted)]">
              Need help?{' '}
              <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="text-[var(--accent-primary)] hover:underline">
                Contact us on WhatsApp
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
