export type ProductCategory =
  | 'marine'
  | 'electrical'
  | 'hydraulic'
  | 'pneumatic'
  | 'spares'
  | 'surplus'
  | 'lifting-handling'
  | 'tools-equipment'
  | 'safety'
  | 'hand-tools'
  | 'ship-navigation'
  | 'marine-pumps'
  | 'engine-spare'
  | 'engine-parts'
  | 'motor-components'
  | 'ship-machinery'
  | 'hydraulic-pumps'
  | 'rigging'
  | 'other-business'

export type Availability = 'in-stock' | 'sourced' | 'emergency' | 'out-of-stock'

export type Urgency = 'standard' | 'urgent' | 'emergency'

export type Language = 'en' | 'ar' | 'es'

export interface ProductImage {
  url: string
  alt: string
  label?: string
}

export interface Product {
  id: string
  filename: string
  name: string
  brand: string
  sku: string
  category: ProductCategory
  industry: string[]
  availability: Availability
  specs: Record<string, string>
  // New fields
  description: string
  condition: 'new' | 'refurbished' | 'used' | 'reconditioned' | 'unused'
  price: number
  salePrice?: number
  onSale?: boolean
  inStock: boolean
  stockCount: number
  customLabel?: string
  customLabelColor?: string
  images: ProductImage[]
  isNewArrival?: boolean
  dateAdded?: string
  makeOffer?: boolean
  seoKeywords?: string[]
}

export interface Brand {
  id: string
  name: string
  slug: string
  sectors: string[]
  productCount: number
  logo?: string
}

export interface Industry {
  id: string
  name: string
  icon: string
  description: string
  painPoints: string[]
  productCount: number
}

export interface Testimonial {
  id: string
  name: string
  role: string
  company: string
  avatar: string
  text: string
  rating: number
}

export interface Office {
  city: string
  country: string
  address: string
  timezone: string
  phone: string
  email: string
  coordinates: [number, number]
}

export interface TimelineEvent {
  year: string
  title: string
  description: string
}

export interface TeamMember {
  name: string
  role: string
  initials: string
}

export interface RFQFormData {
  // Step 1
  fullName: string
  company: string
  email: string
  phone: string
  country: string
  role: string
  // Step 2
  productDesc: string
  partNumber: string
  brand: string
  quantity: number
  deliveryLocation: string
  // Step 3
  urgency: Urgency
  notes: string
  source: string
  consent: boolean
}

export interface FAQItem {
  question: string
  answer: string
}

export interface SearchResult {
  id: string
  type: 'product' | 'page' | 'category'
  title: string
  description: string
  path: string
}

export interface CartItem {
  product: Product
  quantity: number
}

export interface User {
  name: string
  email: string
}

export interface ShippingAddress {
  fullName: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  postalCode: string
  country: string
}

export interface OrderSummary {
  orderId: string
  items: CartItem[]
  shipping: ShippingAddress
  paymentMethod: string
  subtotal: number
  shippingCost: number
  tax: number
  total: number
  estimatedDelivery: string
  status?: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  cancelRequested?: boolean
}

export interface PriceRange {
  min: number
  max: number
}
