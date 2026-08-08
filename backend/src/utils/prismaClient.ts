// Load env before reading process.env below (see ./env.ts).
import './env.js'

import { createRequire } from 'node:module'
import { PrismaClient, type Prisma } from '@prisma/client'

// Synchronous, *catchable* module loading. A static `import` of a package that
// isn't installed throws at module-evaluation time and cannot be recovered from,
// which would take down the whole server. require() lets us degrade gracefully.
const nodeRequire = createRequire(import.meta.url)

type DbDriver = 'neon-serverless' | 'postgres-tcp'

// The adapter is loaded via createRequire (see below), so it arrives untyped.
// Naming the option's own type keeps the PrismaClient call site type-checked.
type PrismaAdapter = NonNullable<Prisma.PrismaClientOptions['adapter']>

const DEFAULT_CONNECT_TIMEOUT = '10'
const DEFAULT_POOL_TIMEOUT = '10'

const logConfig: Prisma.LogLevel[] = process.env.NODE_ENV === 'development'
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
 * Build a Neon driver adapter that tunnels Postgres over HTTPS/WebSocket on port
 * 443. Required on hosts that block outbound TCP 5432 (e.g. Hostinger shared
 * hosting), where a direct connection hangs forever instead of being refused.
 */
function createNeonAdapter(connectionString: string): PrismaAdapter {
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
  return new PrismaNeon({ connectionString }) as PrismaAdapter
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
      return new PrismaClient({ adapter, log: logConfig })
    } catch (error) {
      // Fall through to TCP rather than crashing: a partially working API that
      // reports the real problem beats a boot loop.
      process.stderr.write(
        `WARN: Neon serverless driver unavailable, falling back to TCP. ${errorMessage(error)}\n`,
      )
    }
  }

  activeDriver = 'postgres-tcp'
  return new PrismaClient({
    log: logConfig,
    ...(rawUrl ? { datasources: { db: { url: withConnectTimeouts(rawUrl) } } } : {}),
  })
}

export const prisma = buildPrismaClient()

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
