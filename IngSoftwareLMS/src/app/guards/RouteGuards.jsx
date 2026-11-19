import { Navigate, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/auth-context'
import { getRoleLabel, hasAllowedRole } from '../../shared/lib/roles'

export function PageLoader() {
  return (
    <main className="grid min-h-screen place-items-center bg-canvas-bg">
      <p className="flex items-center gap-3 text-sm font-semibold text-primary">
        <span className="size-5 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
        Verificando tu sesión...
      </p>
    </main>
  )
}

export function GuestRoute({ children }) {
  const { isAuthenticated, isInitializing } = useAuth()
  if (isInitializing) return <PageLoader />
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children
}

export function ProtectedRoute({ children }) {
  const { isAuthenticated, isInitializing } = useAuth()
  const location = useLocation()
  if (isInitializing) return <PageLoader />
  return isAuthenticated ? (
    children
  ) : (
    <Navigate to="/login" replace state={{ from: location }} />
  )
}

export function RoleGuard({ allowedRoles = [], children }) {
  const { user } = useAuth()

  if (!hasAllowedRole(user, allowedRoles)) {
    return (
      <div className="mx-auto max-w-xl px-6 py-16">
        <div
          className="rounded-2xl border border-amber-200 bg-amber-50/90 p-8 text-center shadow-xs"
          role="alert"
        >
          <span
            className="material-symbols-outlined text-4xl text-amber-600"
            aria-hidden="true"
          >
            lock_person
          </span>
          <h1 className="mt-3 text-lg font-extrabold text-slate-900">
            Acceso restringido por rol
          </h1>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">
            Tu cuenta actual tiene el rol de{' '}
            <strong className="font-bold text-slate-900">
              {getRoleLabel(user)}
            </strong>
            , el cual no tiene permisos para acceder a este módulo.
          </p>
          <Link
            className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white transition hover:bg-primary-dark"
            to="/dashboard"
          >
            <span className="material-symbols-outlined text-base">
              arrow_back
            </span>
            Volver al panel principal
          </Link>
        </div>
      </div>
    )
  }

  return children
}
