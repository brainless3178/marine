import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Save,
  Eye,
  ArrowLeft,
  Upload,
  Plus,
  Trash2,
  GripVertical,
  Info,
  CheckCircle,
  Image,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { admin } from '../../lib/api'
import { useToast } from '../../components/admin/Toast'
import { isLightColor } from '../../lib/utils'
import { OptimizedImage } from '../../components/ui/OptimizedImage'

type TabId = 'basics' | 'images' | 'pricing' | 'inventory' | 'specs' | 'details' | 'seo' | 'notes'

const tabs: { id: TabId; label: string }[] = [
    { id: 'basics', label: 'Basics' },
  { id: 'images', label: 'Images' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'specs', label: 'Specifications' },
  { id: 'details', label: 'Details' },
  { id: 'seo', label: 'SEO' },
  { id: 'notes', label: 'Admin Notes' },
]

interface SpecRow {
  name: string
  value: string
}

interface ProductFormData {
  name: string
  sku: string
  brand: string
  category: string
  industries: string[]
  condition: string
  availability: string
  shortDescription: string
  description: string
  images: { url: string; alt: string; label: string }[]
  regularPrice: string
  salePrice: string
  makeOfferEnabled: boolean
  currency: string
  inStock: boolean
  stockCount: string
  lowStockThreshold: string
  warehouseLocation: string
  leadTime: string
  specs: SpecRow[]
  keyFeatures: string[]
  compatibilityNotes: string
  warrantyNotes: string
  conditionNotes: string
  includedItems: string[]
  excludedItems: string[]
  seoTitle: string
  seoDescription: string
  searchKeywords: string
  internalNotes: string
  isNewArrival: boolean
  isFeatured: boolean
  customLabel: string
  customLabelColor: string
}

function getEmptyForm(): ProductFormData {
  return {
    name: '',
    sku: '',
    brand: '',
    category: '',
    industries: [],
    condition: 'used',
    availability: 'in-stock',
    shortDescription: '',
    description: '',
    images: [{ url: '', alt: '', label: 'Main' }],
    regularPrice: '',
    salePrice: '',
    makeOfferEnabled: true,
    currency: 'USD',
    inStock: true,
    stockCount: '1',
    lowStockThreshold: '5',
    warehouseLocation: '',
    leadTime: '',
    specs: [{ name: '', value: '' }],
    keyFeatures: [''],
    compatibilityNotes: '',
    warrantyNotes: '',
    conditionNotes: '',
    includedItems: [''],
    excludedItems: [''],
    seoTitle: '',
    seoDescription: '',
    searchKeywords: '',
    internalNotes: '',
    isNewArrival: false,
    isFeatured: false,
    customLabel: '',
    customLabelColor: '#159a67',
  }
}

function getFormFromProduct(product: any): ProductFormData {
  return {
    name: product.name || '',
    sku: product.sku || '',
    brand: product.brandId || (typeof product.brand === 'object' ? product.brand?.id || '' : product.brand || ''),
    category: product.categoryId || (typeof product.category === 'object' ? product.category?.id || '' : product.category || ''),
    industries: Array.isArray(product.industries)
      ? product.industries.map((i: any) => typeof i === 'object' ? (i.industryId || i.industry?.id || i.id || '') : i)
      : (Array.isArray(product.industryIds) ? product.industryIds : []),
    condition: product.condition || 'used',
    availability: product.availability || 'in-stock',
    shortDescription: product.shortDescription || product.description?.split('—')[0]?.trim() || '',
    description: product.description || '',
    images: Array.isArray(product.images) && product.images.length > 0
      ? product.images.map((img: any) => ({
          url: img.url || '',
          alt: img.altText || img.alt || '',
          label: img.label || '',
        }))
      : [{ url: '', alt: '', label: 'Main' }],
    regularPrice: (product.regularPrice ?? product.price ?? '').toString(),
    salePrice: product.salePrice?.toString() || '',
    makeOfferEnabled: product.makeOfferEnabled ?? product.makeOffer ?? false,
    currency: product.currency || 'USD',
    inStock: product.inStock ?? product.stockCount > 0,
    stockCount: (product.stockCount ?? 0).toString(),
    lowStockThreshold: (product.lowStockThreshold ?? 5).toString(),
    warehouseLocation: product.warehouseLocation || '',
    leadTime: product.leadTime || '',
    specs: Array.isArray(product.specs)
      ? product.specs.map((s: any) => ({ name: s.name || '', value: String(s.value || '') }))
      : (product.specs && typeof product.specs === 'object'
          ? Object.entries(product.specs).map(([name, value]) => ({ name, value: String(value) }))
          : []),
    keyFeatures: Array.isArray(product.keyFeatures) && product.keyFeatures.length > 0 ? product.keyFeatures : [''],
    compatibilityNotes: product.compatibilityNotes || '',
    warrantyNotes: product.warrantyNotes || '',
    conditionNotes: product.conditionNotes || '',
    includedItems: Array.isArray(product.includedItems) && product.includedItems.length > 0 ? product.includedItems : [''],
    excludedItems: Array.isArray(product.excludedItems) && product.excludedItems.length > 0 ? product.excludedItems : [''],
    seoTitle: product.seoTitle || product.name || '',
    seoDescription: product.seoDescription || product.description?.slice(0, 160) || '',
    searchKeywords: product.seoKeywords || product.searchKeywords || '',
    internalNotes: product.internalNotes || '',
    isNewArrival: product.isNewArrival ?? false,
    isFeatured: product.isFeatured ?? false,
    customLabel: product.customLabel || '',
    customLabelColor: product.customLabelColor || '#159a67',
  }
}

