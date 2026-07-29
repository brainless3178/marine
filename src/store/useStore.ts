import { create } from 'zustand'
import i18n from 'i18next'
import type { Language, CartItem, Product, User, PriceRange } from '../types'
import { adminAuth, customerAuth, setAdminToken, setCustomerToken } from '../lib/api'


interface AdminUser {
  name: string
  email: string
  role: 'owner' | 'store-manager' | 'inventory-manager' | 'sales-agent' | 'content-manager' | 'viewer'
  avatar?: string
}

interface AppState {
  // Theme
  theme: 'dark' | 'light'
  toggleTheme: () => void

  // Admin Auth
  adminUser: AdminUser | null
  isAdminLoggedIn: boolean
  adminLoginError: string | null
  adminLogin: (email: string, password: string) => Promise<boolean>
  adminLogout: () => Promise<void>
  loadAdminSession: () => Promise<void>

  // Language
  language: Language
  setLanguage: (lang: Language) => void

  // Search
  searchQuery: string
  setSearchQuery: (query: string) => void
  recentSearches: string[]
  addRecentSearch: (query: string) => void
  clearRecentSearches: () => void

  // Filters
  selectedCategories: string[]
  selectedBrands: string[]
  selectedIndustry: string
  priceRange: PriceRange
  showOnSale: boolean
  urgencyFilter: 'all' | 'emergency'
  sortBy: 'relevance' | 'name-asc' | 'name-desc' | 'category' | 'price-asc' | 'price-desc'
  setSelectedCategories: (cats: string[]) => void
  setSelectedBrands: (brands: string[]) => void
  setSelectedIndustry: (industry: string) => void
  setPriceRange: (range: PriceRange) => void
  setShowOnSale: (sale: boolean) => void
  setUrgencyFilter: (filter: 'all' | 'emergency') => void
  setSortBy: (sort: 'relevance' | 'name-asc' | 'name-desc' | 'category' | 'price-asc' | 'price-desc') => void
  clearFilters: () => void

  // RFQ Form
  rfqStep: number
  setRfqStep: (step: number) => void
  rfqSubmitted: boolean
  setRfqSubmitted: (submitted: boolean) => void
  rfqId: string
  generateRfqId: () => void

  // Cmd+K
  commandOpen: boolean
  setCommandOpen: (open: boolean) => void

  // Auth
  isLoggedIn: boolean
  user: User | null
  isSessionLoading: boolean
  showAuthModal: boolean
  authError: string | null
  login: (email: string, password: string) => Promise<boolean>
  register: (name: string, email: string, password: string, phone?: string, company?: string, country?: string) => Promise<boolean>
  logout: () => Promise<void>
  loadCustomerSession: () => Promise<void>
  setShowAuthModal: (show: boolean) => void
  clearAuthErrors: () => void

  // Admin Sidebar
  adminSidebarCollapsed: boolean
  toggleAdminSidebar: () => void

  // Cart
  cart: CartItem[]
  showCartDrawer: boolean
  setShowCartDrawer: (show: boolean) => void
  addToCart: (product: Product) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, qty: number) => void
  clearCart: () => void
  getCartTotal: () => number
  getCartCount: () => number
  cartTotal: number
  cartCount: number

  // Checkout
  checkoutStep: number
  setCheckoutStep: (step: number) => void
  orderPlaced: boolean
  setOrderPlaced: (placed: boolean) => void
  orderId: string
  generateOrderId: () => void
  cancelRequested: boolean
  setCancelRequested: (req: boolean) => void
  cancelReason: string
  setCancelReason: (reason: string) => void
}

function loadState<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`alka-${key}`)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    // Corrupted JSON in localStorage — fall back to default
    console.warn('[store] Corrupted localStorage data for key:', `alka-${key}`)
    return fallback
  }
}

function saveState(key: string, value: unknown) {
  try {
    localStorage.setItem(`alka-${key}`, JSON.stringify(value))
  } catch { /* quota exceeded, expected behavior for full localStorage */ }
}

function computeCartTotals(cart: CartItem[]) {
  let total = 0
  let count = 0
  for (const item of cart) {
    const price = item.product.onSale && item.product.salePrice
      ? item.product.salePrice
      : item.product.price
    total += price * item.quantity
    count += item.quantity
  }
  return { cartTotal: total, cartCount: count }
}

