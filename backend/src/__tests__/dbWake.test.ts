import { describe, it, expect, vi } from 'vitest'

const dbWake = await import('../utils/dbWake.js')

describe('isColdStartError', () => {
  it('matches Prisma connection error codes', () => {
    expect(dbWake.isColdStartError(new Error('P1001: Can\'t reach database server'))).toBe(true)
    expect(dbWake.isColdStartError(new Error('P1002: The database server timed out'))).toBe(true)
    expect(dbWake.isColdStartError(new Error('P1017: Server has closed the connection'))).toBe(true)
    expect(dbWake.isColdStartError(new Error('P2024: Timed out fetching a new connection from the pool'))).toBe(true)
  })

  it('matches Node network error codes', () => {
    const err: any = new Error('connect ECONNREFUSED 0.0.0.0:5432')
    err.code = 'ECONNREFUSED'
    expect(dbWake.isColdStartError(err)).toBe(true)
    expect(dbWake.isColdStartError(new Error('read ECONNRESET'))).toBe(true)
    expect(dbWake.isColdStartError(new Error('connect ETIMEDOUT'))).toBe(true)
  })

  it('matches Postgres/Neon wake-up messages', () => {
    expect(dbWake.isColdStartError(new Error('Connection terminated due to connection timeout'))).toBe(true)
    expect(dbWake.isColdStartError(new Error('the database system is starting up'))).toBe(true)
    expect(dbWake.isColdStartError(new Error('Neon: compute is starting, retry the request'))).toBe(true)
    expect(dbWake.isColdStartError(new Error('Connection pool timeout (pool is full)'))).toBe(true)
    expect(dbWake.isColdStartError(new Error('all server connections are in use'))).toBe(true)
  })

  it('does NOT match genuine query failures', () => {
    expect(dbWake.isColdStartError(new Error('P2002: Unique constraint failed on the fields (`sku`)'))).toBe(false)
    expect(dbWake.isColdStartError(new Error('P2025: Record not found'))).toBe(false)
    expect(dbWake.isColdStartError(new Error('syntax error at or near "SELECT"'))).toBe(false)
    expect(dbWake.isColdStartError(new Error('boom'))).toBe(false)
    expect(dbWake.isColdStartError('not an error object')).toBe(false)
  })
})

describe('withColdStartRetry', () => {
  it('returns immediately when the first attempt succeeds', async () => {
    const fn = vi.fn().mockResolvedValue('ok')
    await expect(dbWake.withColdStartRetry(fn, { baseDelayMs: 1 })).resolves.toBe('ok')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('retries once and succeeds when the first attempt hits a cold start', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('P1001: Can\'t reach database server'))
      .mockResolvedValueOnce('recovered')
    await expect(dbWake.withColdStartRetry(fn, { baseDelayMs: 1 })).resolves.toBe('recovered')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('rethrows non-cold-start errors immediately without retrying', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('P2002: Unique constraint failed'))
    await expect(dbWake.withColdStartRetry(fn, { baseDelayMs: 1 })).rejects.toThrow('P2002')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('throws after exhausting attempts when the DB never wakes', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('ECONNRESET'))
    await expect(dbWake.withColdStartRetry(fn, { attempts: 3, baseDelayMs: 1 })).rejects.toThrow('ECONNRESET')
    expect(fn).toHaveBeenCalledTimes(3)
  })
})

describe('wakeDatabase', () => {
  it('resolves when the query succeeds on the first attempt', async () => {
    const execute = vi.fn().mockResolvedValue([{ '?column?': 1 }])
    await expect(dbWake.wakeDatabase(execute, { baseDelayMs: 1 })).resolves.toBeUndefined()
    expect(execute).toHaveBeenCalledTimes(1)
  })

  it('retries after a cold-start failure and succeeds', async () => {
    const execute = vi
      .fn()
      .mockRejectedValueOnce(new Error('Connection terminated due to connection timeout'))
      .mockResolvedValueOnce([{ '?column?': 1 }])
    await expect(dbWake.wakeDatabase(execute, { baseDelayMs: 1 })).resolves.toBeUndefined()
    expect(execute).toHaveBeenCalledTimes(2)
  })

  it('retries when an attempt exceeds its timeout budget (waking compute)', async () => {
    // Simulates withTimeout rejecting with the label-based timeout error.
    const execute = vi
      .fn()
      .mockRejectedValueOnce(new Error('db-wake-query timed out after 5000ms'))
      .mockResolvedValueOnce([{ '?column?': 1 }])
    await expect(dbWake.wakeDatabase(execute, { baseDelayMs: 1 })).resolves.toBeUndefined()
    expect(execute).toHaveBeenCalledTimes(2)
  })

  it('does not retry genuine failures', async () => {
    const execute = vi.fn().mockRejectedValue(new Error('relation "products" does not exist'))
    await expect(dbWake.wakeDatabase(execute, { baseDelayMs: 1 })).rejects.toThrow('relation')
    expect(execute).toHaveBeenCalledTimes(1)
  })

  it('throws after exhausting attempts', async () => {
    const execute = vi.fn().mockRejectedValue(new Error('ECONNRESET'))
    await expect(dbWake.wakeDatabase(execute, { attempts: 2, baseDelayMs: 1 })).rejects.toThrow('ECONNRESET')
    expect(execute).toHaveBeenCalledTimes(2)
  })
})
