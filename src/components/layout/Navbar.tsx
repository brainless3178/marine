import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router-dom'
import { Menu, MessageCircle, Phone, ShoppingCart, X, Mail, Globe } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { useStoreSettings } from '../../hooks/useStoreSettings'
import { ThemeToggle } from '../ui/ThemeToggle'
import type { Language } from '../../types'

const navLinks = [
  { path: '/', labelKey: 'home' },
  { path: '/about', labelKey: 'about' },
  { path: '/shop', labelKey: 'shop' },
  { path: '/brands', labelKey: 'brands' },
  { path: '/contact', labelKey: 'contact' },
]

const languages: { code: Language; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'ar', label: 'AR' },
  { code: 'es', label: 'ES' },
]

function BrandLockup() {
  return (
    <Link to="/" className="flex items-center gap-3 no-underline text-[var(--text-primary)]">
      <img
        src="/images/alka-traders-logo.jpeg"
        alt="Alka Traders Logo"
        width={44}
        height={44}
        className="h-11 w-11 shrink-0 rounded-lg object-cover shadow-sm"
      />
      <span className="flex flex-col leading-none">
        <span className="font-display text-xl lg:text-[28px] font-bold tracking-tight">Alka Traders</span>
        <span className="mt-1 text-xs font-bold uppercase tracking-[2px] text-[var(--text-muted)]">
          Marine & Industrial Equipment
        </span>
      </span>
    </Link>
  )
}

