import pino from 'pino'

const isDevelopment = process.env.NODE_ENV !== 'production'

const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  transport: isDevelopment ? { target: 'pino/file', options: { destination: 1 } } : undefined,
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
  redact: {
    paths: ['req.headers.authorization', 'req.headers["x-csrf-token"]', 'password', 'passwordHash', 'token', 'refreshToken', 'secretKey', 'webhookSecret', 'clientSecret'],
    censor: '[REDACTED]',
  },
})

// ─── Child Loggers for Specific Domains ───────────────────────

export function createContextLogger(context: string) {
  return logger.child({ context })
}

export const authLogger = createContextLogger('auth')
export const dbLogger = createContextLogger('database')
export const emailLogger = createContextLogger('email')
export const webhookLogger = createContextLogger('webhook')
export const apiLogger = createContextLogger('api')
export const startupLogger = createContextLogger('startup')

export default logger
