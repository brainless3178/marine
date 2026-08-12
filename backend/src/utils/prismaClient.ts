// Load env before reading process.env below (see ./env.ts).
import './env.js'

import { createRequire } from 'node:module'
import { PrismaClient } from '@prisma/client'
import { withColdStartRetry } from './dbWake.js'

// Synchronous, *catchable* module loading. A static `import` of a package that
// isn't installed throws at module-evaluation time and cannot be recovered from,
// which would take down the whole server. require() lets us degrade gracefully.
const nodeRequire = createRequire(import.meta.url)

type DbDriver = 'neon-serverless' | 'postgres-tcp'

// Deliberately NOT `Prisma.LogLevel`. The `Prisma` namespace only carries real
// types once `prisma generate` has run; against the bare re-export stub shipped
// in @prisma/client it collapses and fails the build. This union is stable
// across every Prisma 6.x release.
type LogLevel = 'query' | 'info' | 'warn' | 'error'

// The require()-loaded adapter is opaque to us by design: we never call into it,
// we only hand it to Prisma.
type NeonAdapter = object

// Derived structurally rather than from `Prisma.PrismaClientOptions` so it stays
// correct without depending on the generated client being present.
type ClientOptions = NonNullable<ConstructorParameters<typeof PrismaClient>[0]>

// The parts of the options we actually vary. Typed precisely so both call sites
// stay genuinely checked even though buildClientOptions() casts on the way out.
type PrismaClientExtraOptions = {
  adapter?: NeonAdapter
  datasources?: { db: { url: string } }
}

const DEFAULT_CONNECT_TIMEOUT = '10'
const DEFAULT_POOL_TIMEOUT = '10'

const logConfig: LogLevel[] = process.env.NODE_ENV === 'development'
  ? ['query', 'error', 'warn']
  : ['error']

let activeDriver: DbDriver = 'postgres-tcp'

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/** Host:port only — never the user or password. Safe to log. */
function parseHost(rawUrl: string | undefined): string {
  if (!rawUrl) return 'unset'
  try {
    return new URL(rawUrl).host || 'unknown'
  } catch {
    return 'unparseable'
  }
}

/**
 * Ensure the TCP connection string fails fast. Without connect_timeout a blocked
 * port hangs until the OS gives up, which can be minutes.
 */
function withConnectTimeouts(rawUrl: string): string {
  try {
    const url = new URL(rawUrl)
    if (!url.searchParams.has('connect_timeout')) {
      url.searchParams.set('connect_timeout', DEFAULT_CONNECT_TIMEOUT)
    }
    if (!url.searchParams.has('pool_timeout')) {
      url.searchParams.set('pool_timeout', DEFAULT_POOL_TIMEOUT)
    }
    return url.toString()
  } catch {
    return rawUrl
  }
}

/**
 * Assemble the argument for `new PrismaClient()`.
 *
 * The lone cast here is deliberate and load-bearing. `adapter` appears on the
 * client's options type only *after* `prisma generate` has run, because all real
 * Prisma types live in the generated client — `@prisma/client/index.d.ts` is
 * nothing but `export * from '.prisma/client/default'`. A build host that
 * compiles against the un-generated stub (or a cached node_modules predating the
 * last Prisma upgrade) therefore rejects `adapter` at compile time even though
 * the Prisma *runtime* accepts it unconditionally.
 *
 * Keeping the cast in one function leaves the rest of the file fully
 * type-checked, and lets this be deleted outright once every build host is
 * guaranteed to generate the client first (see the postinstall hook).
 */
function buildClientOptions(extra: PrismaClientExtraOptions): ClientOptions {
  return { log: logConfig, ...extra } as ClientOptions
}

/**
 * Build a Neon driver adapter that tunnels Postgres over HTTPS/WebSocket on port
 * 443. Required on hosts that block outbound TCP 5432 (e.g. Hostinger shared
 * hosting), where a direct connection hangs forever instead of being refused.
 */
