import { useState, useRef, useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Search, Bell, ChevronDown, Sun, Moon, Menu, X, Package, ShoppingCart, FileText, Users, Settings, Home, Award, Factory, FolderTree, ImageIcon, HandCoins, ClipboardList, Shield } from 'lucide-react'
import { useStore } from '../../store/useStore'

const breadcrumbMap: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/products': 'Products',
  '/admin/media': 'Media Library',
  '/admin/categories': 'Categories',
  '/admin/brands': 'Brands',
  '/admin/industries': 'Industries',
  '/admin/orders': 'Orders',
  '/admin/rfqs': 'RFQs',
  '/admin/offers': 'Offers',
  '/admin/customers': 'Customers',
  '/admin/messages': 'Messages',
  '/admin/homepage': 'Homepage Content',
  '/admin/settings': 'Store Settings',
  '/admin/users': 'Users & Roles',
  '/admin/audit-log': 'Audit Log',
}

const commandItems = [
  { label: 'Products', path: '/admin/products', icon: Package, keywords: 'catalog inventory items' },
  { label: 'Orders', path: '/admin/orders', icon: ShoppingCart, keywords: 'purchases transactions' },
  { label: 'RFQs', path: '/admin/rfqs', icon: FileText, keywords: 'requests quotes' },
  { label: 'Offers', path: '/admin/offers', icon: HandCoins, keywords: 'quotes proposals' },
  { label: 'Customers', path: '/admin/customers', icon: Users, keywords: 'clients contacts' },
  { label: 'Messages', path: '/admin/messages', icon: Shield, keywords: 'inbox mail' },
  { label: 'Media Library', path: '/admin/media', icon: ImageIcon, keywords: 'images photos upload' },
  { label: 'Categories', path: '/admin/categories', icon: FolderTree, keywords: 'taxonomy grouping' },
  { label: 'Brands', path: '/admin/brands', icon: Award, keywords: 'manufacturers suppliers' },
  { label: 'Industries', path: '/admin/industries', icon: Factory, keywords: 'sectors markets' },
  { label: 'Homepage', path: '/admin/homepage', icon: Home, keywords: 'hero banner content' },
  { label: 'Settings', path: '/admin/settings', icon: Settings, keywords: 'config shipping payments' },
  { label: 'Users & Roles', path: '/admin/users', icon: Shield, keywords: 'team permissions' },
  { label: 'Audit Log', path: '/admin/audit-log', icon: ClipboardList, keywords: 'history activity' },
  { label: 'Dashboard', path: '/admin', icon: Home, keywords: 'overview stats' },
]

