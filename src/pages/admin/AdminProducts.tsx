import { useState, useMemo, useEffect, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useToast } from '../../components/admin/Toast'
import { ConfirmDialog } from '../../components/admin/ConfirmDialog'
import {
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Eye,
  Pencil,
  Trash2,
  Package,
  ImageOff,
  Tag,
  Download,
  CheckSquare,
  Square,
  X,
  Loader2,
} from 'lucide-react'
import { admin } from '../../lib/api'
import { AdminPagination } from '../../components/admin/AdminPagination'
import { OptimizedImage } from '../../components/ui/OptimizedImage'

type SortKey = 'name' | 'sku' | 'brand' | 'category' | 'price' | 'stock' | 'condition'
type SortDir = 'asc' | 'desc'

const ITEMS_PER_PAGE = 20

interface AdminProduct {
  id: string
  name: string
  sku: string
  brand: string | { name: string }
  category: string | { name: string }
  price: number
  salePrice?: number | null
  onSale: boolean
  stockCount: number
  condition: string
  availability: string
  isNewArrival: boolean
  images: { url: string; alt: string; label?: string }[]
  customLabel?: string
}

function getBrandName(brand: string | { name: string }): string {
  return typeof brand === 'string' ? brand : brand?.name || 'Unknown'
}

function getCategoryName(category: string | { name: string }): string {
  return typeof category === 'string' ? category : category?.name || 'Unknown'
}

