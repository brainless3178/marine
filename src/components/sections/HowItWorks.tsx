import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, useInView } from 'framer-motion'
import { SectionLabel } from '../ui/SectionLabel'

export function HowItWorks() {
  const { t } = useTranslation()
  const sectionRef = useRef<HTMLDivElement>(null!)
  const isInView = useInView(sectionRef, { once: true, amount: 0.3 })

  const steps = [
    { num: '01', title: t('process.step1Title'), desc: t('process.step1Desc') },
    { num: '02', title: t('process.step2Title'), desc: t('process.step2Desc') },
    { num: '03', title: t('process.step3Title'), desc: t('process.step3Desc') },
    { num: '04', title: t('process.step4Title'), desc: t('process.step4Desc') },
    { num: '05', title: t('process.step5Title'), desc: t('process.step5Desc') },
  ]

  return (
    <section className="section-y bg-[var(--secondary-bg)]" ref={sectionRef}>
      <div className="site-container">
        <div className="section-header">
          <SectionLabel>{t('process.label')}</SectionLabel>
          <h2 className="font-display font-bold text-section tracking-tight">
            From inquiry to dispatch
          </h2>
          <div className="gold-accent-bar mt-4" />
        </div>

        <div className="flex flex-col lg:flex-row justify-between relative mt-8 lg:px-4">
          {/* Timeline line */}
          <motion.div
            className="hidden lg:block absolute top-6 left-[60px] right-[60px] h-[2px] bg-gradient-to-r from-[var(--accent-primary)]/30 via-[var(--accent-gold)]/35 to-[var(--accent-primary)]/30"
            initial={{ width: '0%' }}
            animate={isInView ? { width: 'calc(100% - 120px)' } : { width: '0%' }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
          />

          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              className="flex-1 text-center relative px-3 mb-10 lg:mb-0 lg:pl-12 lg:text-left"
              initial={{ y: 30, opacity: 0 }}
              animate={isInView ? { y: 0, opacity: 1 } : { y: 30, opacity: 0 }}
              transition={{ delay: i * 0.12, duration: 0.5, ease: 'easeOut' }}
            >
              <motion.div
                className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto lg:absolute lg:-left-12 mb-5 bg-[var(--surface)] border border-[var(--accent-primary)]/35 font-display font-extrabold text-lg text-[var(--accent-primary)] relative z-10 shadow-[0_4px_20px_var(--focus-ring)]"
                initial={{ scale: 0, opacity: 0 }}
                animate={isInView ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
                transition={{ delay: i * 0.15, duration: 0.4, ease: 'backOut' }}
              >
                {step.num}
              </motion.div>
              <h4 className="text-label font-bold mb-2 text-[var(--text-primary)]">{step.title}</h4>
              <p className="text-body-sm text-[var(--text-secondary)] leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
