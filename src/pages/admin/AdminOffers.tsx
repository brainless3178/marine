import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  Search,
  HandCoins,
  Eye,
  X,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MapPin,
  Building,
  Calendar,
  Tag,
  Download,
  ShoppingCart,
  Loader2,
} from 'lucide-react'
import { admin } from '../../lib/api'
import { useToast } from '../../components/admin/toast-context'
import { ConfirmDialog } from '../../components/admin/ConfirmDialog'
import { AdminPagination } from '../../components/admin/AdminPagination'
import type { ApiOffer, ApiOfferItem } from '../../lib/api-types'

type OfferStatus = 'pending' | 'accepted' | 'rejected' | 'expired'

interface OfferItem {
  productName: string
  sku: string
  quantity: number
  unitPrice: number
  total: number
}

interface Offer {
  id: string
  rfqId: string
  customerCompany: string
  customerCountry: string
  subject: string
  status: OfferStatus
  items: OfferItem[]
  subtotal: number
  shipping: number
  total: number
  currency: string
  validUntil: string
  createdAt: string
  notes: string
  terms: string
}

function mapApiOffer(o: ApiOffer): Offer {
  const items: OfferItem[] = (o.items || []).map((item: ApiOfferItem) => ({
    productName: item.productName || 'Unknown',
    sku: item.sku || '',
    quantity: item.quantity || 1,
    unitPrice: item.unitPrice || item.price || 0,
    total: (item.quantity || 1) * (item.unitPrice || item.price || 0),
  }))
  return {
    id: o.offerNumber || o.id,
    rfqId: o.rfqNumber || o.rfqId || '',
    customerCompany: o.company || o.customerCompany || '',
    customerCountry: o.country || o.customerCountry || '',
    subject: o.subject || items[0]?.productName || 'Offer',
    status: (o.status || 'pending') as OfferStatus,
    items,
    subtotal: o.subtotal ?? items.reduce((s, i) => s + i.total, 0),
    shipping: o.shipping ?? 0,
    total: o.total ?? items.reduce((s, i) => s + i.total, 0),
    currency: o.currency || 'USD',
    validUntil: o.validUntil?.split('T')[0] || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    createdAt: o.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
    notes: o.notes || '',
    terms: o.terms || 'Payment: 30-day net. Delivery: FOB Jebel Ali. Warranty: 12 months from delivery.',
  }
}

const statusConfig: Record<OfferStatus, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  pending: { label: 'Pending', color: 'text-[var(--accent-gold)]', bg: 'bg-[var(--accent-gold)]/10', icon: Clock },
  accepted: { label: 'Accepted', color: 'text-[var(--success)]', bg: 'bg-[var(--success)]/10', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'text-[var(--danger)]', bg: 'bg-[var(--danger)]/10', icon: XCircle },
  expired: { label: 'Expired', color: 'text-[var(--text-muted)]', bg: 'bg-[var(--text-muted)]/10', icon: AlertTriangle },
}

const ITEMS_PER_PAGE = 12

