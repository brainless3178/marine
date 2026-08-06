import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Clock, Globe, Lock, LogIn, LogOut, Mail, Menu, MessageCircle, Package,
  Phone, ShoppingCart, Truck, User, UserCircle2, X,
} from 'lucide-react'
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

const TRUST_ITEMS = [
  { icon: Truck, labelKey: 'freeShipping' },
  { icon: Clock, labelKey: 'timelyDelivery' },
  { icon: Lock, labelKey: 'securePayment' },
]

/** Shared style for the compact icon buttons in the action cluster. */
const ICON_BTN =
  'flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--nav-btn-border)] bg-[var(--nav-btn-bg)] text-[var(--nav-text-muted)] transition-colors hover:border-[var(--nav-btn-hover-border)] hover:text-[var(--nav-text)] focus-visible:outline-2 focus-visible:outline-[var(--accent-primary)]'

function BrandLockup() {
  const locale = useLocale()
  return (
    <Link
      to={`/${locale}`}
      className="flex items-center gap-3 no-underline transition-opacity hover:opacity-90"
    >
      <img
        src="/images/alka-traders-logo.jpeg"
        alt="Alka Traders Logo"
        width={40}
        height={40}
        className="h-10 w-10 shrink-0 rounded-lg object-cover ring-1 ring-[var(--nav-btn-border)]"
      />
      <span className="flex flex-col leading-none">
        <span className="font-manrope text-lg font-bold tracking-tight text-[var(--nav-text)] sm:text-xl">
          Alka Traders
        </span>
        <span className="mt-1 hidden text-[9px] font-semibold uppercase tracking-[2px] text-[var(--nav-text-muted)] sm:block">
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
  const [profileOpen, setProfileOpen] = useState(false)
  const setShowCartDrawer = useStore((s) => s.setShowCartDrawer)
  const getCartCount = useStore((s) => s.getCartCount)
  const language = useStore((s) => s.language)
  const isLoggedIn = useStore((s) => s.isLoggedIn)
  const user = useStore((s) => s.user)
  const logout = useStore((s) => s.logout)
  const setShowAuthModal = useStore((s) => s.setShowAuthModal)
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
    setProfileOpen(false)
  }, [pathname])

  // Lock body scroll when the mobile menu is open
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

  // NOTE: this returns a fragment (not a wrapping div) on purpose. The
  // <nav> must be a DIRECT child of the page layout's full-height container
  // so position:sticky is constrained to the whole page, not to a short
  // header wrapper — otherwise the nav scrolls out of view after ~100px.
  return (
    <>
      {/* ── TOP UTILITY BAR: email/phone · trust indicators ── */}
      <div className="border-b border-[var(--header-utility-border)] bg-[var(--header-utility-bg)] pt-[env(safe-area-inset-top)] text-[var(--header-utility-text)]">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
          {/* Desktop / tablet: single 40px row */}
          <div className="hidden h-10 items-center justify-between text-[13px] font-medium sm:flex">
            <div className="flex items-center gap-6">
              <a
                href={`mailto:${settings.rfqEmail}`}
                className="utility-link flex items-center gap-1.5 font-medium text-[var(--header-utility-text)] no-underline transition-colors hover:text-[var(--accent-primary)]"
              >
                <Mail size={13} className="shrink-0 text-[var(--accent-primary)]" />
                {settings.rfqEmail}
              </a>
              <a
                href={`tel:${settings.phoneNumber}`}
                className="utility-link flex items-center gap-1.5 font-medium text-[var(--header-utility-text)] no-underline transition-colors hover:text-[var(--accent-primary)]"
              >
                <Phone size={13} className="shrink-0 text-[var(--accent-primary)]" />
                {settings.phoneNumber}
              </a>
            </div>
            <div className="flex items-center gap-5">
              {TRUST_ITEMS.map((item, i) => (
                <div key={item.labelKey} className="flex items-center gap-5">
                  {i > 0 && <span className="h-3.5 w-px bg-[var(--header-utility-border)]" aria-hidden="true" />}
                  <span className="flex items-center gap-1.5 whitespace-nowrap">
                    <item.icon size={13} className="shrink-0 text-[var(--accent-primary)]" />
                    {t(`topbar.${item.labelKey}`)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile: two centered rows */}
          <div className="flex flex-col items-center gap-1 py-2 text-xs font-medium sm:hidden">
            <div className="flex items-center gap-4">
              <a
                href={`mailto:${settings.rfqEmail}`}
                className="utility-link flex items-center gap-1.5 font-medium text-[var(--header-utility-text)] no-underline transition-colors hover:text-[var(--accent-primary)]"
              >
                <Mail size={12} className="shrink-0 text-[var(--accent-primary)]" />
                {settings.rfqEmail}
              </a>
              <a
                href={`tel:${settings.phoneNumber}`}
                className="utility-link flex items-center gap-1.5 font-medium text-[var(--header-utility-text)] no-underline transition-colors hover:text-[var(--accent-primary)]"
              >
                <Phone size={12} className="shrink-0 text-[var(--accent-primary)]" />
                {settings.phoneNumber}
              </a>
            </div>
            <div className="flex items-center gap-2.5 text-[11px]">
              {TRUST_ITEMS.map((item, i) => (
                <span key={item.labelKey} className="flex items-center gap-2.5">
                  {i > 0 && <span className="opacity-40" aria-hidden="true">•</span>}
                  <span className="flex items-center gap-1 whitespace-nowrap">
                    <item.icon size={12} className="shrink-0 text-[var(--accent-primary)]" />
                    {t(`topbar.${item.labelKey}`)}
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN NAVIGATION ── */}
      <nav
        className={`site-header sticky top-0 z-50 border-b border-[var(--header-border)] bg-[var(--header-bg)] backdrop-blur-[12px] transition-shadow duration-300 ${
          scrolled ? 'shadow-[var(--shadow-card)]' : ''
        }`}
      >
        <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-5 px-4 py-3 sm:px-6">
          <BrandLockup />

          {/* Centered desktop links */}
          <div className="hidden items-center gap-7 lg:flex">
            {STATIC_NAV_LINKS.map((link) => {
              const localizedTo = localizedPath(link.path)
              const isActive =
                pathname === localizedTo ||
                (localizedTo !== `/${locale}` && pathname.startsWith(localizedTo))
              return (
                <Link
                  key={link.path}
                  to={localizedTo}
                  className={`relative text-sm font-semibold no-underline transition-colors ${
                    isActive ? 'text-[var(--accent-primary)]' : 'text-[var(--nav-text-muted)] hover:text-[var(--nav-text)]'
                  }`}
                >
                  {t(`nav.${link.labelKey}`)}
                  {isActive && (
                    <span className="absolute -bottom-1.5 left-0 right-0 h-0.5 rounded-full bg-[var(--accent-primary)]" aria-hidden="true" />
                  )}
                </Link>
              )
            })}
          </div>

          {/* Right action cluster */}
          <div className="flex items-center gap-2">
            {/* Language switcher */}
            <div className="relative" data-lang-switcher>
              <button
                onClick={() => setLangOpen((v) => !v)}
                className={ICON_BTN}
                aria-label="Switch language"
              >
                <Globe size={16} />
              </button>
              {langOpen && (
                <div className="absolute right-0 top-full mt-2 w-28 overflow-hidden rounded-xl border border-[var(--nav-dropdown-border)] bg-[var(--nav-dropdown-bg)] shadow-2xl z-50">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        navigate(switchLocalePath(pathname, lang.code))
                        setLangOpen(false)
                      }}
                      className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs font-bold transition-colors hover:bg-[var(--surface-soft)] ${
                        language === lang.code ? 'text-[var(--accent-primary)]' : 'text-[var(--nav-text-muted)]'
                      }`}
                    >
                      {language === lang.code && (
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-primary)]" />
                      )}
                      {lang.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <ThemeToggle />

            {/* Cart */}
            <button
              onClick={() => setShowCartDrawer(true)}
              className={`${ICON_BTN} relative`}
              aria-label="Cart"
            >
              <ShoppingCart size={18} />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--accent-primary)] px-1 text-xs font-bold leading-none text-[var(--btn-blue-text)]">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </button>

            {/* WhatsApp */}
            <a
              href={`https://wa.me/${settings.whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`${ICON_BTN} hidden sm:flex`}
              aria-label={`WhatsApp ${settings.phoneNumber}`}
            >
              <MessageCircle size={18} />
            </a>

            {/* Request Quote (primary CTA) */}
            <Link
              to={localizedPath('/rfq')}
              className="hidden items-center rounded-lg bg-[var(--accent-primary)] px-5 py-2.5 text-sm font-semibold text-[var(--btn-blue-text)] no-underline transition-colors hover:bg-[var(--accent-primary-hover)] focus-visible:outline-2 focus-visible:outline-[var(--accent-primary)] lg:inline-flex"
            >
              {t('nav.requestQuote')}
            </Link>

            {/* Profile / Auth */}
            <div className="relative" data-profile-menu>
              <button
                onClick={() => setProfileOpen((v) => !v)}
                className={`${ICON_BTN} ${
                  isLoggedIn
                    ? 'border-[var(--accent-primary)]/40 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] hover:text-[var(--accent-primary-hover)]'
                    : ''
                }`}
                aria-label="Profile"
              >
                <UserCircle2 size={20} />
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 overflow-hidden rounded-xl border border-[var(--nav-dropdown-border)] bg-[var(--nav-dropdown-bg)] shadow-2xl z-50">
                  {isLoggedIn ? (
                    <>
                      <div className="border-b border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3">
                        <p className="truncate text-xs font-bold text-[var(--text-primary)]">{user?.name || 'My Account'}</p>
                        <p className="mt-0.5 truncate text-[11px] text-[var(--text-muted)]">{user?.email || ''}</p>
                      </div>
                      <Link
                        to={localizedPath('/account/profile')}
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-[var(--nav-text-muted)] no-underline transition-colors hover:bg-[var(--surface-soft)] hover:text-[var(--nav-text)]"
                      >
                        <User size={14} className="text-[var(--text-muted)]" /> My Profile
                      </Link>
                      <Link
                        to={localizedPath('/account/orders')}
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-[var(--nav-text-muted)] no-underline transition-colors hover:bg-[var(--surface-soft)] hover:text-[var(--nav-text)]"
                      >
                        <Package size={14} className="text-[var(--text-muted)]" /> My Orders
                      </Link>
                      <div className="border-t border-[var(--border)]">
                        <button
                          onClick={() => { logout(); setProfileOpen(false) }}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-xs font-semibold text-[var(--danger)] transition-colors hover:bg-[var(--surface-soft)]"
                        >
                          <LogOut size={14} /> Sign Out
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="border-b border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3">
                        <p className="text-xs font-bold text-[var(--text-primary)]">Welcome</p>
                        <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">Sign in to access your account</p>
                      </div>
                      <button
                        onClick={() => { setShowAuthModal(true); setProfileOpen(false) }}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-xs font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-soft)]"
                      >
                        <LogIn size={14} className="text-[var(--accent-primary)]" /> Sign In
                      </button>
                      <button
                        onClick={() => { setShowAuthModal(true); setProfileOpen(false) }}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-xs font-semibold text-[var(--accent-primary)] transition-colors hover:bg-[var(--surface-soft)]"
                      >
                        <UserCircle2 size={14} /> Create Account
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen((value) => !value)}
              className={`${ICON_BTN} lg:hidden`}
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          className={`absolute left-0 right-0 top-full z-50 border-b border-[var(--header-border)] bg-[var(--header-bg)] px-5 py-4 shadow-2xl backdrop-blur-xl transition-all duration-300 ease-in-out lg:hidden ${
            mobileOpen ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-2 opacity-0'
          }`}
          style={{ maxHeight: mobileOpen ? '80vh' : '0', overflow: 'hidden' }}
        >
          <div className="mx-auto flex max-w-[1280px] flex-col gap-3">
            {STATIC_NAV_LINKS.map((link) => {
              const localizedTo = localizedPath(link.path)
              const isActive = pathname === localizedTo
              return (
                <Link
                  key={link.path}
                  to={localizedTo}
                  className={`rounded-lg px-3 py-2 text-sm font-bold no-underline transition-colors ${
                    isActive ? 'bg-[var(--surface-soft)] text-[var(--accent-primary)]' : 'text-[var(--nav-text-muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--nav-text)]'
                  }`}
                >
                  {t(`nav.${link.labelKey}`)}
                </Link>
              )
            })}
            <div className="mt-1 border-t border-[var(--border)] pt-3">
              <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                {t('nav.language')}
              </span>
              <div className="flex gap-2">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => navigate(switchLocalePath(pathname, lang.code))}
                    className={`rounded-lg border px-3 py-2 text-xs font-bold transition-colors ${
                      language === lang.code
                        ? 'border-[var(--accent-primary)]/50 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                        : 'border-[var(--border)] text-[var(--nav-text-muted)] hover:border-[var(--accent-primary)]'
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
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-xs font-bold text-[var(--text-primary)] no-underline transition-colors hover:border-[var(--accent-primary)]"
              >
                <MessageCircle size={14} /> WhatsApp
              </a>
              <a
                href={`tel:${settings.phoneNumber}`}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-xs font-bold text-[var(--text-primary)] no-underline transition-colors hover:border-[var(--accent-primary)]"
              >
                <Phone size={14} /> Call
              </a>
            </div>
            <div className="mt-1 border-t border-[var(--border)] pt-3">
              {isLoggedIn ? (
                <div className="flex flex-col gap-1">
                  <div className="rounded-lg bg-[var(--surface-soft)] px-3 py-2">
                    <p className="truncate text-xs font-bold text-[var(--text-primary)]">{user?.name || 'My Account'}</p>
                    <p className="truncate text-[11px] text-[var(--text-muted)]">{user?.email || ''}</p>
                  </div>
                  <Link
                    to={localizedPath('/account/profile')}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-[var(--nav-text-muted)] no-underline transition-colors hover:bg-[var(--surface-soft)] hover:text-[var(--nav-text)]"
                  >
                    <User size={13} /> My Profile
                  </Link>
                  <Link
                    to={localizedPath('/account/orders')}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-[var(--nav-text-muted)] no-underline transition-colors hover:bg-[var(--surface-soft)] hover:text-[var(--nav-text)]"
                  >
                    <Package size={13} /> My Orders
                  </Link>
                  <button
                    onClick={() => { logout(); setMobileOpen(false) }}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-[var(--danger)] transition-colors hover:bg-[var(--surface-soft)]"
                  >
                    <LogOut size={13} /> Sign Out
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setShowAuthModal(true); setMobileOpen(false) }}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--accent-primary)]/40 bg-[var(--accent-primary)]/10 px-4 py-3 text-xs font-bold text-[var(--accent-primary)] transition-colors hover:bg-[var(--accent-primary)]/20"
                >
                  <UserCircle2 size={15} /> Sign In / Create Account
                </button>
              )}
            </div>
            <Link
              to={localizedPath('/rfq')}
              onClick={() => setMobileOpen(false)}
              className="inline-flex items-center justify-center rounded-lg bg-[var(--accent-primary)] px-5 py-3 text-xs font-bold text-[var(--btn-blue-text)] no-underline transition-colors hover:bg-[var(--accent-primary-hover)]"
            >
              {t('nav.requestQuote')}
            </Link>
          </div>
        </div>
      </nav>
    </>
  )
}
