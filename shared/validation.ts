/**
 * Shared Zod validation schemas.
 *
 * These schemas are the single source of truth for validation rules
 * used by both frontend forms and backend request validation.
 *
 * Import from this file instead of duplicating validation logic.
 */

import { z } from 'zod'

// ─── Auth ──────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email('Invalid email address').max(254),
  password: z.string().min(1, 'Password is required').max(128),
})

export const registerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  email: z.string().email('Invalid email address').max(254),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  phone: z.string().max(30).optional(),
  company: z.string().max(200).optional(),
  country: z.string().max(100).optional(),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address').max(254),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1).max(2000),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
})

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  phone: z.string().max(30).optional(),
  company: z.string().max(200).optional(),
  country: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  address: z.string().max(500).optional(),
  website: z.string().max(200).optional(),
})

// ─── RFQ ───────────────────────────────────────────────────────

export const rfqSchema = z.object({
  fullName: z.string().min(1, 'Name is required').max(255),
  company: z.string().max(255).optional(),
  email: z.string().email('Invalid email address').max(255),
  phone: z.string().max(50).optional(),
  country: z.string().max(100).optional(),
  role: z.string().max(100).optional(),
  productDescription: z.string().min(1, 'Product description is required'),
  partNumber: z.string().max(255).optional(),
  brand: z.string().max(255).optional(),
  quantity: z.coerce.number().int().positive().optional(),
  deliveryLocation: z.string().max(255).optional(),
  urgency: z.enum(['standard', 'urgent', 'emergency']),
  notes: z.string().max(5000).optional(),
  source: z.string().max(50).optional(),
  consent: z.literal(true, { message: 'You must agree to the terms' }),
})

// ─── Contact ───────────────────────────────────────────────────

export const contactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  email: z.string().email('Invalid email address').max(255),
  subject: z.string().max(500).optional(),
  message: z.string().min(1, 'Message is required'),
})

// ─── Admin: Product ────────────────────────────────────────────

export const adminProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(500),
  sku: z.string().min(1, 'SKU is required').max(100),
  slug: z.string().max(255).optional(),
  brandId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  status: z.enum(['draft', 'published', 'archived', 'hidden']).optional(),
  availability: z.enum(['in-stock', 'sourced', 'emergency', 'out-of-stock']).optional(),
  condition: z.enum(['new', 'refurbished', 'used', 'reconditioned', 'unused']).optional(),
  shortDescription: z.string().max(1000).optional(),
  description: z.string().optional(),
  regularPrice: z.coerce.number().min(0).optional(),
  salePrice: z.coerce.number().min(0).optional(),
  stockCount: z.coerce.number().int().min(0).optional(),
  makeOfferEnabled: z.boolean().optional(),
  isNewArrival: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
})

// ─── Admin: Customer ──────────────────────────────────────────

export const adminCreateCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  email: z.string().email('Invalid email address').max(255),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().max(30).optional(),
  company: z.string().max(200).optional(),
  country: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  address: z.string().max(500).optional(),
  website: z.string().max(200).optional(),
})

export const adminUpdateCustomerSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  phone: z.string().max(30).optional(),
  company: z.string().max(200).optional(),
  country: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  address: z.string().max(500).optional(),
  website: z.string().max(200).optional(),
  status: z.enum(['active', 'inactive', 'vip', 'new']).optional(),
})

export const customerStatusSchema = z.object({
  status: z.enum(['active', 'inactive', 'vip', 'new']),
})

export const customerNotesSchema = z.object({
  notes: z.string().min(1).max(5000),
})

// ─── Admin: Order ──────────────────────────────────────────────

export const orderStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']),
  note: z.string().max(1000).optional(),
})

export const orderTrackingSchema = z.object({
  trackingNumber: z.string().min(1, 'Tracking number is required').max(100),
  courier: z.string().min(1, 'Courier is required').max(100),
})

// ─── Checkout ──────────────────────────────────────────────────

export const checkoutSchema = z.object({
  fullName: z.string().min(1, 'Name is required').max(255),
  email: z.string().email('Invalid email').max(254),
  phone: z.string().max(30).optional(),
  addressLine1: z.string().min(1, 'Address is required').max(255),
  addressLine2: z.string().max(255).optional(),
  city: z.string().min(1, 'City is required').max(100),
  state: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  country: z.string().min(1, 'Country is required').max(100),
  notes: z.string().max(2000).optional(),
})

// ─── Admin: Settings ──────────────────────────────────────────

export const storeSettingSchema = z.object({
  key: z.string().min(1).max(255),
  value: z.any(),
  category: z.string().max(100).optional(),
})

// ─── Inferred Types ───────────────────────────────────────────

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type RfqInput = z.infer<typeof rfqSchema>
export type ContactInput = z.infer<typeof contactSchema>
export type AdminProductInput = z.infer<typeof adminProductSchema>
export type CheckoutInput = z.infer<typeof checkoutSchema>
export type OrderStatusInput = z.infer<typeof orderStatusSchema>
export type OrderTrackingInput = z.infer<typeof orderTrackingSchema>
export type AdminCreateCustomerInput = z.infer<typeof adminCreateCustomerSchema>
export type AdminUpdateCustomerInput = z.infer<typeof adminUpdateCustomerSchema>
