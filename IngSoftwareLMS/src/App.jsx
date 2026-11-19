import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './contexts/auth-context'
import {
  GuestRoute,
  PageLoader,
  ProtectedRoute,
  RoleGuard,
} from './app/guards/RouteGuards'
import AppLayout from './app/layouts/AppLayout'
import { LoadingState } from './shared/components/ui/StateViews'
import { ROLES } from './shared/lib/roles'

const LoginPage = lazy(() => import('./features/auth/pages/LoginPage'))
const DashboardPage = lazy(() =>
  import('./features/dashboard/pages/DashboardPage'),
)
const CursosPage = lazy(() => import('./features/academico/pages/CursosPage'))
const CursoDetallePage = lazy(() =>
  import('./features/academico/pages/CursoDetallePage'),
)
const GestionAcademicaPage = lazy(() =>
  import('./features/academico/pages/GestionAcademicaPage'),
)
const ComunicacionPage = lazy(() =>
  import('./features/comunicacion/pages/ComunicacionPage'),
)
const EvaluacionesPage = lazy(() =>
  import('./features/evaluaciones/pages/EvaluacionesPage'),
)
const ArchivosPage = lazy(() => import('./features/archivos/pages/ArchivosPage'))
const NotificacionesPage = lazy(() =>
  import('./features/notificaciones/pages/NotificacionesPage'),
)
const PerfilPage = lazy(() => import('./features/usuarios/pages/PerfilPage'))
const GestionUsuariosPage = lazy(() =>
  import('./features/usuarios/pages/GestionUsuariosPage'),
)

function RouteSuspense({ children }) {
  return (
    <Suspense
      fallback={
        <div className="p-8">
          <LoadingState label="Cargando módulo..." />
        </div>
      }
    >
      {children}
    </Suspense>
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
            <RouteSuspense>
              <LoginPage />
            </RouteSuspense>
          </GuestRoute>
        }
      />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route
          path="/dashboard"
          element={
            <RouteSuspense>
              <DashboardPage />
            </RouteSuspense>
          }
        />
        <Route
          path="/cursos"
          element={
            <RouteSuspense>
              <CursosPage />
            </RouteSuspense>
          }
        />
        <Route
          path="/cursos/:seccionId"
          element={
            <RouteSuspense>
              <CursoDetallePage />
            </RouteSuspense>
          }
        />
        <Route
          path="/comunicacion"
          element={
            <RouteSuspense>
              <ComunicacionPage />
            </RouteSuspense>
          }
        />
        <Route
          path="/evaluaciones"
          element={
            <RouteSuspense>
              <EvaluacionesPage />
            </RouteSuspense>
          }
        />
        <Route
          path="/archivos"
          element={
            <RouteSuspense>
              <ArchivosPage />
            </RouteSuspense>
          }
        />
        <Route
          path="/notificaciones"
          element={
            <RouteSuspense>
              <NotificacionesPage />
            </RouteSuspense>
          }
        />
        <Route
          path="/perfil"
          element={
            <RouteSuspense>
              <PerfilPage />
            </RouteSuspense>
          }
        />

        <Route
          path="/gestion/academico"
          element={
            <RoleGuard allowedRoles={[ROLES.ADMIN, ROLES.DOCENTE]}>
              <RouteSuspense>
                <GestionAcademicaPage />
              </RouteSuspense>
            </RoleGuard>
          }
        />

        <Route
          path="/gestion/usuarios"
          element={
            <RoleGuard allowedRoles={[ROLES.ADMIN]}>
              <RouteSuspense>
                <GestionUsuariosPage />
              </RouteSuspense>
            </RoleGuard>
          }
        />
      </Route>

      <Route
        path="*"
        element={
          <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />
        }
      />
    </Routes>
  )
}

export default App
