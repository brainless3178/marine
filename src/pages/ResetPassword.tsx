import { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Lock, Eye, EyeOff, CheckCircle, Anchor } from 'lucide-react'
import { customerAuth } from '../lib/api'
import { useStore } from '../store/useStore'
import { SEO } from '../components/seo/SEO'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) { setError('Invalid or missing reset token'); return }
    if (!password) { setError('Password is required'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    if (password !== confirmPassword) { setError('Passwords do not match'); return }

    setLoading(true)
    setError('')
    try {
      await customerAuth.resetPassword(token, password)
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. The link may have expired.')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--primary-bg)] px-4">
        <div className="text-center">
          <Anchor size={32} className="text-[var(--accent-blue)] mx-auto mb-4" />
          <h2 className="font-display text-xl font-bold text-[var(--text-primary)] mb-2">Invalid Reset Link</h2>
          <p className="text-sm text-[var(--text-secondary)] mb-4">This password reset link is invalid or has expired.</p>
          <Link to="/" className="text-sm font-semibold text-[var(--accent-blue)] hover:underline">← Back to Home</Link>
        </div>
      </div>
    )
  }

  return (
    <>
      <SEO title="Reset Password — Alka Traders" description="Set a new password for your Alka Traders account." />
      <div className="min-h-screen flex items-center justify-center bg-[var(--primary-bg)] px-4 py-16">
      <div className="w-full max-w-[420px]">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Anchor size={24} className="text-[var(--accent-blue)]" />
            <span className="font-display text-xl font-bold tracking-tight text-[var(--text-primary)]">Alka Traders</span>
          </div>
          <p className="text-xs text-[var(--text-muted)] tracking-widest uppercase">Marine & Industrial Equipment</p>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8">
          {success ? (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--success)]/10 flex items-center justify-center">
                <CheckCircle size={32} className="text-[var(--success)]" />
              </div>
              <h2 className="font-display text-xl font-bold text-[var(--text-primary)] mb-2">Password Reset Successfully</h2>
              <p className="text-sm text-[var(--text-secondary)] mb-6">Your password has been updated. You can now sign in with your new password.</p>
              <button
                onClick={() => useStore.getState().setShowAuthModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--accent-blue)] text-white font-semibold text-sm rounded-full hover:bg-[var(--accent-blue)]/90 transition-all"
              >
                Sign In
              </button>
            </div>
          ) : (
            <>
              <h2 className="font-display text-xl font-bold text-[var(--text-primary)] mb-2">Set New Password</h2>
              <p className="text-sm text-[var(--text-secondary)] mb-6">Enter your new password below.</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError('') }}
                    placeholder="New password (min. 8 characters)"
                    className="w-full pl-10 pr-10 py-3 bg-[var(--primary-bg)] border border-[var(--border)] text-sm text-[var(--text-primary)] rounded-xl outline-none focus:border-accent-gold focus:shadow-focus-gold transition-all placeholder:text-[var(--text-muted)]"
                    autoFocus
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)]">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setError('') }}
                    placeholder="Confirm new password"
                    className="w-full pl-10 pr-4 py-3 bg-[var(--primary-bg)] border border-[var(--border)] text-sm text-[var(--text-primary)] rounded-xl outline-none focus:border-accent-gold focus:shadow-focus-gold transition-all placeholder:text-[var(--text-muted)]"
                  />
                </div>

                {error && <p className="text-xs text-[var(--danger)] text-center">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-[var(--accent-blue)] text-white font-semibold text-sm rounded-full hover:bg-[var(--accent-blue)]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="h-5 w-5 mx-auto rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : 'Reset Password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
      </div>
    </>
  )
}
