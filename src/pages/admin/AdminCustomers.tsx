import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  Search,
  Users,
  Eye,
  Mail,
  Phone,
  MapPin,
  Building,
  Calendar,
  ShoppingCart,
  DollarSign,
  Star,
  X,
  FileText,
  Globe,
  Plus,
  Loader2,
} from 'lucide-react'
import { admin } from '../../lib/api'
import { useToast } from '../../components/admin/Toast'
import { AdminPagination } from '../../components/admin/AdminPagination'
import type { ApiCustomer } from '../../lib/api-types'


// ─── Types ────────────────────────────────────────────────────────────────────────

type CustomerStatus = 'active' | 'inactive' | 'vip' | 'new'

interface CustomerOrder {
  id: string
  date: string
  total: number
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  itemCount: number
}

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  company: string
  country: string
  city: string
  address: string
  website: string
  status: CustomerStatus
  joinedDate: string
  lastOrderDate: string
  totalOrders: number
  totalSpent: number
  avgOrderValue: number
  orders: CustomerOrder[]
  tags: string[]
  notes: string
}

// ─── Mock Data ────────────────────────────────────────────────────────────────────



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

const ITEMS_PER_PAGE = 15



// ─── Component ────────────────────────────────────────────────────────────────────

function mapApiCustomer(c: ApiCustomer): Customer {
  return {
    id: c.id,
    name: c.name || '',
    email: c.email || '',
    phone: c.phone || '',
    company: c.company || '',
    country: c.country || '',
    city: c.city || '',
    address: c.address || '',
    website: c.website || '',
    status: (c.status || 'active') as CustomerStatus,
    joinedDate: c.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
    lastOrderDate: c.lastOrderAt?.split('T')[0] || new Date().toISOString().split('T')[0],
    totalOrders: c._count?.orders ?? 0,
    totalSpent: c.totalSpent ?? 0,
    avgOrderValue: c._count?.orders ? Math.round((c.totalSpent ?? 0) / c._count.orders) : 0,
    orders: [],
    tags: c.tags || [],
    notes: c.notes || '',
  }
}

