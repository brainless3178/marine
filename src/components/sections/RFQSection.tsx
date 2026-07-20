import { useState, useEffect, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { CircleCheck, MessageCircle, Mail, Send } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { useStoreSettings } from '../../hooks/useStoreSettings'

export function RFQSection() {
  const { t } = useTranslation()
  const [spotlight, setSpotlight] = useState({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = useState(false)
  const [isTouchDevice, setIsTouchDevice] = useState(() => 'ontouchstart' in window || navigator.maxTouchPoints > 0)

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0)
  }, [])
  const { rfqSubmitted, rfqId, setRfqSubmitted, generateRfqId } = useStore()
  const settings = useStoreSettings()
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    productDesc: '',
    quantity: '1',
    urgency: 'standard',
  })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isTouchDevice) return
    const rect = e.currentTarget.getBoundingClientRect()
    setSpotlight({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    generateRfqId()
    setRfqSubmitted(true)
  }

  if (rfqSubmitted) {
    return (
      <section className="py-28 bg-[var(--secondary-bg)]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto relative mb-8">
              <div className="w-24 h-24 rounded-full border-[3px] border-[var(--success)]" />
              <div className="absolute top-7 left-[34px] w-4 h-9 border-r-[3px] border-b-[3px] border-[var(--success)] animate-checkmark origin-center"
                style={{ transform: 'rotate(45deg)' }}
              />
            </div>
            <h3 className="text-xl font-bold mb-3 text-[var(--text-primary)]">{t('rfq.success')}</h3>
            <p className="font-mono text-lg text-[var(--accent-gold)] mb-2">{t('rfq.rfqId')}{rfqId}</p>
            <p className="text-sm text-[var(--text-secondary)]">{t('rfq.successSub')}</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section
      className="py-28 bg-[var(--secondary-bg)]"
      style={{
        backgroundImage: `linear-gradient(135deg, rgba(200,147,10,0.04) 0%, transparent 48%), linear-gradient(180deg, var(--secondary-bg), var(--primary-bg))`,
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div
        className="max-w-[1280px] mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-[42%_58%] gap-12 items-center"
        style={{
          background: isTouchDevice
            ? 'radial-gradient(600px at 50% 50%, rgba(200, 147, 10, 0.06) 0%, transparent 80%)'
            : isHovering
            ? `radial-gradient(600px at ${spotlight.x}px ${spotlight.y}px, rgba(200, 147, 10, 0.06) 0%, transparent 80%)`
            : undefined,
        }}
      >
        <div>
          <h2 className="font-display font-bold text-section-xl tracking-tight mb-5">
            Cannot find it?<br />We will source it.
          </h2>
          <div className="gold-accent-bar mt-4 mb-6" />
          <p className="text-body text-[var(--text-secondary)] leading-relaxed mb-7 max-w-[520px]">
            Upload a part description, photo, SKU or equipment plate. We will check stock, condition and export options, then come back with a quote.
          </p>
          <ul className="flex flex-col gap-3.5 mb-7">
            <li className="flex items-center gap-3 text-body-sm text-[var(--text-secondary)]">
              <CircleCheck size={18} className="text-[var(--success)] flex-shrink-0" /> {t('rfq.verifiedSuppliers')}
            </li>
            <li className="flex items-center gap-3 text-body-sm text-[var(--text-secondary)]">
              <CircleCheck size={18} className="text-[var(--success)] flex-shrink-0" /> {t('rfq.hourResponse')}
            </li>
            <li className="flex items-center gap-3 text-body-sm text-[var(--text-secondary)]">
              <CircleCheck size={18} className="text-[var(--success)] flex-shrink-0" /> {t('rfq.countries')}
            </li>
          </ul>
          <div className="flex flex-col gap-2.5">
            <a href={`https://wa.me/${settings.whatsappNumber}`} className="flex items-center gap-2.5 text-sm font-semibold no-underline text-[var(--text-primary)] hover:text-[var(--success)] transition-colors">
              <MessageCircle size={18} className="text-[var(--success)]" /> WhatsApp Us Now
            </a>
            <a href={`mailto:${settings.rfqEmail}`} className="flex items-center gap-2.5 text-sm font-semibold no-underline text-[var(--text-primary)] hover:text-[var(--accent-blue)] transition-colors">
              <Mail size={18} className="text-[var(--accent-blue)]" /> {settings.rfqEmail}
            </a>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="maritime-card p-7 md:p-9">
          <div className="mb-5">
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">Full Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
              placeholder="Your full name"
              className="w-full px-4 py-3.5 rounded-xl bg-[var(--surface-soft)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:border-[var(--accent-gold)] focus:shadow-[0_0_0_3px_rgba(200,147,10,0.1)] transition-all outline-none"
            />
          </div>
          <div className="mb-5">
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">Company Name</label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => setFormData((p) => ({ ...p, company: e.target.value }))}
              placeholder="Company name"
              className="w-full px-4 py-3.5 rounded-xl bg-[var(--surface-soft)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:border-[var(--accent-gold)] focus:shadow-[0_0_0_3px_rgba(200,147,10,0.1)] transition-all outline-none"
            />
          </div>
          <div className="mb-5">
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">Email Address *</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
              placeholder="you@company.com"
              className="w-full px-4 py-3.5 rounded-xl bg-[var(--surface-soft)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:border-[var(--accent-gold)] focus:shadow-[0_0_0_3px_rgba(200,147,10,0.1)] transition-all outline-none"
            />
          </div>
          <div className="mb-5">
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">Phone Number</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
              placeholder={t('rfq.placeholders.phone') || '+1 555 000 0000'}
              className="w-full px-4 py-3.5 rounded-xl bg-[var(--surface-soft)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:border-[var(--accent-gold)] focus:shadow-[0_0_0_3px_rgba(200,147,10,0.1)] transition-all outline-none"
            />
          </div>
          <div className="mb-5">
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">Product Name or Description *</label>
            <textarea
              required
              value={formData.productDesc}
              onChange={(e) => setFormData((p) => ({ ...p, productDesc: e.target.value }))}
              rows={3}
              placeholder="Describe the part, include SKU or brand if known"
              className="w-full px-4 py-3.5 rounded-xl bg-[var(--surface-soft)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:border-[var(--accent-gold)] focus:shadow-[0_0_0_3px_rgba(200,147,10,0.1)] transition-all outline-none resize-vertical min-h-[80px]"
            />
          </div>
          <div className="mb-5">
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">Quantity Required</label>
            <input
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData((p) => ({ ...p, quantity: e.target.value }))}
              min={1}
              className="w-full px-4 py-3.5 rounded-xl bg-[var(--surface-soft)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:border-[var(--accent-gold)] focus:shadow-[0_0_0_3px_rgba(200,147,10,0.1)] transition-all outline-none"
            />
          </div>
          <div className="mb-7">
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">Urgency</label>
            <select
              value={formData.urgency}
              onChange={(e) => setFormData((p) => ({ ...p, urgency: e.target.value }))}
              className="w-full px-4 py-3.5 rounded-xl bg-[var(--surface-soft)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:border-[var(--accent-gold)] focus:shadow-[0_0_0_3px_rgba(200,147,10,0.1)] transition-all outline-none appearance-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%2394A3B8' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10l-5 5z'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 12px center',
              }}
            >
              <option value="standard">Standard (7-14 days)</option>
              <option value="urgent">Urgent (24-48 hours)</option>
              <option value="emergency">Emergency (Same day)</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2.5 maritime-btn-primary text-sm maritime-shimmer"
          >
            <Send size={14} />
            Submit RFQ
          </button>
        </form>
      </div>
    </section>
  )
}
