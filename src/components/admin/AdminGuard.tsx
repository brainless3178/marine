import { Navigate } from 'react-router-dom'
import { useStore } from '../../store/useStore'

interface AdminGuardProps {
  children: React.ReactNode
}

export function AdminGuard({ children }: AdminGuardProps) {
  const isAdminLoggedIn = useStore((s) => s.isAdminLoggedIn)

  if (!isAdminLoggedIn) {
    return <Navigate to="/admin/login" replace />
  }

  return <>{children}</>
}
