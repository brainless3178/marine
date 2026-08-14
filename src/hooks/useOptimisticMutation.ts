import { useCallback, useEffect, useRef, useState } from 'react'

interface UseOptimisticMutationOptions<TArgs, TSnapshot> {
  /** The real API call. Runs after the optimistic UI change is applied. */
  mutationFn: (args: TArgs) => Promise<unknown>
  /** Paint the change immediately — before the server confirms. */
  optimistic: (args: TArgs) => void
  /** Capture the current UI state so it can be restored on failure. */
  snapshot: () => TSnapshot
  /** Restore the captured state when the mutation fails (rollback). */
  restore: (snapshot: TSnapshot) => void
  /** Optional success hook — e.g. toast + refetch server truth. */
  onSuccess?: (args: TArgs) => void
  /** Optional failure hook — e.g. toast the rollback message. */
  onError?: (error: Error, args: TArgs) => void
}

/**
 * Optimistic mutation with safe rollback.
 *
 * Flow: snapshot current UI → apply optimistic change → fire the API call →
 * on success keep the optimistic state (optionally resync via onSuccess);
 * on failure restore the snapshot so the UI never lies about server state.
 *
 * Usage (delete a row from a list):
 *   const { mutate, pending } = useOptimisticMutation<string, AdminProduct[]>({
 *     mutationFn: (id) => admin.products.delete(id),
 *     optimistic: (id) => setList(prev => prev.filter(p => p.id !== id)),
 *     snapshot: () => listRef.current,
 *     restore: (prev) => setList(prev),
 *     onSuccess: () => refetch(),
 *   })
 */
export function useOptimisticMutation<TArgs, TSnapshot>({
  mutationFn,
  optimistic,
  snapshot,
  restore,
  onSuccess,
  onError,
}: UseOptimisticMutationOptions<TArgs, TSnapshot>) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const snapshotRef = useRef<TSnapshot | undefined>(undefined)

  // Keep the latest options in a ref so `mutate` never closes over stale
  // state (list state, callbacks) captured at hook creation time. The ref is
  // synced in an effect (after commit), never during render.
  const optsRef = useRef({ mutationFn, optimistic, snapshot, restore, onSuccess, onError })
  useEffect(() => {
    optsRef.current = { mutationFn, optimistic, snapshot, restore, onSuccess, onError }
  })

  const mutate = useCallback(async (args: TArgs) => {
    const { mutationFn: run, optimistic: apply, snapshot: snap, restore: rollback, onSuccess: success, onError: fail } = optsRef.current

    snapshotRef.current = snap()
    apply(args) // Optimistic update: UI responds before the network does.
    setPending(true)
    setError(null)

    try {
      await run(args)
      success?.(args)
    } catch (err) {
      // Roll back to the pre-mutation state — the server rejected the change.
      if (snapshotRef.current !== undefined) rollback(snapshotRef.current)
      const error = err instanceof Error ? err : new Error('Request failed')
      setError(error.message)
      fail?.(error, args)
    } finally {
      setPending(false)
    }
  }, [])

  return { mutate, pending, error }
}