export default function AdminOffers() {
  const { toast } = useToast()
  const [offers, setOffers] = useState<Offer[]>([])
  const [_loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<OfferStatus | ''>('')
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null)
  const [page, setPage] = useState(1)
  const [rejectTarget, setRejectTarget] = useState<string | null>(null)
  const [convertingOffer, setConvertingOffer] = useState<string | null>(null)

  const fetchOffers = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (search.trim()) params.search = search.trim()
      if (statusFilter) params.status = statusFilter
      params.page = String(page)
      params.limit = String(ITEMS_PER_PAGE)
      const res = await admin.offers.list(params)
      setOffers((res.offers || []).map(mapApiOffer))
    } catch (err: unknown) {
      console.error('Failed to load offers:', err)
      toast('Failed to load offers', 'error')
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, page, toast])

  useEffect(() => { fetchOffers() }, [fetchOffers])

  const filtered = useMemo(() => {
    let result = [...offers]
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((o) => o.id.toLowerCase().includes(q) || o.customerCompany.toLowerCase().includes(q) || o.subject.toLowerCase().includes(q) || o.rfqId.toLowerCase().includes(q))
    }
    if (statusFilter) result = result.filter((o) => o.status === statusFilter)
    return result
  }, [offers, search, statusFilter])

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  const statusCounts = useMemo(() => {
    const counts = new Map<string, number>()
    offers.forEach((o) => counts.set(o.status, (counts.get(o.status) || 0) + 1))
    return counts
  }, [offers])

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  const handleAccept = async (offerId: string) => {
    try {
      await admin.offers.accept(offerId)
      toast(`Offer ${offerId} accepted`, 'success')
      fetchOffers()
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to accept offer', 'error')
    }
  }

  const handleReject = async (offerId: string) => {
    try {
      await admin.offers.reject(offerId)
      toast(`Offer ${offerId} rejected`, 'info')
      fetchOffers()
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to reject offer', 'error')
    }
  }

  const handleConvertToOrder = async (offerId: string) => {
    setConvertingOffer(offerId)
    try {
      const result = await admin.offers.convertToOrder(offerId)
      toast(`Order ${result.order?.orderNumber || ''} created from offer`, 'success')
      fetchOffers()
      setSelectedOffer(null)
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to convert offer to order', 'error')
    } finally {
      setConvertingOffer(null)
    }
  }

  const handleExportCsv = () => {
    const headers = ['Offer ID', 'RFQ ID', 'Customer', 'Country', 'Items', 'Subtotal', 'Shipping', 'Total', 'Status', 'Created', 'Valid Until']
    const rows = filtered.map((o) => [o.id, o.rfqId, o.customerCompany, o.customerCountry, o.items.length.toString(), o.subtotal.toString(), o.shipping.toString(), o.total.toString(), o.status, o.createdAt, o.validUntil])
    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `offers-export-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast('Offers exported to CSV', 'success')
  }

  return (
    <>
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-[var(--text-primary)]">Offers</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">{filtered.length} of {offers.length} offers</p>
        </div>
        <button onClick={handleExportCsv} className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2.5 text-xs font-bold text-[var(--text-secondary)] transition-all hover:border-[var(--accent-teal)] hover:text-[var(--accent-teal)]">
          <Download size={14} /> Export CSV
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => { setStatusFilter(''); setPage(1) }} className={`shrink-0 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${statusFilter === '' ? 'bg-[var(--accent-gold)] text-[var(--btn-blue-text)] shadow-[0_4px_12px_rgba(232,170,36,0.2)]' : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-gold)]'}`}>
          All ({offers.length})
        </button>
        {(Object.keys(statusConfig) as OfferStatus[]).map((s) => (
          <button key={s} onClick={() => { setStatusFilter(s === statusFilter ? '' : s); setPage(1) }} className={`shrink-0 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${statusFilter === s ? `${statusConfig[s].bg} ${statusConfig[s].color} border border-current/20` : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-gold)]'}`}>
            {statusConfig[s].label} ({statusCounts.get(s) || 0})
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input type="text" placeholder="Search by offer ID, company, subject, or RFQ ID..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] py-2.5 pl-10 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-all focus:border-[var(--accent-gold)]" />
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Offer ID</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Valid Until</th>
                <th className="w-20">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12"><HandCoins size={32} className="mx-auto text-[var(--text-muted)] mb-3" /><p className="text-sm font-semibold text-[var(--text-muted)]">No offers found</p></td></tr>
              ) : paginated.map((offer) => {
                const sts = statusConfig[offer.status]
                const StsIcon = sts.icon
                return (
                  <tr key={offer.id} className="cursor-pointer hover:bg-[var(--surface-soft)]" onClick={() => setSelectedOffer(offer)}>
                    <td className="font-mono text-xs font-bold text-[var(--accent-blue)]">{offer.id}</td>
                    <td>
                      <div>
                        <p className="text-xs font-semibold text-[var(--text-primary)]">{offer.customerCompany}</p>
                        <p className="text-[0.625rem] text-[var(--text-muted)]">{offer.customerCountry} · RFQ: {offer.rfqId}</p>
                      </div>
                    </td>
                    <td className="text-xs">{offer.items.length} items</td>
                    <td className="font-mono text-xs font-bold">${offer.total.toLocaleString()}</td>
                    <td>
                      <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[0.625rem] font-bold ${sts.bg} ${sts.color}`}>
                        <StsIcon size={10} /> {sts.label}
                      </span>
                    </td>
                    <td className="text-xs text-[var(--text-muted)]">{formatDate(offer.validUntil)}</td>
                    <td>
                      <button onClick={(e) => { e.stopPropagation(); setSelectedOffer(offer) }} className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--accent-gold)] hover:bg-[var(--gold-muted)] transition-colors">
                        <Eye size={12} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      {selectedOffer && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-black/50 backdrop-blur-sm" onClick={() => setSelectedOffer(null)}>
          <div className="relative w-full max-w-xl max-md:max-w-full max-md:rounded-none bg-[var(--surface)] shadow-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-6 py-4">
              <div>
                <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">{selectedOffer.id}</h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">{selectedOffer.subject}</p>
              </div>
              <button onClick={() => setSelectedOffer(null)} className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-soft)] transition-colors"><X size={16} /></button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold ${statusConfig[selectedOffer.status].bg} ${statusConfig[selectedOffer.status].color}`}>
                  {(() => { const I = statusConfig[selectedOffer.status].icon; return <I size={12} /> })()}
                  {statusConfig[selectedOffer.status].label}
                </span>
                <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]"><Tag size={12} /> RFQ: {selectedOffer.rfqId}</span>
              </div>

              {selectedOffer.status === 'pending' && (
                <div className="rounded-xl border border-[var(--accent-gold)]/20 bg-[var(--accent-gold)]/5 p-4 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Offer Actions</h3>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => handleAccept(selectedOffer.id)} className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--success)]/20 bg-[var(--success)]/10 px-3 py-2 text-xs font-bold text-[var(--success)] hover:bg-[var(--success)]/20 transition-colors">
                      <CheckCircle size={12} /> Accept Offer
                    </button>
                    <button onClick={() => setRejectTarget(selectedOffer.id)} className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--danger)]/20 bg-[var(--danger)]/10 px-3 py-2 text-xs font-bold text-[var(--danger)] hover:bg-[var(--danger)]/20 transition-colors">
                      <XCircle size={12} /> Reject Offer
                    </button>
                  </div>
                </div>
              )}

              {selectedOffer.status === 'accepted' && (
                <div className="rounded-xl border border-[var(--success)]/20 bg-[var(--success)]/5 p-4 space-y-3">
                  <div className="text-center">
                    <CheckCircle size={20} className="mx-auto text-[var(--success)] mb-1" />
                    <p className="text-xs font-bold text-[var(--success)]">Offer Accepted — ready to process</p>
                  </div>
                  <button onClick={() => handleConvertToOrder(selectedOffer.id)} disabled={convertingOffer === selectedOffer.id} className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--success)] px-4 py-2.5 text-xs font-bold text-[var(--btn-success-text)] hover:bg-[var(--success)]/90 transition-colors disabled:opacity-50">
                    {convertingOffer === selectedOffer.id ? <><Loader2 size={12} className="animate-spin" /> Converting...</> : <><ShoppingCart size={12} /> Convert to Order</>}
                  </button>
                </div>
              )}

              {selectedOffer.status === 'rejected' && (
                <div className="rounded-xl border border-[var(--danger)]/20 bg-[var(--danger)]/5 p-4 text-center">
                  <XCircle size={20} className="mx-auto text-[var(--danger)] mb-1" />
                  <p className="text-xs font-bold text-[var(--danger)]">Offer Rejected</p>
                </div>
              )}

              {selectedOffer.status === 'expired' && (
                <div className="rounded-xl border border-[var(--text-muted)]/20 bg-[var(--text-muted)]/5 p-4 text-center">
                  <AlertTriangle size={20} className="mx-auto text-[var(--text-muted)] mb-1" />
                  <p className="text-xs font-bold text-[var(--text-muted)]">Offer Expired</p>
                </div>
              )}

              <div className="rounded-xl border border-[var(--border)] p-4 space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Details</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2"><Building size={12} className="text-[var(--text-muted)]" /><span className="text-xs text-[var(--text-secondary)]">{selectedOffer.customerCompany}</span></div>
                  <div className="flex items-center gap-2"><MapPin size={12} className="text-[var(--text-muted)]" /><span className="text-xs text-[var(--text-secondary)]">{selectedOffer.customerCountry}</span></div>
                  <div className="flex items-center gap-2"><Calendar size={12} className="text-[var(--text-muted)]" /><span className="text-xs text-[var(--text-secondary)]">Created: {formatDate(selectedOffer.createdAt)}</span></div>
                  <div className="flex items-center gap-2"><Clock size={12} className="text-[var(--text-muted)]" /><span className="text-xs text-[var(--text-secondary)]">Valid until: {formatDate(selectedOffer.validUntil)}</span></div>
                </div>
              </div>

              <div className="rounded-xl border border-[var(--border)] p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">Line Items</h3>
                <div className="space-y-2">
                  {selectedOffer.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
                      <div>
                        <p className="text-xs font-semibold text-[var(--text-primary)]">{item.productName}</p>
                        <p className="text-[0.625rem] text-[var(--text-muted)] font-mono">{item.sku} · {item.quantity} × ${item.unitPrice.toLocaleString()}</p>
                      </div>
                      <span className="font-mono text-xs font-bold">${item.total.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-[var(--border)] space-y-1">
                  <div className="flex justify-between text-xs"><span className="text-[var(--text-muted)]">Subtotal</span><span className="font-mono font-bold">${selectedOffer.subtotal.toLocaleString()}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-[var(--text-muted)]">Shipping</span><span className="font-mono font-bold">${selectedOffer.shipping.toLocaleString()}</span></div>
                  <div className="flex justify-between text-sm font-bold pt-1 border-t border-[var(--border)]"><span>Total</span><span className="font-mono text-[var(--accent-gold)]">${selectedOffer.total.toLocaleString()}</span></div>
                </div>
              </div>

              <div className="rounded-xl border border-[var(--border)] p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">Terms & Conditions</h3>
                <p className="text-xs text-[var(--text-secondary)]">{selectedOffer.terms}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>

    <ConfirmDialog
      open={!!rejectTarget}
      title="Reject Offer"
      message="Are you sure you want to reject this offer? The customer will be notified."
      confirmLabel="Reject"
      danger
      onConfirm={() => { if (rejectTarget) handleReject(rejectTarget); setRejectTarget(null) }}
      onCancel={() => setRejectTarget(null)}
    />
    </>
  )
}
