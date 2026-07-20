import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, Lock, User, Eye, EyeOff, Anchor } from 'lucide-react'
import { useStore } from '../../store/useStore'

type AuthTab = 'signin' | 'signup'

interface FieldErrors {
  name?: string
  email?: string
  password?: string
  confirmPassword?: string
}

export function AuthModal() {
  const showAuthModal = useStore((s) => s.showAuthModal)
  const setShowAuthModal = useStore((s) => s.setShowAuthModal)
  const login = useStore((s) => s.login)
  const register = useStore((s) => s.register)
  const authError = useStore((s) => s.authError)

  const [activeTab, setActiveTab] = useState<AuthTab>('signin')
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Sign In fields
  const [signInEmail, setSignInEmail] = useState('')
  const [signInPassword, setSignInPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)

  // Sign Up fields
  const [signUpName, setSignUpName] = useState('')
  const [signUpEmail, setSignUpEmail] = useState('')
  const [signUpPassword, setSignUpPassword] = useState('')
  const [signUpConfirm, setSignUpConfirm] = useState('')

  const [errors, setErrors] = useState<FieldErrors>({})

  const clearAuthErrors = useStore((s) => s.clearAuthErrors)

  // Reset form state when modal opens or tab changes
  useEffect(() => {
    if (showAuthModal) {
      // Restore remembered email if available
      const remembered = localStorage.getItem('alka-remembered-email')
      if (remembered) {
        setSignInEmail(remembered)
        setRememberMe(true)
      } else {
        setSignInEmail('')
        setRememberMe(false)
      }
      setSignInPassword('')
      setSignUpName('')
      setSignUpEmail('')
      setSignUpPassword('')
      setSignUpConfirm('')
      setErrors({})
      setShowPassword(false)
      setShowConfirmPassword(false)
      clearAuthErrors()
    }
  }, [showAuthModal, clearAuthErrors])

  useEffect(() => {
    setErrors({})
    setShowPassword(false)
    setShowConfirmPassword(false)
  }, [activeTab])

  // Escape key closes modal
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowAuthModal(false)
    },
    [setShowAuthModal]
  )

  useEffect(() => {
    if (showAuthModal) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      // Only clear overflow if no other modal is open
      if (!document.querySelector('[role="dialog"], [role="alertdialog"]')) {
        document.body.style.overflow = ''
      }
    }
  }, [showAuthModal, handleKeyDown])

  if (!showAuthModal) return null

  const closeModal = () => setShowAuthModal(false)

  const handleSignIn = async () => {
    const newErrors: FieldErrors = {}
    if (!signInEmail.trim()) newErrors.email = 'Email is required'
    if (!signInPassword.trim()) newErrors.password = 'Password is required'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setSubmitting(true)
    await login(signInEmail.trim(), signInPassword)
    // Persist email if Remember Me is checked
    if (rememberMe) {
      localStorage.setItem('alka-remembered-email', signInEmail.trim())
    } else {
      localStorage.removeItem('alka-remembered-email')
    }
    setSubmitting(false)
  }

  const handleSignUp = async () => {
    const newErrors: FieldErrors = {}
    if (!signUpName.trim()) newErrors.name = 'Full name is required'
    if (!signUpEmail.trim()) newErrors.email = 'Email is required'
    if (!signUpPassword.trim()) {
      newErrors.password = 'Password is required'
    } else if (signUpPassword.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }
    if (!signUpConfirm.trim()) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (signUpPassword !== signUpConfirm) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setSubmitting(true)
    await register(signUpName.trim(), signUpEmail.trim(), signUpPassword)
    setSubmitting(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (activeTab === 'signin') handleSignIn()
    else handleSignUp()
  }

  const inputClass =
    'w-full px-4 py-3 bg-[var(--primary-bg)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:border-[var(--accent-blue)] outline-none transition-all duration-200 rounded-lg placeholder:text-[var(--text-muted)]'

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  } as const

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { type: 'spring' as const, damping: 25, stiffness: 350, delay: 0.05 },
    },
    exit: {
      opacity: 0,
      scale: 0.92,
      y: 16,
      transition: { duration: 0.18, ease: 'easeIn' as const },
    },
  } as const

  return (
    <AnimatePresence>
      {showAuthModal && (
        <motion.div
          key="auth-backdrop"
          className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center overflow-y-auto bg-black/60 backdrop-blur-sm md:backdrop-blur-md py-8 sm:py-0 px-4"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.22 }}
          onClick={closeModal}
        >
          {/* Card */}
          <motion.div
            key="auth-card"
            className="relative w-full max-w-[420px] p-8 bg-[var(--surface)] border border-[var(--border)] shadow-2xl rounded-2xl"
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 p-1.5 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--primary-bg)] transition-all duration-200"
              aria-label="Close"
            >
              <X size={18} strokeWidth={2.5} />
            </button>

            {/* Brand header */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Anchor size={22} className="text-[var(--brick-ember)]" />
                <h2 className="text-xl font-bold tracking-wide">
                  <span className="text-[var(--brick-ember)]">ALKA</span>{' '}
                  <span className="text-[var(--text-primary)]">TRADERS</span>
                </h2>
              </div>
              <p className="text-xs text-[var(--text-muted)] tracking-widest uppercase">
                Marine Equipment Specialists
              </p>
            </div>

            {/* Tabs */}
            <div className="relative flex mb-7 bg-[var(--primary-bg)] rounded-xl p-1">
              {/* Sliding indicator */}
              <motion.div
                className="absolute top-1 bottom-1 rounded-lg bg-[var(--surface)] shadow-sm"
                style={{ width: 'calc(50% - 4px)' }}
                animate={{ x: activeTab === 'signin' ? 4 : 'calc(100% + 4px)' }}
                transition={{ type: 'spring', damping: 28, stiffness: 380 }}
              />
              {(['signin', 'signup'] as AuthTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative z-10 flex-1 py-2.5 text-sm font-semibold rounded-lg transition-colors duration-200 ${
                    activeTab === tab
                      ? 'text-[var(--accent-blue)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                  }`}
                >
                  {tab === 'signin' ? 'Sign In' : 'Sign Up'}
                </button>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate>
              <AnimatePresence mode="wait">
                {activeTab === 'signin' ? (
                  <motion.div
                    key="signin-form"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    {/* Email */}
                    <div>
                      <div className="relative">
                        <Mail
                          size={16}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                        />
                        <input
                          type="email"
                          placeholder="Email address"
                          value={signInEmail}
                          onChange={(e) => {
                            setSignInEmail(e.target.value)
                            if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }))
                          }}
                          className={`${inputClass} pl-10`}
                        />
                      </div>
                      {errors.email && (
                        <motion.p
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-1.5 text-xs text-danger"
                        >
                          {errors.email}
                        </motion.p>
                      )}
                    </div>

                    {/* Password */}
                    <div>
                      <div className="relative">
                        <Lock
                          size={16}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                        />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Password"
                          value={signInPassword}
                          onChange={(e) => {
                            setSignInPassword(e.target.value)
                            if (errors.password)
                              setErrors((prev) => ({ ...prev, password: undefined }))
                          }}
                          className={`${inputClass} pl-10 pr-10`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {errors.password && (
                        <motion.p
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-1.5 text-xs text-danger"
                        >
                          {errors.password}
                        </motion.p>
                      )}
                      <div className="flex items-center justify-between mt-2">                          <label className="flex items-center gap-2 text-xs text-[var(--text-muted)] cursor-pointer">
                          <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="accent-[var(--accent-blue)] w-3.5 h-3.5 rounded" />
                          Remember me
                        </label>
                        <a href="/forgot-password" className="text-xs text-[var(--accent-blue)] hover:underline" onClick={(e) => { e.stopPropagation(); setShowAuthModal(false) }}>
                          Forgot password?
                        </a>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="signup-form"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    {/* Full Name */}
                    <div>
                      <div className="relative">
                        <User
                          size={16}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                        />
                        <input
                          type="text"
                          placeholder="Full name"
                          value={signUpName}
                          onChange={(e) => {
                            setSignUpName(e.target.value)
                            if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }))
                          }}
                          className={`${inputClass} pl-10`}
                        />
                      </div>
                      {errors.name && (
                        <motion.p
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-1.5 text-xs text-danger"
                        >
                          {errors.name}
                        </motion.p>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <div className="relative">
                        <Mail
                          size={16}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                        />
                        <input
                          type="email"
                          placeholder="Email address"
                          value={signUpEmail}
                          onChange={(e) => {
                            setSignUpEmail(e.target.value)
                            if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }))
                          }}
                          className={`${inputClass} pl-10`}
                        />
                      </div>
                      {errors.email && (
                        <motion.p
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-1.5 text-xs text-danger"
                        >
                          {errors.email}
                        </motion.p>
                      )}
                    </div>

                    {/* Password */}
                    <div>
                      <div className="relative">
                        <Lock
                          size={16}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                        />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Password (min. 8 characters)"
                          value={signUpPassword}
                          onChange={(e) => {
                            setSignUpPassword(e.target.value)
                            if (errors.password)
                              setErrors((prev) => ({ ...prev, password: undefined }))
                          }}
                          className={`${inputClass} pl-10 pr-10`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {errors.password && (
                        <motion.p
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-1.5 text-xs text-danger"
                        >
                          {errors.password}
                        </motion.p>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <div className="relative">
                        <Lock
                          size={16}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                        />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Confirm password"
                          value={signUpConfirm}
                          onChange={(e) => {
                            setSignUpConfirm(e.target.value)
                            if (errors.confirmPassword)
                              setErrors((prev) => ({ ...prev, confirmPassword: undefined }))
                          }}
                          className={`${inputClass} pl-10 pr-10`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <motion.p
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-1.5 text-xs text-danger"
                        >
                          {errors.confirmPassword}
                        </motion.p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* API Error */}
              {authError && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 text-xs text-center text-danger"
                >
                  {authError}
                </motion.p>
              )}

              {/* Submit button */}
              <motion.button
                type="submit"
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.975 }}
                disabled={submitting}
                className="w-full py-3.5 mt-7 bg-[var(--brick-ember)] text-[var(--honeydew)] font-semibold rounded-full hover:bg-btn-hover-dark transition-all duration-200 text-sm tracking-wide shadow-lg shadow-[var(--brick-ember)]/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <div className="h-5 w-5 mx-auto rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : activeTab === 'signin' ? 'Sign In' : 'Create Account'}
              </motion.button>
            </form>

            {/* Toggle text */}
            <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
              {activeTab === 'signin' ? (
                <>
                  Don&apos;t have an account?{' '}
                  <button
                    onClick={() => setActiveTab('signup')}
                    className="text-[var(--accent-blue)] font-semibold hover:underline transition-all"
                  >
                    Sign Up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    onClick={() => setActiveTab('signin')}
                    className="text-[var(--accent-blue)] font-semibold hover:underline transition-all"
                  >
                    Sign In
                  </button>
                </>
              )}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