export function AdminHeader() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { theme, toggleTheme, adminUser, adminLogout } = useStore()
  const toggleSidebar = useStore((s) => s.toggleAdminSidebar)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [cmdOpen, setCmdOpen] = useState(false)
  const [cmdQuery, setCmdQuery] = useState('')
  const [cmdIndex, setCmdIndex] = useState(0)
  const menuRef = useRef<HTMLDivElement>(null)
  const cmdInputRef = useRef<HTMLInputElement>(null)

  const filteredCommands = commandItems.filter((item) => {
    if (!cmdQuery.trim()) return true
    const q = cmdQuery.toLowerCase()
    return item.label.toLowerCase().includes(q) || item.keywords.toLowerCase().includes(q) || item.path.toLowerCase().includes(q)
  })

  // ⌘K keyboard shortcut
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      setCmdOpen((prev) => !prev)
    }
    if (e.key === 'Escape') setCmdOpen(false)
  }, [])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  useEffect(() => {
    if (cmdOpen) {
      setCmdQuery('')
      setCmdIndex(0)
      setTimeout(() => cmdInputRef.current?.focus(), 50)
    }
  }, [cmdOpen])

  const cmdSelect = (path: string) => {
    setCmdOpen(false)
    navigate(path)
  }

  const pageName = breadcrumbMap[pathname] || (pathname.startsWith('/admin/products/') ? 'Edit Product' : pathname === '/admin/products/new' ? 'New Product' : 'Admin')

  // Close user menu on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const initials = adminUser?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'AD'

  return (
    <>
    <header className="admin-header sticky top-0 z-30 flex items-center justify-between gap-4 px-4 sm:px-6 h-16">
      {/* Left: Mobile menu + Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-secondary)] lg:hidden"
          aria-label="Toggle sidebar"
        >
          <Menu size={18} />
        </button>

        <div className="flex items-center gap-2 text-sm">
          <span className="text-[var(--text-muted)] font-medium">Admin</span>
          <span className="text-[var(--text-muted)]">/</span>
          <span className="font-bold text-[var(--text-primary)]">{pageName}</span>
        </div>
      </div>

      {/* Right: Search, Notifications, Theme, User */}
      <div className="flex items-center gap-2">
        {/* Search / ⌘K */}
        <button
          onClick={() => setCmdOpen(true)}
          className="hidden sm:flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 transition-all duration-200 hover:border-[var(--accent-gold)]"
        >
          <Search size={14} className="text-[var(--text-muted)] shrink-0" />
          <span className="text-sm text-[var(--text-muted)] font-medium">Search admin...</span>
          <kbd className="hidden lg:inline text-[0.625rem] font-bold text-[var(--text-muted)] bg-[var(--primary-bg)] border border-[var(--border)] rounded px-1.5 py-0.5">
            ⌘K
          </kbd>
        </button>

        {/* Notifications */}
        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-secondary)] transition-colors hover:text-[var(--accent-blue)]"
          aria-label="Notifications"
        >
          <Bell size={16} />
          <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[var(--danger)] px-1 text-[0.625rem] font-bold text-[var(--btn-danger-text)]">
            0
          </span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-secondary)] transition-colors hover:text-[var(--accent-blue)]"
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* User Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setUserMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-2.5 py-1.5 transition-colors hover:border-[var(--accent-gold)]"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--accent-blue)] text-[0.625rem] font-bold text-[var(--btn-blue-text)]">
              {initials}
            </div>
            <span className="hidden sm:block text-xs font-bold text-[var(--text-primary)] max-w-[100px] truncate">
              {adminUser?.name || 'Admin'}
            </span>
            <ChevronDown size={12} className="text-[var(--text-muted)]" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xl overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-[var(--border)]">
                <p className="text-sm font-bold text-[var(--text-primary)]">
                  {adminUser?.name || 'Admin'}
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {adminUser?.email || 'sales@alkatraders.co'}
                </p>
                <span className="admin-badge admin-badge-info mt-2 text-[0.625rem]">
                  {adminUser?.role?.replace(/-/g, ' ') || 'Owner'}
                </span>
              </div>
              <div className="py-1">
                <button onClick={() => { navigate('/admin/settings'); setUserMenuOpen(false) }} className="w-full px-4 py-2 text-left text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-soft)] transition-colors">
                  Profile Settings
                </button>
                <button onClick={() => { navigate('/admin/settings'); setUserMenuOpen(false) }} className="w-full px-4 py-2 text-left text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-soft)] transition-colors">
                  Preferences
                </button>
                <div className="border-t border-[var(--border)] my-1" />
                <button
                  onClick={() => {
                    adminLogout()
                    setUserMenuOpen(false)
                  }}
                  className="w-full px-4 py-2 text-left text-xs font-semibold text-[var(--danger)] hover:bg-danger/5 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>

    {/* ⌘K Command Palette */}
    {cmdOpen && (
      <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] bg-black/50 backdrop-blur-sm" onClick={() => setCmdOpen(false)}>
        <div className="w-full max-w-lg mx-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3">
            <Search size={16} className="text-[var(--text-muted)] shrink-0" />
            <input
              ref={cmdInputRef}
              type="text"
              placeholder="Type a command or search..."
              value={cmdQuery}
              onChange={(e) => { setCmdQuery(e.target.value); setCmdIndex(0) }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') { e.preventDefault(); setCmdIndex((i) => Math.min(i + 1, filteredCommands.length - 1)) }
                if (e.key === 'ArrowUp') { e.preventDefault(); setCmdIndex((i) => Math.max(i - 1, 0)) }
                if (e.key === 'Enter' && filteredCommands[cmdIndex]) { cmdSelect(filteredCommands[cmdIndex].path) }
              }}
              className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] font-medium"
            />
            <button onClick={() => setCmdOpen(false)} className="flex h-6 w-6 items-center justify-center rounded text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X size={14} /></button>
          </div>
          <div className="max-h-80 overflow-y-auto py-2">
            {filteredCommands.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs text-[var(--text-muted)]">No results found</p>
            ) : (
              filteredCommands.map((item, i) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.path}
                    onClick={() => cmdSelect(item.path)}
                    onMouseEnter={() => setCmdIndex(i)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${i === cmdIndex ? 'bg-[var(--accent-gold)]/10 text-[var(--accent-gold)]' : 'text-[var(--text-secondary)] hover:bg-[var(--surface-soft)]'}`}
                  >
                    <Icon size={16} className="shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{item.label}</p>
                      <p className="text-[0.625rem] text-[var(--text-muted)] font-mono truncate">{item.path}</p>
                    </div>
                  </button>
                )
              })
            )}
          </div>
          <div className="border-t border-[var(--border)] px-4 py-2 flex items-center gap-3">
            <span className="text-[0.625rem] text-[var(--text-muted)]">↑↓ Navigate</span>
            <span className="text-[0.625rem] text-[var(--text-muted)]">↵ Select</span>
            <span className="text-[0.625rem] text-[var(--text-muted)]">Esc Close</span>
          </div>
        </div>
      </div>
    )}
    </>
  )
}
