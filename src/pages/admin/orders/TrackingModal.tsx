import { useState } from 'react'
import { X } from 'lucide-react'
import { useToast } from '../../../components/admin/Toast'
import { admin } from '../../../lib/api'
import type { Order } from './types'

interface TrackingModalProps {
  order: Order
  onClose: () => void
  onSaved: () => void
}

export function TrackingModal({ order, onClose, onSaved }: TrackingModalProps) {
  const { toast } = useToast()
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || '')
  const [courier, setCourier] = useState(order.courier || 'DHL')

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[var(--surface)] w-full max-w-[400px] rounded-2xl shadow-2xl border border-[var(--border)] p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[var(--text-primary)]">Update Tracking</h3>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-soft)]">
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
          <button onClick={onClose} className="flex-1 py-2.5 border border-[var(--border)] bg-transparent text-[var(--text-secondary)] font-semibold text-xs rounded-xl hover:border-[var(--danger)] hover:text-[var(--danger)] transition-colors">
            Cancel
          </button>
          <button
            onClick={() => {
              if (!trackingNumber.trim()) { toast('Enter a tracking number', 'error'); return }
              admin.orders.updateTracking(order.id, trackingNumber, courier)
                .then(() => { toast('Tracking updated', 'success'); onSaved() })
                .catch((err: unknown) => toast(err instanceof Error ? err.message : 'Failed to update tracking', 'error'))
            }}
            disabled={!trackingNumber.trim()}
            className="flex-1 py-2.5 bg-[var(--accent-teal)] text-[var(--btn-blue-text)] font-semibold text-xs rounded-xl hover:bg-[var(--accent-teal)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Tracking
          </button>
        </div>
      </div>
    </div>
  )
}