export default function AdminProducts() {
  const { toast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const [productList, setProductList] = useState<AdminProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [search, setSearch] = useState(searchParams.get('q') || '')
  const [filterCategory, setFilterCategory] = useState(searchParams.get('category') || '')
  const [filterBrand, setFilterBrand] = useState(searchParams.get('brand') || '')
  const [filterCondition, setFilterCondition] = useState(searchParams.get('condition') || '')
  const [filterAvailability, setFilterAvailability] = useState(searchParams.get('availability') || '')
  const [filterOnSale, setFilterOnSale] = useState(searchParams.get('sale') === 'true')
  const [filterNewArrival, setFilterNewArrival] = useState(searchParams.get('new') === 'true')
  const [showFilters, setShowFilters] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)

  // Load brand/category ID mappings for server-side filtering
  const [brandIdMap, setBrandIdMap] = useState<Map<string, string>>(new Map())
  const [categoryIdMap, setCategoryIdMap] = useState<Map<string, string>>(new Map())

  useEffect(() => {
    Promise.allSettled([
      admin.brands.list(),
      admin.categories.list(),
    ]).then(([brandsRes, catsRes]) => {
      if (brandsRes.status === 'fulfilled') {
        const b = (brandsRes.value as any).brands || []
        setBrandIdMap(new Map(b.map((x: any) => [x.name, x.id])))
      }
      if (catsRes.status === 'fulfilled') {
        const c = (catsRes.value as any).categories || []
        setCategoryIdMap(new Map(c.map((x: any) => [x.name, x.id])))
      }
    })
  }, [])

  // Fetch products from API
  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (search.trim()) params.search = search.trim()
      if (filterCategory) {
        const catId = categoryIdMap.get(filterCategory)
        if (catId) params.categoryId = catId
        else params.category = filterCategory
      }
      if (filterBrand) {
        const brandId = brandIdMap.get(filterBrand)
        if (brandId) params.brandId = brandId
        else params.brand = filterBrand
      }
      if (filterCondition) params.condition = filterCondition
      if (filterAvailability) params.availability = filterAvailability
      if (filterOnSale) params.onSale = 'true'
      if (filterNewArrival) params.isNewArrival = 'true'
      params.sort = sortKey
      params.order = sortDir
      params.page = String(page)
      params.limit = String(ITEMS_PER_PAGE)

      const res = await admin.products.list(params)
      setProductList((res.products || []).map((p: any) => ({
        id: p.id,
        name: p.name || '',
        sku: p.sku || '',
        brand: p.brand || 'Unknown',
        category: p.category || 'Unknown',
        price: p.regularPrice ?? p.price ?? 0,
        salePrice: p.salePrice ?? null,
        onSale: p.onSale ?? false,
        stockCount: p.stockCount ?? 0,
        condition: p.condition || 'used',
        availability: p.availability || 'in-stock',
        isNewArrival: p.isNewArrival ?? false,
        images: p.images || [],
        customLabel: p.customLabel || '',
      })))
    } catch (err: any) {
      console.error('Failed to load products:', err)
      toast('Failed to load products from API', 'error')
    } finally {
      setLoading(false)
    }
  }, [search, filterCategory, filterBrand, filterCondition, filterAvailability, filterOnSale, filterNewArrival, sortKey, sortDir, page, toast])

  useEffect(() => {
    const timer = setTimeout(() => fetchProducts(), 300)
    return () => clearTimeout(timer)
  }, [fetchProducts])

  // Client-side filtering as fallback / refinement
  const filteredProducts = useMemo(() => {
    let result = [...productList]
    // If API didn't filter, do it client-side
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || getBrandName(p.brand).toLowerCase().includes(q) || getCategoryName(p.category).toLowerCase().includes(q))
    }
    if (filterCategory) result = result.filter((p) => getCategoryName(p.category) === filterCategory)
    if (filterBrand) result = result.filter((p) => getBrandName(p.brand) === filterBrand)
    if (filterCondition) result = result.filter((p) => p.condition === filterCondition)
    if (filterAvailability) result = result.filter((p) => p.availability === filterAvailability)
    if (filterOnSale) result = result.filter((p) => p.onSale)
    if (filterNewArrival) result = result.filter((p) => p.isNewArrival)

    result.sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'name': cmp = a.name.localeCompare(b.name); break
        case 'sku': cmp = a.sku.localeCompare(b.sku); break
        case 'brand': cmp = getBrandName(a.brand).localeCompare(getBrandName(b.brand)); break
        case 'category': cmp = getCategoryName(a.category).localeCompare(getCategoryName(b.category)); break
        case 'price': cmp = (a.onSale && a.salePrice ? a.salePrice : a.price) - (b.onSale && b.salePrice ? b.salePrice : b.price); break
        case 'stock': cmp = a.stockCount - b.stockCount; break
        case 'condition': cmp = a.condition.localeCompare(b.condition); break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
    return result
  }, [productList, search, filterCategory, filterBrand, filterCondition, filterAvailability, filterOnSale, filterNewArrival, sortKey, sortDir])

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE)
  const paginatedProducts = filteredProducts.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  const uniqueBrands = useMemo(() => {
    const brandSet = new Set(productList.map((p) => getBrandName(p.brand)))
    return Array.from(brandSet).sort()
  }, [productList])

  const uniqueCategories = useMemo(() => {
    const catSet = new Set(productList.map((p) => getCategoryName(p.category)))
    return Array.from(catSet).sort()
  }, [productList])

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedProducts.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(paginatedProducts.map((p) => p.id)))
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
  }

  const activeFilterCount = [filterCategory, filterBrand, filterCondition, filterAvailability, filterOnSale, filterNewArrival].filter(Boolean).length

  const clearFilters = () => {
    setFilterCategory(''); setFilterBrand(''); setFilterCondition('')
    setFilterAvailability(''); setFilterOnSale(false); setFilterNewArrival(false)
    setSearch(''); setPage(1); setSearchParams({})
  }

  const getConditionBadge = (condition: string) => {
    const map: Record<string, string> = { new: 'admin-badge-published', unused: 'admin-badge-info', used: 'admin-badge-draft', refurbished: 'admin-badge-draft', reconditioned: 'admin-badge-info' }
    return map[condition] || 'admin-badge-hidden'
  }

  const getAvailabilityBadge = (availability: string) => {
    const map: Record<string, string> = { 'in-stock': 'admin-badge-published', emergency: 'admin-badge-danger', sourced: 'admin-badge-info', 'out-of-stock': 'admin-badge-danger' }
    return map[availability] || 'admin-badge-hidden'
  }

  const handleBulkAction = async (action: string) => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return

    try {
      await admin.products.bulk(ids, action)
      toast(`${ids.length} product${ids.length > 1 ? 's' : ''} ${action}`, 'success')
      fetchProducts()
    } catch (err: any) {
      toast(err.message || 'Bulk action failed', 'error')
    }
    setSelectedIds(new Set())
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await admin.products.delete(deleteTarget)
      toast('Product deleted', 'success')
      fetchProducts()
    } catch (err: any) {
      toast(err.message || 'Delete failed', 'error')
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  const handleExportCsv = () => {
    const headers = ['Name', 'SKU', 'Brand', 'Category', 'Price', 'Sale Price', 'Stock', 'Condition', 'Availability']
    const rows = filteredProducts.map((p) => [p.name, p.sku, getBrandName(p.brand), getCategoryName(p.category), p.price.toString(), p.salePrice?.toString() || '', p.stockCount.toString(), p.condition, p.availability])
    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `\"${c}\"`).join(','))].join('\\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url; link.download = `products-export-${new Date().toISOString().split('T')[0]}.csv`; link.click()
    URL.revokeObjectURL(url)
    toast('Products exported to CSV', 'success')
  }

  return (
    <>
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-[var(--text-primary)]">Products</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {filteredProducts.length} products
            {selectedIds.size > 0 && ` · ${selectedIds.size} selected`}
          </p>
        </div>
        <Link to="/admin/products/new" className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent-gold)] px-4 py-2.5 text-xs font-extrabold text-[#061522] no-underline transition-all hover:bg-[var(--gold-light)] hover:-translate-y-0.5">
          <Plus size={14} /> Add Product
        </Link>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input type="text" placeholder="Search by name, SKU, brand, category..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] py-2.5 pl-10 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition-all focus:border-[var(--accent-gold)] focus:shadow-[0_0_0_3px_rgba(232,170,36,0.1)]" />
          </div>
          <button onClick={() => setShowFilters((v) => !v)} className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition-all ${showFilters || activeFilterCount > 0 ? 'border-[var(--accent-gold)] bg-[var(--gold-muted)] text-[var(--accent-gold)]' : 'border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-secondary)] hover:border-[var(--accent-gold)]'}`}>
            <Filter size={14} /> Filters
            {activeFilterCount > 0 && <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--accent-gold)] px-1.5 text-[0.625rem] font-bold text-[#061522]">{activeFilterCount}</span>}
          </button>
          <button onClick={handleExportCsv} className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2.5 text-xs font-bold text-[var(--text-secondary)] transition-all hover:border-[var(--accent-teal)] hover:text-[var(--accent-teal)]">
            <Download size={14} /> Export CSV
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 border-t border-[var(--border)] pt-4">
            <div>
              <label className="mb-1 block text-[0.625rem] font-bold uppercase tracking-wider text-[var(--text-muted)]">Category</label>
              <select value={filterCategory} onChange={(e) => { setFilterCategory(e.target.value); setPage(1) }} className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] outline-none focus:border-[var(--accent-gold)]">
                <option value="">All Categories</option>
                {uniqueCategories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[0.625rem] font-bold uppercase tracking-wider text-[var(--text-muted)]">Brand</label>
              <select value={filterBrand} onChange={(e) => { setFilterBrand(e.target.value); setPage(1) }} className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] outline-none focus:border-[var(--accent-gold)]">
                <option value="">All Brands</option>
                {uniqueBrands.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[0.625rem] font-bold uppercase tracking-wider text-[var(--text-muted)]">Condition</label>
              <select value={filterCondition} onChange={(e) => { setFilterCondition(e.target.value); setPage(1) }} className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] outline-none focus:border-[var(--accent-gold)]">
                <option value="">All Conditions</option>
                <option value="new">New</option><option value="unused">Unused</option><option value="used">Used</option><option value="refurbished">Refurbished</option><option value="reconditioned">Reconditioned</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[0.625rem] font-bold uppercase tracking-wider text-[var(--text-muted)]">Availability</label>
              <select value={filterAvailability} onChange={(e) => { setFilterAvailability(e.target.value); setPage(1) }} className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] outline-none focus:border-[var(--accent-gold)]">
                <option value="">All</option><option value="in-stock">In Stock</option><option value="emergency">Emergency</option><option value="sourced">Sourced</option><option value="out-of-stock">Out of Stock</option>
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={() => { setFilterOnSale((v) => !v); setPage(1) }} className={`w-full rounded-lg border px-3 py-2 text-xs font-bold transition-all ${filterOnSale ? 'border-[var(--accent-gold)] bg-[var(--accent-gold)] text-[#061522]' : 'border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-secondary)]'}`}>
                <Tag size={12} className="inline mr-1" /> On Sale
              </button>
            </div>
            <div className="flex items-end">
              <button onClick={() => { setFilterNewArrival((v) => !v); setPage(1) }} className={`w-full rounded-lg border px-3 py-2 text-xs font-bold transition-all ${filterNewArrival ? 'border-[var(--accent-teal)] bg-[var(--accent-teal)] text-white' : 'border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-secondary)]'}`}>
                <Package size={12} className="inline mr-1" /> New Arrivals
              </button>
            </div>
          </div>
        )}

        {activeFilterCount > 0 && !showFilters && (
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span className="text-[0.625rem] font-bold text-[var(--text-muted)]">Active:</span>
            {filterCategory && <span className="inline-flex items-center gap-1 rounded-md bg-[var(--accent-blue)]/10 px-2 py-1 text-[0.625rem] font-bold text-[var(--accent-blue)]">{filterCategory}<button onClick={() => setFilterCategory('')}><X size={10} /></button></span>}
            {filterBrand && <span className="inline-flex items-center gap-1 rounded-md bg-[var(--accent-teal)]/10 px-2 py-1 text-[0.625rem] font-bold text-[var(--accent-teal)]">{filterBrand}<button onClick={() => setFilterBrand('')}><X size={10} /></button></span>}
            {filterCondition && <span className="inline-flex items-center gap-1 rounded-md bg-[var(--accent-gold)]/10 px-2 py-1 text-[0.625rem] font-bold text-[var(--accent-gold)]">{filterCondition}<button onClick={() => setFilterCondition('')}><X size={10} /></button></span>}
            {filterAvailability && <span className="inline-flex items-center gap-1 rounded-md bg-[var(--success)]/10 px-2 py-1 text-[0.625rem] font-bold text-[var(--success)]">{filterAvailability}<button onClick={() => setFilterAvailability('')}><X size={10} /></button></span>}
            {filterOnSale && <span className="inline-flex items-center gap-1 rounded-md bg-[var(--danger)]/10 px-2 py-1 text-[0.625rem] font-bold text-[var(--danger)]">On Sale<button onClick={() => setFilterOnSale(false)}><X size={10} /></button></span>}
            {filterNewArrival && <span className="inline-flex items-center gap-1 rounded-md bg-[var(--accent-teal)]/10 px-2 py-1 text-[0.625rem] font-bold text-[var(--accent-teal)]">New<button onClick={() => setFilterNewArrival(false)}><X size={10} /></button></span>}
            <button onClick={clearFilters} className="text-[0.625rem] font-bold text-[var(--danger)] hover:underline ml-1">Clear all</button>
          </div>
        )}
      </div>

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-[var(--accent-gold)]/30 bg-[var(--gold-muted)] px-4 py-3">
          <span className="text-xs font-bold text-[var(--accent-gold)]">{selectedIds.size} selected</span>
          <div className="flex flex-wrap gap-2 ml-auto">
            <button onClick={() => handleBulkAction('publish')} className="rounded-lg bg-[var(--surface)] border border-[var(--border)] px-3 py-1.5 text-[0.625rem] font-bold text-[var(--text-secondary)] hover:border-[var(--accent-teal)]">Publish</button>
            <button onClick={() => handleBulkAction('hide')} className="rounded-lg bg-[var(--surface)] border border-[var(--border)] px-3 py-1.5 text-[0.625rem] font-bold text-[var(--text-secondary)] hover:border-[var(--accent-gold)]">Hide</button>
            <button onClick={() => handleBulkAction('markSale')} className="rounded-lg bg-[var(--surface)] border border-[var(--border)] px-3 py-1.5 text-[0.625rem] font-bold text-[var(--text-secondary)] hover:border-[var(--accent-blue)]">Mark Sale</button>
            <button onClick={() => handleBulkAction('newArrival')} className="rounded-lg bg-[var(--surface)] border border-[var(--border)] px-3 py-1.5 text-[0.625rem] font-bold text-[var(--text-secondary)] hover:border-[var(--accent-blue)]">New Arrival</button>
          </div>
          <button onClick={() => setSelectedIds(new Set())} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X size={14} /></button>
        </div>
      )}

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-[var(--accent-gold)]" />
            <span className="ml-3 text-sm text-[var(--text-muted)]">Loading products...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="w-10"><button onClick={toggleSelectAll} className="flex items-center justify-center">{selectedIds.size === paginatedProducts.length && paginatedProducts.length > 0 ? <CheckSquare size={14} className="text-[var(--accent-gold)]" /> : <Square size={14} />}</button></th>
                  <th><button onClick={() => handleSort('name')} className="flex items-center gap-1 hover:text-[var(--text-primary)]">Product <ArrowUpDown size={10} /></button></th>
                  <th><button onClick={() => handleSort('sku')} className="flex items-center gap-1 hover:text-[var(--text-primary)]">SKU <ArrowUpDown size={10} /></button></th>
                  <th><button onClick={() => handleSort('brand')} className="flex items-center gap-1 hover:text-[var(--text-primary)]">Brand <ArrowUpDown size={10} /></button></th>
                  <th><button onClick={() => handleSort('category')} className="flex items-center gap-1 hover:text-[var(--text-primary)]">Category <ArrowUpDown size={10} /></button></th>
                  <th><button onClick={() => handleSort('price')} className="flex items-center gap-1 hover:text-[var(--text-primary)]">Price <ArrowUpDown size={10} /></button></th>
                  <th><button onClick={() => handleSort('stock')} className="flex items-center gap-1 hover:text-[var(--text-primary)]">Stock <ArrowUpDown size={10} /></button></th>
                  <th>Condition</th><th>Status</th><th className="w-20">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProducts.length === 0 ? (
                  <tr><td colSpan={10} className="text-center py-12">
                    <Package size={32} className="mx-auto text-[var(--text-muted)] mb-3" />
                    <p className="text-sm font-semibold text-[var(--text-muted)]">No products found</p>
                    <button onClick={clearFilters} className="mt-2 text-xs font-bold text-[var(--accent-gold)] hover:underline">Clear filters</button>
                  </td></tr>
                ) : paginatedProducts.map((product) => {
                  const hasImage = product.images.length > 0 && product.images.some((img) => img.url && !img.url.includes('placeholder'))
                  const effectivePrice = product.onSale && product.salePrice ? product.salePrice : product.price
                  return (
                    <tr key={product.id}>
                      <td><button onClick={() => toggleSelect(product.id)} className="flex items-center justify-center">{selectedIds.has(product.id) ? <CheckSquare size={14} className="text-[var(--accent-gold)]" /> : <Square size={14} />}</button></td>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 shrink-0 rounded-lg bg-[var(--surface-soft)] border border-[var(--border)] overflow-hidden flex items-center justify-center">
                            {hasImage ? <OptimizedImage src={product.images[0].url} alt={product.name} width={40} height={40} loading="lazy" className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} /> : <ImageOff size={14} className="text-[var(--text-muted)]" />}
                          </div>
                          <div className="min-w-0">
                            <Link to={`/admin/products/${product.id}/edit`} className="text-sm font-bold text-[var(--text-primary)] hover:text-[var(--accent-gold)] no-underline truncate block">{product.name}</Link>
                            {product.onSale && <span className="inline-flex items-center gap-0.5 text-[0.5625rem] font-bold text-[var(--danger)]"><Tag size={8} /> SALE</span>}
                            {product.isNewArrival && <span className="ml-1 inline-flex items-center gap-0.5 text-[0.5625rem] font-bold text-[var(--success)]">NEW</span>}
                          </div>
                        </div>
                      </td>
                      <td className="font-mono text-xs">{product.sku}</td>
                      <td className="text-xs font-semibold">{getBrandName(product.brand)}</td>
                      <td className="text-xs capitalize">{getCategoryName(product.category).replace(/-/g, ' ')}</td>
                      <td className="font-mono text-xs font-bold">
                        {product.onSale && product.salePrice ? <><span className="text-[var(--danger)]">${product.salePrice}</span><span className="ml-1 line-through text-[var(--text-muted)]">${product.price}</span></> : <span className="text-[var(--text-primary)]">${effectivePrice}</span>}
                      </td>
                      <td><span className={`font-mono text-xs font-bold ${product.stockCount === 0 ? 'text-[var(--danger)]' : product.stockCount <= 3 ? 'text-[var(--accent-gold)]' : 'text-[var(--text-primary)]'}`}>{product.stockCount}</span></td>
                      <td><span className={`admin-badge ${getConditionBadge(product.condition)} capitalize`}>{product.condition}</span></td>
                      <td><span className={`admin-badge ${getAvailabilityBadge(product.availability)}`}>{product.availability.replace(/-/g, ' ')}</span></td>
                      <td>
                        <div className="flex items-center gap-1">
                          <Link to={`/admin/products/${product.id}/edit`} className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--accent-gold)] hover:bg-[var(--gold-muted)] transition-colors" title="Edit"><Pencil size={12} /></Link>
                          <a href={`/product/${product.id}`} target="_blank" rel="noopener noreferrer" className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--accent-blue)] hover:bg-[var(--accent-blue)]/10 transition-colors" title="View on storefront"><Eye size={12} /></a>
                          <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(product.id) }} className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-red-50 transition-colors" title="Delete"><Trash2 size={12} /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && <AdminPagination page={page} totalPages={totalPages} totalItems={filteredProducts.length} itemLabel="products" onPageChange={setPage} />}
      </div>
    </div>

    <ConfirmDialog
      open={!!deleteTarget}
      title="Delete Product"
      message={`Are you sure you want to delete this product? This action cannot be undone.`}
      confirmLabel={deleting ? 'Deleting...' : 'Delete'}
      danger
      onConfirm={handleDelete}
      onCancel={() => setDeleteTarget(null)}
    />
    </>
  )
}
