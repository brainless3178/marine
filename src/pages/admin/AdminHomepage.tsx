import { useState, useEffect, useCallback } from 'react'
import {
  Home,
  GripVertical,
  Eye,
  EyeOff,
  Save,
  CheckCircle,
  Image,
  Star,
  Package,
  Award,
  Factory,
  Users,
  Type,
  Loader2,
} from 'lucide-react'
import { admin } from '../../lib/api'
import { useToast } from '../../components/admin/toast-context'

const iconMap: Record<string, typeof Home> = {
  hero: Image,
  featured: Package,
  stats: Users,
  categories: Factory,
  brands: Award,
  testimonials: Star,
  industries: Factory,
  cta: Type,
}

interface Section {
  id: string
  type: string
  label: string
  icon: typeof Home
  enabled: boolean
  sortOrder: number
  config: Record<string, string>
}

const defaultSections: Section[] = [
  { id: 'hero', type: 'hero', label: 'Hero Banner', icon: Image, enabled: true, sortOrder: 0, config: { title: 'Alka Traders', subtitle: 'Leading Supplier & Exporter of Used & Unbranded Marine Equipment', ctaText: 'Browse Products', heroImage: '/images/placeholder.jpg' } },
  { id: 'featured', type: 'featured', label: 'Featured Products', icon: Package, enabled: true, sortOrder: 1, config: { title: 'Featured Equipment', maxItems: '8', layout: 'grid' } },
  { id: 'stats', type: 'stats', label: 'Stats Bar', icon: Users, enabled: true, sortOrder: 2, config: { stat1Label: 'Products', stat1Value: '255+', stat2Label: 'Countries', stat2Value: '30+', stat3Label: 'Years', stat3Value: '25+', stat4Label: 'Clients', stat4Value: '500+' } },
  { id: 'categories', type: 'categories', label: 'Categories Grid', icon: Factory, enabled: true, sortOrder: 3, config: { title: 'Browse by Category', layout: 'grid' } },
  { id: 'brands', type: 'brands', label: 'Brands Marquee', icon: Award, enabled: true, sortOrder: 4, config: { title: 'Trusted Brands', autoScroll: 'true' } },
  { id: 'testimonials', type: 'testimonials', label: 'Testimonials', icon: Star, enabled: true, sortOrder: 5, config: { title: 'What Our Clients Say', autoPlay: 'true' } },
  { id: 'industries', type: 'industries', label: 'Industries', icon: Factory, enabled: true, sortOrder: 6, config: { title: 'Industries We Serve', layout: 'tabs' } },
  { id: 'cta', type: 'cta', label: 'Call to Action', icon: Type, enabled: true, sortOrder: 7, config: { title: 'Need Custom Marine Parts?', subtitle: 'Submit a request for quote and our team will get back to you within 24 hours.', ctaText: 'Request a Quote', ctaLink: '/rfq' } },
]

