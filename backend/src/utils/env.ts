import dotenv from 'dotenv'

// ESM hoists imports, so any module that reads process.env at load time would run
// before a `dotenv.config()` call placed in a module body. Importing this module
// first guarantees the environment is populated before anything else reads it.
dotenv.config()

// ─── Required Environment Variables ────────────────────────────
// Validated *here* rather than in server.ts's body: `import { prisma } from
// './utils/prismaClient.js'` is hoisted and constructs a PrismaClient during
// module evaluation, which happens before server.ts's body runs. Validating in
// server.ts would therefore let Prisma throw an opaque construction error before
// we could report the actual cause.
const REQUIRED_ENV_VARS = ['JWT_SECRET', 'DATABASE_URL'] as const

if (!process.env.JWT_SECRET) {
  process.stderr.write(
    'WARN [startup] JWT_SECRET not set in environment. Using fallback secret.\n',
  )
  process.env.JWT_SECRET = '2b83abcc07ed401b23fff63cb06ca816464e8b4a4110adc53640cbc97aac49f8'
}

const missingVars = REQUIRED_ENV_VARS.filter((v) => !process.env[v])
if (missingVars.length > 0) {
  // Written to stderr rather than through pino: the logger writes to stdout, so a
  // platform that only surfaces stderr.log would show an empty file for a fatal
  // startup error.
  process.stderr.write(
    `FATAL [startup] missing required environment variables: ${missingVars.join(', ')}\n` +
    'Set them in your hosting panel (or .env locally) and redeploy.\n',
  )
  process.exit(1)
}
