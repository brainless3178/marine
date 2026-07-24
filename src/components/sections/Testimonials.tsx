import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { SectionLabel } from '../ui/SectionLabel'
import { storefront } from '../../lib/api'
import { Star } from 'lucide-react'

interface Testimonial { id: string; name: string; role: string; company: string; avatar: string; rating: number; text: string }

export function Testimonials() {
  const { t } = useTranslation()
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])

  useEffect(() => {
    let cancelled = false
    storefront.testimonials()
      .then((res) => {
        if (!cancelled && res.testimonials?.length) {
          setTestimonials(res.testimonials.map((r: any) => ({
            id: r.id, name: r.name || 'Anonymous', role: r.role || '', company: r.company || '',
            avatar: r.avatar || r.name?.charAt(0) || '?', rating: r.rating ?? 5, text: r.text || r.content || '',
          })))
        }
      })
      .catch(() => { /* API unavailable */ })
    return () => { cancelled = true }
  }, [])

  if (testimonials.length === 0) return null

  return (
    <section className="py-28 bg-[var(--secondary-bg)]" id="testimonials">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
        <SectionLabel>{t('testimonials.label')}</SectionLabel>
        <h2 className="font-display font-bold text-section tracking-tight mb-12">{t('testimonials.title')}</h2>
        <div className="gold-accent-bar mt-0 mb-12" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {testimonials.map((review, i) => (
            <div key={review.id} className="maritime-card p-8 border-l-[4px] border-l-transparent hover:border-l-[var(--accent-primary)]" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="flex gap-1 mb-5">
                {Array.from({ length: review.rating }).map((_, j) => (
                  <Star key={j} size={16} className="fill-[var(--accent-gold)] text-[var(--accent-gold)]" />
                ))}
              </div>
              <p className="text-body-sm text-[var(--text-secondary)] leading-relaxed italic mb-6">&ldquo;{review.text}&rdquo;</p>
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-[var(--accent-primary)]/[0.08] border border-[var(--accent-primary)]/15 flex items-center justify-center font-display font-bold text-sm text-[var(--accent-primary)] flex-shrink-0">{review.avatar}</div>
                <div>
                  <strong className="text-label block text-[var(--text-primary)]">{review.name}</strong>
                  <span className="font-mono text-xs text-[var(--text-secondary)] block">{review.role}</span>
                  <span className="text-xs text-[var(--text-secondary)]">{review.company}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
