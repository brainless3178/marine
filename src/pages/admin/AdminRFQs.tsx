import { useState, useMemo, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  FileText,
  X,
  Clock,
  AlertTriangle,
  User,
  Building,
  MapPin,
  Mail,
  Phone,
  Send,
  MessageSquare,
  HandCoins,
  Loader2,
} from 'lucide-react'
import { admin } from '../../lib/api'
import { useToast } from '../../components/admin/Toast'
import { AdminPagination } from '../../components/admin/AdminPagination'
import type { ApiRfq } from '../../lib/api-types'

// ─── Types ────────────────────────────────────────────────────────────────────────

type RFQUrgency = 'standard' | 'urgent' | 'emergency'
type RFQStatus = 'new' | 'in-progress' | 'quoted' | 'closed' | 'won' | 'lost'

interface RFQItem {
  productName: string
  quantity: number
  unit: string
  notes: string
}

interface RFQ {
  id: string
  customerName: string
  customerEmail: string
  customerPhone: string
  company: string
  country: string
  urgency: RFQUrgency
  status: RFQStatus
  items: RFQItem[]
  subject: string
  message: string
  assignedTo: string
  createdAt: string
  updatedAt: string
  notes: string
  responseCount: number
}

// ─── Mock Data ────────────────────────────────────────────────────────────────────



const urgencyConfig: Record<RFQUrgency, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  emergency: { label: 'Emergency', color: 'text-[var(--danger)]', bg: 'bg-[var(--danger)]/10', icon: AlertTriangle },
  urgent: { label: 'Urgent', color: 'text-[var(--accent-gold)]', bg: 'bg-[var(--accent-gold)]/10', icon: Clock },
  standard: { label: 'Standard', color: 'text-[var(--accent-blue)]', bg: 'bg-[var(--accent-blue)]/10', icon: FileText },
}

const statusConfig: Record<RFQStatus, { label: string; color: string; bg: string }> = {
  'new': { label: 'New', color: 'text-[var(--accent-teal)]', bg: 'bg-[var(--accent-teal)]/10' },
  'in-progress': { label: 'In Progress', color: 'text-[var(--accent-blue)]', bg: 'bg-[var(--accent-blue)]/10' },
  'quoted': { label: 'Quoted', color: 'text-[var(--accent-gold)]', bg: 'bg-[var(--accent-gold)]/10' },
  'closed': { label: 'Closed', color: 'text-[var(--text-muted)]', bg: 'bg-[var(--text-muted)]/10' },
  'won': { label: 'Won', color: 'text-[var(--success)]', bg: 'bg-[var(--success)]/10' },
  'lost': { label: 'Lost', color: 'text-[var(--danger)]', bg: 'bg-[var(--danger)]/10' },
}

const statusFlow: RFQStatus[] = ['new', 'in-progress', 'quoted', 'won']

const ITEMS_PER_PAGE = 12

// ─── Component ────────────────────────────────────────────────────────────────────

function mapApiRfq(r: ApiRfq): RFQ {
  return {
    id: r.rfqNumber || r.id,
    customerName: r.fullName || r.customer?.name || '',
    customerEmail: r.email || r.customer?.email || '',
    customerPhone: r.phone || '',
    company: r.company || '',
    country: r.country || '',
    urgency: (r.urgency || 'standard') as RFQUrgency,
    status: (r.status || 'new') as RFQStatus,
    items: [{ productName: r.productDescription || 'RFQ Request', quantity: r.quantity || 1, unit: 'pcs', notes: r.notes || '' }],
    subject: r.productDescription?.slice(0, 80) || r.subject || 'RFQ Request',
    message: r.productDescription || r.notes || '',
    assignedTo: r.assignedTo || '',
    createdAt: r.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
    updatedAt: r.updatedAt?.split('T')[0] || new Date().toISOString().split('T')[0],
    notes: r.notes || '',
    responseCount: 0,
  }
}

