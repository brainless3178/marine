import { useState } from 'react'
import { Plus, Trash2, MapPin, ToggleLeft, ToggleRight, X } from 'lucide-react'
import type { ShippingZone } from './types'
import { inputClass, labelClass } from './types'

interface ShippingTabProps {
  zones: ShippingZone[]
  setZones: React.Dispatch<React.SetStateAction<ShippingZone[]>>
}

export function ShippingTab({ zones, setZones }: ShippingTabProps) {
  const [editingZone, setEditingZone] = useState<string | null>(null)
  const [newZoneOpen, setNewZoneOpen] = useState(false)

  return (
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
}

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
