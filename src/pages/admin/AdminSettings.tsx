import { useState, useEffect, useCallback } from 'react'
import { Globe, Truck, CreditCard, Bell, Save, CheckCircle, Loader2 } from 'lucide-react'
import { admin } from '../../lib/api'
import { useToast } from '../../components/admin/toast-context'
import type { SettingsTab, SiteConfig, ShippingZone, PaymentMethod, NotificationPrefs } from './settings/types'
import { defaultSite, defaultZones, defaultPayments, defaultNotifications } from './settings/types'
import { SiteConfigTab } from './settings/SiteConfigTab'
import { ShippingTab } from './settings/ShippingTab'
import { PaymentsTab } from './settings/PaymentsTab'
import { NotificationsTab } from './settings/NotificationsTab'

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

  // Payments
  const [payments, setPayments] = useState<PaymentMethod[]>(defaultPayments)

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
    } catch (err: unknown) {
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
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to save settings', 'error')
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
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent-gold)] px-5 py-2.5 text-xs font-bold text-[var(--btn-blue-text)] hover:shadow-[0_4px_12px_rgba(232,170,36,0.3)] transition-all disabled:opacity-50"
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
                  ? 'bg-[var(--accent-gold)] text-[var(--btn-blue-text)] shadow-[0_4px_12px_rgba(232,170,36,0.2)]'
                  : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-gold)]'
              }`}
            >
              <Icon size={14} /> {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'site' && <SiteConfigTab site={site} updateSite={updateSite} />}
      {activeTab === 'shipping' && <ShippingTab zones={zones} setZones={setZones} />}
      {activeTab === 'payments' && <PaymentsTab payments={payments} setPayments={setPayments} />}
      {activeTab === 'notifications' && <NotificationsTab notifs={notifs} updateNotif={updateNotif} />}
    </div>
  )
}