export default function AdminRFQs() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [rfqs, setRfqs] = useState<RFQ[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [urgencyFilter, setUrgencyFilter] = useState<RFQUrgency | ''>('')
  const [statusFilter, setStatusFilter] = useState<RFQStatus | ''>('')
  const [selectedRFQ, setSelectedRFQ] = useState<RFQ | null>(null)
  const [page, setPage] = useState(1)

  const fetchRfqs = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (search.trim()) params.search = search.trim()
      if (urgencyFilter) params.urgency = urgencyFilter
      if (statusFilter) params.status = statusFilter
      params.page = String(page)
      params.limit = String(ITEMS_PER_PAGE)
      const res = await admin.rfqs.list(params)
      setRfqs((res.rfqs || []).map(mapApiRfq))
    } catch (err: unknown) {
      console.error('Failed to load RFQs:', err)
      toast('Failed to load RFQs', 'error')
    } finally {
      setLoading(false)
    }
  }, [search, urgencyFilter, statusFilter, page, toast])

  useEffect(() => { fetchRfqs() }, [fetchRfqs])

  const filtered = useMemo(() => {
    let result = [...rfqs]
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((r) =>
        r.id.toLowerCase().includes(q) ||
        r.company.toLowerCase().includes(q) ||
        r.subject.toLowerCase().includes(q) ||
        r.customerName.toLowerCase().includes(q)
      )
    }
    if (urgencyFilter) result = result.filter((r) => r.urgency === urgencyFilter)
    if (statusFilter) result = result.filter((r) => r.status === statusFilter)
    return result
  }, [rfqs, search, urgencyFilter, statusFilter])

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  const statusCounts = useMemo(() => {
    const counts = new Map<string, number>()
    rfqs.forEach((r) => counts.set(r.status, (counts.get(r.status) || 0) + 1))
    return counts
  }, [rfqs])

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  const handleAssign = async (rfqId: string, assignee: string) => {
    try {
      await admin.rfqs.assign(rfqId, assignee)
      toast(`RFQ assigned to ${assignee}`, 'success')
      fetchRfqs()
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to assign', 'error')
    }
  }

  const handleAdvanceStatus = async (rfqId: string) => {
    const rfq = rfqs.find((r) => r.id === rfqId)
    if (!rfq) return
    const idx = statusFlow.indexOf(rfq.status)
    if (idx === -1 || idx >= statusFlow.length - 1) return
    const newStatus = statusFlow[idx + 1]
    try {
      await admin.rfqs.updateStatus(rfqId, newStatus)
      toast(`RFQ ${rfqId} → ${statusConfig[newStatus].label}`, 'success')
      fetchRfqs()
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to update status', 'error')
    }
  }

  const assignees = ['Ahmed K.', 'Sarah M.', 'James L.', 'Priya R.', 'Unassigned']

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-[var(--text-primary)]">RFQ Inbox</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">{filtered.length} of {rfqs.length} requests</p>
        </div>
      </div>

      {/* Urgency Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => { setUrgencyFilter(''); setPage(1) }} className={`shrink-0 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${urgencyFilter === '' ? 'bg-[var(--accent-gold)] text-navy-deep shadow-[0_4px_12px_rgba(232,170,36,0.2)]' : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-gold)]'}`}>
          All ({rfqs.length})
        </button>
        {(Object.keys(urgencyConfig) as RFQUrgency[]).map((u) => (
          <button key={u} onClick={() => { setUrgencyFilter(u === urgencyFilter ? '' : u); setPage(1) }} className={`shrink-0 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${urgencyFilter === u ? `${urgencyConfig[u].bg} ${urgencyConfig[u].color} border border-current/20` : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-gold)]'}`}>
            {urgencyConfig[u].label} ({rfqs.filter((r) => r.urgency === u).length})
          </button>
        ))}
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(Object.keys(statusConfig) as RFQStatus[]).map((s) => (
          <button key={s} onClick={() => { setStatusFilter(s === statusFilter ? '' : s); setPage(1) }} className={`shrink-0 rounded-lg px-3 py-1.5 text-[0.625rem] font-bold transition-all ${statusFilter === s ? `${statusConfig[s].bg} ${statusConfig[s].color} border border-current/20` : 'bg-[var(--surface-soft)] border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent-gold)]'}`}>
            {statusConfig[s].label} ({statusCounts.get(s) || 0})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input type="text" placeholder="Search by RFQ ID, company, subject, or customer..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] py-2.5 pl-10 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition-all focus:border-[var(--accent-gold)] focus:shadow-[0_0_0_3px_rgba(232,170,36,0.1)]" />
        </div>
      </div>

      {/* RFQ Cards */}
      <div className="space-y-3">
        {loading ? (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-center py-16">
            <Loader2 size={24} className="mx-auto text-[var(--accent-gold)] animate-spin mb-3" />
            <p className="text-sm font-semibold text-[var(--text-muted)]">Loading RFQs...</p>
          </div>
        ) : paginated.length === 0 ? (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-center py-12">
            <FileText size={32} className="mx-auto text-[var(--text-muted)] mb-3" />
            <p className="text-sm font-semibold text-[var(--text-muted)]">No RFQs found</p>
          </div>
        ) : (
          paginated.map((rfq) => {
            const urg = urgencyConfig[rfq.urgency]
            const sts = statusConfig[rfq.status]
            const UrgIcon = urg.icon
            return (
              <div key={rfq.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 cursor-pointer hover:border-[var(--accent-gold)]/30 hover:shadow-[0_4px_16px_rgba(232,170,36,0.06)] transition-all" onClick={() => setSelectedRFQ(rfq)}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[0.625rem] font-bold ${urg.bg} ${urg.color}`}>
                        <UrgIcon size={10} /> {urg.label}
                      </span>
                      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[0.625rem] font-bold ${sts.bg} ${sts.color}`}>
                        {sts.label}
                      </span>
                      <span className="font-mono text-[0.625rem] text-[var(--text-muted)]">{rfq.id}</span>
                    </div>
                    <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1">{rfq.subject}</h3>
                    <div className="flex items-center gap-3 text-[0.625rem] text-[var(--text-muted)]">
                      <span className="flex items-center gap-1"><Building size={10} /> {rfq.company}</span>
                      <span>{rfq.country}</span>
                      <span>{rfq.items.length} item{rfq.items.length !== 1 ? 's' : ''}</span>
                      <span>{formatDate(rfq.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {rfq.assignedTo && (
                      <span className="flex items-center gap-1 text-[0.625rem] text-[var(--text-secondary)]">
                        <User size={10} /> {rfq.assignedTo}
                      </span>
                    )}
                    {rfq.responseCount > 0 && (
                      <span className="flex items-center gap-1 text-[0.625rem] text-[var(--accent-blue)]">
                        <MessageSquare size={10} /> {rfq.responseCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Pagination */}
      <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {/* Detail Slide-over */}
      {selectedRFQ && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-black/50 backdrop-blur-sm" onClick={() => setSelectedRFQ(null)}>
          <div className="relative w-full max-w-xl max-md:max-w-full max-md:rounded-none bg-[var(--surface)] shadow-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-6 py-4">
              <div>
                <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">{selectedRFQ.id}</h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">{formatDate(selectedRFQ.createdAt)} · {selectedRFQ.company}</p>
              </div>
              <button onClick={() => setSelectedRFQ(null)} className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-soft)] transition-colors"><X size={16} /></button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status + Urgency */}
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold ${urgencyConfig[selectedRFQ.urgency].bg} ${urgencyConfig[selectedRFQ.urgency].color}`}>
                  {(() => { const I = urgencyConfig[selectedRFQ.urgency].icon; return <I size={12} /> })()}
                  {urgencyConfig[selectedRFQ.urgency].label}
                </span>
                <span className={`inline-flex items-center rounded-lg px-3 py-2 text-xs font-bold ${statusConfig[selectedRFQ.status].bg} ${statusConfig[selectedRFQ.status].color}`}>
                  {statusConfig[selectedRFQ.status].label}
                </span>
              </div>

              {/* Status Actions */}
              {selectedRFQ.status !== 'won' && selectedRFQ.status !== 'lost' && selectedRFQ.status !== 'closed' && (
                <div className="rounded-xl border border-[var(--accent-gold)]/20 bg-[var(--accent-gold)]/5 p-4 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Quick Actions</h3>
                  <div className="flex flex-wrap gap-2">
                    {statusFlow.indexOf(selectedRFQ.status) < statusFlow.length - 1 && (
                      <button onClick={() => handleAdvanceStatus(selectedRFQ.id)} className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--success)]/20 bg-[var(--success)]/10 px-3 py-2 text-xs font-bold text-[var(--success)] hover:bg-[var(--success)]/20 transition-colors">
                        <Send size={12} /> Mark as {statusConfig[statusFlow[statusFlow.indexOf(selectedRFQ.status) + 1]].label}
                      </button>
                    )}
                    <button onClick={() => { toast(`Offer created from ${selectedRFQ.id}`, 'success'); navigate('/admin/offers') }} className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--accent-gold)]/20 bg-[var(--accent-gold)]/10 px-3 py-2 text-xs font-bold text-[var(--accent-gold)] hover:bg-[var(--accent-gold)]/20 transition-colors">
                      <HandCoins size={12} /> Create Offer
                    </button>
                  </div>
                  <div>
                    <label className="text-[0.625rem] font-bold text-[var(--text-muted)] mb-1 block">Assign to</label>
                    <div className="flex flex-wrap gap-1.5">
                      {assignees.map((a) => (
                        <button key={a} onClick={() => handleAssign(selectedRFQ.id, a)} className={`rounded-lg px-2.5 py-1 text-[0.625rem] font-bold transition-all ${selectedRFQ.assignedTo === a ? 'bg-[var(--accent-gold)] text-navy-deep' : 'bg-[var(--surface-soft)] border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-gold)]'}`}>
                          {a}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Subject */}
              <div className="rounded-xl border border-[var(--border)] p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">Subject</h3>
                <p className="text-sm font-bold text-[var(--text-primary)]">{selectedRFQ.subject}</p>
                <p className="text-xs text-[var(--text-secondary)] mt-2">{selectedRFQ.message}</p>
              </div>

              {/* Items */}
              <div className="rounded-xl border border-[var(--border)] p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">Requested Items ({selectedRFQ.items.length})</h3>
                <div className="space-y-2">
                  {selectedRFQ.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
                      <div>
                        <p className="text-xs font-semibold text-[var(--text-primary)]">{item.productName}</p>
                        {item.notes && <p className="text-[0.625rem] text-[var(--text-muted)]">{item.notes}</p>}
                      </div>
                      <span className="font-mono text-xs font-bold text-[var(--text-primary)]">{item.quantity} {item.unit}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Customer */}
              <div className="rounded-xl border border-[var(--border)] p-4 space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Customer</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2"><User size={12} className="text-[var(--text-muted)]" /><span className="text-xs text-[var(--text-secondary)]">{selectedRFQ.customerName}</span></div>
                  <div className="flex items-center gap-2"><Mail size={12} className="text-[var(--text-muted)]" /><span className="text-xs text-[var(--text-secondary)]">{selectedRFQ.customerEmail}</span></div>
                  <div className="flex items-center gap-2"><Phone size={12} className="text-[var(--text-muted)]" /><span className="text-xs text-[var(--text-secondary)]">{selectedRFQ.customerPhone}</span></div>
                  <div className="flex items-center gap-2"><MapPin size={12} className="text-[var(--text-muted)]" /><span className="text-xs text-[var(--text-secondary)]">{selectedRFQ.country}</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
