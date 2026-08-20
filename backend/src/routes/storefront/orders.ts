import { Router } from 'express'
import { authenticateCustomer, optionalCustomerAuth, AuthRequest } from '../../middleware/auth.js'
import { asyncHandler, validateBody, validateParams } from '../../middleware/validate.js'
import { z } from 'zod'
import { sendSuccess, sendError } from '../../middleware/response.js'
import * as orderService from '../../services/orderService.js'

const router = Router()

const shippingSchema = z.object({
  fullName: z.string().min(1),
  addressLine1: z.string().min(1),
  addressLine2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().min(1),
})

const orderParamsSchema = z.object({
  id: z.string().uuid(),
})

const orderSchema = z.object({
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive(),
  })).min(1),
  shipping: shippingSchema,
  paymentMethod: z.enum(['bank-transfer', 'paypal']),
  customerNotes: z.string().optional(),
  idempotencyKey: z.string().max(200).optional(),
})

// ─── Create Order from Checkout ────────────────────────────────
// Accepts both logged-in and guest checkouts. When no auth token is
// present, customerId is omitted and the order is stored as a guest order.
router.post('/', optionalCustomerAuth, validateBody(orderSchema), asyncHandler(async (req: AuthRequest, res) => {
  try {
    const order = await orderService.createOrder({
      ...req.body,
      customerId: req.user?.id ?? null,
    })
    sendSuccess(res, { order }, 201)
  } catch (err: unknown) {
    const e = err as { message?: string; status?: number }
    sendError(res, e.message || 'Failed to create order', e.status || 500)
  }
}))

// ─── List Own Orders ──────────────────────────────────────────
router.get('/', authenticateCustomer, asyncHandler(async (req: AuthRequest, res) => {
  const page = Math.max(1, Number(req.query.page) || 1)
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20))
  const result = await orderService.listCustomerOrders(req.user!.id, page, limit)
  sendSuccess(res, result)
}))

// ─── Get Order (own orders only) ───────────────────────────────
router.get('/:id', authenticateCustomer, validateParams(orderParamsSchema), asyncHandler(async (req: AuthRequest, res) => {
  try {
    const order = await orderService.getCustomerOrder(req.params.id as string, req.user!.id)
    sendSuccess(res, { order })
  } catch (err: unknown) {
    const e = err as { message?: string; status?: number }
    sendError(res, e.message || 'Order not found', e.status || 404)
  }
}))

// ─── Request Cancellation ──────────────────────────────────────
router.post('/:id/cancel', authenticateCustomer, validateParams(orderParamsSchema), asyncHandler(async (req: AuthRequest, res) => {
  try {
    const order = await orderService.requestOrderCancellation(
      req.params.id as string,
      req.user!.id,
      req.body.reason
    )
    sendSuccess(res, { order })
  } catch (err: unknown) {
    const e = err as { message?: string; status?: number }
    sendError(res, e.message || 'Cancellation failed', e.status || 400)
  }
}))

export default router
