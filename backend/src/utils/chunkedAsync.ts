import { setImmediate as nodeSetImmediate } from 'node:timers/promises'

/**
 * Process a large array without starving the event loop.
 *
 * Runs `fn` over every item but yields (via setImmediate) every `chunkSize`
 * items, so timers, sockets, and other in-flight requests stay responsive
 * during big loops (bulk imports, report generation, email fan-out).
 *
 * Usage:
 *   await forEachChunked(products, 25, async (p) => {
 *     await generateThumbnail(p)
 *   })
 */
export async function forEachChunked<T>(
  items: readonly T[],
  chunkSize: number,
  fn: (item: T, index: number) => Promise<void> | void,
): Promise<void> {
  const step = Math.max(1, chunkSize)
  for (let i = 0; i < items.length; i++) {
    await fn(items[i], i)
    if ((i + 1) % step === 0) {
      await nodeSetImmediate() // Let the event loop breathe between chunks.
    }
  }
}
