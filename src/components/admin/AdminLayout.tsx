import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { AdminSidebar } from './AdminSidebar'
import { AdminHeader } from './AdminHeader'
import { useStore } from '../../store/useStore'

export function AdminLayout() {
  const collapsed = useStore((s) => s.adminSidebarCollapsed)

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />

      <div
        className={`flex flex-1 flex-col min-w-0 transition-all duration-300 ${
          collapsed ? 'lg:ml-[68px]' : 'lg:ml-[260px]'
        }`}
      >
        <AdminHeader />

        <main className="admin-content flex-1 p-3 sm:p-6 lg:p-8 overflow-x-hidden">
          <Suspense fallback={
            <div className="flex items-center justify-center min-h-[50vh]">
              <div className="w-8 h-8 border-2 border-[var(--accent-blue)] border-t-transparent rounded-full animate-spin" />
            </div>
          }>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  )
}
