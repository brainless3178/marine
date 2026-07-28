import { useState } from 'react'
import { CreditCard, Info, ToggleLeft, ToggleRight } from 'lucide-react'
import type { PaymentMethod } from './types'
import { inputClass, selectClass, labelClass } from './types'

interface PaymentsTabProps {
  payments: PaymentMethod[]
  setPayments: React.Dispatch<React.SetStateAction<PaymentMethod[]>>
}

export function PaymentsTab({ payments, setPayments }: PaymentsTabProps) {
  const [expandedPayment, setExpandedPayment] = useState<string | null>(null)

  return (
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
}
