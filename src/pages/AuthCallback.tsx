import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { handleAuthCallback } from '../lib/neon-auth'
import { useStore } from '../store/useStore'

/**
 * Auth Callback Page
 *
 * Handles the redirect back from Google OAuth → Neon Auth → our app.
 * Extracts session tokens, validates them, and redirects the user.
 */
export function AuthCallback() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState('')

  // Access store actions
  const loadCustomerSession = useStore((s) => s.loadCustomerSession)

  useEffect(() => {
    let mounted = true

    async function processCallback() {
      try {
        setStatus('loading')

        // Process the OAuth callback — extracts tokens and validates session
        const session = await handleAuthCallback()

        if (!mounted) return

        if (session?.user) {
          setStatus('success')
          // Reload customer session in the store to update UI
          await loadCustomerSession()

          if (!mounted) return

          // Redirect to homepage after a brief moment
          setTimeout(() => {
            if (mounted) {
              navigate('/', { replace: true })
            }
          }, 1000)
        } else {
          setStatus('error')
          setError('Authentication failed. Please try signing in again.')
        }
      } catch (err: any) {
        if (!mounted) return
        setStatus('error')
        setError(err.message || 'An unexpected error occurred during authentication.')
      }
    }

    processCallback()

    return () => {
      mounted = false
    }
  }, [navigate, loadCustomerSession])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--primary-bg)] px-4">
      <div className="max-w-sm w-full text-center">
        {status === 'loading' && (
          <>
            <div className="h-10 w-10 mx-auto mb-4 rounded-full border-3 border-[var(--border)] border-t-[var(--accent-blue)] animate-spin" />
            <h1 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
              Signing you in...
            </h1>
            <p className="text-sm text-[var(--text-muted)]">
              Verifying your Google account. This won&apos;t take long.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="h-10 w-10 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
              <svg
                className="h-5 w-5 text-emerald-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
              Welcome back!
            </h1>
            <p className="text-sm text-[var(--text-muted)]">
              Redirecting you to the homepage...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="h-10 w-10 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <svg
                className="h-5 w-5 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
              Authentication Failed
            </h1>
            <p className="text-sm text-[var(--text-muted)] mb-4">{error}</p>
            <button
              onClick={() => navigate('/', { replace: true })}
              className="px-6 py-2.5 bg-[var(--accent-blue)] text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity"
            >
              Go to Homepage
            </button>
          </>
        )}
      </div>
    </div>
  )
}
