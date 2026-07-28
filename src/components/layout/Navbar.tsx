import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, MessageCircle, Phone, ShoppingCart, X, Mail, Globe, UserCircle2, LogOut, User, Package, LogIn } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { useStoreSettings } from '../../hooks/useStoreSettings'
import { ThemeToggle } from '../ui/ThemeToggle'
import { useLocale, useLocalizedPath, switchLocalePath } from '../../lib/locale'
import type { Language } from '../../types'

const STATIC_NAV_LINKS = [
  { path: '/', labelKey: 'home' },
  { path: '/products', labelKey: 'products' },
  { path: '/shop', labelKey: 'shop' },
  { path: '/industries', labelKey: 'industries' },
  { path: '/brands', labelKey: 'brands' },
  { path: '/about', labelKey: 'about' },
  { path: '/contact', labelKey: 'contact' },
]

const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'ar', label: 'AR' },
  { code: 'es', label: 'ES' },
]

function BrandLockup() {
  const locale = useLocale()
  return (
    <Link to={`/${locale}`} className="flex items-center gap-3 no-underline text-[var(--text-primary)]"><img
        src="/images/alka-traders-logo.jpeg"
        alt="Alka Traders Logo"
        width={44}
        height={44}
        className="h-11 w-11 shrink-0 rounded-lg object-cover shadow-sm"
      />
      <span className="flex flex-col leading-none">
        <span className="font-display text-xl lg:text-[26px] font-bold tracking-tight text-[var(--text-primary)]">Alka Traders</span>
        <span className="mt-1 text-[10px] font-bold uppercase tracking-[2px] text-[var(--text-muted)]">
          Marine & Industrial Equipment
        </span>
      </span>
    </Link>
  )
}

