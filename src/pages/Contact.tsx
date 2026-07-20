import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MapPin, Clock, Phone, Mail, MessageCircle, Send, Check, Loader2 } from 'lucide-react'
import { offices } from '../data/testimonials'
import { storefront } from '../lib/api'
import { useStoreSettings } from '../hooks/useStoreSettings'
import { SEO } from '../components/seo/SEO'

export default function Contact() {
  const { t } = useTranslation()
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { whatsappNumber, phoneNumber, rfqEmail } = useStoreSettings()
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await storefront.contact.submit({
        name: form.name,
        email: form.email,
        subject: form.subject || undefined,
        message: form.message,
      })
      setSubmitted(true)
      setForm({ name: '', email: '', subject: '', message: '' })
      // Keep success message visible until user interacts
    } catch (err: any) {
      setError(err.message || 'Failed to send message. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <SEO
        title="Contact Us — Alka Traders"
        description="Get in touch with Alka Traders. Global offices in Singapore, Dubai, Rotterdam, and Mumbai. Reach us via email, phone, WhatsApp, or our contact form."
        canonical="/contact"
      />
      <section className="py-20 bg-secondary-bg text-center">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
          <span className="inline-block font-body font-medium text-xs tracking-[3px] uppercase text-[var(--text-muted)] mb-4">{t('contact.label')}</span>
          <h1 className="font-display font-bold text-display-xl tracking-tight">{t('contact.title')}</h1>
          <p className="text-body text-[var(--text-secondary)] max-w-[640px] mx-auto mt-4">
            {t('contact.sub')}
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
          {/* Offices */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
            {offices.map((office) => (
              <div key={office.city} className="bg-secondary-bg border border-[var(--border)] border-l-[3px] border-l-transparent p-6 transition-all duration-300 hover:border-l-accent-blue hover:-translate-y-1">
                <h3 className="heading-lg mb-1">{office.city}</h3>
                <p className="text-xs text-[var(--text-muted)] mb-3">{office.country}</p>
                <p className="text-xs text-[var(--text-secondary)] flex items-start gap-1.5 mb-2">
                  <MapPin size={12} className="mt-0.5 flex-shrink-0 text-accent-blue" /> {office.address}
                </p>
                <p className="text-xs text-[var(--text-secondary)] flex items-center gap-1.5 mb-2">
                  <Clock size={12} className="text-accent-blue flex-shrink-0" /> {office.timezone.split('/')[1]}
                </p>
                <a href={`tel:${office.phone}`} className="text-xs text-[var(--text-secondary)] flex items-center gap-1.5 no-underline hover:text-accent-blue">
                  <Phone size={12} className="text-accent-blue" /> {office.phone}
                </a>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-12 items-start">
            {/* Form */}              <form onSubmit={handleSubmit} className="bg-surface border border-[var(--border)] p-10">
              <h3 className="text-lg font-semibold mb-6">{t('contact.formTitle')}</h3>
              {error && <p className="text-xs text-[var(--danger)] mb-4">{error}</p>}
              <div className="mb-5">
                <label htmlFor="contact-name" className="sr-only">{t('contact.formName')}</label>
                <input id="contact-name" type="text" placeholder={t('contact.formName')} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-3 bg-[var(--primary-bg)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:border-accent-blue focus:shadow-[0_0_0_3px_rgba(14,165,233,0.25)] transition-all outline-none" />
              </div>
              <div className="mb-5">
                <label htmlFor="contact-email" className="sr-only">{t('contact.formEmail')}</label>
                <input id="contact-email" type="email" placeholder={t('contact.formEmail')} required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-3 bg-[var(--primary-bg)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:border-accent-blue focus:shadow-[0_0_0_3px_rgba(14,165,233,0.25)] transition-all outline-none" />
              </div>
              <div className="mb-5">
                <label htmlFor="contact-subject" className="sr-only">{t('contact.formSubject')}</label>
                <input id="contact-subject" type="text" placeholder={t('contact.formSubject')} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="w-full px-4 py-3 bg-[var(--primary-bg)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:border-accent-blue focus:shadow-[0_0_0_3px_rgba(14,165,233,0.25)] transition-all outline-none" />
              </div>
              <div className="mb-6">
                <label htmlFor="contact-message" className="sr-only">{t('contact.formMessage')}</label>
                <textarea id="contact-message" rows={4} placeholder={t('contact.formMessage')} required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="w-full px-4 py-3 bg-[var(--primary-bg)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:border-accent-blue focus:shadow-[0_0_0_3px_rgba(14,165,233,0.25)] transition-all outline-none resize-vertical min-h-[100px]" />
              </div>
              <button type="submit" disabled={submitted || loading} aria-label={t('contact.formSubmit')} className={`w-full flex items-center justify-center gap-2 px-7 py-3.5 font-semibold text-sm border transition-all ${submitted ? 'bg-[var(--success)] border-[var(--success)] text-white' : 'bg-accent-blue text-[var(--btn-blue-text)] border-accent-blue hover:bg-accent-teal'}`} onClick={() => submitted && setSubmitted(false)}>
                {loading ? <><Loader2 size={16} className="animate-spin" /> Sending...</> : submitted ? <><Check size={16} /> Message Sent!</> : <><Send size={16} /> {t('contact.formSubmit')}</>}
              </button>
            </form>

            {/* Contact info */}
            <div>
              <div className="bg-secondary-bg border border-[var(--border)] p-8 mb-6">
                <h3 className="text-lg font-semibold mb-4">{t('contact.instantTitle')}</h3>
                <a href={`https://wa.me/${whatsappNumber}`} className="flex items-center justify-center gap-2 px-7 py-3.5 bg-transparent text-success font-semibold text-sm border border-success hover:bg-success/10 transition-all no-underline mb-4">
                  <MessageCircle size={16} /> {t('contact.whatsapp')}
                </a>
                <a href={`mailto:${rfqEmail}`} className="flex items-center gap-2 text-sm text-[var(--text-secondary)] no-underline hover:text-accent-blue mb-3">
                  <Mail size={16} className="text-accent-blue" /> {rfqEmail}
                </a>
                <a href={`tel:${phoneNumber}`} className="flex items-center gap-2 text-sm text-[var(--text-secondary)] no-underline hover:text-accent-blue">
                  <Phone size={16} className="text-accent-blue" /> {phoneNumber}
                </a>
              </div>
              <div className="bg-surface border border-[var(--border)] p-8">
                <h3 className="text-lg font-semibold mb-2">{t('contact.officeHours')}</h3>
                <p className="text-sm text-[var(--text-secondary)] mb-1">{t('contact.officeHoursDetail')}</p>
                <p className="text-sm text-[var(--text-secondary)]">{t('contact.emergencyLine')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
