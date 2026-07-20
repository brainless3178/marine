import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SectionLabel } from '../ui/SectionLabel'

gsap.registerPlugin(ScrollTrigger)

export function HowItWorks() {
  const { t } = useTranslation()
  const sectionRef = useRef<HTMLDivElement>(null!)
  const lineRef = useRef<HTMLDivElement>(null!)
  const stepsRef = useRef<HTMLDivElement>(null!)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const ctx = gsap.context(() => {
      gsap.fromTo(
        lineRef.current,
        { width: '0%' },
        {
          width: '100%',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 70%',
            end: 'center 40%',
            scrub: 1.5,
          },
        }
      )

      const stepDots = gsap.utils.toArray<HTMLElement>('.timeline-dot')
      gsap.fromTo(
        stepDots,
        { scale: 0, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          stagger: 0.2,
          ease: 'back.out(1.7)',
          scrollTrigger: {
            trigger: stepsRef.current,
            start: 'top 75%',
            end: 'bottom 60%',
            toggleActions: 'play none none reverse',
          },
        }
      )

      const stepContents = gsap.utils.toArray<HTMLElement>('.timeline-content')
      gsap.fromTo(
        stepContents,
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.15,
          duration: 0.6,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: stepsRef.current,
            start: 'top 75%',
            end: 'bottom 50%',
            toggleActions: 'play none none reverse',
          },
        }
      )
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  const steps = [
    { num: '01', title: t('process.step1Title'), desc: t('process.step1Desc') },
    { num: '02', title: t('process.step2Title'), desc: t('process.step2Desc') },
    { num: '03', title: t('process.step3Title'), desc: t('process.step3Desc') },
    { num: '04', title: t('process.step4Title'), desc: t('process.step4Desc') },
    { num: '05', title: t('process.step5Title'), desc: t('process.step5Desc') },
  ]

  return (
    <section className="py-24 bg-[var(--secondary-bg)]" ref={sectionRef}>
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
        <SectionLabel>{t('process.label')}</SectionLabel>
        <h2 className="font-display font-bold text-section tracking-tight">
          From inquiry to dispatch
        </h2>
        <div className="gold-accent-bar mt-4 mb-14" />

        <div ref={stepsRef} className="flex flex-col lg:flex-row justify-between relative mt-8 px-4">
          {/* Timeline line */}
          <div
            ref={lineRef}
            className="hidden lg:block absolute top-6 left-[60px] right-[60px] h-[2px] bg-gradient-to-r from-[rgba(200,147,10,0.5)] via-[#c8930a] to-[rgba(200,147,10,0.5)]"
            style={{ width: '0%' }}
          />

          {steps.map((step) => (
            <div
              key={step.num}
              className="flex-1 text-center relative px-3 mb-10 lg:mb-0 lg:pl-12 lg:text-left timeline-content"
            >
              <div
                className="timeline-dot w-14 h-14 rounded-xl flex items-center justify-center mx-auto lg:absolute lg:-left-12 mb-5 bg-[var(--surface)] border-2 border-[var(--accent-gold)] font-display font-extrabold text-lg text-[var(--accent-gold)] relative z-10 shadow-[0_4px_20px_rgba(200,147,10,0.15)]"
              >
                {step.num}
              </div>
              <h4 className="text-label font-bold mb-2 text-[var(--text-primary)]">{step.title}</h4>
              <p className="text-body-sm text-[var(--text-muted)] leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
