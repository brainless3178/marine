import { useState, useEffect, useCallback } from 'react'
import {
  Globe,
  Truck,
  CreditCard,
  Bell,
  Save,
  CheckCircle,
  Plus,
  Trash2,
  MapPin,
  Info,
  X,
  ToggleLeft,
  ToggleRight,
  Loader2,
} from 'lucide-react'
import { admin } from '../../lib/api'
import { useToast } from '../../components/admin/Toast'

// ─── Types ───────────────────────────────────────────────────────────────────────

type SettingsTab = 'site' | 'shipping' | 'payments' | 'notifications'

interface SiteConfig {
  companyName: string
  tagline: string
  email: string
  phone: string
  address: string
  city: string
  country: string
  currency: string
  timezone: string
  seoTitle: string
  seoDescription: string
  googleAnalyticsId: string
  maintenanceMode: boolean
}

interface ShippingZone {
  id: string
  name: string
  regions: string[]
  rateType: 'flat' | 'weight' | 'free'
  flatRate: number
  freeThreshold: number
  estimatedDays: string
  active: boolean
}

interface PaymentMethod {
  id: string
  name: string
  type: string
  enabled: boolean
  testMode: boolean
  config: Record<string, string>
}

interface NotificationPrefs {
  orderPlaced: boolean
  orderConfirmed: boolean
  orderShipped: boolean
  orderDelivered: boolean
  orderCancelled: boolean
  lowStock: boolean
  lowStockThreshold: number
  rfqReceived: boolean
  rfqAssigned: boolean
  rfqUrgent: boolean
  newCustomer: boolean
  weeklyReport: boolean
  monthlyReport: boolean
  reportEmail: string
}

// ─── Defaults ─────────────────────────────────────────────────────────────────────

const defaultSite: SiteConfig = {
  companyName: 'Alka Traders',
  tagline: 'Leading Supplier & Exporter of Used & Unbranded Marine Equipment',
  email: 'info@alkatraders.com',
  phone: '+971 4 XXX XXXX',
  address: 'PLOT - 7 ALANG HOUSE, MOTITALAV ROAD, KHUMBHARWADA',
  city: 'BHAVNAGAR',
  country: 'India',
  currency: 'USD',
  timezone: 'Asia/Dubai',
  seoTitle: 'Alka Traders | Marine Equipment Supplier',
  seoDescription: 'Leading supplier and exporter of used and unbranded marine equipment. Parts for engines, hydraulics, electronics, and more.',
  googleAnalyticsId: '',
  maintenanceMode: false,
}

const defaultZones: ShippingZone[] = [
  { id: 'z1', name: 'UAE / GCC', regions: ['UAE', 'Saudi Arabia', 'Qatar', 'Bahrain', 'Kuwait', 'Oman'], rateType: 'flat', flatRate: 50, freeThreshold: 2000, estimatedDays: '3–5 business days', active: true },
  { id: 'z2', name: 'South Asia', regions: ['India', 'Pakistan', 'Bangladesh', 'Sri Lanka'], rateType: 'flat', flatRate: 120, freeThreshold: 5000, estimatedDays: '7–14 business days', active: true },
  { id: 'z3', name: 'Southeast Asia', regions: ['Singapore', 'Malaysia', 'Thailand', 'Vietnam', 'Indonesia', 'Philippines'], rateType: 'flat', flatRate: 150, freeThreshold: 5000, estimatedDays: '10–18 business days', active: true },
  { id: 'z4', name: 'Europe', regions: ['Netherlands', 'Germany', 'UK', 'France', 'Spain', 'Italy'], rateType: 'flat', flatRate: 200, freeThreshold: 10000, estimatedDays: '14–21 business days', active: true },
  { id: 'z5', name: 'North America', regions: ['USA', 'Canada', 'Mexico'], rateType: 'flat', flatRate: 220, freeThreshold: 10000, estimatedDays: '14–21 business days', active: true },
  { id: 'z6', name: 'East Asia', regions: ['China', 'Japan', 'South Korea', 'Taiwan'], rateType: 'flat', flatRate: 180, freeThreshold: 7500, estimatedDays: '10–18 business days', active: true },
]