export const useStore = create<AppState>((set, get) => ({
  toggleTheme: () =>
    set((state) => {
      const newTheme = state.theme === 'dark' ? 'light' : 'dark'
      if (newTheme === 'light') {
        document.documentElement.classList.add('light')
        document.documentElement.classList.remove('dark')
      } else {
        document.documentElement.classList.remove('light')
        document.documentElement.classList.add('dark')
      }
      return { theme: newTheme }
    }),

  // Admin Auth
  adminUser: null,
  isAdminLoggedIn: false,
  adminLoginError: null,
  adminLogin: async (email: string, password: string) => {
    set({ adminLoginError: null })
    try {
      const { accessToken, user } = await adminAuth.login({ email, password })
      setAdminToken(accessToken)
      set({ adminUser: user as AdminUser, isAdminLoggedIn: true, adminLoginError: null })
      saveState('admin-auth', true)
      return true
    } catch (err: any) {
      set({ adminLoginError: err.message || 'Login failed' })
      return false
    }
  },
  adminLogout: async () => {
    try { await adminAuth.logout() } catch { console.warn('[store] Admin logout API call failed') }
    setAdminToken(null)
    set({ adminUser: null, isAdminLoggedIn: false })
    localStorage.removeItem('alka-admin-auth')
  },
  loadAdminSession: async () => {
    // Don't store admin PII in localStorage — always validate against the API
    if (!localStorage.getItem('alka-admin-auth')) return
    try {
      const { user } = await adminAuth.me()
      const validRoles = ['owner', 'store-manager', 'inventory-manager', 'sales-agent', 'content-manager', 'viewer']
      if (validRoles.includes(user.role)) {
        set({ adminUser: user as AdminUser, isAdminLoggedIn: true })
      } else {
        localStorage.removeItem('alka-admin-auth')
      }
    } catch {
      console.warn('[store] Admin session token expired or invalid — clearing session')
      localStorage.removeItem('alka-admin-auth')
      set({ adminUser: null, isAdminLoggedIn: false })
    }
  },

  // Admin Sidebar
  adminSidebarCollapsed: typeof window !== 'undefined' && window.innerWidth < 1024,
  toggleAdminSidebar: () => set((s) => ({ adminSidebarCollapsed: !s.adminSidebarCollapsed })),

  // Language
  language: 'en',
  setLanguage: (language) => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = language
    i18n.changeLanguage(language)
    set({ language })
  },

  // Search
  searchQuery: '',
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  recentSearches: [],
  addRecentSearch: (query) =>
    set((state) => ({
      recentSearches: [query, ...state.recentSearches.filter((s) => s !== query)].slice(0, 5),
    })),
  clearRecentSearches: () => set({ recentSearches: [] }),

  // Filters
  selectedCategories: [],
  selectedBrands: [],
  selectedIndustry: '',
  priceRange: { min: 0, max: 10000 },
  showOnSale: false,
  urgencyFilter: 'all',
  sortBy: 'relevance',
  setSelectedCategories: (selectedCategories) => set({ selectedCategories }),
  setSelectedBrands: (selectedBrands) => set({ selectedBrands }),
  setSelectedIndustry: (selectedIndustry) => set({ selectedIndustry }),
  setPriceRange: (priceRange) => set({ priceRange }),
  setShowOnSale: (showOnSale) => set({ showOnSale }),
  setUrgencyFilter: (urgencyFilter) => set({ urgencyFilter }),
  setSortBy: (sortBy) => set({ sortBy }),
  clearFilters: () =>
    set({
      selectedCategories: [],
      selectedBrands: [],
      selectedIndustry: '',
      priceRange: { min: 0, max: 10000 },
      showOnSale: false,
      urgencyFilter: 'all',
      sortBy: 'relevance',
      searchQuery: '',
    }),

  // RFQ
  rfqStep: 1,
  setRfqStep: (rfqStep) => set({ rfqStep }),
  rfqSubmitted: false,
  setRfqSubmitted: (rfqSubmitted) => set({ rfqSubmitted }),
  rfqId: '',
  generateRfqId: () =>
    set({ rfqId: `AT-${Math.floor(10000 + Math.random() * 90000)}` }),

  // Cmd+K
  commandOpen: false,
  setCommandOpen: (commandOpen) => set({ commandOpen }),

  // Auth
  // Don't persist user PII in localStorage — always validate against the API on session load
  isLoggedIn: typeof window !== 'undefined' && !!localStorage.getItem('alka-auth'),
  user: null,
  isSessionLoading: typeof window !== 'undefined' && !!localStorage.getItem('alka-auth'),

  // Sync theme with what the JS in main.tsx already initialized
  theme: (typeof window !== 'undefined' && document.documentElement.classList.contains('dark')) ? 'dark' : 'light',
  showAuthModal: false,
  authError: null,
  login: async (email: string, password: string) => {
    set({ authError: null })
    try {
      const { accessToken, user } = await customerAuth.login({ email, password })
      setCustomerToken(accessToken)
      set({ isLoggedIn: true, user, showAuthModal: false, authError: null })
      saveState('auth', true)
      return true
    } catch (err: any) {
      set({ authError: err.message || 'Login failed' })
      return false
    }
  },
  register: async (name, email, password, phone, company, country) => {
    set({ authError: null })
    try {
      const { accessToken, user } = await customerAuth.register({ name, email, password, phone, company, country })
      setCustomerToken(accessToken)
      set({ isLoggedIn: true, user, showAuthModal: false, authError: null })
      saveState('auth', true)
      return true
    } catch (err: any) {
      set({ authError: err.message || 'Registration failed' })
      return false
    }
  },
  logout: async () => {
    try { await customerAuth.logout() } catch { console.warn('[store] Customer logout API call failed') }
    setCustomerToken(null)
    set({ isLoggedIn: false, user: null, cart: [], showCartDrawer: false, cartTotal: 0, cartCount: 0 })
    saveState('auth', false)
    saveState('cart', [])
  },
  loadCustomerSession: async () => {
    set({ isSessionLoading: true })

    if (!localStorage.getItem('alka-auth')) {
      set({ isLoggedIn: false, user: null, isSessionLoading: false })
      return
    }
    try {
      const { user } = await customerAuth.me()
      set({ isLoggedIn: true, user, isSessionLoading: false })
    } catch {
      console.warn('[store] Customer session token expired or invalid — clearing session')
      set({ isLoggedIn: false, user: null, isSessionLoading: false })
      localStorage.removeItem('alka-auth')
    }
  },
  setShowAuthModal: (showAuthModal) => set({ showAuthModal }),
  clearAuthErrors: () => set({ authError: null, adminLoginError: null }),

  // Cart
  cart: loadState<CartItem[]>('cart', []),
  ...computeCartTotals(loadState<CartItem[]>('cart', [])),
  showCartDrawer: false,
  setShowCartDrawer: (showCartDrawer) => set({ showCartDrawer }),
  addToCart: (product) =>
    set((state) => {
      const existing = state.cart.find((item) => item.product.id === product.id)
      const newCart = existing
        ? state.cart.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        : [...state.cart, { product, quantity: 1 }]
      saveState('cart', newCart)
      return { cart: newCart, showCartDrawer: true, ...computeCartTotals(newCart) }
    }),
  removeFromCart: (productId) =>
    set((state) => {
      const newCart = state.cart.filter((item) => item.product.id !== productId)
      saveState('cart', newCart)
      return { cart: newCart, ...computeCartTotals(newCart) }
    }),
  updateQuantity: (productId, qty) =>
    set((state) => {
      const newCart = qty <= 0
        ? state.cart.filter((item) => item.product.id !== productId)
        : state.cart.map((item) =>
            item.product.id === productId ? { ...item, quantity: qty } : item
          )
      saveState('cart', newCart)
      return { cart: newCart, ...computeCartTotals(newCart) }
    }),
  clearCart: () => {
    set({ cart: [], cartTotal: 0, cartCount: 0 })
    saveState('cart', [])
  },
  cartTotal: 0,
  cartCount: 0,
  getCartTotal: () => get().cartTotal,
  getCartCount: () => get().cartCount,

  // Checkout
  checkoutStep: 1,
  setCheckoutStep: (checkoutStep) => set({ checkoutStep }),
  orderPlaced: false,
  setOrderPlaced: (orderPlaced) => set({ orderPlaced }),
  orderId: '',
  generateOrderId: () =>
    set({ orderId: `AT-ORD-${Math.floor(10000 + Math.random() * 90000)}` }),
  cancelRequested: false,
  setCancelRequested: (cancelRequested) => set({ cancelRequested }),
  cancelReason: '',
  setCancelReason: (cancelReason) => set({ cancelReason }),
}))
