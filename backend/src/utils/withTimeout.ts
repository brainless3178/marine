/**
 * Bound a promise with a hard timeout.
 *
 * A firewall that silently drops TCP packets (rather than refusing the
 * connection) leaves database calls pending indefinitely: they never resolve and
 * never reject. Wrapping them here converts that invisible hang into a fast,
 * loud, diagnosable error.
 */
export function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined

  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    // Don't let a pending timer hold the event loop open during shutdown.
    timer.unref()
  })

  // If the timeout wins, the original promise may still reject later.
  // Promise.race doesn't suppress that, so it would surface as an
  // unhandledRejection and could crash the process. Swallow it explicitly.
  promise.catch(() => {})

  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer)
  })
}
