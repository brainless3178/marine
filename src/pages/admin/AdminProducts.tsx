import { useState, useMemo, useEffect, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useToast } from '../../components/admin/Toast'
import { ConfirmDialog } from '../../components/admin/ConfirmDialog'
import { AdminProductFilters } from '../../components/admin/AdminProductFilters'
import { AdminProductTable } from '../../components/admin/AdminProductTable'
import type { SortKey, SortDir } from '../../components/admin/AdminProductTable'
import { AdminImportModal } from '../../components/admin/AdminImportModal'
import { Plus, Upload } from 'lucide-react'
import Papa from 'papaparse'
import { admin } from '../../lib/api'

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

  const [duplicating, setDuplicating] = useState<string | null>(null)
  const [showImport, setShowImport] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ created: number; skipped: number; errors: string[] } | null>(null)

  const handleDuplicate = async (productId: string) => {
    setDuplicating(productId)
    try {
      await admin.products.duplicate(productId)
      toast('Product duplicated as draft', 'success')
      fetchProducts()
    } catch (err: any) {
      toast(err.message || 'Failed to duplicate product', 'error')
    } finally {
      setDuplicating(null)
    }
  }

  const handleImportCsv = async (file: File) => {
    setImporting(true)
    setImportResult(null)
    try {
      const result = await new Promise<Papa.ParseResult<any>>((resolve, reject) => {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: false,
          transformHeader: (h: string) => h.trim().toLowerCase(),
          complete: (results) => resolve(results),
          error: (err: Error) => reject(err),
        })
      })

      if (result.errors.length > 0) {
        const errMessages = result.errors.map((e) => `Row ${e.row}: ${e.message}`)
        toast(`CSV parse errors: ${errMessages[0]}`, 'error')
        setImportResult({ created: 0, skipped: 0, errors: errMessages })
        return
      }

      if (!result.data || result.data.length === 0) {
        toast('CSV file is empty or has no data rows', 'error')
        return
      }

      const rows = result.data.map((row: Record<string, string>) => {
        const clean: Record<string, any> = {}
        for (const [key, value] of Object.entries(row)) {
          const cleanKey = key.trim().toLowerCase()
          clean[cleanKey] = value
        }
        return clean
      })

      const importResult = await admin.products.importCsv(rows)
      setImportResult(importResult)
      toast(`Imported ${importResult.created} products (${importResult.skipped} skipped)`, 'success')
      fetchProducts()
    } catch (err: any) {
      toast(err.message || 'Import failed', 'error')
    } finally {
      setImporting(false)
    }
  }

  const handleExportCsv = () => {
    const headers = ['Name', 'SKU', 'Brand', 'Category', 'Price', 'Sale Price', 'Stock', 'Condition', 'Availability']
    const rows = filteredProducts.map((p) => [p.name, p.sku, getBrandName(p.brand), getCategoryName(p.category), p.price.toString(), p.salePrice?.toString() || '', p.stockCount.toString(), p.condition, p.availability])
    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n')
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
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-[var(--text-primary)]">Products</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {filteredProducts.length} products
            {selectedIds.size > 0 && ` · ${selectedIds.size} selected`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2.5 text-xs font-bold text-[var(--text-secondary)] transition-all hover:border-[var(--accent-teal)] hover:text-[var(--accent-teal)]"
          >
            <Upload size={14} /> Import CSV
          </button>
          <Link
            to="/admin/products/new"
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent-gold)] px-4 py-2.5 text-xs font-extrabold text-navy-deep no-underline transition-all hover:bg-[var(--gold-light)] hover:-translate-y-0.5"
          >
            <Plus size={14} /> Add Product
          </Link>
        </div>
      </div>

      {/* ── Filters ── */}
      <AdminProductFilters
        search={search}
        onSearchChange={setSearch}
        onPageReset={() => setPage(1)}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters((v) => !v)}
        activeFilterCount={activeFilterCount}
        onExportCsv={handleExportCsv}
        filterCategory={filterCategory}
        onFilterCategoryChange={setFilterCategory}
        filterBrand={filterBrand}
        onFilterBrandChange={setFilterBrand}
        filterCondition={filterCondition}
        onFilterConditionChange={setFilterCondition}
        filterAvailability={filterAvailability}
        onFilterAvailabilityChange={setFilterAvailability}
        filterOnSale={filterOnSale}
        onFilterOnSaleToggle={() => setFilterOnSale((v) => !v)}
        filterNewArrival={filterNewArrival}
        onFilterNewArrivalToggle={() => setFilterNewArrival((v) => !v)}
        uniqueBrands={uniqueBrands}
        uniqueCategories={uniqueCategories}
        onClearFilters={clearFilters}
      />

      {/* ── Table (with bulk actions, pagination) ── */}
      <AdminProductTable
        products={paginatedProducts}
        loading={loading}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
        onToggleSelectAll={toggleSelectAll}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={handleSort}
        onDuplicate={handleDuplicate}
        duplicating={duplicating}
        onDeleteRequest={setDeleteTarget}
        onClearFilters={clearFilters}
        onBulkAction={handleBulkAction}
        onClearSelection={() => setSelectedIds(new Set())}
        page={page}
        totalPages={totalPages}
        totalItems={filteredProducts.length}
        onPageChange={setPage}
      />
    </div>

    {/* ── Import Modal ── */}
    <AdminImportModal
      open={showImport}
      onClose={() => { setShowImport(false); setImportResult(null) }}
      onImport={handleImportCsv}
      importing={importing}
      importResult={importResult}
    />

    {/* ── Delete Confirm ── */}
    <ConfirmDialog
      open={!!deleteTarget}
      title="Delete Product"
      message="Are you sure you want to delete this product? This action cannot be undone."
      confirmLabel={deleting ? 'Deleting...' : 'Delete'}
      danger
      onConfirm={handleDelete}
      onCancel={() => setDeleteTarget(null)}
    />
    </>
  )
}
