import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  Search, ShoppingCart, User, Truck, ShieldCheck, Clock, CreditCard,
  ArrowRight, Star, Package, Wrench, Cpu, Cable, Warehouse, HardHat, Gauge,
  Mail, Phone, MapPin, Send, Check, ChevronRight
} from 'lucide-react'

// ── Color scheme constants ──────────────────────────────
const NAVY = '#1A2E40'
const RED = '#E63946'
const CHARCOAL = '#212529'
const WHITE = '#FFFFFF'
const LIGHT_GREY = '#F8F9FA'

// ── Sample product data ─────────────────────────────────
const sampleProducts = [
  { id: 'p1', name: 'Hydraulic Cylinder 100mm Bore 400mm Stroke', brand: 'Parker', price: 1249.00, oldPrice: 1499.00, rating: 4.5, reviews: 28, image: 'https://placehold.co/400x300/1A2E40/FFFFFF?text=Parker+Cylinder' },
  { id: 'p2', name: 'Siemens S7-1500 PLC CPU Module 6ES7511-1AK02', brand: 'Siemens', price: 2199.00, oldPrice: null, rating: 5.0, reviews: 42, image: 'https://placehold.co/400x300/1A2E40/FFFFFF?text=Siemens+PLC' },
  { id: 'p3', name: 'ABB ACS880 Variable Frequency Drive 2.2kW', brand: 'ABB', price: 1899.00, oldPrice: 2299.00, rating: 4.0, reviews: 35, image: 'https://placehold.co/400x300/1A2E40/FFFFFF?text=ABB+VFD' },
  { id: 'p4', name: 'Bosch Rexroth 4WE6 Directional Control Valve', brand: 'Bosch Rexroth', price: 449.00, oldPrice: null, rating: 4.8, reviews: 19, image: 'https://placehold.co/400x300/1A2E40/FFFFFF?text=Bosch+Valve' },
  { id: 'p5', name: 'Schneider Electric NSX250F MCCB 250A', brand: 'Schneider Electric', price: 799.00, oldPrice: 899.00, rating: 4.3, reviews: 15, image: 'https://placehold.co/400x300/1A2E40/FFFFFF?text=Schneider+MCCB' },
  { id: 'p6', name: 'Parker Hydraulic Power Unit 15kW', brand: 'Parker', price: 5499.00, oldPrice: null, rating: 4.6, reviews: 23, image: 'https://placehold.co/400x300/1A2E40/FFFFFF?text=Parker+HPU' },
  { id: 'p7', name: 'Honeywell Marine Fire Detection Panel', brand: 'Honeywell', price: 3299.00, oldPrice: 3899.00, rating: 4.7, reviews: 31, image: 'https://placehold.co/400x300/1A2E40/FFFFFF?text=Honeywell+FDP' },
  { id: 'p8', name: 'Danfoss VLT FC-102 Variable Frequency Drive', brand: 'Danfoss', price: 2599.00, oldPrice: null, rating: 4.4, reviews: 27, image: 'https://placehold.co/400x300/1A2E40/FFFFFF?text=Danfoss+VFD' },
]

const categories = [
  { name: 'Hydraulics', icon: Wrench, count: 1248, image: 'https://placehold.co/600x400/E63946/FFFFFF?text=Hydraulics' },
  { name: 'Pneumatics', icon: Package, count: 856, image: 'https://placehold.co/600x400/1A2E40/FFFFFF?text=Pneumatics' },
  { name: 'Electrical & Automation', icon: Cpu, count: 2104, image: 'https://placehold.co/600x400/E63946/FFFFFF?text=Electrical' },
  { name: 'Lifting & Handling', icon: Warehouse, count: 632, image: 'https://placehold.co/600x400/1A2E40/FFFFFF?text=Lifting' },
  { name: 'Tools & Equipment', icon: Wrench, count: 945, image: 'https://placehold.co/600x400/E63946/FFFFFF?text=Tools' },
  { name: 'Instruments', icon: Gauge, count: 723, image: 'https://placehold.co/600x400/1A2E40/FFFFFF?text=Instruments' },
  { name: 'Safety', icon: HardHat, count: 512, image: 'https://placehold.co/600x400/E63946/FFFFFF?text=Safety' },
  { name: 'Cables & Connectors', icon: Cable, count: 1567, image: 'https://placehold.co/600x400/1A2E40/FFFFFF?text=Cables' },
]