export default function AdminHomepage() {
  const { toast } = useToast()
  const [sections, setSections] = useState(defaultSections)
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchSections = useCallback(async () => {
    setLoading(true)
    try {
      const res = await admin.homepage.get()
      if (res.sections && res.sections.length > 0) {
        setSections(res.sections.map((s: any, i: number) => ({
          id: s.id || `section-${i}`,
          type: s.type || 'custom',
          label: s.label || s.name || s.type || 'Section',
          icon: iconMap[s.type] || Home,
          enabled: s.enabled ?? true,
          sortOrder: s.sortOrder ?? i,
          config: s.config || {},
        })))
      }
    } catch (err: any) {
      console.error('Failed to load homepage sections:', err)
      toast('Failed to load homepage content', 'error')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { fetchSections() }, [fetchSections])

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = sections.map((s, i) => ({
        id: s.id,
        type: s.type,
        label: s.label,
        enabled: s.enabled,
        sortOrder: i,
        config: s.config,
      }))
      await admin.homepage.update(payload)
      setSaved(true)
      toast('Homepage content saved', 'success')
      setTimeout(() => setSaved(false), 2000)
    } catch (err: any) {
      toast(err.message || 'Failed to save homepage content', 'error')
    } finally {
      setSaving(false)
    }
  }

  const toggleSection = (id: string) => {
    setSections((prev) => prev.map((s) => s.id === id ? { ...s, enabled: !s.enabled } : s))
  }

  const moveSection = (id: string, direction: 'up' | 'down') => {
    setSections((prev) => {
      const idx = prev.findIndex((s) => s.id === id)
      if (idx === -1) return prev
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1
      if (targetIdx < 0 || targetIdx >= prev.length) return prev
      const next = [...prev]
      ;[next[idx], next[targetIdx]] = [next[targetIdx], next[idx]]
      return next.map((s, i) => ({ ...s, sortOrder: i }))
    })
  }

  const updateConfig = (id: string, key: string, value: string) => {
    setSections((prev) => prev.map((s) => s.id === id ? { ...s, config: { ...s.config, [key]: value } } : s))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={24} className="animate-spin text-[var(--accent-gold)]" />
        <span className="ml-3 text-sm text-[var(--text-muted)]">Loading homepage content...</span>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-[var(--text-primary)]">Homepage Content</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">{sections.filter((s) => s.enabled).length} of {sections.length} sections enabled</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent-gold)] px-5 py-2.5 text-xs font-bold text-[var(--btn-blue-text)] hover:shadow-[0_4px_12px_rgba(232,170,36,0.3)] transition-all disabled:opacity-50">
          {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : saved ? <><CheckCircle size={14} /> Saved!</> : <><Save size={14} /> Save Changes</>}
        </button>
      </div>

      {/* Section List */}
      <div className="space-y-3">
        {sections.map((section, i) => {
          const Icon = section.icon
          const isEditing = editingSection === section.id
          return (
            <div key={section.id} className={`rounded-2xl border bg-[var(--surface)] overflow-hidden transition-all ${section.enabled ? 'border-[var(--border)]' : 'border-[var(--border)] opacity-50'}`}>
              <div className="flex items-center gap-3 px-5 py-4">
                {/* Drag Handle */}
                <div className="flex flex-col gap-0.5">
                  <button onClick={() => moveSection(section.id, 'up')} disabled={i === 0} className="text-[var(--text-muted)]/30 hover:text-[var(--text-muted)] disabled:opacity-20"><GripVertical size={12} className="rotate-180" /></button>
                  <button onClick={() => moveSection(section.id, 'down')} disabled={i === sections.length - 1} className="text-[var(--text-muted)]/30 hover:text-[var(--text-muted)] disabled:opacity-20"><GripVertical size={12} /></button>
                </div>

                {/* Icon */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-soft)] border border-[var(--border)]">
                  <Icon size={16} className={section.enabled ? 'text-[var(--accent-gold)]' : 'text-[var(--text-muted)]'} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">{section.label}</h3>
                  <p className="text-[0.625rem] text-[var(--text-muted)] uppercase">{section.type} · Section {i + 1}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setEditingSection(isEditing ? null : section.id)} className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--accent-gold)] hover:bg-[var(--gold-muted)] transition-colors">
                    <Type size={14} />
                  </button>
                  <button onClick={() => toggleSection(section.id)} className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--accent-blue)] hover:bg-[var(--accent-blue)]/10 transition-colors">
                    {section.enabled ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                </div>
              </div>

              {/* Config Editor */}
              {isEditing && (
                <div className="border-t border-[var(--border)] bg-[var(--surface-soft)] p-5 space-y-3">
                  <h4 className="text-[0.625rem] font-bold uppercase tracking-wider text-[var(--text-muted)]">Section Settings</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(section.config).map(([key, value]) => (
                      <div key={key}>
                        <label className="block text-[0.625rem] font-bold text-[var(--text-secondary)] mb-1">{key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}</label>
                        {value.length > 60 ? (
                          <textarea value={value} onChange={(e) => updateConfig(section.id, key, e.target.value)} rows={2} className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] py-2 px-3 text-xs focus:border-[var(--accent-gold)] resize-y" />
                        ) : (
                          <input value={value} onChange={(e) => updateConfig(section.id, key, e.target.value)} className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] py-2 px-3 text-xs focus:border-[var(--accent-gold)]" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