export default function AdminCustomers() {
  const { toast } = useToast()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newCustomer, setNewCustomer] = useState({ name: '', email: '', phone: '', company: '', country: '', city: '' })
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<CustomerStatus | ''>('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [page, setPage] = useState(1)

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (search.trim()) params.search = search.trim()
      if (statusFilter) params.status = statusFilter
      params.page = String(page)
      params.limit = String(ITEMS_PER_PAGE)
      const res = await admin.customers.list(params)
      setCustomers((res.customers || []).map(mapApiCustomer))
    } catch (err: unknown) {
      console.error('Failed to load customers:', err)
      toast('Failed to load customers', 'error')
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, page, toast])

  useEffect(() => { fetchCustomers() }, [fetchCustomers])

  const filteredCustomers = useMemo(() => {
    let result = [...customers]
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.company.toLowerCase().includes(q) ||
          c.country.toLowerCase().includes(q) ||
          c.city.toLowerCase().includes(q) ||
          c.tags.some((t) => t.toLowerCase().includes(q))
      )
    }
    if (statusFilter) {
      result = result.filter((c) => c.status === statusFilter)
    }
    return result
  }, [customers, search, statusFilter])

  const totalPages = Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE)
  const paginatedCustomers = filteredCustomers.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  const statusCounts = useMemo(() => {
    const counts = new Map<string, number>()
    customers.forEach((c) => counts.set(c.status, (counts.get(c.status) || 0) + 1))
    return counts
  }, [customers])

  const stats = useMemo(() => ({
    totalRevenue: customers.reduce((s, c) => s + c.totalSpent, 0),
    avgLifetimeValue: Math.round(customers.reduce((s, c) => s + c.totalSpent, 0) / customers.length),
    vipCount: customers.filter((c) => c.status === 'vip').length,
    activeCount: customers.filter((c) => c.status === 'active' || c.status === 'vip').length,
  }), [customers])

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const handleCreateCustomer = async () => {
    if (!newCustomer.name.trim() || !newCustomer.email.trim()) { toast('Name and email are required', 'error'); return }
    try {
      await admin.customers.create(newCustomer)
      setShowCreateModal(false)
      setNewCustomer({ name: '', email: '', phone: '', company: '', country: '', city: '' })
      toast('Customer created', 'success')
      fetchCustomers()
    } catch (err: any) {
      toast(err instanceof Error ? err.message : 'Failed to create customer', 'error')
    }
  }

  const inputClass = 'w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] py-2.5 px-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition-all focus:border-[var(--accent-gold)] focus:shadow-[0_0_0_3px_rgba(232,170,36,0.1)]'

  return (
    <div className="space-y-5">
      {/* Header + Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-[var(--text-primary)]">Customers</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">{filteredCustomers.length} of {customers.length} customers</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent-gold)] px-4 py-2.5 text-xs font-bold text-navy-deep hover:shadow-[0_4px_12px_rgba(232,170,36,0.3)] transition-all">
          <Plus size={14} /> Add Customer
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Revenue', value: `$${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-[var(--success)]' },
          { label: 'Avg. Lifetime Value', value: `$${stats.avgLifetimeValue.toLocaleString()}`, icon: ShoppingCart, color: 'text-[var(--accent-blue)]' },
          { label: 'VIP Customers', value: stats.vipCount.toString(), icon: Star, color: 'text-[var(--accent-gold)]' },
          { label: 'Active Customers', value: stats.activeCount.toString(), icon: Users, color: 'text-[var(--accent-teal)]' },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="admin-stat-card">
              <div className="flex items-center gap-2 mb-2">
                <Icon size={14} className={stat.color} />
                <span className="text-[0.625rem] font-bold uppercase tracking-wider text-[var(--text-muted)]">{stat.label}</span>
              </div>
              <p className="font-display text-lg font-extrabold text-[var(--text-primary)]">{stat.value}</p>
            </div>
          )
        })}
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
          All ({customers.length})
        </button>
        {(Object.keys(statusConfig) as CustomerStatus[]).map((status) => (
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

      {/* Search */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search by name, email, company, country, or tags..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] py-2.5 pl-10 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition-all focus:border-[var(--accent-gold)] focus:shadow-[0_0_0_3px_rgba(232,170,36,0.1)]"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Country</th>
                <th>Orders</th>
                <th>Total Spent</th>
                <th>Status</th>
                <th>Last Order</th>
                <th className="w-20">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <div className="flex items-center justify-center gap-3">
                      <Loader2 size={20} className="animate-spin text-[var(--accent-gold)]" />
                      <span className="text-sm text-[var(--text-muted)]">Loading customers...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <Users size={32} className="mx-auto text-[var(--text-muted)] mb-3" />
                    <p className="text-sm font-semibold text-[var(--text-muted)]">No customers found</p>
                  </td>
                </tr>
              ) : (
                paginatedCustomers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="cursor-pointer hover:bg-[var(--surface-soft)]"
                    onClick={() => setSelectedCustomer(customer)}
                  >
                    <td>
                      <div>
                        <p className="text-xs font-semibold text-[var(--text-primary)]">{customer.name}</p>
                        <p className="text-[0.625rem] text-[var(--text-muted)]">{customer.email}</p>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <Globe size={10} className="text-[var(--text-muted)]" />
                        <span className="text-xs text-[var(--text-secondary)]">{customer.country}</span>
                      </div>
                    </td>
                    <td className="text-xs font-bold text-[var(--text-primary)]">{customer.totalOrders}</td>
                    <td className="font-mono text-xs font-bold text-[var(--success)]">${customer.totalSpent.toLocaleString()}</td>
                    <td>
                      <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[0.625rem] font-bold ${statusConfig[customer.status].bg} ${statusConfig[customer.status].color}`}>
                        {customer.status === 'vip' && <Star size={10} />}
                        {statusConfig[customer.status].label}
                      </span>
                    </td>
                    <td className="text-xs text-[var(--text-muted)]">{formatDate(customer.lastOrderDate)}</td>
                    <td>
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedCustomer(customer) }}
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

        <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      {/* Customer Detail Slide-over */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-black/50 backdrop-blur-sm" onClick={() => setSelectedCustomer(null)}>
          <div
            className="relative w-full max-w-xl max-md:max-w-full max-md:rounded-none bg-[var(--surface)] shadow-2xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-6 py-4">
              <div>
                <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">{selectedCustomer.name}</h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">{selectedCustomer.id} · {selectedCustomer.company}</p>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-soft)] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status + Actions */}
              <div className="flex items-center gap-3">
                <select
                  value={selectedCustomer.status}
                  onChange={async (e) => {
                    const newStatus = e.target.value as CustomerStatus
                    try {
                      await admin.customers.updateStatus(selectedCustomer.id, newStatus)
                      setSelectedCustomer({ ...selectedCustomer, status: newStatus })
                      setCustomers((prev) => prev.map((c) => c.id === selectedCustomer.id ? { ...c, status: newStatus } : c))
                      toast('Customer status updated', 'success')
                    } catch (err: unknown) {
                      toast(err instanceof Error ? err.message : 'Failed to update status', 'error')
                    }
                  }}
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-xs font-bold outline-none focus:border-[var(--accent-gold)]"
                >
                  {(Object.keys(statusConfig) as CustomerStatus[]).map((s) => (
                    <option key={s} value={s}>{statusConfig[s].label}</option>
                  ))}
                </select>
                {selectedCustomer.tags.map((tag) => (
                  <span key={tag} className="rounded-md bg-[var(--surface-soft)] border border-[var(--border)] px-2 py-1 text-[0.625rem] font-bold text-[var(--text-secondary)]">
                    {tag}
                  </span>
                ))}
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Total Orders', value: selectedCustomer.totalOrders.toString(), icon: ShoppingCart },
                  { label: 'Total Spent', value: `$${selectedCustomer.totalSpent.toLocaleString()}`, icon: DollarSign },
                  { label: 'Avg Order', value: `$${selectedCustomer.avgOrderValue.toLocaleString()}`, icon: FileText },
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
                  <div className="flex items-center gap-2">
                    <Mail size={12} className="text-[var(--text-muted)] shrink-0" />
                    <span className="text-xs text-[var(--text-secondary)]">{selectedCustomer.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={12} className="text-[var(--text-muted)] shrink-0" />
                    <span className="text-xs text-[var(--text-secondary)]">{selectedCustomer.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe size={12} className="text-[var(--text-muted)] shrink-0" />
                    <a href={selectedCustomer.website} className="text-xs text-[var(--accent-blue)] hover:underline">{selectedCustomer.website}</a>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={12} className="text-[var(--text-muted)] shrink-0" />
                    <span className="text-xs text-[var(--text-secondary)]">{selectedCustomer.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building size={12} className="text-[var(--text-muted)] shrink-0" />
                    <span className="text-xs text-[var(--text-secondary)]">{selectedCustomer.company}</span>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="rounded-xl border border-[var(--border)] p-4 space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Customer Info</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <Calendar size={12} className="text-[var(--text-muted)]" />
                    <div>
                      <p className="text-[0.625rem] text-[var(--text-muted)]">Joined</p>
                      <p className="text-xs font-bold text-[var(--text-primary)]">{formatDate(selectedCustomer.joinedDate)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShoppingCart size={12} className="text-[var(--text-muted)]" />
                    <div>
                      <p className="text-[0.625rem] text-[var(--text-muted)]">Last Order</p>
                      <p className="text-xs font-bold text-[var(--text-primary)]">{formatDate(selectedCustomer.lastOrderDate)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order History */}
              <div className="rounded-xl border border-[var(--border)] p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">
                  Order History ({selectedCustomer.orders.length})
                </h3>
                {selectedCustomer.orders.length === 0 ? (
                  <p className="text-xs text-[var(--text-muted)] text-center py-4">No orders yet</p>
                ) : (
                  <div className="space-y-2">
                    {selectedCustomer.orders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between py-2.5 border-b border-[var(--border)] last:border-0">
                        <div>
                          <p className="text-xs font-bold font-mono text-[var(--accent-blue)]">{order.id}</p>
                          <p className="text-[0.625rem] text-[var(--text-muted)]">{formatDate(order.date)} · {order.itemCount} items</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`rounded-md px-2 py-0.5 text-[0.625rem] font-bold ${orderStatusConfig[order.status].bg} ${orderStatusConfig[order.status].color}`}>
                            {orderStatusConfig[order.status].label}
                          </span>
                          <span className="font-mono text-xs font-bold text-[var(--text-primary)]">${order.total.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2 pt-2">
                <button onClick={() => toast(`Email opened for ${selectedCustomer.email}`, 'info')} className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-xs font-bold text-[var(--text-secondary)] hover:border-[var(--accent-gold)] transition-colors">
                  <Mail size={12} /> Send Email
                </button>
                <button onClick={() => toast(`New order started for ${selectedCustomer.name}`, 'success')} className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-xs font-bold text-[var(--text-secondary)] hover:border-[var(--accent-teal)] transition-colors">
                  <ShoppingCart size={12} /> New Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Customer Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowCreateModal(false)}>
          <div className="w-full max-w-md mx-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
              <h3 className="font-display text-sm font-bold text-[var(--text-primary)]">Add New Customer</h3>
              <button onClick={() => setShowCreateModal(false)} className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X size={14} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[0.625rem] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">Name *</label>
                <input value={newCustomer.name} onChange={(e) => setNewCustomer((p) => ({ ...p, name: e.target.value }))} placeholder="Company name" className={inputClass} />
              </div>
              <div>
                <label className="block text-[0.625rem] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">Email *</label>
                <input type="email" value={newCustomer.email} onChange={(e) => setNewCustomer((p) => ({ ...p, email: e.target.value }))} placeholder="contact@company.com" className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[0.625rem] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">Phone</label>
                  <input value={newCustomer.phone} onChange={(e) => setNewCustomer((p) => ({ ...p, phone: e.target.value }))} placeholder="+971 50 XXXX" className={inputClass} />
                </div>
                <div>
                  <label className="block text-[0.625rem] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">Country</label>
                  <input value={newCustomer.country} onChange={(e) => setNewCustomer((p) => ({ ...p, country: e.target.value }))} placeholder="UAE" className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[0.625rem] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">Company</label>
                  <input value={newCustomer.company} onChange={(e) => setNewCustomer((p) => ({ ...p, company: e.target.value }))} placeholder="Optional" className={inputClass} />
                </div>
                <div>
                  <label className="block text-[0.625rem] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">City</label>
                  <input value={newCustomer.city} onChange={(e) => setNewCustomer((p) => ({ ...p, city: e.target.value }))} placeholder="Dubai" className={inputClass} />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-[var(--border)] px-6 py-4">
              <button onClick={() => setShowCreateModal(false)} className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2 text-xs font-bold text-[var(--text-secondary)] hover:border-[var(--text-muted)] transition-colors">Cancel</button>
              <button onClick={handleCreateCustomer} className="rounded-xl bg-[var(--accent-gold)] px-4 py-2 text-xs font-extrabold text-navy-deep hover:bg-[var(--gold-light)] transition-colors">Create Customer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