const brands = ['ABB', 'Siemens', 'Schneider', 'Parker', 'Bosch', 'Honeywell', 'Danfoss', 'Emerson', 'Alfa Laval', 'Atlas Copco']

export default function TestPage() {
  const [activeTab, setActiveTab] = useState<'featured' | 'best-seller' | 'top-rated'>('featured')
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [cartCount] = useState(3)
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set())

  const handleSearch = (e: FormEvent) => {
    e.preventDefault()
    window.location.href = `/products?search=${encodeURIComponent(searchQuery)}`
  }

  const handleNewsletter = (e: FormEvent) => {
    e.preventDefault()
    if (email) setSubscribed(true)
  }

  const handleAddToCart = (id: string) => {
    setAddedIds(prev => {
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }

  const getFilteredProducts = () => {
    const sorted = [...sampleProducts]
    if (activeTab === 'best-seller') {
      sorted.sort((a, b) => b.reviews - a.reviews)
    } else if (activeTab === 'top-rated') {
      sorted.sort((a, b) => b.rating - a.rating)
    }
    return sorted
  }

  const displayProducts = getFilteredProducts()

  return (
    <div className="min-h-screen" style={{ backgroundColor: WHITE, color: CHARCOAL }}>
      {/* ── SEO ── */}
      <div className="sr-only">
        <h1>Marine Shop Seven — Leading Supplier & Exporter Of Used/Unbranded Marine Equipment</h1>
      </div>

      {/* ═══════════════════════════════════════════════════════
          SECTION 1: TOP BAR
          ═══════════════════════════════════════════════════════ */}
      <div style={{ backgroundColor: NAVY }} className="text-white/85 text-xs">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 flex items-center justify-between h-10">
          <div className="flex items-center gap-5">
            <a href="tel:+919726900547" className="flex items-center gap-1.5 text-white/70 hover:text-white transition-colors no-underline">
              <Phone size={12} /> <span>+91 97269 00547</span>
            </a>
            <a href="mailto:info@alkatraders.com" className="hidden sm:flex items-center gap-1.5 text-white/70 hover:text-white transition-colors no-underline">
              <Mail size={12} /> <span>info@alkatraders.com</span>
            </a>
          </div>
          <div className="flex items-center gap-4">
            <a href="/track-order" className="text-white/70 hover:text-white transition-colors no-underline font-medium">Track Order</a>
            <span className="text-white/20">|</span>
            <a href="/about" className="text-white/70 hover:text-white transition-colors no-underline font-medium">About</a>
            <span className="text-white/20 hidden sm:inline">|</span>
            <a href="/contact" className="hidden sm:inline text-white/70 hover:text-white transition-colors no-underline font-medium">Contact</a>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          SECTION 2: MAIN NAVIGATION
          ═══════════════════════════════════════════════════════ */}
      <div style={{ backgroundColor: WHITE }} className="border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
          {/* Logo + Search + Cart Row */}
          <div className="flex items-center gap-4 py-3">
            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden flex flex-col gap-1 p-2"
              aria-label="Toggle menu"
            >
              <span className={`block w-5 h-0.5 bg-gray-800 transition-all ${mobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
              <span className={`block w-5 h-0.5 bg-gray-800 transition-all ${mobileMenuOpen ? 'opacity-0' : ''}`} />
              <span className={`block w-5 h-0.5 bg-gray-800 transition-all ${mobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
            </button>

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 no-underline flex-shrink-0">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-display font-bold text-lg" style={{ backgroundColor: RED }}>
                MS
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-sm font-bold tracking-tight leading-tight" style={{ color: NAVY }}>Marine Shop</span>
                <span className="text-[10px] font-semibold tracking-wider uppercase" style={{ color: '#6c757d' }}>Seven</span>
              </div>
            </Link>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex-1 max-w-[580px] mx-auto hidden md:flex">
              <div className="flex w-full rounded-lg overflow-hidden border border-gray-300 focus-within:border-red-500 transition-colors" style={{ borderColor: '#dee2e6' }}>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-gray-50 text-xs font-semibold px-3 py-2.5 border-r border-gray-300 outline-none cursor-pointer min-w-[130px]"
                  style={{ backgroundColor: LIGHT_GREY, color: CHARCOAL }}
                >
                  <option value="all">All Categories</option>
                  <option value="hydraulics">Hydraulics</option>
                  <option value="pneumatics">Pneumatics</option>
                  <option value="electrical">Electrical</option>
                  <option value="lifting">Lifting & Handling</option>
                  <option value="tools">Tools & Equipment</option>
                </select>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products, brands, SKUs..."
                  className="flex-1 px-4 py-2.5 text-sm outline-none"
                  style={{ color: CHARCOAL }}
                />
                <button type="submit" className="px-5 py-2.5 text-white font-bold text-sm transition-opacity hover:opacity-90" style={{ backgroundColor: RED }}>
                  <Search size={18} />
                </button>
              </div>
            </form>

            {/* Right Actions */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <Link to="/account/profile" className="hidden sm:flex items-center gap-1.5 text-sm font-semibold no-underline hover:text-red-600 transition-colors" style={{ color: CHARCOAL }}>
                <User size={18} />
                <span className="hidden lg:inline">Account</span>
              </Link>
              <Link to="/checkout" className="relative flex items-center gap-1.5 text-sm font-semibold no-underline hover:text-red-600 transition-colors" style={{ color: CHARCOAL }}>
                <ShoppingCart size={20} />
                <span className="hidden lg:inline">Cart</span>
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center" style={{ backgroundColor: RED }}>
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-1 pb-0">
            {[
              { path: '/', label: 'Home' },
              { path: '/about', label: 'About' },
              { path: '/shop', label: 'Shop' },
              { path: '/brands', label: 'Brands' },
              { path: '/contact', label: 'Contact' },
              { path: '/rfq', label: 'Sell to Us' },
            ].map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="px-4 py-3 text-xs font-bold uppercase tracking-wider no-underline border-b-2 border-transparent hover:border-red-500 transition-all"
                style={{ color: NAVY }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white px-4 py-4 space-y-2">
            <form onSubmit={handleSearch} className="flex mb-3">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                aria-label="Search products"
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-l-lg outline-none"
              />
              <button type="submit" className="px-4 py-2 text-white font-bold text-sm rounded-r-lg" style={{ backgroundColor: RED }}>
                <Search size={16} />
              </button>
            </form>
            {['Home', 'About', 'Shop', 'Brands', 'Contact', 'Sell to Us'].map((label) => (
              <Link
                key={label}
                to={`/${label.toLowerCase().replace(/\s+/g, '-')}`}
                className="block px-3 py-2 text-sm font-semibold rounded-lg hover:bg-gray-100 no-underline"
                style={{ color: CHARCOAL }}
                onClick={() => setMobileMenuOpen(false)}
              >
                {label}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════
          SECTION 3: HERO BANNER
          ═══════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden" style={{ backgroundColor: NAVY }}>
        {/* Background texture overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 25% 50%, rgba(230,57,70,0.3) 0%, transparent 50%), radial-gradient(circle at 75% 30%, rgba(255,255,255,0.05) 0%, transparent 40%)' }} />
        </div>
        <div className="relative max-w-[1280px] mx-auto px-4 sm:px-6 py-16 md:py-24">
          <div className="grid md:grid-cols-[1.2fr_1fr] gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-6" style={{ backgroundColor: 'rgba(230,57,70,0.15)', color: '#ff6b6b' }}>
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: RED }} />
                Trusted Marine Supplier Since 2010
              </div>
              <h1 className="font-display font-bold text-white leading-tight mb-4" style={{ fontSize: 'clamp(32px, 5vw, 52px)', lineHeight: 1.1 }}>
                Leading Supplier & Exporter of{' '}
                <span style={{ color: '#ff6b6b' }}>Marine & Industrial</span>{' '}
                Equipment
              </h1>
              <p className="text-base md:text-lg leading-relaxed mb-8 max-w-[580px]" style={{ color: 'rgba(255,255,255,0.7)' }}>
                Premium quality marine spares, hydraulic systems, electrical automation, and industrial equipment sourced globally and delivered to your doorstep.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/shop"
                  className="inline-flex items-center gap-2 px-8 py-4 text-sm font-bold text-white rounded-lg transition-all hover:opacity-90 shadow-lg no-underline"
                  style={{ backgroundColor: RED }}
                >
                  Shop Catalog <ArrowRight size={16} />
                </Link>
                <Link
                  to="/rfq"
                  className="inline-flex items-center gap-2 px-8 py-4 text-sm font-bold rounded-lg border-2 transition-all hover:bg-white/10 no-underline"
                  style={{ color: WHITE, borderColor: 'rgba(255,255,255,0.3)' }}
                >
                  Request Quote
                </Link>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="relative">
                <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                  <img
                    src="https://placehold.co/800x600/1A2E40/ffffff?text=Marine+Equipment+Showcase"
                    alt="Marine equipment showcase"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-4 -left-4 flex gap-3">
                  <div className="px-4 py-3 rounded-xl backdrop-blur border border-white/10" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                    <span className="block text-2xl font-bold text-white">10K+</span>
                    <span className="text-xs text-white/60">Products</span>
                  </div>
                  <div className="px-4 py-3 rounded-xl backdrop-blur border border-white/10" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                    <span className="block text-2xl font-bold text-white">200+</span>
                    <span className="text-xs text-white/60">Brands</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 4: TRUST BAR
          ═══════════════════════════════════════════════════════ */}
      <section className="py-10" style={{ backgroundColor: LIGHT_GREY }}>
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {[
              { icon: Truck, title: 'Fast Delivery', desc: 'Global shipping via DHL, FedEx & Sea Freight' },
              { icon: ShieldCheck, title: 'Money Back Guarantee', desc: '30-day return policy on all orders' },
              { icon: Clock, title: 'Timely Shipping', desc: 'Same-day dispatch for in-stock items' },
              { icon: CreditCard, title: 'Secure Payment', desc: 'Pay via Wire Transfer, PayPal & Cards' },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div key={item.title} className="flex items-start gap-3 p-4 rounded-xl bg-white border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(230,57,70,0.1)' }}>
                    <Icon size={22} style={{ color: RED }} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold mb-0.5" style={{ color: CHARCOAL }}>{item.title}</h3>
                    <p className="text-xs" style={{ color: '#6c757d' }}>{item.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 5: TRUSTED BRANDS MARQUEE
          ═══════════════════════════════════════════════════════ */}
      <section className="py-12 bg-white">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 text-center mb-8">
          <p className="text-xs font-bold uppercase tracking-[3px] mb-1" style={{ color: '#6c757d' }}>Trusted Brands</p>
          <h2 className="font-display text-2xl font-bold" style={{ color: NAVY }}>We partner with the world's leading manufacturers</h2>
        </div>
        <div className="overflow-hidden">
          <div className="flex gap-12 animate-marquee-left hover:paused" style={{ animationDuration: '30s' }}>
            {[...brands, ...brands].map((brand, i) => (
              <div key={`${brand}-${i}`} className="flex-shrink-0 px-6 py-3 rounded-lg border border-gray-200 bg-gray-50">
                <span className="text-sm font-bold whitespace-nowrap" style={{ color: NAVY }}>{brand}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 6: CATEGORY GRID
          ═══════════════════════════════════════════════════════ */}
      <section className="py-16" style={{ backgroundColor: LIGHT_GREY }}>
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-[3px] mb-2" style={{ color: RED }}>Categories</p>
            <h2 className="font-display text-3xl font-bold" style={{ color: NAVY }}>Browse by Equipment Type</h2>
            <p className="mt-3 text-sm max-w-[600px] mx-auto" style={{ color: '#6c757d' }}>Explore our extensive inventory organized by category for easy navigation</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {categories.map((cat) => {
              const Icon = cat.icon
              return (
                <Link
                  key={cat.name}
                  to={`/products?category=${cat.name.toLowerCase().replace(/[&\s]+/g, '-')}`}
                  className="group relative overflow-hidden rounded-xl bg-white border border-gray-200 hover:shadow-lg transition-all duration-300 no-underline"
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon size={16} className="text-white" />
                      <h3 className="text-sm font-bold text-white">{cat.name}</h3>
                    </div>
                    <p className="text-xs text-white/70">{cat.count} Products</p>
                  </div>
                </Link>
              )
            })}
          </div>
          <div className="text-center mt-8">
            <Link to="/products" className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white rounded-lg transition-all hover:opacity-90 no-underline" style={{ backgroundColor: NAVY }}>
              View All Categories <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 7: FEATURED PRODUCTS
          ═══════════════════════════════════════════════════════ */}
      <section className="py-16 bg-white">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-[3px] mb-2" style={{ color: RED }}>Products</p>
            <h2 className="font-display text-3xl font-bold" style={{ color: NAVY }}>Featured Products</h2>
          </div>

          {/* Tabs */}
          <div className="flex justify-center gap-1 mb-10 p-1 rounded-xl max-w-fit mx-auto" style={{ backgroundColor: LIGHT_GREY }}>
            {[
              { key: 'featured' as const, label: 'Featured' },
              { key: 'best-seller' as const, label: 'Best Seller' },
              { key: 'top-rated' as const, label: 'Top Rated' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-6 py-2.5 text-xs font-bold rounded-lg transition-all uppercase tracking-wider cursor-pointer ${
                  activeTab === tab.key ? 'text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
                style={activeTab === tab.key ? { backgroundColor: RED, color: WHITE } : {}}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {displayProducts.map((product) => {
              const isAdded = addedIds.has(product.id)
              const hasOldPrice = product.oldPrice !== null
              return (
                <div key={product.id} className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col">
                  <Link to={`/product/${product.id}`} className="relative overflow-hidden bg-gray-100 block">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full aspect-[4/3] object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {hasOldPrice && (
                      <span className="absolute top-3 left-3 px-2.5 py-1 text-xs font-bold text-white rounded-md" style={{ backgroundColor: RED }}>
                        -{Math.round((1 - product.price / product.oldPrice!) * 100)}%
                      </span>
                    )}
                  </Link>
                  <div className="p-4 flex flex-col flex-1">
                    <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6c757d' }}>{product.brand}</span>
                    <Link to={`/product/${product.id}`} className="text-sm font-bold mt-1 mb-2 leading-snug hover:text-red-600 transition-colors line-clamp-2 no-underline" style={{ color: CHARCOAL }}>
                      {product.name}
                    </Link>
                    <div className="flex items-center gap-1 mb-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={12}
                          className={i < Math.floor(product.rating) ? 'fill-current' : 'fill-none'}
                          style={{ color: i < Math.floor(product.rating) ? '#ffc107' : '#dee2e6' }}
                        />
                      ))}
                      <span className="text-xs ml-1" style={{ color: '#6c757d' }}>({product.reviews})</span>
                    </div>
                    <div className="flex items-center gap-2 mb-3 mt-auto">
                      <span className="text-lg font-bold" style={{ color: RED }}>${product.price.toFixed(2)}</span>
                      {hasOldPrice && (
                        <span className="text-sm line-through" style={{ color: '#adb5bd' }}>${product.oldPrice!.toFixed(2)}</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleAddToCart(product.id)}
                      className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer border ${
                        isAdded
                          ? 'border-green-500 text-green-600 bg-green-50'
                          : 'text-white hover:opacity-90 border-transparent'
                      }`}
                      style={!isAdded ? { backgroundColor: RED } : {}}
                    >
                      {isAdded ? <><Check size={14} /> Added</> : <><ShoppingCart size={14} /> Add to Cart</>}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="text-center mt-10">
            <Link to="/shop" className="inline-flex items-center gap-2 px-8 py-3.5 text-sm font-bold text-white rounded-lg transition-all hover:opacity-90 no-underline" style={{ backgroundColor: NAVY }}>
              View All Products <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 8: TRUST & ABOUT
          ═══════════════════════════════════════════════════════ */}
      <section className="py-16" style={{ backgroundColor: NAVY }}>
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-4" style={{ backgroundColor: 'rgba(230,57,70,0.15)', color: '#ff6b6b' }}>
                Why Choose Us
              </div>
              <h2 className="font-display text-3xl font-bold text-white mb-6">Trusted Supplier to the Marine & Industrial Industry</h2>
              <p className="text-sm leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,0.7)' }}>
                With over 15 years of experience, Marine Shop Seven has established itself as a leading supplier and exporter of used and unbranded marine equipment. Our extensive network spans across Singapore, Dubai, Rotterdam, and Mumbai, ensuring global reach and competitive pricing.
              </p>
              <div className="grid grid-cols-2 gap-4 mb-8">
                {[
                  { stat: '10,000+', label: 'Products' },
                  { stat: '200+', label: 'Global Brands' },
                  { stat: '50+', label: 'Export Countries' },
                  { stat: '98%', label: 'Client Satisfaction' },
                ].map((item) => (
                  <div key={item.label} className="p-4 rounded-xl border border-white/10" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                    <span className="block text-2xl font-bold text-white">{item.stat}</span>
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>{item.label}</span>
                  </div>
                ))}
              </div>
              <Link to="/about" className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold rounded-lg transition-all hover:opacity-90 no-underline" style={{ backgroundColor: RED, color: WHITE }}>
                Learn More About Us <ChevronRight size={16} />
              </Link>
            </div>
            <div className="hidden md:block">
              <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                <img
                  src="https://placehold.co/600x500/E63946/FFFFFF?text=Global+Operations"
                  alt="Global operations"
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 9: NEWSLETTER
          ═══════════════════════════════════════════════════════ */}
      <section className="py-16" style={{ backgroundColor: LIGHT_GREY }}>
        <div className="max-w-[640px] mx-auto px-4 sm:px-6 text-center">
          <Mail size={32} className="mx-auto mb-4" style={{ color: RED }} />
          <h2 className="font-display text-2xl font-bold mb-3" style={{ color: NAVY }}>Subscribe to Our Newsletter</h2>
          <p className="text-sm mb-8" style={{ color: '#6c757d' }}>Stay updated with new arrivals, exclusive deals, and industry insights.</p>
          {subscribed ? (
            <div className="flex items-center justify-center gap-2 p-4 rounded-xl bg-green-50 border border-green-200">
              <Check size={18} className="text-green-600" />
              <span className="text-sm font-semibold text-green-700">Thank you for subscribing!</span>
            </div>
          ) : (
            <form onSubmit={handleNewsletter} className="flex max-w-[480px] mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                className="flex-1 px-5 py-3.5 text-sm border border-gray-300 rounded-l-lg outline-none focus:border-red-500 transition-colors"
                style={{ color: CHARCOAL }}
              />
              <button
                type="submit"
                className="px-6 py-3.5 text-sm font-bold text-white rounded-r-lg transition-all hover:opacity-90 flex items-center gap-2"
                style={{ backgroundColor: RED }}
              >
                Subscribe <Send size={14} />
              </button>
            </form>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 10: FOOTER
          ═══════════════════════════════════════════════════════ */}
      <footer style={{ backgroundColor: NAVY }} className="pt-16 pb-8">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {/* Company Info */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-display font-bold text-lg" style={{ backgroundColor: RED }}>
                  MS
                </div>
                <div>
                  <span className="text-sm font-bold text-white">Marine Shop Seven</span>
                  <span className="block text-[10px] font-semibold tracking-wider uppercase text-white/50">Seven</span>
                </div>
              </div>
              <p className="text-sm leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.65)' }}>
                Leading supplier & exporter of used/unbranded marine equipment. Serving the global maritime industry with quality products and reliable service.
              </p>
              <div className="flex gap-3">
                <a href="#" className="w-10 h-10 rounded-lg flex items-center justify-center border transition-colors hover:border-red-500 hover:text-red-500" style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)' }} aria-label="Facebook">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-lg flex items-center justify-center border transition-colors hover:border-red-500 hover:text-red-500" style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)' }} aria-label="Twitter">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-lg flex items-center justify-center border transition-colors hover:border-red-500 hover:text-red-500" style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)' }} aria-label="Instagram">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-lg flex items-center justify-center border transition-colors hover:border-red-500 hover:text-red-500" style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)' }} aria-label="LinkedIn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124zM7.119 20.452H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-[3px] text-white/50 mb-5">Quick Links</h3>
              <div className="space-y-3">
                {[
                  { label: 'Home', path: '/' },
                  { label: 'About Us', path: '/about' },
                  { label: 'Shop All Products', path: '/shop' },
                  { label: 'Brands', path: '/brands' },
                  { label: 'Contact Us', path: '/contact' },
                  { label: 'Sell to Us', path: '/rfq' },
                ].map((link) => (
                  <Link key={link.label} to={link.path} className="block text-sm no-underline hover:text-white transition-colors" style={{ color: 'rgba(255,255,255,0.65)' }}>
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-[3px] text-white/50 mb-5">Categories</h3>
              <div className="space-y-3">
                {['Hydraulics', 'Pneumatics', 'Electrical & Automation', 'Lifting & Handling', 'Tools & Equipment', 'Safety'].map((cat) => (
                  <Link
                    key={cat}
                    to={`/products?category=${cat.toLowerCase().replace(/[&\s]+/g, '-')}`}
                    className="block text-sm no-underline hover:text-white transition-colors"
                    style={{ color: 'rgba(255,255,255,0.65)' }}
                  >
                    {cat}
                  </Link>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-[3px] text-white/50 mb-5">Get in Touch</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin size={16} className="mt-0.5 flex-shrink-0" style={{ color: RED }} />
                  <span className="text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>
                    Global Operations: Singapore · Dubai · Rotterdam · Mumbai
                  </span>
                </div>
                <a href="tel:+919726900547" className="flex items-center gap-3 text-sm no-underline hover:text-white transition-colors" style={{ color: 'rgba(255,255,255,0.65)' }}>
                  <Phone size={16} style={{ color: RED }} /> +91 97269 00547
                </a>
                <a href="mailto:info@alkatraders.com" className="flex items-center gap-3 text-sm no-underline hover:text-white transition-colors" style={{ color: 'rgba(255,255,255,0.65)' }}>
                  <Mail size={16} style={{ color: RED }} /> info@alkatraders.com
                </a>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t flex flex-wrap justify-between items-center gap-3 text-xs" style={{ borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
            <span>&copy; {new Date().getFullYear()} Marine Shop Seven. All rights reserved.</span>
            <div className="flex items-center gap-4">
              <Link to="/privacy-policy" className="hover:text-white transition-colors no-underline" style={{ color: 'inherit' }}>Privacy Policy</Link>
              <Link to="/terms-of-service" className="hover:text-white transition-colors no-underline" style={{ color: 'inherit' }}>Terms of Service</Link>
              <Link to="/refund-policy" className="hover:text-white transition-colors no-underline" style={{ color: 'inherit' }}>Returns</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* ── Inline animation style ── */}
      <style>{`
        @keyframes marquee-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee-left {
          animation: marquee-left 30s linear infinite;
        }
        .animate-marquee-left:hover {
          animation-play-state: paused;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  )
}