export default function AdminProductForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEditing = !!id && id !== 'new'

  const [activeTab, setActiveTab] = useState<TabId>('basics')
  const [form, setForm] = useState<ProductFormData>(getEmptyForm())
  const [loadingProduct, setLoadingProduct] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [attempted, setAttempted] = useState(false)
  const isDirtyRef = useRef(false)

  const { toast } = useToast()

  // Dropdown data
  const [brandList, setBrandList] = useState<{ id: string; name: string }[]>([])
  const [categoryList, setCategoryList] = useState<{ id: string; name: string }[]>([])
  const [industryList, setIndustryList] = useState<{ id: string; name: string }[]>([])
  const [uploadingImage, setUploadingImage] = useState(false)
  const productImageInputId = 'product-image-upload'

  // Handle file upload for product images
  const handleImageUpload = async (file: File) => {
    setUploadingImage(true)
    try {
      const { asset } = await admin.media.upload(file)
      // Add as a new image row or replace the first empty one
      const emptyIdx = form.images.findIndex((img) => !img.url)
      if (emptyIdx >= 0) {
        updateImage(emptyIdx, 'url', asset.url)
      } else {
        updateField('images', [...form.images, { url: asset.url, alt: file.name.replace(/\.[^.]+$/, ''), label: form.images.length === 0 ? 'Main' : '' }])
      }
      toast('Image uploaded', 'success')
    } catch (err: any) {
      toast(err.message || 'Upload failed', 'error')
    } finally {
      setUploadingImage(false)
    }
  }

  // Fetch dropdown data from API on mount
  useEffect(() => {
    let cancelled = false
    Promise.allSettled([
      admin.brands.list(),
      admin.categories.list(),
      admin.industries.list(),
    ]).then(([brandsRes, catsRes, indsRes]) => {
      if (cancelled) return
      if (brandsRes.status === 'fulfilled') {
        const b = (brandsRes.value as any).brands || []
        setBrandList(b.map((x: any) => ({ id: x.id, name: x.name })))
      }
      if (catsRes.status === 'fulfilled') {
        const c = (catsRes.value as any).categories || []
        setCategoryList(c.map((x: any) => ({ id: x.id || x.slug, name: x.name })))
      }
      if (indsRes.status === 'fulfilled') {
        const ind = (indsRes.value as any).industries || []
        setIndustryList(ind.map((x: any) => ({ id: x.id, name: x.name })))
      }
    })
    return () => { cancelled = true }
  }, [])

  // Fetch product data from API when editing
  useEffect(() => {
    if (!isEditing || !id) return
    let cancelled = false
    setLoadingProduct(true)
    admin.products.get(id)
      .then((res) => {
        if (!cancelled && res.product) {
          setForm(getFormFromProduct(res.product))
        }
      })
      .catch((err) => {
        console.error('Failed to load product:', err)
      })
      .finally(() => {
        if (!cancelled) setLoadingProduct(false)
      })
    return () => { cancelled = true }
  }, [id, isEditing])
  const formJson = JSON.stringify(form)
  useEffect(() => {
    isDirtyRef.current = true
  }, [formJson])

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirtyRef.current) {
        e.preventDefault()
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [])

  const tabErrors: Record<TabId, boolean> = {
    basics: !form.name.trim() || !form.sku.trim() || !form.brand || !form.category,
    images: false,
    pricing: !!(form.salePrice && form.regularPrice && Number(form.salePrice) >= Number(form.regularPrice)),
    inventory: false,
    specs: false,
    details: false,
    seo: false,
    notes: false,
  }

  const updateField = <K extends keyof ProductFormData>(field: K, value: ProductFormData[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const addSpec = () => updateField('specs', [...form.specs, { name: '', value: '' }])
  const removeSpec = (i: number) => updateField('specs', form.specs.filter((_, idx) => idx !== i))
  const updateSpec = (i: number, field: keyof SpecRow, value: string) => {
    const specs = [...form.specs]
    specs[i] = { ...specs[i], [field]: value }
    updateField('specs', specs)
  }

  // Helpers for string-array fields (keyFeatures, includedItems, excludedItems)
  const addArrayItem = (field: 'keyFeatures' | 'includedItems' | 'excludedItems') =>
    updateField(field, [...form[field], ''])
  const removeArrayItem = (field: 'keyFeatures' | 'includedItems' | 'excludedItems', i: number) =>
    updateField(field, form[field].filter((_: string, idx: number) => idx !== i))
  const updateArrayItem = (field: 'keyFeatures' | 'includedItems' | 'excludedItems', i: number, value: string) => {
    const arr = [...form[field]]
    arr[i] = value
    updateField(field, arr)
  }

  const addImage = () => updateField('images', [...form.images, { url: '', alt: '', label: '' }])
  const removeImage = (i: number) => updateField('images', form.images.filter((_, idx) => idx !== i))
  const updateImage = (i: number, field: string, value: string) => {
    const images = [...form.images]
    images[i] = { ...images[i], [field]: value }
    updateField('images', images)
  }

  const toggleIndustry = (id: string) => {
    updateField(
      'industries',
      form.industries.includes(id)
        ? form.industries.filter((i) => i !== id)
        : [...form.industries, id]
    )
  }

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Product name is required'
    if (!form.sku.trim()) e.sku = 'SKU is required'
    if (!form.brand) e.brand = 'Brand is required'
    if (!form.category) e.category = 'Category is required'
    if (form.salePrice && form.regularPrice && Number(form.salePrice) >= Number(form.regularPrice)) {
      e.salePrice = 'Sale price must be lower than regular price'
    }
    return e
  }

  const isValid = Object.keys(validate()).length === 0

  const markTouched = (field: string) => setTouched((prev) => ({ ...prev, [field]: true }))

  const showError = (field: string) => (attempted || touched[field]) && errors[field]

  const inputBaseClass =
    'w-full rounded-xl border bg-[var(--surface-soft)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition-all'

  const getFieldClass = (field: string, extra = '') => {
    const hasError = showError(field)
    return `${inputBaseClass} ${extra} ${
      hasError
        ? 'border-[var(--danger)] focus:border-[var(--danger)] focus:shadow-[0_0_0_3px_rgba(220,38,38,0.1)]'
        : 'border-[var(--border)] focus:border-[var(--accent-gold)] focus:shadow-[0_0_0_3px_rgba(232,170,36,0.1)]'
    }`
  }

  const getSelectClass = (field: string) => {
    const hasError = showError(field)
    return `w-full rounded-xl border bg-[var(--surface-soft)] px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none ${
      hasError
        ? 'border-[var(--danger)] focus:border-[var(--danger)]'
        : 'border-[var(--border)] focus:border-[var(--accent-gold)]'
    }`
  }

  const handleSave = async () => {
    const validationErrors = validate()
    setErrors(validationErrors)
    setAttempted(true)
    if (Object.keys(validationErrors).length > 0) {
      setActiveTab('basics')
      return
    }

    setSaving(true)
    try {
      const payload: any = {
        name: form.name,
        sku: form.sku,
        brandId: form.brand || null,
        categoryId: form.category || null,
        industryIds: form.industries,
        condition: form.condition,
        availability: form.availability,
        shortDescription: form.shortDescription,
        description: form.description,
        images: form.images.filter((img) => img.url).map((img, i) => ({
          url: img.url,
          altText: img.alt,
          label: img.label,
          isMain: i === 0,
        })),
        regularPrice: Number(form.regularPrice) || 0,
        salePrice: form.salePrice ? Number(form.salePrice) : null,
        makeOfferEnabled: form.makeOfferEnabled,
        currency: form.currency,
        inStock: form.inStock,
        stockCount: Number(form.stockCount) || 0,
        lowStockThreshold: Number(form.lowStockThreshold) || 5,
        warehouseLocation: form.warehouseLocation,
        leadTime: form.leadTime,
        specs: form.specs.filter((s) => s.name.trim()),
        seoTitle: form.seoTitle,
        seoDescription: form.seoDescription,
        keyFeatures: form.keyFeatures.filter((f: string) => f.trim()),
        compatibilityNotes: form.compatibilityNotes,
        warrantyNotes: form.warrantyNotes,
        conditionNotes: form.conditionNotes,
        includedItems: form.includedItems.filter((i: string) => i.trim()),
        excludedItems: form.excludedItems.filter((i: string) => i.trim()),
        seoKeywords: form.searchKeywords,
        showPrice: (Number(form.regularPrice) || 0) > 0,
        internalNotes: form.internalNotes,
        isNewArrival: form.isNewArrival,
        isFeatured: form.isFeatured,
        customLabel: form.customLabel || null,
        customLabelColor: form.customLabel ? form.customLabelColor : null,
      }

      if (isEditing && id) {
        await admin.products.update(id, payload)
      } else {
        await admin.products.create(payload)
      }

      isDirtyRef.current = false
      setSaved(true)
      setTimeout(() => { setSaved(false); navigate('/admin/products') }, 1500)
    } catch (err: any) {
      const msg = err.message || 'Failed to save product'
      if (err.details && Array.isArray(err.details)) {
        const fieldErrors: Record<string, string> = {}
        err.details.forEach((d: any) => { fieldErrors[d.field] = d.message })
        setErrors(fieldErrors)
        setActiveTab('basics')
        // Field-level errors are rendered inline — no toast needed for those
        toast('Please fix the highlighted field errors', 'error')
      } else {
        toast(msg, 'error')
      }
    } finally {
      setSaving(false)
    }
  }

  const labelClass = 'mb-1.5 block text-[0.6875rem] font-bold uppercase tracking-wider text-[var(--text-muted)]'
  const errorClass = 'mt-1 text-[0.625rem] font-bold text-[var(--danger)] flex items-center gap-1'

  if (loadingProduct) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={24} className="animate-spin text-[var(--accent-gold)]" />
        <span className="ml-3 text-sm text-[var(--text-muted)]">Loading product...</span>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/products')}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="font-display text-2xl font-extrabold text-[var(--text-primary)]">
              {isEditing ? 'Edit Product' : 'Add Product'}
            </h1>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">
              {isEditing ? `Editing ${form.name || id}` : 'Create a new product listing'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isEditing && (
            <a
              href={`/product/${id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2.5 text-xs font-bold text-[var(--text-secondary)] no-underline hover:border-[var(--accent-blue)] transition-colors"
            >
              <Eye size={14} />
              Preview
            </a>
          )}
          <button
            onClick={handleSave}
            disabled={saving || (!isValid && attempted)}
            className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-extrabold transition-all ${
              saved
                ? 'bg-[var(--success)] text-white'
                : !isValid && attempted
                ? 'bg-[var(--text-muted)] text-white cursor-not-allowed opacity-60'
                : 'bg-[var(--accent-gold)] text-navy-deep hover:bg-[var(--gold-light)] hover:-translate-y-0.5'
            }`}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <CheckCircle size={14} /> : <Save size={14} />}
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Product'}
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Tab Navigation */}
        <div className="lg:w-48 shrink-0">
          <nav className="flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-[var(--accent-gold)] text-navy-deep shadow-[0_4px_12px_rgba(232,170,36,0.2)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--surface-soft)] hover:text-[var(--text-primary)]'
                }`}
              >
                {tab.label}
                {tabErrors[tab.id] && (
                  <span className="ml-1.5 inline-block h-2 w-2 rounded-full bg-[var(--danger)]" />
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="flex-1 min-w-0">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
            {/* BASICS */}
            {activeTab === 'basics' && (
              <div className="space-y-5">
                <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">Basic Information</h2>

                <div>
                  <label className={labelClass}>Product Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    onBlur={() => markTouched('name')}
                    placeholder="e.g. Hydraulic Pump HP-200"
                    className={getFieldClass('name')}
                  />
                  {showError('name') && <p className={errorClass}><AlertCircle size={10} />{errors.name}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                  <label className={labelClass}>SKU *</label>
                  <input
                    type="text"
                    value={form.sku}
                    onChange={(e) => updateField('sku', e.target.value)}
                    onBlur={() => markTouched('sku')}
                    placeholder="e.g. HP-200-MS"
                    className={`${getFieldClass('sku')} font-mono`}
                  />
                  {showError('sku') && <p className={errorClass}><AlertCircle size={10} />{errors.sku}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Brand *</label>
                    <select
                      value={form.brand}
                      onChange={(e) => updateField('brand', e.target.value)}
                      onBlur={() => markTouched('brand')}
                      className={getSelectClass('brand')}
                    >
                      <option value="">Select brand</option>
                      {brandList.map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                    {showError('brand') && <p className={errorClass}><AlertCircle size={10} />{errors.brand}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Category *</label>
                    <select
                      value={form.category}
                      onChange={(e) => updateField('category', e.target.value)}
                      onBlur={() => markTouched('category')}
                      className={getSelectClass('category')}
                    >
                      <option value="">Select category</option>
                      {categoryList.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                    {showError('category') && <p className={errorClass}><AlertCircle size={10} />{errors.category}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Condition *</label>
                    <select
                      value={form.condition}
                      onChange={(e) => updateField('condition', e.target.value)}
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-gold)]"
                    >
                      <option value="new">New</option>
                      <option value="unused">Unused / New Old Stock</option>
                      <option value="used">Used</option>
                      <option value="refurbished">Refurbished</option>
                      <option value="reconditioned">Reconditioned</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Industries</label>
                  <div className="flex flex-wrap gap-2">
                    {industryList.map((ind) => (
                      <button
                        key={ind.id}
                        onClick={() => toggleIndustry(ind.id)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition-all ${
                          form.industries.includes(ind.id)
                            ? 'border-[var(--accent-teal)] bg-[var(--accent-teal)]/10 text-[var(--accent-teal)]'
                            : 'border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-secondary)] hover:border-[var(--accent-teal)]'
                        }`}
                      >
                        {ind.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Short Description</label>
                  <input
                    type="text"
                    value={form.shortDescription}
                    onChange={(e) => updateField('shortDescription', e.target.value)}
                    placeholder="Brief description for cards and search previews"
                    className={getFieldClass('shortDescription')}
                  />
                </div>

                <div>
                  <label className={labelClass}>Full Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    placeholder="Detailed product description..."
                    rows={5}
                    className={`${getFieldClass('description')} resize-y`}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isNewArrival}
                      onChange={(e) => updateField('isNewArrival', e.target.checked)}
                      className="h-4 w-4 rounded border-[var(--border)] accent-[var(--accent-gold)]"
                    />
                    <span className="text-xs font-bold text-[var(--text-secondary)]">New Arrival</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isFeatured}
                      onChange={(e) => updateField('isFeatured', e.target.checked)}
                      className="h-4 w-4 rounded border-[var(--border)] accent-[var(--accent-gold)]"
                    />
                    <span className="text-xs font-bold text-[var(--text-secondary)]">Featured Product</span>
                  </label>
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Custom Label</label>
                    <div className="flex items-center gap-3">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={form.customLabel}
                          onChange={(e) => updateField('customLabel', e.target.value)}
                          placeholder="e.g. SALE, NEW"
                          className={getFieldClass('customLabel')}
                        />
                      </div>
                      {form.customLabel && (
                        <div className="flex items-center gap-2">
                          <div
                            className="h-9 w-9 shrink-0 rounded-lg border-2 border-[var(--border)] cursor-pointer overflow-hidden relative"
                            title={`Label color: ${form.customLabelColor}`}
                          >
                            <input
                              type="color"
                              value={form.customLabelColor}
                              onChange={(e) => updateField('customLabelColor', e.target.value)}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="w-full h-full" style={{ backgroundColor: form.customLabelColor }} />
                          </div>
                          <span
                            className="inline-flex items-center rounded-md px-2.5 py-1 text-[0.625rem] font-extrabold shrink-0"
                            style={{
                              backgroundColor: form.customLabelColor,
                              color: isLightColor(form.customLabelColor) ? '#1a1a1a' : '#ffffff',
                            }}
                          >
                            {form.customLabel}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* IMAGES */}
            {activeTab === 'images' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">Product Images</h2>
                  <button
                    onClick={addImage}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-1.5 text-xs font-bold text-[var(--text-secondary)] hover:border-[var(--accent-gold)] transition-colors"
                  >
                    <Plus size={12} /> Add Image
                  </button>
                </div>

                <input id={productImageInputId} type="file" accept="image/*" multiple className="hidden" onChange={async (e) => {
                  const files = e.target.files
                  if (!files) return
                  for (let i = 0; i < files.length; i++) {
                    await handleImageUpload(files[i])
                  }
                  e.target.value = ''
                }} />
                <div
                  className="rounded-xl border-2 border-dashed border-[var(--border)] p-8 text-center cursor-pointer hover:border-[var(--accent-gold)] transition-colors"
                  onClick={() => document.getElementById(productImageInputId)?.click()}
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-[var(--accent-gold)]') }}
                  onDragLeave={(e) => e.currentTarget.classList.remove('border-[var(--accent-gold)]')}
                  onDrop={async (e) => {
                    e.preventDefault()
                    e.currentTarget.classList.remove('border-[var(--accent-gold)]')
                    const files = e.dataTransfer.files
                    for (let i = 0; i < files.length; i++) {
                      if (files[i].type.startsWith('image/')) await handleImageUpload(files[i])
                    }
                  }}
                >
                  {uploadingImage ? (
                    <><Loader2 size={32} className="mx-auto text-[var(--accent-gold)] animate-spin mb-3" /><p className="text-sm font-semibold text-[var(--text-secondary)]">Uploading...</p></>
                  ) : (
                    <><Upload size={32} className="mx-auto text-[var(--text-muted)] mb-3" /><p className="text-sm font-semibold text-[var(--text-secondary)]">Drag & drop images here, or click to upload</p><p className="text-xs text-[var(--text-muted)] mt-1">JPG, PNG, WebP, AVIF · Max 10MB · Recommended 800×800px</p></>
                  )}
                </div>

                {form.images.map((img, i) => (
                  <div key={i} className="flex items-start gap-4 rounded-xl border border-[var(--border)] p-4">
                    <div className="flex items-center pt-2 text-[var(--text-muted)]">
                      <GripVertical size={14} />
                    </div>
                    <div className="h-20 w-20 shrink-0 rounded-lg bg-[var(--surface-soft)] border border-[var(--border)] flex items-center justify-center overflow-hidden">
                      {img.url ? (
                        <OptimizedImage src={img.url} alt={img.alt} width={80} height={80} loading="lazy" className="h-full w-full object-cover" />
                      ) : (
                        <Image size={20} className="text-[var(--text-muted)]" />
                      )}
                    </div>
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className={labelClass}>Image URL</label>
                        <input
                          type="text"
                          value={img.url}
                          onChange={(e) => updateImage(i, 'url', e.target.value)}
                          placeholder="/images/product-001.jpg"
                          className={getFieldClass('')}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Alt Text</label>
                        <input
                          type="text"
                          value={img.alt}
                          onChange={(e) => updateImage(i, 'alt', e.target.value)}
                          placeholder="Product image description"
                          className={getFieldClass('')}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Label</label>
                        <select
                          value={img.label}
                          onChange={(e) => updateImage(i, 'label', e.target.value)}
                          className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-gold)]"
                        >
                          <option value="Main">Main</option>
                          <option value="Side">Side View</option>
                          <option value="Detail">Detail</option>
                          <option value="Nameplate">Nameplate</option>
                          <option value="Serial Plate">Serial Plate</option>
                          <option value="Packaging">Packaging</option>
                          <option value="Test Report">Test Report</option>
                        </select>
                      </div>
                    </div>
                    {form.images.length > 1 && (
                      <button
                        onClick={() => removeImage(i)}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-danger/5 transition-colors mt-5"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* PRICING */}
            {activeTab === 'pricing' && (
              <div className="space-y-5">
                <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">Pricing</h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className={labelClass}>Regular Price *</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[var(--text-muted)]">$</span>
                      <input
                        type="number"
                        value={form.regularPrice}
                        onChange={(e) => updateField('regularPrice', e.target.value)}
                        placeholder="0.00"
                        className={`${getFieldClass('regularPrice')} pl-8 font-mono`}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Sale Price</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[var(--text-muted)]">$</span>
                      <input
                        type="number"
                        value={form.salePrice}
                        onChange={(e) => updateField('salePrice', e.target.value)}
                        placeholder="0.00"
                        className={`${getFieldClass('salePrice')} pl-8 font-mono`}
                      />
                    </div>
                    {form.salePrice && form.regularPrice && Number(form.salePrice) >= Number(form.regularPrice) && (
                      <p className="mt-1 text-[0.625rem] font-bold text-[var(--danger)] flex items-center gap-1">
                        <Info size={10} /> Sale price must be lower than regular price
                      </p>
                    )}
                  </div>
                  <div>
                    <label className={labelClass}>Currency</label>
                    <select
                      value={form.currency}
                      onChange={(e) => updateField('currency', e.target.value)}
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-gold)]"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="AED">AED (د.إ)</option>
                      <option value="INR">INR (₹)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.makeOfferEnabled}
                      onChange={(e) => updateField('makeOfferEnabled', e.target.checked)}
                      className="h-4 w-4 rounded border-[var(--border)] accent-[var(--accent-gold)]"
                    />
                    <span className="text-xs font-bold text-[var(--text-secondary)]">Enable Make Offer</span>
                  </label>
                </div>

                <div className="rounded-xl bg-[var(--surface-soft)] border border-[var(--border)] p-4">
                  <p className="text-xs text-[var(--text-muted)] flex items-center gap-2">
                    <Info size={14} />
                    Price visibility: Price will be shown on the storefront. To show "Contact for Price" instead, set price to 0.
                  </p>
                </div>
              </div>
            )}

            {/* INVENTORY */}
            {activeTab === 'inventory' && (
              <div className="space-y-5">
                <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">Inventory & Availability</h2>

                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.inStock}
                      onChange={(e) => updateField('inStock', e.target.checked)}
                      className="h-4 w-4 rounded border-[var(--border)] accent-[var(--success)]"
                    />
                    <span className="text-xs font-bold text-[var(--text-secondary)]">In Stock</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className={labelClass}>Stock Count</label>
                    <input
                      type="number"
                      value={form.stockCount}
                      onChange={(e) => updateField('stockCount', e.target.value)}
                      min="0"
                      className={`${getFieldClass('stockCount')} font-mono`}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Low Stock Threshold</label>
                    <input
                      type="number"
                      value={form.lowStockThreshold}
                      onChange={(e) => updateField('lowStockThreshold', e.target.value)}
                      min="0"
                      className={`${getFieldClass('lowStockThreshold')} font-mono`}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Availability</label>
                    <select
                      value={form.availability}
                      onChange={(e) => updateField('availability', e.target.value)}
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-gold)]"
                    >
                      <option value="in-stock">In Stock</option>
                      <option value="sourced">Sourced on Request</option>
                      <option value="emergency">Emergency Available</option>
                      <option value="out-of-stock">Out of Stock</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Warehouse / Location</label>
                    <input
                      type="text"
                      value={form.warehouseLocation}
                      onChange={(e) => updateField('warehouseLocation', e.target.value)}
                      placeholder="e.g. Dubai Hub, Rack A-12"
                      className={getFieldClass('warehouseLocation')}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Lead Time</label>
                    <input
                      type="text"
                      value={form.leadTime}
                      onChange={(e) => updateField('leadTime', e.target.value)}
                      placeholder="e.g. 2-3 business days"
                      className={getFieldClass('leadTime')}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* DETAILS (keyFeatures, compatibility, warranty, condition, included/excluded items) */}
            {activeTab === 'details' && (
              <div className="space-y-6">
                <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">Product Details</h2>

                {/* Key Features */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className={labelClass}>Key Features</label>
                    <button onClick={() => addArrayItem('keyFeatures')} className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-1.5 text-xs font-bold text-[var(--text-secondary)] hover:border-[var(--accent-gold)] transition-colors">
                      <Plus size={12} /> Add Feature
                    </button>
                  </div>
                  {form.keyFeatures.map((feat, i) => (
                    <div key={i} className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-[var(--text-muted)] w-6 shrink-0">{i + 1}.</span>
                      <input type="text" value={feat} onChange={(e) => updateArrayItem('keyFeatures', i, e.target.value)} placeholder="e.g. Heavy-duty construction" className={`${getFieldClass('')} flex-1`} />
                      {form.keyFeatures.length > 1 && (
                        <button onClick={() => removeArrayItem('keyFeatures', i)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-danger/5 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Condition Notes */}
                <div>
                  <label className={labelClass}>Condition Notes</label>
                  <textarea value={form.conditionNotes} onChange={(e) => updateField('conditionNotes', e.target.value)} placeholder="Notes about the item's condition (e.g. minor scratches on housing, fully tested and functional)" rows={3} className={`${getFieldClass('conditionNotes')} resize-y`} />
                </div>

                {/* Compatibility Notes */}
                <div>
                  <label className={labelClass}>Compatibility Notes</label>
                  <textarea value={form.compatibilityNotes} onChange={(e) => updateField('compatibilityNotes', e.target.value)} placeholder="Compatible engines, vessels, systems, OEM part numbers, replacements..." rows={3} className={`${getFieldClass('compatibilityNotes')} resize-y`} />
                </div>

                {/* Warranty Notes */}
                <div>
                  <label className={labelClass}>Warranty / Guarantee Notes</label>
                  <textarea value={form.warrantyNotes} onChange={(e) => updateField('warrantyNotes', e.target.value)} placeholder="e.g. 30-day functional warranty, sold as-is, etc." rows={2} className={`${getFieldClass('warrantyNotes')} resize-y`} />
                </div>

                {/* Included Items */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className={labelClass}>Included Items</label>
                    <button onClick={() => addArrayItem('includedItems')} className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-1.5 text-xs font-bold text-[var(--text-secondary)] hover:border-[var(--accent-gold)] transition-colors">
                      <Plus size={12} /> Add Item
                    </button>
                  </div>
                  {form.includedItems.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 mb-2">
                      <CheckCircle size={14} className="text-[var(--success)] shrink-0" />
                      <input type="text" value={item} onChange={(e) => updateArrayItem('includedItems', i, e.target.value)} placeholder="e.g. Mounting brackets, User manual" className={`${getFieldClass('')} flex-1`} />
                      {form.includedItems.length > 1 && (
                        <button onClick={() => removeArrayItem('includedItems', i)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-danger/5 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Excluded Items */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className={labelClass}>Excluded Items</label>
                    <button onClick={() => addArrayItem('excludedItems')} className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-1.5 text-xs font-bold text-[var(--text-secondary)] hover:border-[var(--accent-gold)] transition-colors">
                      <Plus size={12} /> Add Item
                    </button>
                  </div>
                  {form.excludedItems.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 mb-2">
                      <AlertCircle size={14} className="text-[var(--danger)] shrink-0" />
                      <input type="text" value={item} onChange={(e) => updateArrayItem('excludedItems', i, e.target.value)} placeholder="e.g. Power cable, Installation tools" className={`${getFieldClass('')} flex-1`} />
                      {form.excludedItems.length > 1 && (
                        <button onClick={() => removeArrayItem('excludedItems', i)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-danger/5 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="rounded-xl bg-[var(--surface-soft)] border border-[var(--border)] p-4">
                  <p className="text-xs text-[var(--text-muted)] flex items-center gap-2">
                    <Info size={14} />
                    These details appear on the product detail page to give buyers full information about the item.
                  </p>
                </div>
              </div>
            )}

            {/* SPECIFICATIONS */}
            {activeTab === 'specs' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">Technical Specifications</h2>
                  <button
                    onClick={addSpec}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-1.5 text-xs font-bold text-[var(--text-secondary)] hover:border-[var(--accent-gold)] transition-colors"
                  >
                    <Plus size={12} /> Add Row
                  </button>
                </div>

                {form.specs.map((spec, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <GripVertical size={14} className="text-[var(--text-muted)] shrink-0" />
                    <input
                      type="text"
                      value={spec.name}
                      onChange={(e) => updateSpec(i, 'name', e.target.value)}
                      placeholder="Specification name"
                      className={`${getFieldClass('')} flex-1`}
                    />
                    <input
                      type="text"
                      value={spec.value}
                      onChange={(e) => updateSpec(i, 'value', e.target.value)}
                      placeholder="Value"
                      className={`${getFieldClass('')} flex-1`}
                    />
                    {form.specs.length > 1 && (
                      <button
                        onClick={() => removeSpec(i)}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-danger/5 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}

                {form.specs.length === 0 && (
                  <p className="text-sm text-[var(--text-muted)] text-center py-8">
                    No specifications added yet. Click "Add Row" to start.
                  </p>
                )}
              </div>
            )}

            {/* SEO */}
            {activeTab === 'seo' && (
              <div className="space-y-5">
                <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">SEO & Search</h2>

                <div>
                  <label className={labelClass}>Meta Title</label>
                  <input
                    type="text"
                    value={form.seoTitle}
                    onChange={(e) => updateField('seoTitle', e.target.value)}
                    placeholder="SEO title (auto-filled from product name)"
                    className={getFieldClass('seoTitle')}
                  />
                  <p className="mt-1 text-[0.625rem] text-[var(--text-muted)]">
                    {form.seoTitle.length}/60 characters · {form.seoTitle.length > 60 ? 'Too long' : 'Good'}
                  </p>
                </div>

                <div>
                  <label className={labelClass}>Meta Description</label>
                  <textarea
                    value={form.seoDescription}
                    onChange={(e) => updateField('seoDescription', e.target.value)}
                    placeholder="SEO description for search results"
                    rows={3}
                    className={`${getFieldClass('seoDescription')} resize-y`}
                  />
                  <p className="mt-1 text-[0.625rem] text-[var(--text-muted)]">
                    {form.seoDescription.length}/160 characters · {form.seoDescription.length > 160 ? 'Too long' : 'Good'}
                  </p>
                </div>

                <div>
                  <label className={labelClass}>Search Keywords</label>
                  <textarea
                    value={form.searchKeywords}
                    onChange={(e) => updateField('searchKeywords', e.target.value)}
                    placeholder="Additional search keywords, part numbers, alternate names (comma-separated)"
                    rows={2}
                    className={`${getFieldClass('searchKeywords')} resize-y`}
                  />
                </div>
              </div>
            )}

            {/* ADMIN NOTES */}
            {activeTab === 'notes' && (
              <div className="space-y-5">
                <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">Admin Notes</h2>

                <div>
                  <label className={labelClass}>Internal Notes</label>
                  <textarea
                    value={form.internalNotes}
                    onChange={(e) => updateField('internalNotes', e.target.value)}
                    placeholder="Private notes for the team — not visible to customers"
                    rows={6}
                    className={`${getFieldClass('internalNotes')} resize-y`}
                  />
                </div>

                <div className="rounded-xl bg-[var(--surface-soft)] border border-[var(--border)] p-4">
                  <p className="text-xs text-[var(--text-muted)] flex items-center gap-2">
                    <Info size={14} />
                    Admin notes are only visible to staff with Inventory Manager or Owner roles.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
