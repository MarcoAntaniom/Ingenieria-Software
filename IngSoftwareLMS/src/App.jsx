import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './contexts/auth-context'
import { MODULES } from './features/modules/moduleRegistry'
import { getLandingPath, getUserRole } from './utils/roles'

const LoginPage = lazy(() => import('./pages/LoginPage.jsx'))
const Dashboard = lazy(() => import('./components/Dashboard.jsx'))
const ModulePage = lazy(() => import('./pages/ModulePage.jsx'))
const PermissionDeniedPage = lazy(() =>
  import('./pages/StatusPages.jsx').then((module) => ({
    default: module.PermissionDeniedPage,
  })),
)
const NotFoundPage = lazy(() =>
  import('./pages/StatusPages.jsx').then((module) => ({
    default: module.NotFoundPage,
  })),
)

function PageLoader() {
  return (
    <main
      aria-live="polite"
      className="grid min-h-screen place-items-center bg-surface"
      role="status"
    >
      <p className="flex items-center gap-3 text-sm font-semibold text-primary">
        <span className="size-5 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
        Cargando Campus Virtual...
      </p>
    </main>
  )
}

function GuestRoute({ children }) {
  const { isAuthenticated, isInitializing, user } = useAuth()
  if (isInitializing) return <PageLoader />
  return isAuthenticated ? (
    <Navigate to={getLandingPath(user)} replace />
  ) : (
    children
  )
}

function ProtectedRoute({ children }) {
  const { isAuthenticated, isInitializing } = useAuth()
  const location = useLocation()
  if (isInitializing) return <PageLoader />
  return isAuthenticated ? (
    children
  ) : (
    <Navigate to="/login" replace state={{ from: location }} />
  )
}

function RoleRoute({ allowedRoles, children }) {
  const { user } = useAuth()
  return allowedRoles.includes(getUserRole(user)) ? (
    children
  ) : (
    <PermissionDeniedPage />
  )
}

function HomeRedirect() {
  const { user } = useAuth()
  return <Navigate to={getLandingPath(user)} replace />
}

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route
          element={
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          }
          path="/login"
        />
        <Route
          element={
            <ProtectedRoute>
              <HomeRedirect />
            </ProtectedRoute>
          }
          path="/"
        />
        <Route
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['student']}>
                <Dashboard />
              </RoleRoute>
            </ProtectedRoute>
          }
          path="/dashboard"
        />
        {MODULES.map((module) => (
          <Route
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={module.roles}>
                  <ModulePage module={module} />
                </RoleRoute>
              </ProtectedRoute>
            }
            key={module.key}
            path={module.path}
          />
        ))}
        <Route element={<PermissionDeniedPage />} path="/403" />
        <Route element={<NotFoundPage />} path="*" />
      </Routes>
    </Suspense>
  )
}

export default App
