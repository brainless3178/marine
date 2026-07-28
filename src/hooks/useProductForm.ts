import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { admin } from '../lib/api'
import { useToast } from '../components/admin/Toast'
import type { ApiProduct, ApiBrand, ApiCategory, ApiIndustry } from '../lib/api-types'

export interface SpecRow {
  name: string
  value: string
}

export interface ProductFormData {
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

export type TabId = 'basics' | 'images' | 'pricing' | 'inventory' | 'specs' | 'details' | 'seo' | 'notes'

export const TABS: { id: TabId; label: string }[] = [
  { id: 'basics', label: 'Basics' },
  { id: 'images', label: 'Images' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'specs', label: 'Specifications' },
  { id: 'details', label: 'Details' },
  { id: 'seo', label: 'SEO' },
  { id: 'notes', label: 'Admin Notes' },
]

export function getEmptyForm(): ProductFormData {
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

export function getFormFromProduct(product: ApiProduct): ProductFormData {
  return {
    name: product.name || '',
    sku: product.sku || '',
    brand: product.brandId || (typeof product.brand === 'object' ? product.brand?.id || '' : product.brand || ''),
    category: product.categoryId || (typeof product.category === 'object' ? product.category?.id || '' : product.category || ''),
    industries: Array.isArray(product.industries)
      ? product.industries.map((i) => typeof i === 'object' ? (i.industryId || i.industry?.id || i.id || '') : i)
      : (Array.isArray(product.industryIds) ? product.industryIds : []),
    condition: product.condition || 'used',
    availability: product.availability || 'in-stock',
    shortDescription: product.shortDescription || product.description?.split('—')[0]?.trim() || '',
    description: product.description || '',
    images: Array.isArray(product.images) && product.images.length > 0
      ? product.images.map((img) => ({
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
      ? product.specs.map((s) => ({ name: s.name || '', value: String(s.value || '') }))
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

export function useProductForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEditing = !!id && id !== 'new'
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState<TabId>('basics')
  const [form, setForm] = useState<ProductFormData>(getEmptyForm())
  const [loadingProduct, setLoadingProduct] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [attempted, setAttempted] = useState(false)
  const isDirtyRef = useRef(false)

  const [brandList, setBrandList] = useState<{ id: string; name: string }[]>([])
  const [categoryList, setCategoryList] = useState<{ id: string; name: string }[]>([])
  const [industryList, setIndustryList] = useState<{ id: string; name: string }[]>([])
  const [uploadingImage, setUploadingImage] = useState(false)
  const productImageInputId = 'product-image-upload'

  // ── Effects ──

  useEffect(() => {
    let cancelled = false
    Promise.allSettled([
      admin.brands.list(),
      admin.categories.list(),
      admin.industries.list(),
    ]).then(([brandsRes, catsRes, indsRes]) => {
      if (cancelled) return
      if (brandsRes.status === 'fulfilled') {
        const val = brandsRes.value as { brands?: ApiBrand[] }
        setBrandList((val?.brands || []).map((x) => ({ id: x.id, name: x.name })))
      }
      if (catsRes.status === 'fulfilled') {
        const val = catsRes.value as { categories?: ApiCategory[] }
        setCategoryList((val?.categories || []).map((x) => ({ id: x.id || x.slug, name: x.name })))
      }
      if (indsRes.status === 'fulfilled') {
        const val = indsRes.value as { industries?: ApiIndustry[] }
        setIndustryList((val?.industries || []).map((x) => ({ id: x.id, name: x.name })))
      }
    })
    return () => { cancelled = true }
  }, [])

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

  // ── Helpers ──

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

  const updateField = useCallback(<K extends keyof ProductFormData>(field: K, value: ProductFormData[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }, [])

  const addSpec = useCallback(() => updateField('specs', [...form.specs, { name: '', value: '' }]), [form.specs, updateField])
  const removeSpec = useCallback((i: number) => updateField('specs', form.specs.filter((_, idx) => idx !== i)), [form.specs, updateField])
  const updateSpec = useCallback((i: number, field: keyof SpecRow, value: string) => {
    const specs = [...form.specs]
    specs[i] = { ...specs[i], [field]: value }
    updateField('specs', specs)
  }, [form.specs, updateField])

  type ArrayField = 'keyFeatures' | 'includedItems' | 'excludedItems'

  const addArrayItem = useCallback((field: ArrayField) => {
    updateField(field, [...form[field], ''] as string[])
  }, [form, updateField])

  const removeArrayItem = useCallback((field: ArrayField, i: number) => {
    updateField(field, form[field].filter((_: string, idx: number) => idx !== i) as string[])
  }, [form, updateField])

  const updateArrayItem = useCallback((field: ArrayField, i: number, value: string) => {
    const arr = [...form[field]]
    arr[i] = value
    updateField(field, arr as string[])
  }, [form, updateField])

  const addImage = useCallback(() => updateField('images', [...form.images, { url: '', alt: '', label: '' }]), [form.images, updateField])
  const removeImage = useCallback((i: number) => updateField('images', form.images.filter((_, idx) => idx !== i)), [form.images, updateField])
  const updateImage = useCallback((i: number, field: string, value: string) => {
    const images = [...form.images]
    images[i] = { ...images[i], [field]: value }
    updateField('images', images)
  }, [form.images, updateField])

  const toggleIndustry = useCallback((industryId: string) => {
    updateField(
      'industries',
      form.industries.includes(industryId)
        ? form.industries.filter((i) => i !== industryId)
        : [...form.industries, industryId]
    )
  }, [form.industries, updateField])

  const validate = useCallback((): Record<string, string> => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Product name is required'
    if (!form.sku.trim()) e.sku = 'SKU is required'
    if (!form.brand) e.brand = 'Brand is required'
    if (!form.category) e.category = 'Category is required'
    if (form.salePrice && form.regularPrice && Number(form.salePrice) >= Number(form.regularPrice)) {
      e.salePrice = 'Sale price must be lower than regular price'
    }
    return e
  }, [form.name, form.sku, form.brand, form.category, form.salePrice, form.regularPrice])

  const isValid = Object.keys(validate()).length === 0

  const markTouched = useCallback((field: string) => setTouched((prev) => ({ ...prev, [field]: true })), [])
  const showError = useCallback((field: string) => (attempted || touched[field]) && errors[field], [attempted, touched, errors])

  const inputBaseClass = 'w-full rounded-xl border bg-[var(--surface-soft)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition-all'

  const getFieldClass = useCallback((field: string, extra = '') => {
    const hasError = showError(field)
    return `${inputBaseClass} ${extra} ${
      hasError
        ? 'border-[var(--danger)] focus:border-[var(--danger)] focus:shadow-[0_0_0_3px_rgba(220,38,38,0.1)]'
        : 'border-[var(--border)] focus:border-[var(--accent-gold)] focus:shadow-[0_0_0_3px_rgba(232,170,36,0.1)]'
    }`
  }, [showError])

  const getSelectClass = useCallback((field: string) => {
    const hasError = showError(field)
    return `w-full rounded-xl border bg-[var(--surface-soft)] px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none ${
      hasError
        ? 'border-[var(--danger)] focus:border-[var(--danger)]'
        : 'border-[var(--border)] focus:border-[var(--accent-gold)]'
    }`
  }, [showError])

  const labelClass = 'mb-1.5 block text-[0.6875rem] font-bold uppercase tracking-wider text-[var(--text-muted)]'
  const errorClass = 'mt-1 text-[0.625rem] font-bold text-[var(--danger)] flex items-center gap-1'

  // ── Image upload ──

  const handleImageUpload = useCallback(async (file: File) => {
    setUploadingImage(true)
    try {
      const { asset } = await admin.media.upload(file)
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
  }, [form.images, updateField, updateImage, toast])

  // ── Save ──

  const handleSave = useCallback(async () => {
    const validationErrors = validate()
    setErrors(validationErrors)
    setAttempted(true)
    if (Object.keys(validationErrors).length > 0) {
      setActiveTab('basics')
      return
    }

    setSaving(true)
    try {
      const payload: Partial<ApiProduct> = {
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save product'
      if (err instanceof Error && 'details' in err && Array.isArray((err as { details?: unknown }).details)) {
        const details = (err as { details: { field: string; message: string }[] }).details
        const fieldErrors: Record<string, string> = {}
        details.forEach((d) => { fieldErrors[d.field] = d.message })
        setErrors(fieldErrors)
        setActiveTab('basics')
        toast('Please fix the highlighted field errors', 'error')
      } else {
        toast(msg, 'error')
      }
    } finally {
      setSaving(false)
    }
  }, [form, isEditing, id, navigate, toast, validate])

  return {
    id, isEditing, navigate,
    activeTab, setActiveTab,
    form, setForm,
    loadingProduct,
    saving, saved,
    errors, touched, attempted,
    brandList, categoryList, industryList,
    uploadingImage,
    productImageInputId,
    tabErrors, isValid,

    updateField,
    addSpec, removeSpec, updateSpec,
    addArrayItem, removeArrayItem, updateArrayItem,
    addImage, removeImage, updateImage,
    toggleIndustry,
    validate, markTouched, showError,
    getFieldClass, getSelectClass,
    labelClass, errorClass,
    handleSave, handleImageUpload,
  }
}
