import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import LoginForm from './components/LoginForm'
import Dashboard from './components/Dashboard'
import { useAuth } from './contexts/auth-context'

function PageLoader() {
  return (
    <main className="grid min-h-screen place-items-center bg-canvas-bg">
      <p className="flex items-center gap-3 text-sm font-semibold text-primary">
        <span className="size-5 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
        Verificando tu sesión...
      </p>
    </main>
  )
}

function GuestRoute({ children }) {
  const { isAuthenticated, isInitializing } = useAuth()
  if (isInitializing) return <PageLoader />
  return isAuthenticated ? (
    <Navigate to="/dashboard" replace />
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

function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col justify-between bg-canvas-bg font-sans text-text-primary antialiased">
      <header className="sticky top-0 z-20 w-full border-b border-border-light bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-4 sm:px-6">
          <span className="block text-base font-bold leading-tight tracking-tight text-primary sm:text-lg">
            Campus Virtual LMS
          </span>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="grid min-h-[580px] w-full max-w-5xl grid-cols-1 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xl lg:grid-cols-12">
          <aside className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-primary via-[#083853] to-[#042436] p-6 text-white sm:p-8 lg:col-span-5 lg:p-10">
            <div className="relative z-10">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent-gold/40 bg-accent-gold/20 px-3.5 py-1.5 text-xs font-semibold text-[#f8d893] shadow-sm backdrop-blur-md">
                <span className="material-symbols-outlined text-sm text-accent-gold">
                  calendar_month
                </span>
                <span>Campus Digital</span>
              </div>
              <h2 className="mb-3 text-2xl leading-snug font-bold tracking-tight text-white sm:text-3xl">
                Tu espacio de aprendizaje
              </h2>
              <p className="mb-6 text-sm leading-relaxed font-normal text-slate-200/90 sm:text-base">
                Accede a tus asignaturas, entregas, clases virtuales y material
                de estudio desde un solo lugar.
              </p>
              <div className="space-y-3 pt-1">
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.07] p-3">
                  <span className="material-symbols-outlined text-[#4ad7d7]">
                    menu_book
                  </span>
                  <span className="text-xs font-semibold">
                    Clases, foros y anuncios
                  </span>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.07] p-3">
                  <span className="material-symbols-outlined text-[#ffd27e]">
                    assignment_turned_in
                  </span>
                  <span className="text-xs font-semibold">
                    Entregas y evaluaciones
                  </span>
                </div>
              </div>
            </div>
          </aside>
          <LoginForm />
        </div>
      </main>

      <footer className="w-full border-t border-slate-200/80 bg-white/70 py-4">
        <div className="mx-auto max-w-6xl px-4 text-center text-xs text-slate-500 sm:px-6">
          © 2026 Campus Virtual LMS
        </div>
      </footer>
    </div>
  )
}

function App() {
  const { isAuthenticated, isInitializing } = useAuth()
  if (isInitializing) return <PageLoader />

  return (
    <Routes>
      <Route
        path="/login"
        element={
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />}
      />
    </Routes>
  )
}

export default App
