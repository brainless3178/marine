/**
 * Neon free-tier cold-start handling.
 *
 * Neon's free plan scales the database compute to zero after ~5 minutes of
 * inactivity. The first query after a suspend has to wait for the compute to
 * wake (typically 1–5s, occasionally longer), and that first connection often
 * fails with a timeout, a reset, or a "server is starting" message. Without
 * handling this, the API returns 503/"disconnected" exactly when the site is
 * first visited after idle — the free-tier cold-start problem.
 *
 * These helpers detect cold-start-class failures and retry after a short delay.
 * The failed attempt itself is what triggers the wake, so the retry a second or
 * two later usually succeeds. A dedicated wake loop (see `wakeDatabase`) is used
 * by the health / wake endpoints so a single request can absorb the wake and
 * report success once the compute is back.
 */
import { dbLogger } from './logger.js'
import { withTimeout } from './withTimeout.js'

// ─── Cold-start failure detection ─────────────────────────────

const COLD_START_PATTERNS: RegExp[] = [
  // Prisma error codes — https://www.prisma.io/docs/orm/reference/error-reference
  /P1001/, // Cannot reach the database server
  /P1002/, // Database server timed out
  /P1017/, // Server has closed the connection
  /P2024/, // Connection pool timeout
  // Node network error codes
  /ECONNREFUSED/,
  /ECONNRESET/,
  /EPIPE/,
  /ETIMEDOUT/,
  /EAI_AGAIN/,
  // Postgres / Neon messages emitted while a compute wakes up
  /connection terminated/i,
  /connection timeout/i,
  /connection refused/i,
  /server closed the connection/i,
  /terminating connection/i,
  /pool timeout/i,
  /pool is full/i,
  /all server connections are in use/i,
  /database system is starting up/i,
  /compute is starting/i,
  /database is starting/i,
  /is suspended/i,
  /temporarily unavailable/i,
]

/**
 * True when the error looks like a Neon cold start or a dropped idle
 * connection (both retryable) rather than a genuine query/SQL failure.
 */
export function isColdStartError(error: unknown): boolean {
  const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error)
  return COLD_START_PATTERNS.some((pattern) => pattern.test(message))
}

// ─── Retry helpers ────────────────────────────────────────────

export interface RetryOptions {
  /** Total attempts including the first. Default 2 (one retry). */
  attempts?: number
  /** Delay before the first retry; doubled per attempt. Default 1200ms. */
  baseDelayMs?: number
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

/**
 * Run `fn`, retrying only when the failure looks like a Neon cold start or a
 * dropped idle connection. The first (failed) attempt triggers the compute
 * wake, so retrying after a short backoff lets the same query succeed.
 *
 * Non-cold-start errors (SQL errors, unique violations, 4xx from the data) are
 * rethrown immediately — we never retry real bugs.
 */
export async function withColdStartRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const attempts = options.attempts ?? 2
  const baseDelayMs = options.baseDelayMs ?? 1200
  let lastError: unknown

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (!isColdStartError(error) || attempt === attempts) throw error
      const delayMs = baseDelayMs * 2 ** (attempt - 1)
      dbLogger.warn({ attempt, attempts, delayMs }, 'Database cold start detected, retrying after wake delay')
      await sleep(delayMs)
    }
  }

  // Unreachable: the loop either returns or throws on the final attempt.
  throw lastError
}

export interface WakeOptions {
  /** Total attempts including the first. Default 3. */
  attempts?: number
  /** Backoff before the first retry; doubled per attempt. Default 500ms. */
  baseDelayMs?: number
  /** Hard timeout for a single attempt. Default 5s. */
  attemptTimeoutMs?: number
}

/**
 * Dedicated wake loop: run `execute` (typically `SELECT 1`) with a per-attempt
 * timeout, retrying on cold-start failures AND on timeouts — a waking compute
 * can take longer than one attempt's budget. Used by /api/health and /api/wake
 * so a single request waits out the wake and reports success afterwards.
 */
export async function wakeDatabase(execute: () => Promise<unknown>, options: WakeOptions = {}): Promise<void> {
  const attempts = options.attempts ?? 3
  const baseDelayMs = options.baseDelayMs ?? 500
  const attemptTimeoutMs = options.attemptTimeoutMs ?? 5_000
  let lastError: unknown

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      await withTimeout(execute(), attemptTimeoutMs, 'db-wake-query')
      return
    } catch (error) {
      lastError = error
      const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error)
      const retryable = isColdStartError(error) || /timed out after/i.test(message)
      if (!retryable || attempt === attempts) throw error
      const delayMs = baseDelayMs * 2 ** (attempt - 1)
      dbLogger.warn({ attempt, attempts, delayMs }, 'Database waking (Neon scale-to-zero), retrying')
      await sleep(delayMs)
    }
  }

  // Unreachable: the loop either returns or throws on the final attempt.
  throw lastError
}