export function Navbar() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const setShowCartDrawer = useStore((s) => s.setShowCartDrawer)
  const getCartCount = useStore((s) => s.getCartCount)
  const language = useStore((s) => s.language)
  const setLanguage = useStore((s) => s.setLanguage)
  const cartCount = getCartCount()
  const settings = useStoreSettings()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 32)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
    setLangOpen(false)
  }, [pathname])

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  // Close language dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('[data-lang-switcher]')) {
        setLangOpen(false)
      }
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  return (
    <header>
      {/* ── TOP BAR: Email, Phone, Free Shipping ── */}
      <div className="bg-[var(--navy-deep)] border-b border-white/10 text-white/85 text-xs">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 flex items-center justify-between h-9">
          <div className="flex items-center gap-4">
            <a href={`mailto:${settings.rfqEmail}`} className="flex items-center gap-1.5 text-white/80 hover:text-[var(--accent-gold)] transition-colors no-underline">
              <Mail size={12} />
              <span className="hidden sm:inline">{settings.rfqEmail}</span>
            </a>
            <a href={`tel:${settings.phoneNumber}`} className="flex items-center gap-1.5 text-white/80 hover:text-[var(--accent-gold)] transition-colors no-underline">
              <Phone size={12} />
              <span className="hidden sm:inline">{settings.phoneNumber}</span>
            </a>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden md:inline text-white/70">{t('topbar.freeShipping')}</span>
            <span className="hidden md:inline text-white/45">|</span>
            <span className="hidden md:inline text-white/70">{t('topbar.timelyDelivery')}</span>
            <span className="hidden md:inline text-white/45">|</span>
            <span className="hidden md:inline text-white/70">{t('topbar.securePayment')}</span>
          </div>
        </div>
      </div>

      {/* ── MAIN NAVBAR ── */}
      <nav
        className={`sticky top-0 z-50 border-b bg-[var(--surface)]/96 px-4 py-3 backdrop-blur-sm md:backdrop-blur-xl transition-shadow pt-[env(safe-area-inset-top)] ${
          scrolled ? 'border-[var(--border)] shadow-[0_10px_30px_rgba(15,23,42,0.08)]' : 'border-transparent'
        }`}
      >
        <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-5">
          <BrandLockup />

          {/* Desktop Nav Links */}
          <div className="hidden items-center gap-6 lg:flex">                {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-bold no-underline transition-colors ${
                  pathname === link.path
                    ? 'text-[var(--accent-blue)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--accent-blue)]'
                }`}
              >
                {t(`nav.${link.labelKey}`)}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <div className="relative" data-lang-switcher>
              <button
                onClick={() => setLangOpen((v) => !v)}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-secondary)] hover:text-[var(--accent-blue)] transition-colors"
                aria-label="Switch language"
              >
                <Globe size={16} />
              </button>
              {langOpen && (
                <div className="absolute right-0 top-full mt-1 w-28 rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-lg overflow-hidden z-50">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code)
                        setLangOpen(false)
                      }}
                      className={`w-full px-4 py-2.5 text-xs font-bold text-left transition-colors hover:bg-[var(--surface-soft)] flex items-center gap-2 ${
                        language === lang.code ? 'text-[var(--accent-blue)] bg-[var(--surface-soft)]' : 'text-[var(--text-secondary)]'
                      }`}
                    >
                      {language === lang.code && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-gold)]" />
                      )}
                      {lang.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <ThemeToggle />

            <button
              onClick={() => setShowCartDrawer(true)}
              className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-secondary)] transition-colors hover:text-[var(--accent-blue)]"
              aria-label="Cart"
            >
              <ShoppingCart size={18} />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--accent-gold)] px-1 text-xs font-bold leading-none text-navy-deep">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </button>

            <a
              href={`https://wa.me/${settings.whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden h-10 w-10 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] text-[var(--success)] transition-opacity hover:opacity-80 sm:flex"
              aria-label={`WhatsApp ${settings.phoneNumber}`}
            >
              <MessageCircle size={18} />
            </a>

            <Link
              to="/rfq"
              className="hidden items-center rounded-lg bg-[var(--accent-gold)] px-5 py-3 text-xs font-extrabold text-navy-deep no-underline transition-colors hover:bg-btn-hover-gold hover:text-white lg:inline-flex"
            >
              {t('nav.requestQuote')}
            </Link>

            <button
              onClick={() => setMobileOpen((value) => !value)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] lg:hidden"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`absolute left-0 right-0 top-full border-b border-[var(--border)] bg-[var(--surface)] px-5 py-4 shadow-lg lg:hidden z-50 transition-all duration-300 ease-in-out ${mobileOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`} style={{ maxHeight: mobileOpen ? '80vh' : '0', overflow: 'hidden' }}>
            <div className="mx-auto flex max-w-[1280px] flex-col gap-3">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`rounded-lg px-3 py-2 text-sm font-bold no-underline ${
                    pathname === link.path
                      ? 'bg-[var(--surface-soft)] text-[var(--accent-blue)]'
                      : 'text-[var(--text-secondary)]'
                  }`}
                >
                  {t(`nav.${link.labelKey}`)}
                </Link>
              ))}
              <div className="border-t border-[var(--border)] pt-3 mt-1">
                <span className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider block mb-2">{t('nav.language')}</span>
                <div className="flex gap-2">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code)
                      }}
                      className={`px-3 py-2 rounded-lg text-xs font-bold border ${
                        language === lang.code
                          ? 'border-[var(--accent-gold)] bg-[var(--gold-muted)] text-[var(--accent-gold)]'
                          : 'border-[var(--border)] text-[var(--text-secondary)]'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <a
                  href={`https://wa.me/${settings.whatsappNumber}`}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-xs font-bold text-[var(--success)] no-underline"
                >
                  <MessageCircle size={14} /> WhatsApp
                </a>
                <a
                  href={`tel:${settings.phoneNumber}`}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-xs font-bold text-[var(--accent-blue)] no-underline"
                >
                  <Phone size={14} /> Call
                </a>
              </div>
              <Link
                to="/rfq"
                className="inline-flex items-center justify-center rounded-lg bg-[var(--accent-gold)] px-5 py-3 text-xs font-extrabold text-navy-deep no-underline"
              >
                {t('nav.requestQuote')}
              </Link>
            </div>
          </div>
      </nav>
    </header>
  )
}
