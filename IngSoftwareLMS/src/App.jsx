import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import LoginForm from './components/LoginForm'
import { useAuth } from './contexts/auth-context'

// Lazy loading de ruta del panel principal para optimizar rendimiento de carga inicial
const Dashboard = lazy(() => import('./components/Dashboard'))

function PageLoader() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#F5F7FA]">
      <p className="flex items-center gap-3 text-sm font-semibold text-[#0B4F6C]">
        <span
          aria-hidden="true"
          className="size-5 animate-spin rounded-full border-2 border-[#0B4F6C]/20 border-t-[#0B4F6C]"
        />
        Cargando plataforma...
      </p>
    </main>
  )
}

function GuestRoute({ children }) {
  const { isAuthenticated, isInitializing } = useAuth()
  if (isInitializing) return <PageLoader />
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children
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
    <main className="login-page min-h-screen w-full bg-[#F4F7FA] grid place-items-center p-4 sm:p-6 lg:p-8 font-sans text-[#1F2937] antialiased">
      <div className="w-full flex flex-col items-center max-w-[820px]">
        {/* Tarjeta Principal de Login */}
        <section
          aria-label="Inicio de sesión institucional"
          className="login-card w-full overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_14px_35px_rgba(15,23,42,0.08)] flex flex-col md:flex-row md:min-h-[480px] md:max-h-[520px]"
        >
          {/* Panel Informativo Izquierdo (40% en escritorio: ~330px) */}
          <aside
            aria-label="Identidad y beneficios de la plataforma"
            className="order-2 md:order-1 flex w-full md:w-[330px] shrink-0 flex-col justify-between bg-gradient-to-br from-[#0B4F6C] to-[#07364A] p-6 text-white sm:p-8"
          >
            <div>
              {/* Marca y Logotipo en la cabecera */}
              <div className="mb-6 flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-xl bg-white/10 text-white backdrop-blur-xs">
                  <span aria-hidden="true" className="material-symbols-outlined text-2xl">
                    school
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-base font-extrabold tracking-tight text-white leading-tight">
                    Campus Virtual
                  </span>
                  <span className="text-xs font-medium text-[#E0F2FE]">
                    LMS Universitario
                  </span>
                </div>
              </div>

              {/* Título Principal y Subtítulo */}
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-snug">
                Aprende desde cualquier lugar
              </h2>
              <p className="mt-2 text-xs sm:text-[13px] text-[#E0F2FE] leading-relaxed">
                Accede a tus clases, actividades y recursos académicos desde un solo lugar.
              </p>

              {/* Lista breve de beneficios visuales no interactivos con checkmarks */}
              <ul className="mt-6 space-y-3" aria-label="Beneficios del campus virtual">
                <li className="flex items-center gap-2.5 text-xs sm:text-[13px] font-medium text-white">
                  <span
                    aria-hidden="true"
                    className="material-symbols-outlined text-lg text-[#34D399] shrink-0"
                  >
                    check_circle
                  </span>
                  <span>Clases y recursos académicos</span>
                </li>
                <li className="flex items-center gap-2.5 text-xs sm:text-[13px] font-medium text-white">
                  <span
                    aria-hidden="true"
                    className="material-symbols-outlined text-lg text-[#34D399] shrink-0"
                  >
                    check_circle
                  </span>
                  <span>Seguimiento de actividades</span>
                </li>
              </ul>
            </div>

            {/* Aviso de seguridad institucional al pie del panel */}
            <div className="hidden md:flex items-center gap-2 text-[11px] text-[#E0F2FE]/80 pt-6 border-t border-white/10">
              <span aria-hidden="true" className="material-symbols-outlined text-sm">
                verified_user
              </span>
              <span>Plataforma Oficial Segura · 2026</span>
            </div>
          </aside>

          {/* Formulario (60% en escritorio: ~490px) */}
          <div className="order-1 md:order-2 flex flex-1 flex-col justify-center bg-white">
            <LoginForm />
          </div>
        </section>

        {/* Pie Contextual Discreto y Copyright */}
        <footer className="mt-4 text-center text-xs text-[#64748B]">
          © 2026 Campus Virtual LMS · Universidad. Todos los derechos reservados.
        </footer>
      </div>
    </main>
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
            <Suspense fallback={<PageLoader />}>
              <Dashboard />
            </Suspense>
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