export function Navbar() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const locale = useLocale()
  const localizedPath = useLocalizedPath()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const setShowCartDrawer = useStore((s) => s.setShowCartDrawer)
  const getCartCount = useStore((s) => s.getCartCount)
  const language = useStore((s) => s.language)
  const isLoggedIn = useStore((s) => s.isLoggedIn)
  const user = useStore((s) => s.user)
  const logout = useStore((s) => s.logout)
  const setShowAuthModal = useStore((s) => s.setShowAuthModal)
  const cartCount = getCartCount()
  const settings = useStoreSettings()
  const [profileOpen, setProfileOpen] = useState(false)

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

  // Close language and profile dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('[data-lang-switcher]')) setLangOpen(false)
      if (!target.closest('[data-profile-menu]')) setProfileOpen(false)
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  return (
    <header className="sticky top-0 z-50">
      {/* ── TOP BAR: Email, Phone, Free Shipping ── */}
      <div className="hidden sm:block bg-[var(--surface-soft)] border-b border-[var(--border)] text-[var(--text-secondary)] text-xs">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 flex items-center justify-between h-9">
          <div className="flex items-center gap-5">
            <a href={`mailto:${settings.rfqEmail}`} className="flex items-center gap-1.5 text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors no-underline font-medium">
              <Mail size={12} className="text-[var(--accent-primary)]" />
              <span className="hidden sm:inline">{settings.rfqEmail}</span>
            </a>
            <a href={`tel:${settings.phoneNumber}`} className="flex items-center gap-1.5 text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors no-underline font-medium">
              <Phone size={12} className="text-[var(--accent-primary)]" />
              <span className="hidden sm:inline">{settings.phoneNumber}</span>
            </a>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-medium">
            <span className="hidden md:inline text-[var(--text-muted)]">{t('topbar.freeShipping')}</span>
            <span className="hidden md:inline text-[var(--border)]">|</span>
            <span className="hidden md:inline text-[var(--text-muted)]">{t('topbar.timelyDelivery')}</span>
            <span className="hidden md:inline text-[var(--border)]">|</span>
            <span className="hidden md:inline text-[var(--text-muted)]">{t('topbar.securePayment')}</span>
          </div>
        </div>
      </div>

      {/* ── MAIN NAVBAR ── */}
      <nav
        className={`border-b bg-[var(--surface)]/98 px-4 py-3 backdrop-blur-md transition-all duration-300 ${
          scrolled ? 'border-[var(--border)] shadow-[0_8px_24px_rgba(15,23,42,0.06)]' : 'border-[var(--border)]'
        }`}
      >
        <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-5">
          <BrandLockup />

          {/* Desktop Nav Links */}
          <div className="hidden items-center gap-7 lg:flex">
            {STATIC_NAV_LINKS.map((link) => {
              const localizedTo = localizedPath(link.path)
              return (
                <Link
                  key={link.path}
                  to={localizedTo}
                  className={`text-sm font-semibold no-underline transition-colors ${
                    pathname === localizedTo || (localizedTo !== `/${locale}` && pathname.startsWith(localizedTo))
                      ? 'text-[var(--accent-primary)] font-bold'
                      : 'text-[var(--text-primary)] hover:text-[var(--accent-primary)]'
                  }`}
                >
                  {t(`nav.${link.labelKey}`)}
                </Link>
              )
            })}
          </div>

          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <div className="relative" data-lang-switcher>
              <button
                onClick={() => setLangOpen((v) => !v)}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors"
                aria-label="Switch language"
              >
                <Globe size={16} />
              </button>
              {langOpen && (
                <div className="absolute right-0 top-full mt-1 w-28 rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-lg overflow-hidden z-50">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        const newPath = switchLocalePath(pathname, lang.code)
                        navigate(newPath)
                        setLangOpen(false)
                      }}
                      className={`w-full px-4 py-2.5 text-xs font-bold text-left transition-colors hover:bg-[var(--surface-soft)] flex items-center gap-2 ${
                        language === lang.code ? 'text-[var(--accent-primary)] bg-[var(--surface-soft)]' : 'text-[var(--text-secondary)]'
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
              className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-secondary)] transition-colors hover:text-[var(--accent-primary)]"
              aria-label="Cart"
            >
              <ShoppingCart size={18} />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--accent-primary)] px-1 text-xs font-bold leading-none text-white">
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
              to={localizedPath('/rfq')}
              className="hidden items-center rounded-lg bg-[var(--accent-primary)] px-5 py-3 text-xs font-extrabold text-white no-underline transition-colors hover:bg-[var(--accent-primary-hover)] lg:inline-flex"
            >
              {t('nav.requestQuote')}
            </Link>

            {/* Profile / Auth */}
            <div className="relative" data-profile-menu>
              <button
                onClick={() => setProfileOpen((v) => !v)}
                className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-colors ${
                  isLoggedIn
                    ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                    : 'border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)]'
                }`}
                aria-label="Profile"
              >
                <UserCircle2 size={20} />
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xl overflow-hidden z-50">
                  {isLoggedIn ? (
                    <>
                      <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--surface-soft)]">
                        <p className="text-xs font-bold text-[var(--text-primary)] truncate">{user?.name || 'My Account'}</p>
                        <p className="text-[11px] text-[var(--text-muted)] truncate mt-0.5">{user?.email || ''}</p>
                      </div>
                      <Link
                        to={localizedPath('/account/profile')}
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-[var(--text-primary)] no-underline hover:bg-[var(--surface-soft)] transition-colors"
                      >
                        <User size={14} className="text-[var(--text-muted)]" /> My Profile
                      </Link>
                      <Link
                        to={localizedPath('/account/orders')}
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-[var(--text-primary)] no-underline hover:bg-[var(--surface-soft)] transition-colors"
                      >
                        <Package size={14} className="text-[var(--text-muted)]" /> My Orders
                      </Link>
                      <div className="border-t border-[var(--border)]">
                        <button
                          onClick={() => { logout(); setProfileOpen(false) }}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-xs font-semibold text-[var(--danger)] hover:bg-[var(--danger)]/5 transition-colors"
                        >
                          <LogOut size={14} /> Sign Out
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--surface-soft)]">
                        <p className="text-xs font-bold text-[var(--text-primary)]">Welcome</p>
                        <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Sign in to access your account</p>
                      </div>
                      <button
                        onClick={() => { setShowAuthModal(true); setProfileOpen(false) }}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--surface-soft)] transition-colors"
                      >
                        <LogIn size={14} className="text-[var(--accent-primary)]" /> Sign In
                      </button>
                      <button
                        onClick={() => { setShowAuthModal(true); setProfileOpen(false) }}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-xs font-semibold text-[var(--accent-primary)] hover:bg-[var(--surface-soft)] transition-colors"
                      >
                        <UserCircle2 size={14} /> Create Account
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

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
              {STATIC_NAV_LINKS.map((link) => {
                const localizedTo = localizedPath(link.path)
                return (
                  <Link
                    key={link.path}
                    to={localizedTo}
                    className={`rounded-lg px-3 py-2 text-sm font-bold no-underline ${
                      pathname === localizedTo
                        ? 'bg-[var(--surface-soft)] text-[var(--accent-primary)]'
                        : 'text-[var(--text-secondary)]'
                    }`}
                  >
                    {t(`nav.${link.labelKey}`)}
                  </Link>
                )
              })}
              <div className="border-t border-[var(--border)] pt-3 mt-1">
                <span className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider block mb-2">{t('nav.language')}</span>
                <div className="flex gap-2">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        const newPath = switchLocalePath(pathname, lang.code)
                        navigate(newPath)
                      }}
                      className={`px-3 py-2 rounded-lg text-xs font-bold border ${
                        language === lang.code
                          ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
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
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-xs font-bold text-[var(--accent-primary)] no-underline"
                >
                  <Phone size={14} /> Call
                </a>
              </div>
              <div className="border-t border-[var(--border)] pt-3 mt-1">
                {isLoggedIn ? (
                  <div className="flex flex-col gap-1">
                    <div className="px-3 py-2 rounded-lg bg-[var(--surface-soft)]">
                      <p className="text-xs font-bold text-[var(--text-primary)] truncate">{user?.name || 'My Account'}</p>
                      <p className="text-[11px] text-[var(--text-muted)] truncate">{user?.email || ''}</p>
                    </div>
                    <Link to={localizedPath('/account/profile')} onClick={() => setMobileOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold no-underline text-[var(--text-secondary)] hover:bg-[var(--surface-soft)]">
                      <User size={13} /> My Profile
                    </Link>
                    <Link to={localizedPath('/account/orders')} onClick={() => setMobileOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold no-underline text-[var(--text-secondary)] hover:bg-[var(--surface-soft)]">
                      <Package size={13} /> My Orders
                    </Link>
                    <button onClick={() => { logout(); setMobileOpen(false) }} className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-[var(--danger)] hover:bg-[var(--danger)]/5">
                      <LogOut size={13} /> Sign Out
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setShowAuthModal(true); setMobileOpen(false) }}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 px-4 py-3 text-xs font-extrabold text-[var(--accent-primary)] transition-colors hover:bg-[var(--accent-primary)]/20"
                  >
                    <UserCircle2 size={15} /> Sign In / Create Account
                  </button>
                )}
              </div>
              <Link
                to={localizedPath('/rfq')}
                className="inline-flex items-center justify-center rounded-lg bg-[var(--accent-primary)] px-5 py-3 text-xs font-extrabold text-white no-underline hover:bg-[var(--accent-primary-hover)] transition-colors"
              >
                {t('nav.requestQuote')}
              </Link>
            </div>
          </div>
      </nav>
    </header>
  )
}
