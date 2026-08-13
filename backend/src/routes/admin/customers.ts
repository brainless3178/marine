import { Router } from 'express'
import { authenticateAdmin, requireRole, AuthRequest } from '../../middleware/auth.js'
import { asyncHandler, validateBody, validateParams } from '../../middleware/validate.js'
import { z } from 'zod'
import * as customerService from '../../services/customerService.js'
import { sendSuccess, sendError } from '../../middleware/response.js'

const router = Router()
router.use(authenticateAdmin)
router.use(requireRole('sales-agent'))

const createCustomerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
  company: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  website: z.string().optional(),
})

const updateCustomerSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  website: z.string().optional(),
  status: z.enum(['active', 'inactive', 'vip', 'new']).optional(),
})

const notesSchema = z.object({
  notes: z.string().min(1).max(5000),
})

const statusUpdateSchema = z.object({
  status: z.enum(['active', 'inactive', 'vip', 'new']),
})

const customerParamsSchema = z.object({
  id: z.string().uuid(),
})

// ─── List All Customers ────────────────────────────────────────
router.get('/', asyncHandler(async (req, res) => {
  const result = await customerService.listCustomers({
    status: req.query.status as string,
    search: req.query.search as string,
    page: Number(req.query.page),
    limit: Number(req.query.limit),
  })
  sendSuccess(res, result)
}))

// ─── Get Customer Detail ───────────────────────────────────────
router.get('/:id', validateParams(customerParamsSchema), asyncHandler(async (req, res) => {
  try {
    const customer = await customerService.getCustomer(req.params.id as string)
    sendSuccess(res, { customer })
  } catch (err: any) {
    sendError(res, err.message, err.status || 500)
  }
}))

// ─── Create Customer ───────────────────────────────────────────
router.post('/', validateBody(createCustomerSchema), asyncHandler(async (req: AuthRequest, res) => {
  try {
    const customer = await customerService.createCustomer(req.body, req.user!, req.ip || '')
    sendSuccess(res, { customer }, 201)
  } catch (err: any) {
    sendError(res, err.message, err.status || 500)
  }
}))

// ─── Update Customer ───────────────────────────────────────────
router.patch('/:id', validateParams(customerParamsSchema), validateBody(updateCustomerSchema), asyncHandler(async (req: AuthRequest, res) => {
  try {
    const customer = await customerService.updateCustomer(req.params.id as string, req.body, req.user!, req.ip || '')
    sendSuccess(res, { customer })
  } catch (err: any) {
    sendError(res, err.message, err.status || 500)
  }
}))

// ─── Update Customer Status ────────────────────────────────────
router.patch('/:id/status', validateParams(customerParamsSchema), validateBody(statusUpdateSchema), asyncHandler(async (req: AuthRequest, res) => {
  try {
    const customer = await customerService.updateCustomerStatus(req.params.id as string, req.body.status, req.user!, req.ip || '')
    sendSuccess(res, { customer })
  } catch (err: any) {
    sendError(res, err.message, err.status || 500)
  }
}))

// ─── Add Internal Note ─────────────────────────────────────────
router.post('/:id/notes', validateParams(customerParamsSchema), validateBody(notesSchema), asyncHandler(async (req: AuthRequest, res) => {
  try {
    const result = await customerService.addCustomerNote(req.params.id as string, req.body.notes, req.user!, req.ip || '')
    sendSuccess(res, { customer: result })
  } catch (err: any) {
    sendError(res, err.message, err.status || 500)
  }
}))

export default router
