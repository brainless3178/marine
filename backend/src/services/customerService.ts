import bcrypt from 'bcryptjs'
import { prisma } from '../server.js'
import { paginationParams, paginationResponse } from '../utils/helpers.js'
import { logAudit } from '../utils/audit.js'
import type { AuthUser } from '../middleware/auth.js'

// ─── Queries ──────────────────────────────────────────────────

export async function listCustomers(params: { status?: string; search?: string; page?: number; limit?: number }) {
  const { page, limit, skip } = paginationParams(params.page, params.limit)

  const where: any = {}
  if (params.status) where.status = params.status
  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: 'insensitive' } },
      { email: { contains: params.search, mode: 'insensitive' } },
      { company: { contains: params.search, mode: 'insensitive' } },
    ]
  }

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      include: { _count: { select: { orders: true, rfqs: true, offers: true } } },
      orderBy: { createdAt: 'desc' },
      skip, take: limit,
    }),
    prisma.customer.count({ where }),
  ])

  return { customers, pagination: paginationResponse(total, page, limit) }
}

export async function getCustomer(id: string) {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      orders: { orderBy: { createdAt: 'desc' }, take: 10, select: { id: true, orderNumber: true, total: true, status: true, createdAt: true } },
      rfqs: { orderBy: { createdAt: 'desc' }, take: 10 },
      _count: { select: { orders: true, rfqs: true, offers: true } },
    },
  })
  if (!customer) throw Object.assign(new Error('Customer not found'), { status: 404 })
  return customer
}

// ─── Mutations ─────────────────────────────────────────────────

export async function createCustomer(data: { name: string; email: string; password: string; phone?: string; company?: string; country?: string; city?: string; address?: string; website?: string }, actor: AuthUser, ipAddress = '') {
  const { password, ...fields } = data
  const passwordHash = await bcrypt.hash(password, 12)

  const existing = await prisma.customer.findUnique({ where: { email: data.email } })
  if (existing) throw Object.assign(new Error('Email already registered'), { status: 400 })

  const customer = await prisma.customer.create({
    data: { ...fields, passwordHash },
  })

  await logAudit({
    actor,
    action: 'customer.create',
    entityType: 'customer',
    entityId: customer.id,
    entityName: customer.name,
    newValue: { name: customer.name, email: customer.email },
    ipAddress,
  })

  return { id: customer.id, name: customer.name, email: customer.email, status: customer.status }
}

export async function updateCustomer(id: string, data: any, actor: AuthUser, ipAddress = '') {
  const existing = await prisma.customer.findUnique({ where: { id } })
  if (!existing) throw Object.assign(new Error('Customer not found'), { status: 404 })

  const customer = await prisma.customer.update({
    where: { id },
    data,
  })

  await logAudit({
    actor,
    action: 'customer.update',
    entityType: 'customer',
    entityId: customer.id,
    entityName: customer.name,
    previousValue: { status: existing.status },
    newValue: data,
    ipAddress,
  })

  return customer
}

export async function updateCustomerStatus(id: string, status: string, actor: AuthUser, ipAddress = '') {
  const customer = await prisma.customer.findUnique({ where: { id } })
  if (!customer) throw Object.assign(new Error('Customer not found'), { status: 404 })

  const updated = await prisma.customer.update({
    where: { id },
    data: { status },
  })

  await logAudit({
    actor, action: 'customer.status',
    entityType: 'customer', entityId: customer.id, entityName: customer.name,
    newValue: { status }, ipAddress,
  })

  return updated
}

export async function addCustomerNote(id: string, notes: string, actor: AuthUser, ipAddress = '') {
  const customer = await prisma.customer.findUnique({ where: { id } })
  if (!customer) throw Object.assign(new Error('Customer not found'), { status: 404 })

  const updated = await prisma.customer.update({
    where: { id },
    data: { internalNotes: notes },
  })

  await logAudit({
    actor, action: 'customer.notes',
    entityType: 'customer', entityId: customer.id, entityName: customer.name,
    ipAddress,
  })

  return { id: updated.id, internalNotes: updated.internalNotes }
}
