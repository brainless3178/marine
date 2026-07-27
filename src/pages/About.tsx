import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { MapPin, Clock } from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { offices, timelineEvents } from '../data/testimonials'
import { SEO } from '../components/seo/SEO'
import { BreadcrumbJsonLd } from '../components/seo/BreadcrumbJsonLd'

gsap.registerPlugin(ScrollTrigger)

export default function About() {
  const { t } = useTranslation()
  const timelineRef = useRef<HTMLDivElement>(null!)
  const timelineLineRef = useRef<HTMLDivElement>(null!)

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Vertical line draw
      gsap.fromTo(
        timelineLineRef.current,
        { height: '0%' },
        {
          height: '100%',
          scrollTrigger: {
            trigger: timelineRef.current,
            start: 'top 70%',
            end: 'bottom 30%',
            scrub: 1.5,
          },
        }
      )

      // Timeline events stagger
      const events = gsap.utils.toArray<HTMLElement>('.about-timeline-event')
      gsap.fromTo(
        events,
        { x: -30, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          stagger: 0.3,
          ease: 'power2.out',
          duration: 0.7,
          scrollTrigger: {
            trigger: timelineRef.current,
            start: 'top 75%',
            end: 'bottom 40%',
            toggleActions: 'play none none reverse',
          },
        }
      )

      // Timeline dots stagger
      const dots = gsap.utils.toArray<HTMLElement>('.about-timeline-dot')
      gsap.fromTo(
        dots,
        { scale: 0 },
        {
          scale: 1,
          stagger: 0.3,
          ease: 'back.out(2)',
          duration: 0.5,
          scrollTrigger: {
            trigger: timelineRef.current,
            start: 'top 75%',
            end: 'bottom 40%',
            toggleActions: 'play none none reverse',
          },
        }
      )
    }, timelineRef)

    return () => ctx.revert()
  }, [])

  return (
    <div>
      <SEO
        title="About Us — Marine Equipment Specialists"
        description="Alka Traders — globally connected marine and industrial equipment supplier based in Bhavnagar, Gujarat, India. 25+ years of industry expertise."
        canonical="/about"
      />
      <BreadcrumbJsonLd items={[{ name: 'Home', url: '/' }, { name: 'About', url: '/about' }]} />
      {/* Hero */}
      <section className="py-24 bg-[var(--secondary-bg)] text-center relative overflow-hidden">
        <div className="absolute inset-0 dot-grid-bg opacity-40" />
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 relative z-10">
          <span className="inline-block font-body font-medium text-xs tracking-[3px] uppercase text-[var(--text-muted)] mb-4">
            {t('about.heroLabel')}
          </span>
          <h1 className="font-display font-bold text-display-2xl tracking-tight">
            {t('about.heroTitle')}<br />
            <span className="gradient-text">Globally Connected.</span>
          </h1>
          <p className="text-body text-[var(--text-secondary)] max-w-[640px] mx-auto mt-4">
            {t('about.heroSub')}
          </p>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-24">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
          <span className="inline-block font-body font-medium text-xs tracking-[3px] uppercase text-[var(--text-muted)] mb-4">
            {t('about.storyLabel')}
          </span>
          <h2 className="font-display font-bold text-section-lg tracking-tight mb-12">
            {t('about.storyTitle')}
          </h2>
          <div ref={timelineRef} className="relative pl-8">
            {/* Static background line */}
            <div className="absolute left-[3px] top-0 w-[1px] h-full bg-[var(--border)]" />
            {/* Animated accent line — drawn by GSAP */}
            <div
              ref={timelineLineRef}
              className="absolute left-[3px] top-0 w-[2px] bg-[var(--accent-primary)]/50"
              style={{ height: '0%' }}
            />
            {timelineEvents.map((event) => (
              <div key={event.year} className="about-timeline-event relative pb-10 last:pb-0">
                <div className="about-timeline-dot absolute -left-[41px] w-8 h-8 rounded-full bg-[var(--surface)] border-2 border-[var(--accent-primary)] flex items-center justify-center font-display font-bold text-xs text-[var(--accent-primary)] z-10">
                  {event.year.slice(2)}
                </div>
                <div className="ml-4">
                  <span className="font-mono text-xs text-[var(--accent-primary)]">{event.year}</span>
                  <h3 className="text-base font-semibold mt-1">{event.title}</h3>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">{event.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Offices */}
      <section className="py-24 bg-[var(--secondary-bg)]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
          <span className="inline-block font-body font-medium text-xs tracking-[3px] uppercase text-[var(--text-muted)] mb-4">
            {t('about.hubLabel')}
          </span>
          <h2 className="font-display font-bold text-section-lg tracking-tight mb-10">
            {t('about.hubTitle')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {offices.map((office) => (
              <div
                key={office.city}
                className="bg-[var(--surface)] border border-[var(--border)] border-l-[3px] border-l-transparent p-6 transition-all duration-300 hover:border-l-[var(--accent-primary)] hover:-translate-y-1"
              >
                <h3 className="font-display font-bold text-lg mb-1">{office.city}</h3>
                <p className="text-xs text-[var(--text-muted)] mb-3">{office.country}</p>
                <p className="text-xs text-[var(--text-secondary)] mb-3 flex items-start gap-1.5">
                  <MapPin size={12} className="mt-0.5 flex-shrink-0 text-[var(--accent-primary)]" />
                  {office.address}
                </p>
                <p className="text-xs text-[var(--text-secondary)] mb-1 flex items-center gap-1.5">
                  <Clock size={12} className="text-[var(--accent-primary)] flex-shrink-0" />
                  {office.timezone.split('/')[1]}
                </p>
                <p className="text-xs text-[var(--text-secondary)]">{office.phone}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  )
}
