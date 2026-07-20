import * as Sentry from '@sentry/node'

export function initSentry() {
  const dsn = process.env.SENTRY_DSN
  if (!dsn) {
    return // Sentry not configured — skip silently
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.npm_package_version || '1.0.0',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
    integrations: [
      Sentry.httpIntegration(),
    ],
    beforeSend(event) {
      // Scrub sensitive data from error reports
      if (event.request?.headers) {
        delete event.request.headers['authorization']
        delete event.request.headers['x-csrf-token']
      }
      return event
    },
  })
}

export function captureError(error: Error, context?: Record<string, unknown>) {
  Sentry.withScope((scope) => {
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setExtra(key, value)
      })
    }
    Sentry.captureException(error)
  })
}
