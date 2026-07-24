import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Clock, Phone, Mail, MessageCircle, TriangleAlert, Check, Loader2 } from 'lucide-react'
import { useStoreSettings } from '../hooks/useStoreSettings'
import { storefront } from '../lib/api'
import { SEO } from '../components/seo/SEO'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export default function Emergency() {
  const { t } = useTranslation()
  const clockRef = useRef<HTMLDivElement>(null!)
  const pulseRef = useRef<HTMLDivElement>(null!)
  const counterRef = useRef<HTMLDivElement>(null!)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { whatsappNumber, phoneNumber, emergencyEmail } = useStoreSettings()
  const [form, setForm] = useState({ name: '', phone: '', partDescription: '', vesselName: '' })

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const ctx = gsap.context(() => {
      // Pulsing glow on the clock card
      gsap.to(pulseRef.current, {
        boxShadow: '0 0 40px 15px var(--danger-subtle)',
        scale: 1.02,
        duration: 1.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      })

      // Clock icon spin + pulse that activates on scroll
      gsap.to(clockRef.current, {
        rotation: 360,
        duration: 10,
        repeat: -1,
        ease: 'none',
      })

      // Animated countdown digits â€” visual pulse
      gsap.fromTo(
        counterRef.current,
        { scale: 0.8, opacity: 0.5 },
        {
          scale: 1,
          opacity: 1,
          duration: 1.2,
          repeat: -1,
          yoyo: true,
          ease: 'power1.inOut',
        }
      )

      // Scroll-triggered entrance for the emergency contacts panel
      const contactCards = gsap.utils.toArray<HTMLElement>('.emergency-contact-card')
      gsap.fromTo(
        contactCards,
        { x: 30, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          stagger: 0.15,
          duration: 0.5,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: '.emergency-contacts',
            start: 'top 75%',
            toggleActions: 'play none none reverse',
          },
        }
      )
    }, clockRef)

    return () => ctx.revert()
  }, [])
  return (
    <div className="relative">
      <SEO
        title="Emergency Procurement — 24/7 Marine Parts Support"
        description="Emergency marine and industrial parts procurement — 24/7 support, 18-hour delivery record. Send part details via WhatsApp or phone for immediate response."
        canonical="/emergency"
      />
      {/* Dark red gradient overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 50% 0%, var(--danger-glow) 0%, transparent 70%)',
      }} />

      <section className="py-24 text-center relative">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
          <span className="inline-flex items-center gap-2 font-mono text-xs px-3 py-1.5 border border-danger text-danger bg-[var(--surface)] mb-4">
            <TriangleAlert size={12} /> {t('emergency.label')}
          </span>
          <h1 className="font-display font-bold text-display-2xl tracking-tight text-danger mb-4">
            {t('emergency.title')}
          </h1>
          <p className="text-body-lg text-[var(--text-primary)] font-semibold mb-8">
            {t('emergency.sub')}
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <a href={`https://wa.me/${whatsappNumber}`}
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-danger text-[var(--btn-danger-text)] font-semibold text-sm border border-danger hover:bg-danger hover:border-danger hover:-translate-y-0.5 transition-all shadow-[0_0_20px_var(--danger-border)] rounded-xl">
              <MessageCircle size={16} /> {t('emergency.ctaWhatsapp')}
            </a>
            <a href={`tel:${phoneNumber}`}
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-transparent text-danger font-semibold text-sm border border-danger hover:bg-danger/10 hover:-translate-y-0.5 transition-all rounded-xl">
              <Phone size={16} /> {t('emergency.ctaCall')}
            </a>
          </div>
        </div>
      </section>

      {/* Emergency clock demo */}
      <section className="py-16">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            <div ref={pulseRef} className="bg-[var(--secondary-bg)] border border-[var(--border)] p-6 sm:p-10 text-center">
              <div ref={clockRef} className="inline-flex">
                <Clock size={48} className="text-danger mb-4" />
              </div>
              <h2 className="text-lg font-semibold mb-2">{t('emergency.responseClock')}</h2>
              <p className="text-sm text-[var(--text-secondary)] mb-4">{t('emergency.responseRecord')}</p>
              <div ref={counterRef} className="font-mono text-4xl text-danger">24/7</div>
              <p className="text-xs text-[var(--text-muted)] mt-2">{t('emergency.alwaysOperational')}</p>
            </div>

            <div className="emergency-contacts bg-[var(--secondary-bg)] border border-[var(--border)] border-l-[3px] border-l-danger p-5 sm:p-8">
              <h3 className="text-base font-semibold mb-4">{t('emergency.emergencyContacts')}</h3>
              <div className="flex flex-col gap-3">
                <a href={`https://wa.me/${whatsappNumber}`} className="emergency-contact-card flex items-center gap-3 text-sm text-[var(--text-secondary)] no-underline hover:text-danger transition-colors p-3 bg-[var(--surface)] border border-[var(--border)]">
                  <MessageCircle size={18} className="text-danger flex-shrink-0" />
                  <div>
                    <strong className="text-[var(--text-primary)] block text-xs">{t('emergency.whatsappLabel')}</strong>
                    {t('emergency.emergencyText')}
                  </div>
                </a>
                <a href={`tel:${phoneNumber}`} className="emergency-contact-card flex items-center gap-3 text-sm text-[var(--text-secondary)] no-underline hover:text-danger transition-colors p-3 bg-[var(--surface)] border border-[var(--border)]">
                  <Phone size={18} className="text-danger flex-shrink-0" />
                  <div>
                    <strong className="text-[var(--text-primary)] block text-xs">{t('emergency.phoneLabel')}</strong>
                    {phoneNumber}
                  </div>
                </a>
                <a href={`mailto:${emergencyEmail}`} className="emergency-contact-card flex items-center gap-3 text-sm text-[var(--text-secondary)] no-underline hover:text-danger transition-colors p-3 bg-[var(--surface)] border border-[var(--border)]">
                  <Mail size={18} className="text-danger flex-shrink-0" />
                  <div>
                    <strong className="text-[var(--text-primary)] block text-xs">{t('emergency.emailLabel')}</strong>
                    {emergencyEmail}
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Emergency RFQ form */}
      <section className="py-16">
        <div className="max-w-[640px] mx-auto px-4 sm:px-6">
          <form onSubmit={async (e) => {
            e.preventDefault()
            setLoading(true)
            setError('')
            try {
              await storefront.contact.emergency({
                name: form.name,
                phone: form.phone,
                partDescription: form.partDescription,
                vesselName: form.vesselName || undefined,
              })
              setSubmitted(true)
              setForm({ name: '', phone: '', partDescription: '', vesselName: '' })
              // Keep success message visible until user interacts
            } catch (err: any) {
              setError(err.message || 'Failed to submit emergency request. Please call us directly.')
            } finally {
              setLoading(false)
            }
          }} className="bg-[var(--secondary-bg)] border border-[var(--danger)]/30 p-6 sm:p-10">
            <h2 className="text-lg font-semibold mb-6">{t('emergency.formTitle')}</h2>
            {error && <p className="text-xs text-[var(--danger)] mb-4">{error}</p>}
            <div className="mb-4">
              <label htmlFor="emergency-name" className="sr-only">{t('emergency.formName')}</label>
              <input id="emergency-name" type="text" placeholder={t('emergency.formName')} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] text-sm text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] rounded-xl focus:border-[var(--danger)] focus:shadow-[0_0_0_3px_var(--danger-border)] transition-all outline-none" />
            </div>
            <div className="mb-4">
              <label htmlFor="emergency-phone" className="sr-only">{t('emergency.formPhone')}</label>
              <input id="emergency-phone" type="tel" placeholder={t('emergency.formPhone')} required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] text-sm text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] rounded-xl focus:border-[var(--danger)] focus:shadow-[0_0_0_3px_var(--danger-border)] transition-all outline-none" />
            </div>
            <div className="mb-4">
              <label htmlFor="emergency-part" className="sr-only">{t('emergency.formPartDesc')}</label>
              <textarea id="emergency-part" rows={3} placeholder={t('emergency.formPartDesc')} required value={form.partDescription} onChange={(e) => setForm({ ...form, partDescription: e.target.value })} className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] text-sm text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] rounded-xl focus:border-[var(--danger)] focus:shadow-[0_0_0_3px_var(--danger-border)] transition-all outline-none resize-vertical min-h-[80px]" />
            </div>
            <div className="mb-6">
              <label htmlFor="emergency-vessel" className="sr-only">{t('emergency.formVessel')}</label>
              <input id="emergency-vessel" type="text" placeholder={t('emergency.formVessel')} value={form.vesselName} onChange={(e) => setForm({ ...form, vesselName: e.target.value })} className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] text-sm text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] rounded-xl focus:border-[var(--danger)] focus:shadow-[0_0_0_3px_var(--danger-border)] transition-all outline-none" />
            </div>
            <button type="submit" disabled={submitted || loading} aria-label={t('emergency.formSubmit')} className={`w-full flex items-center justify-center gap-2 px-7 py-3.5 font-semibold text-sm border transition-all rounded-xl ${submitted ? 'bg-[var(--success)] border-[var(--success)] text-[var(--btn-success-text)]' : 'bg-danger text-[var(--btn-danger-text)] border-danger hover:bg-danger shadow-[0_0_20px_var(--danger-border)]'}`}>
              {loading ? <><Loader2 size={16} className="animate-spin" /> Submitting...</> : submitted ? <><Check size={16} /> Request Submitted!</> : <><TriangleAlert size={16} /> {t('emergency.formSubmit')}</>}
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}