function createNeonAdapter(connectionString: string): NeonAdapter {
  const { neonConfig } = nodeRequire('@neondatabase/serverless')
  const { PrismaNeon } = nodeRequire('@prisma/adapter-neon')
  const ws = nodeRequire('ws')

  // Node has no native WebSocket constructor available to the driver, so supply one.
  neonConfig.webSocketConstructor = ws.default ?? ws

  // @prisma/adapter-neon is pinned to ^6.19, whose constructor takes a config
  // object. Deliberately no multi-signature probing: older Pool-taking versions
  // accept the wrong argument without throwing and only fail later at query
  // time, so a runtime probe cannot reliably tell the shapes apart. The shape is
  // verified instead by a smoke test against the installed version.
  return new PrismaNeon({ connectionString })
}

function buildPrismaClient(): PrismaClient {
  const rawUrl = process.env.DATABASE_URL
  const forced = process.env.DB_DRIVER
  const looksLikeNeon = parseHost(rawUrl).includes('.neon.tech')
  const useNeon = forced === 'neon-http' || (looksLikeNeon && forced !== 'tcp')

  if (useNeon && rawUrl) {
    try {
      const adapter = createNeonAdapter(rawUrl)
      activeDriver = 'neon-serverless'
      return new PrismaClient(buildClientOptions({ adapter }))
    } catch (error) {
      // Fall through to TCP rather than crashing: a partially working API that
      // reports the real problem beats a boot loop.
      process.stderr.write(
        `WARN: Neon serverless driver unavailable, falling back to TCP. ${errorMessage(error)}\n`,
      )
    }
  }

  activeDriver = 'postgres-tcp'
  return new PrismaClient(
    buildClientOptions(
      rawUrl ? { datasources: { db: { url: withConnectTimeouts(rawUrl) } } } : {},
    ),
  )
}

/**
 * Base client — no retry wrapper. Used by the health/wake endpoints so their
 * own wake loop isn't nested inside the extension's retry.
 */
export const rawPrisma = buildPrismaClient()

/**
 * App-wide client. Every query (model + raw) is wrapped in a single cold-start
 * retry: when Neon's free tier has scaled the compute to zero, the first query
 * after idle fails — the failed attempt wakes the compute, and the retry a
 * second later succeeds. Without this, the first visitor after ~5 minutes of
 * inactivity hits a 5xx on every route, not just /api/health.
 */
// One retry of the same shape for every query: attempts = 3 with 800ms/1.6s
// backoff covers a slow (multi-second) compute wake; healthy-DB queries pay
// zero overhead because the first attempt succeeds.
//
// Retrying writes (create/update/delete) is safe here: Neon only suspends an
// *idle* compute, and a cold-start failure means the connection died before the
// query was sent — so the retry re-runs work that never executed. It never
// double-applies a write, and non-cold-start errors are never retried.
const retryQuery = <T>(fn: () => Promise<T>): Promise<T> =>
  withColdStartRetry(fn, { attempts: 3, baseDelayMs: 800 })

export const prisma = rawPrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ args, query }) {
        return retryQuery(() => query(args))
      },
    },
    // Raw operations take a single callback receiving { args, query }.
    // See DynamicQueryExtensionCb in @prisma/client runtime types.
    $queryRaw: async ({ args, query }) => retryQuery(() => query(args)),
    $queryRawUnsafe: async ({ args, query }) => retryQuery(() => query(args)),
    $executeRaw: async ({ args, query }) => retryQuery(() => query(args)),
    $executeRawUnsafe: async ({ args, query }) => retryQuery(() => query(args)),
  },
})

/** Which driver ended up active, for the startup banner and error messages. */
export function describeDbDriver(): string {
  return activeDriver === 'neon-serverless'
    ? 'neon-serverless (HTTPS/WebSocket, port 443)'
    : 'postgres-tcp (port 5432)'
}

/** Redacted database host — safe to write to logs. */
export function getRedactedDbHost(): string {
  return parseHost(process.env.DATABASE_URL)
}
