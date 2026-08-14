import { Navigate } from 'react-router-dom'
import { useStore } from '../../store/useStore'

interface AdminGuardProps {
  children: React.ReactNode
}

export function AdminGuard({ children }: AdminGuardProps) {
  const isAdminLoggedIn = useStore((s) => s.isAdminLoggedIn)
  const adminSessionLoading = useStore((s) => s.adminSessionLoading)

  // While the admin session is being restored from the httpOnly refresh cookie
  // after a reload, hold on a spinner instead of bouncing to /admin/login.
  if (adminSessionLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--primary-bg)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[var(--accent-primary)] border-t-transparent animate-spin" />
          <p className="text-[var(--text-muted)] text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAdminLoggedIn) {
    return <Navigate to="/admin/login" replace />
  }

  return <>{children}</>
}