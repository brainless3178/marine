import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Suspense, lazy, useEffect } from 'react'
import { useStore } from './store/useStore'
import { PageWrapper } from './components/layout/PageWrapper'
import { PageErrorBoundary } from './components/ui/PageErrorBoundary'
import { ToastProvider } from './components/admin/Toast'
const CommandSearch = lazy(() => import('./components/sections/CommandSearch').then(m => ({ default: m.CommandSearch })))

const AuthModal = lazy(() => import('./components/auth/AuthModal').then(m => ({ default: m.AuthModal })))
const CartDrawer = lazy(() => import('./components/cart/CartDrawer').then(m => ({ default: m.CartDrawer })))

const Home = lazy(() => import('./pages/Home'))
const Products = lazy(() => import('./pages/Products'))
const Shop = lazy(() => import('./pages/Shop'))
const Industries = lazy(() => import('./pages/Industries'))
const Brands = lazy(() => import('./pages/Brands'))
const About = lazy(() => import('./pages/About'))
const RFQ = lazy(() => import('./pages/RFQ'))
const Contact = lazy(() => import('./pages/Contact'))
const SearchPage = lazy(() => import('./pages/Search'))
const Emergency = lazy(() => import('./pages/Emergency'))
const Network = lazy(() => import('./pages/Network'))
const Intelligence = lazy(() => import('./pages/Intelligence'))
const NotFound = lazy(() => import('./pages/NotFound'))
const Checkout = lazy(() => import('./pages/Checkout'))
const ProductDetail = lazy(() => import('./pages/ProductDetail'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const TrackOrder = lazy(() => import('./pages/TrackOrder'))
const OrderHistory = lazy(() => import('./pages/account/OrderHistory'))
const ProfileEdit = lazy(() => import('./pages/account/ProfileEdit'))
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'))
const TermsOfService = lazy(() => import('./pages/TermsOfService'))
const RefundPolicy = lazy(() => import('./pages/RefundPolicy'))
import { CookieConsent } from './components/CookieConsent'
import { PayPalProvider } from './components/PayPalProvider'

// Admin
const AdminLayout = lazy(() => import('./components/admin/AdminLayout').then(m => ({ default: m.AdminLayout })))
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'))
const AdminGuard = lazy(() => import('./components/admin/AdminGuard').then(m => ({ default: m.AdminGuard })))
import { ErrorBoundary } from './components/admin/ErrorBoundary'
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'))
const AdminMedia = lazy(() => import('./pages/admin/AdminMedia'))
const AdminBrands = lazy(() => import('./pages/admin/AdminBrands'))
const AdminIndustries = lazy(() => import('./pages/admin/AdminIndustries'))
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'))
const AdminCustomers = lazy(() => import('./pages/admin/AdminCustomers'))
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories'))
const AdminRFQs = lazy(() => import('./pages/admin/AdminRFQs'))
const AdminOffers = lazy(() => import('./pages/admin/AdminOffers'))
const AdminMessages = lazy(() => import('./pages/admin/AdminMessages'))
const AdminHomepage = lazy(() => import('./pages/admin/AdminHomepage'))
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'))
const AdminAuditLog = lazy(() => import('./pages/admin/AdminAuditLog'))
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'))
const AdminProductForm = lazy(() => import('./pages/admin/AdminProductForm'))
const AdminInsights = lazy(() => import('./pages/admin/AdminInsights'))

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="w-8 h-8 border-2 border-accent-blue border-t-transparent animate-spin" />
    </div>
  )
}

function AppContent() {
  const loadAdminSession = useStore((s) => s.loadAdminSession)
  const loadCustomerSession = useStore((s) => s.loadCustomerSession)
  const isSessionLoading = useStore((s) => s.isSessionLoading)
  useEffect(() => {
    if (localStorage.getItem('alka-admin-auth')) loadAdminSession()
    if (localStorage.getItem('alka-auth')) loadCustomerSession()
  }, [loadAdminSession, loadCustomerSession])

  if (isSessionLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--primary-bg)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-accent-blue border-t-transparent animate-spin" />
          <p className="text-[var(--text-muted)] text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  return (
      <Routes>
        {/* Admin routes — listed FIRST so they take priority over storefront catch-all */}
        <Route path="/admin/login" element={<Suspense fallback={<LoadingFallback />}><AdminLogin /></Suspense>} />
        <Route
          path="/admin"
          element={
            <AdminGuard>
              <ErrorBoundary pageName="Admin Panel">
                <AdminLayout />
              </ErrorBoundary>
            </AdminGuard>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="media" element={<AdminMedia />} />
          <Route path="brands" element={<AdminBrands />} />
          <Route path="industries" element={<AdminIndustries />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="customers" element={<AdminCustomers />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="rfqs" element={<AdminRFQs />} />
          <Route path="offers" element={<AdminOffers />} />
          <Route path="messages" element={<AdminMessages />} />
          <Route path="homepage" element={<AdminHomepage />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="audit-log" element={<AdminAuditLog />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="insights" element={<AdminInsights />} />
          <Route path="products/new" element={<AdminProductForm />} />
          <Route path="products/:id/edit" element={<AdminProductForm />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Storefront routes — AFTER admin so /admin/* is not caught here */}
        <Route
          path="/*"
          element={
            <PageErrorBoundary>
            <PageWrapper>
              <Suspense fallback={null}>
                <CommandSearch />
                <AuthModal />
                <CartDrawer />
              </Suspense>
              <Suspense fallback={<LoadingFallback />}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/shop" element={<Shop />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/industries" element={<Industries />} />
                  <Route path="/brands" element={<Brands />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/rfq" element={<RFQ />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/emergency" element={<Emergency />} />
                  <Route path="/network" element={<Network />} />
                  <Route path="/intelligence" element={<Intelligence />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/track-order" element={<TrackOrder />} />
                  <Route path="/account/orders" element={<OrderHistory />} />
                  <Route path="/account/profile" element={<ProfileEdit />} />
                  <Route path="/product/:id" element={<ProductDetail />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="/terms-of-service" element={<TermsOfService />} />
                  <Route path="/refund-policy" element={<RefundPolicy />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </PageWrapper>
            </PageErrorBoundary>
          }
        />
      </Routes>
  )
}

export default function App() {
  return (
    <ToastProvider>
    <PayPalProvider>
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
    </PayPalProvider>
    <CookieConsent />
    </ToastProvider>
  )
}