const defaultPayments: PaymentMethod[] = [
  { id: 'p1', name: 'PayPal', type: 'paypal', enabled: true, testMode: true, config: { clientId: '', mode: 'sandbox' } },
  { id: 'p2', name: 'Bank Transfer (Wire)', type: 'bank', enabled: true, testMode: false, config: { bankName: 'Emirates NBD', accountName: 'Alka Traders LLC', accountNumber: 'XXXX-XXXX-XXXX-1234', iban: 'AE07 0260 0010 1234 5678 901', swift: 'EBILAEAD' } },
  { id: 'p3', name: 'Letter of Credit (L/C)', type: 'lc', enabled: true, testMode: false, config: { acceptingBanks: 'Emirates NBD, ADCB, Mashreq', documentsRequired: 'Commercial Invoice, Packing List, B/L, Certificate of Origin' } },
]

const defaultNotifications: NotificationPrefs = {
  orderPlaced: true,
  orderConfirmed: true,
  orderShipped: true,
  orderDelivered: true,
  orderCancelled: true,
  lowStock: true,
  lowStockThreshold: 10,
  rfqReceived: true,
  rfqAssigned: true,
  rfqUrgent: true,
  newCustomer: false,
  weeklyReport: true,
  monthlyReport: true,
  reportEmail: 'admin@alkatraders.com',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────────

const inputClass = 'w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] py-2.5 px-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition-all focus:border-[var(--accent-gold)] focus:shadow-[0_0_0_3px_rgba(232,170,36,0.1)]'
const selectClass = 'rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] py-2.5 px-4 text-sm text-[var(--text-primary)] outline-none transition-all focus:border-[var(--accent-gold)] focus:shadow-[0_0_0_3px_rgba(232,170,36,0.1)]'
const labelClass = 'block text-xs font-bold text-[var(--text-secondary)] mb-1.5'

const currencies = ['USD', 'EUR', 'GBP', 'AED', 'INR', 'SGD', 'JPY']
const timezones = ['Asia/Dubai', 'Asia/Kolkata', 'Asia/Singapore', 'Europe/London', 'Europe/Amsterdam', 'America/New_York', 'Asia/Tokyo', 'Asia/Shanghai']

// ─── Component ────────────────────────────────────────────────────────────────────

export default function AdminSettings() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<SettingsTab>('site')
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Site
  const [site, setSite] = useState<SiteConfig>(defaultSite)
  const updateSite = <K extends keyof SiteConfig>(key: K, value: SiteConfig[K]) => setSite((s) => ({ ...s, [key]: value }))

  // Shipping
  const [zones, setZones] = useState<ShippingZone[]>(defaultZones)
  const [editingZone, setEditingZone] = useState<string | null>(null)
  const [newZoneOpen, setNewZoneOpen] = useState(false)

  // Payments
  const [payments, setPayments] = useState<PaymentMethod[]>(defaultPayments)
  const [expandedPayment, setExpandedPayment] = useState<string | null>(null)

  // Notifications
  const [notifs, setNotifs] = useState<NotificationPrefs>(defaultNotifications)
  const updateNotif = <K extends keyof NotificationPrefs>(key: K, value: NotificationPrefs[K]) => setNotifs((n) => ({ ...n, [key]: value }))

  // Fetch settings from API on mount
  const fetchSettings = useCallback(async () => {
    setLoading(true)
    try {
      const res = await admin.settings.get()
      const s = res.settings || {}
      setSite({
        companyName: String(s.companyName || defaultSite.companyName),
        tagline: String(s.tagline || defaultSite.tagline),
        email: String(s.email || defaultSite.email),
        phone: String(s.phone || defaultSite.phone),
        address: String(s.address || defaultSite.address),
        city: String(s.city || defaultSite.city),
        country: String(s.country || defaultSite.country),
        currency: String(s.currency || defaultSite.currency),
        timezone: String(s.timezone || defaultSite.timezone),
        seoTitle: String(s.seoTitle || defaultSite.seoTitle),
        seoDescription: String(s.seoDescription || defaultSite.seoDescription),
        googleAnalyticsId: String(s.googleAnalyticsId || defaultSite.googleAnalyticsId),
        maintenanceMode: s.maintenanceMode === 'true' || s.maintenanceMode === true || defaultSite.maintenanceMode,
      })
      if (s.shippingZones) {
        try { setZones(JSON.parse(String(s.shippingZones))) } catch { /* use defaults */ }
      }
      if (s.paymentMethods) {
        try { setPayments(JSON.parse(String(s.paymentMethods))) } catch { /* use defaults */ }
      }
      if (s.notifications) {
        try { setNotifs(JSON.parse(String(s.notifications))) } catch { /* use defaults */ }
      }
    } catch (err: any) {
      console.error('Failed to load settings:', err)
      toast('Failed to load settings from API', 'error')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { fetchSettings() }, [fetchSettings])

  const handleSave = async () => {
    setSaving(true)
    try {
      const settings: Record<string, string | number | boolean> = {
        companyName: site.companyName,
        tagline: site.tagline,
        email: site.email,
        phone: site.phone,
        address: site.address,
        city: site.city,
        country: site.country,
        currency: site.currency,
        timezone: site.timezone,
        seoTitle: site.seoTitle,
        seoDescription: site.seoDescription,
        googleAnalyticsId: site.googleAnalyticsId,
        maintenanceMode: site.maintenanceMode,
        shippingZones: JSON.stringify(zones),
        paymentMethods: JSON.stringify(payments),
        notifications: JSON.stringify(notifs),
      }
      await admin.settings.update(settings)
      setSaved(true)
      toast('Settings saved', 'success')
      setTimeout(() => setSaved(false), 2000)
    } catch (err: any) {
      toast(err.message || 'Failed to save settings', 'error')
    } finally {
      setSaving(false)
    }
  }

  const tabs: { id: SettingsTab; label: string; icon: typeof Globe }[] = [
    { id: 'site', label: 'Site Config', icon: Globe },
    { id: 'shipping', label: 'Shipping Zones', icon: Truck },
    { id: 'payments', label: 'Payment Methods', icon: CreditCard },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ]

  // ─── Site Config Tab ─────────────────────────────────────────────────────────────
  const renderSiteTab = () => (
    <div className="space-y-6">
      {/* Company Info */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4">
        <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">Company Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Company Name</label>
            <input value={site.companyName} onChange={(e) => updateSite('companyName', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Tagline</label>
            <input value={site.tagline} onChange={(e) => updateSite('tagline', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input type="email" value={site.email} onChange={(e) => updateSite('email', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Phone</label>
            <input value={site.phone} onChange={(e) => updateSite('phone', e.target.value)} className={inputClass} />
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>Address</label>
            <input value={site.address} onChange={(e) => updateSite('address', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>City</label>
            <input value={site.city} onChange={(e) => updateSite('city', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Country</label>
            <input value={site.country} onChange={(e) => updateSite('country', e.target.value)} className={inputClass} />
          </div>
        </div>
      </div>

      {/* Regional Settings */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4">
        <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">Regional Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Currency</label>
            <select value={site.currency} onChange={(e) => updateSite('currency', e.target.value)} className={selectClass}>
              {currencies.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Timezone</label>
            <select value={site.timezone} onChange={(e) => updateSite('timezone', e.target.value)} className={selectClass}>
              {timezones.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* SEO */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4">
        <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">SEO & Analytics</h3>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>SEO Title</label>
            <input value={site.seoTitle} onChange={(e) => updateSite('seoTitle', e.target.value)} className={inputClass} />
            <p className="text-[0.625rem] text-[var(--text-muted)] mt-1">{site.seoTitle.length}/60 characters</p>
          </div>
          <div>
            <label className={labelClass}>Meta Description</label>
            <textarea value={site.seoDescription} onChange={(e) => updateSite('seoDescription', e.target.value)} rows={3} className={`${inputClass} resize-y`} />
            <p className="text-[0.625rem] text-[var(--text-muted)] mt-1">{site.seoDescription.length}/160 characters</p>
          </div>
          <div>
            <label className={labelClass}>Google Analytics ID</label>
            <input value={site.googleAnalyticsId} onChange={(e) => updateSite('googleAnalyticsId', e.target.value)} placeholder="G-XXXXXXXXXX" className={inputClass} />
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-2xl border border-[var(--danger)]/20 bg-[var(--danger)]/5 p-6 space-y-3">
        <h3 className="text-sm font-bold text-[var(--danger)]">Maintenance Mode</h3>
        <p className="text-xs text-[var(--text-secondary)]">When enabled, the storefront will display a maintenance page to all visitors except admins.</p>
        <button
          onClick={() => updateSite('maintenanceMode', !site.maintenanceMode)}
          className="inline-flex items-center gap-2"
        >
          {site.maintenanceMode ? <ToggleRight size={28} className="text-[var(--danger)]" /> : <ToggleLeft size={28} className="text-[var(--text-muted)]" />}
          <span className={`text-xs font-bold ${site.maintenanceMode ? 'text-[var(--danger)]' : 'text-[var(--text-muted)]'}`}>
            {site.maintenanceMode ? 'Enabled' : 'Disabled'}
          </span>
        </button>
      </div>
    </div>
  )

  // ─── Shipping Tab ────────────────────────────────────────────────────────────────
  const renderShippingTab = () => (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--text-muted)]">{zones.length} shipping zones configured</p>
        <button
          onClick={() => { setNewZoneOpen(true); setEditingZone(null) }}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent-gold)] px-4 py-2.5 text-xs font-bold text-navy-deep hover:shadow-[0_4px_12px_rgba(232,170,36,0.3)] transition-all"
        >
          <Plus size={14} /> Add Zone
        </button>
      </div>

      <div className="space-y-3">
        {zones.map((zone) => (
          <div key={zone.id} className={`rounded-2xl border bg-[var(--surface)] p-5 transition-all ${zone.active ? 'border-[var(--border)]' : 'border-[var(--border)] opacity-50'}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">{zone.name}</h3>
                  <span className={`rounded-md px-2 py-0.5 text-[0.625rem] font-bold ${zone.active ? 'bg-[var(--success)]/10 text-[var(--success)]' : 'bg-[var(--text-muted)]/10 text-[var(--text-muted)]'}`}>
                    {zone.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {zone.regions.map((r) => (
                    <span key={r} className="rounded-md bg-[var(--surface-soft)] border border-[var(--border)] px-2 py-0.5 text-[0.625rem] text-[var(--text-secondary)]">{r}</span>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-[var(--text-muted)]">Rate Type</span>
                    <p className="font-bold text-[var(--text-primary)]">{zone.rateType === 'flat' ? 'Flat Rate' : zone.rateType === 'weight' ? 'Weight-Based' : 'Free Shipping'}</p>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)]">Rate</span>
                    <p className="font-bold font-mono text-[var(--text-primary)]">{zone.rateType === 'free' ? 'Free' : `$${zone.flatRate}`}</p>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)]">Free Above</span>
                    <p className="font-bold font-mono text-[var(--text-primary)]">${zone.freeThreshold.toLocaleString()}</p>
                  </div>
                </div>
                <p className="text-[0.625rem] text-[var(--text-muted)] mt-2">Est. {zone.estimatedDays}</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setEditingZone(editingZone === zone.id ? null : zone.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--accent-gold)] hover:bg-[var(--gold-muted)] transition-colors"
                >
                  <MapPin size={14} />
                </button>
                <button
                  onClick={() => setZones((prev) => prev.filter((z) => z.id !== zone.id))}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {editingZone === zone.id && (
              <div className="mt-4 pt-4 border-t border-[var(--border)] grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>Zone Name</label>
                  <input value={zone.name} onChange={(e) => setZones((prev) => prev.map((z) => z.id === zone.id ? { ...z, name: e.target.value } : z))} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Flat Rate ($)</label>
                  <input type="number" value={zone.flatRate} onChange={(e) => setZones((prev) => prev.map((z) => z.id === zone.id ? { ...z, flatRate: Number(e.target.value) } : z))} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Free Above ($)</label>
                  <input type="number" value={zone.freeThreshold} onChange={(e) => setZones((prev) => prev.map((z) => z.id === zone.id ? { ...z, freeThreshold: Number(e.target.value) } : z))} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Estimated Delivery</label>
                  <input value={zone.estimatedDays} onChange={(e) => setZones((prev) => prev.map((z) => z.id === zone.id ? { ...z, estimatedDays: e.target.value } : z))} className={inputClass} />
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Regions (comma-separated)</label>
                  <input value={zone.regions.join(', ')} onChange={(e) => setZones((prev) => prev.map((z) => z.id === zone.id ? { ...z, regions: e.target.value.split(',').map((r) => r.trim()).filter(Boolean) } : z))} className={inputClass} />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => setZones((prev) => prev.map((z) => z.id === zone.id ? { ...z, active: !z.active } : z))}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-xs font-bold text-[var(--text-secondary)] hover:border-[var(--accent-gold)] transition-colors"
                  >
                    {zone.active ? <ToggleRight size={14} className="text-[var(--success)]" /> : <ToggleLeft size={14} />}
                    {zone.active ? 'Active' : 'Inactive'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {newZoneOpen && (
        <NewZoneForm
          onAdd={(zone) => { setZones((prev) => [...prev, { ...zone, id: `z${Date.now()}` }]); setNewZoneOpen(false) }}
          onCancel={() => setNewZoneOpen(false)}
        />
      )}
    </div>
  )

  // ─── Payments Tab ────────────────────────────────────────────────────────────────
  const renderPaymentsTab = () => (
    <div className="space-y-3">
      <p className="text-sm text-[var(--text-muted)]">{payments.filter((p) => p.enabled).length} of {payments.length} methods active</p>
      {payments.map((pm) => (
        <div key={pm.id} className={`rounded-2xl border bg-[var(--surface)] p-5 transition-all ${pm.enabled ? 'border-[var(--border)]' : 'border-[var(--border)] opacity-50'}`}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--surface-soft)] border border-[var(--border)]">
                <CreditCard size={16} className="text-[var(--accent-gold)]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">{pm.name}</h3>
                <p className="text-[0.625rem] text-[var(--text-muted)] uppercase">{pm.type}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {pm.testMode && (
                <span className="rounded-md bg-[var(--accent-gold)]/10 px-2 py-0.5 text-[0.625rem] font-bold text-[var(--accent-gold)]">TEST MODE</span>
              )}
              <button
                onClick={() => setPayments((prev) => prev.map((p) => p.id === pm.id ? { ...p, enabled: !p.enabled } : p))}
                className="inline-flex items-center gap-1.5"
              >
                {pm.enabled ? <ToggleRight size={28} className="text-[var(--success)]" /> : <ToggleLeft size={28} className="text-[var(--text-muted)]" />}
              </button>
              <button
                onClick={() => setExpandedPayment(expandedPayment === pm.id ? null : pm.id)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--accent-gold)] hover:bg-[var(--gold-muted)] transition-colors"
              >
                <Info size={14} />
              </button>
            </div>
          </div>

          {expandedPayment === pm.id && (
            <div className="mt-4 pt-4 border-t border-[var(--border)] space-y-3">
              {Object.entries(pm.config).map(([key, value]) => (
                <div key={key}>
                  <label className={labelClass}>{key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}</label>
                  <input
                    value={value}
                    onChange={(e) => setPayments((prev) => prev.map((p) => p.id === pm.id ? { ...p, config: { ...p.config, [key]: e.target.value } } : p))}
                    className={inputClass}
                    type={key.toLowerCase().includes('secret') ? 'password' : 'text'}
                  />
                </div>
              ))}
              {pm.type === 'paypal' && (
                <div>
                  <label className={labelClass}>Mode</label>
                  <select
                    value={pm.config.mode || 'sandbox'}
                    onChange={(e) => setPayments((prev) => prev.map((p) => p.id === pm.id ? { ...p, config: { ...p.config, mode: e.target.value }, testMode: e.target.value === 'sandbox' } : p))}
                    className={selectClass}
                  >
                    <option value="sandbox">Sandbox (Test)</option>
                    <option value="live">Live (Production)</option>
                  </select>
                </div>
              )}
              <button
                onClick={() => setPayments((prev) => prev.map((p) => p.id === pm.id ? { ...p, testMode: !p.testMode } : p))}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-xs font-bold text-[var(--text-secondary)] hover:border-[var(--accent-gold)] transition-colors"
              >
                {pm.testMode ? <ToggleRight size={14} className="text-[var(--accent-gold)]" /> : <ToggleLeft size={14} />}
                {pm.testMode ? 'Test Mode' : 'Live Mode'}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )

  // ─── Notifications Tab ───────────────────────────────────────────────────────────
  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4">
        <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">Order Events</h3>
        <div className="space-y-3">
          {([
            ['orderPlaced', 'New Order Placed', 'Notify when a customer places a new order'],
            ['orderConfirmed', 'Order Confirmed', 'Notify when an order is confirmed by staff'],
            ['orderShipped', 'Order Shipped', 'Notify when tracking info is added'],
            ['orderDelivered', 'Order Delivered', 'Notify when order is marked as delivered'],
            ['orderCancelled', 'Order Cancelled', 'Notify when an order is cancelled'],
          ] as const).map(([key, title, desc]) => (
            <div key={key} className="flex items-center justify-between py-2">
              <div>
                <p className="text-xs font-bold text-[var(--text-primary)]">{title}</p>
                <p className="text-[0.625rem] text-[var(--text-muted)]">{desc}</p>
              </div>
              <button onClick={() => updateNotif(key, !notifs[key])}>
                {notifs[key] ? <ToggleRight size={28} className="text-[var(--success)]" /> : <ToggleLeft size={28} className="text-[var(--text-muted)]" />}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4">
        <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">Inventory Alerts</h3>
        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-xs font-bold text-[var(--text-primary)]">Low Stock Alert</p>
            <p className="text-[0.625rem] text-[var(--text-muted)]">Notify when product stock falls below threshold</p>
          </div>
          <button onClick={() => updateNotif('lowStock', !notifs.lowStock)}>
            {notifs.lowStock ? <ToggleRight size={28} className="text-[var(--success)]" /> : <ToggleLeft size={28} className="text-[var(--text-muted)]" />}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4">
        <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">RFQ Alerts</h3>
        <div className="space-y-3">
          {([
            ['rfqReceived', 'New RFQ Received', 'Notify when a customer submits a new request for quote'],
            ['rfqAssigned', 'RFQ Assigned to You', 'Notify when an RFQ is assigned to your team'],
            ['rfqUrgent', 'Urgent RFQ', 'Notify on high-urgency RFQ submissions'],
          ] as const).map(([key, title, desc]) => (
            <div key={key} className="flex items-center justify-between py-2">
              <div>
                <p className="text-xs font-bold text-[var(--text-primary)]">{title}</p>
                <p className="text-[0.625rem] text-[var(--text-muted)]">{desc}</p>
              </div>
              <button onClick={() => updateNotif(key, !notifs[key])}>
                {notifs[key] ? <ToggleRight size={28} className="text-[var(--success)]" /> : <ToggleLeft size={28} className="text-[var(--text-muted)]" />}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4">
        <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">Reports & Summaries</h3>
        <div className="space-y-3">
          {([
            ['newCustomer', 'New Customer Registration', 'Notify when a new customer account is created'],
            ['weeklyReport', 'Weekly Sales Report', 'Receive a weekly summary of orders and revenue'],
            ['monthlyReport', 'Monthly Business Report', 'Receive a monthly report with analytics and trends'],
          ] as const).map(([key, title, desc]) => (
            <div key={key} className="flex items-center justify-between py-2">
              <div>
                <p className="text-xs font-bold text-[var(--text-primary)]">{title}</p>
                <p className="text-[0.625rem] text-[var(--text-muted)]">{desc}</p>
              </div>
              <button onClick={() => updateNotif(key, !notifs[key])}>
                {notifs[key] ? <ToggleRight size={28} className="text-[var(--success)]" /> : <ToggleLeft size={28} className="text-[var(--text-muted)]" />}
              </button>
            </div>
          ))}
          <div>
            <label className={labelClass}>Report Recipient Email</label>
            <input type="email" value={notifs.reportEmail} onChange={(e) => updateNotif('reportEmail', e.target.value)} className={inputClass} />
          </div>
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={24} className="animate-spin text-[var(--accent-gold)]" />
        <span className="ml-3 text-sm text-[var(--text-muted)]">Loading settings...</span>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-[var(--text-primary)]">Settings</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Manage your store configuration</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent-gold)] px-5 py-2.5 text-xs font-bold text-navy-deep hover:shadow-[0_4px_12px_rgba(232,170,36,0.3)] transition-all disabled:opacity-50"
        >
          {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : saved ? <><CheckCircle size={14} /> Saved!</> : <><Save size={14} /> Save Changes</>}
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-[var(--accent-gold)] text-navy-deep shadow-[0_4px_12px_rgba(232,170,36,0.2)]'
                  : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-gold)]'
              }`}
            >
              <Icon size={14} /> {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'site' && renderSiteTab()}
      {activeTab === 'shipping' && renderShippingTab()}
      {activeTab === 'payments' && renderPaymentsTab()}
      {activeTab === 'notifications' && renderNotificationsTab()}
    </div>
  )
}

// ─── New Zone Form ────────────────────────────────────────────────────────────────

function NewZoneForm({ onAdd, onCancel }: { onAdd: (zone: Omit<ShippingZone, 'id'>) => void; onCancel: () => void }) {
  const [name, setName] = useState('')
  const [regions, setRegions] = useState('')
  const [flatRate, setFlatRate] = useState(100)
  const [freeThreshold, setFreeThreshold] = useState(5000)
  const [estimatedDays, setEstimatedDays] = useState('7–14 business days')

  return (
    <div className="rounded-2xl border border-[var(--accent-gold)]/20 bg-[var(--accent-gold)]/5 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-[var(--accent-gold)]">New Shipping Zone</h3>
        <button onClick={onCancel} className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)]">
          <X size={14} />
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Zone Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Africa" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Regions (comma-separated)</label>
          <input value={regions} onChange={(e) => setRegions(e.target.value)} placeholder="e.g. Nigeria, Kenya, South Africa" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Flat Rate ($)</label>
          <input type="number" value={flatRate} onChange={(e) => setFlatRate(Number(e.target.value))} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Free Above ($)</label>
          <input type="number" value={freeThreshold} onChange={(e) => setFreeThreshold(Number(e.target.value))} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Estimated Delivery</label>
          <input value={estimatedDays} onChange={(e) => setEstimatedDays(e.target.value)} className={inputClass} />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onAdd({
            name: name || 'New Zone',
            regions: regions.split(',').map((r) => r.trim()).filter(Boolean),
            rateType: 'flat',
            flatRate,
            freeThreshold,
            estimatedDays,
            active: true,
          })}
          disabled={!name.trim()}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent-gold)] px-4 py-2.5 text-xs font-bold text-navy-deep hover:shadow-[0_4px_12px_rgba(232,170,36,0.3)] transition-all disabled:opacity-40"
        >
          <Plus size={14} /> Create Zone
        </button>
        <button onClick={onCancel} className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2.5 text-xs font-bold text-[var(--text-secondary)] hover:border-[var(--accent-gold)] transition-colors">
          Cancel
        </button>
      </div>
    </div>
  )
}
