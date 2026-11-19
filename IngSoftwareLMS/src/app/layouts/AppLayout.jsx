import { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../contexts/auth-context'
import { fetchUnreadCount } from '../../features/notificaciones/api/notificacionesApi'
import { useRealtimeNotifications } from '../../features/notificaciones/hooks/useRealtimeNotifications'
import { useNotificationStore } from '../../features/notificaciones/store/useNotificationStore'
import { queryKeys } from '../../shared/lib/queryKeys'
import {
  getRoleLabel,
  getUserDisplayName,
  getUserRoleCode,
  ROLES,
} from '../../shared/lib/roles'
import TopNavbar from '../components/TopNavbar'
import SidebarNav from '../components/SidebarNav'
import AppFooter from '../components/AppFooter'

export default function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  useRealtimeNotifications()
  const wsStatus = useNotificationStore((state) => state.wsStatus)

  const unreadQuery = useQuery({
    queryKey: queryKeys.notificaciones.unreadCount,
    queryFn: fetchUnreadCount,
    refetchInterval: 45000,
  })

  const unreadCount = unreadQuery.data ?? 0
  const roleCode = getUserRoleCode(user)
  const roleLabel = getRoleLabel(user)
  const displayName = getUserDisplayName(user)

  useEffect(() => {
    function closeOnEscape(event) {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [])

  async function handleLogout() {
    try {
      await signOut()
    } catch {
      navigate('/login', {
        replace: true,
        state: {
          notice:
            'La sesión se cerró en este dispositivo, pero el servidor no confirmó la revocación.',
        },
      })
      return
    }
    navigate('/login', { replace: true })
  }

  const navItems = [
    { to: '/dashboard', icon: 'space_dashboard', label: 'Panel Principal' },
    { to: '/cursos', icon: 'school', label: 'Cursos y Secciones' },
    { to: '/comunicacion', icon: 'forum', label: 'Comunicación y Foros' },
    { to: '/evaluaciones', icon: 'assignment', label: 'Evaluaciones y Tareas' },
    {
      to: '/notificaciones',
      icon: 'notifications',
      label: 'Notificaciones',
      badge: unreadCount > 0 ? unreadCount : null,
    },
    { to: '/perfil', icon: 'person', label: 'Mi Perfil' },
  ]

  const managementItems = [
    ...(roleCode === ROLES.ADMIN || roleCode === ROLES.DOCENTE
      ? [
          {
            to: '/gestion/academico',
            icon: 'account_tree',
            label: 'Catálogo Académico',
          },
        ]
      : []),
    ...(roleCode === ROLES.ADMIN
      ? [
          {
            to: '/gestion/usuarios',
            icon: 'manage_accounts',
            label: 'Usuarios y Perfiles',
          },
        ]
      : []),
  ]

  return (
    <div className="min-h-screen bg-surface font-sans text-sm text-ink antialiased">
      <TopNavbar
        displayName={displayName}
        menuOpen={menuOpen}
        onLogout={handleLogout}
        onToggleMenu={() => setMenuOpen((open) => !open)}
        roleLabel={roleLabel}
        unreadCount={unreadCount}
      />

      <SidebarNav
        displayName={displayName}
        managementItems={managementItems}
        menuOpen={menuOpen}
        navItems={navItems}
        onCloseMenu={() => setMenuOpen(false)}
        roleLabel={roleLabel}
        wsStatus={wsStatus}
      />

      <div className="flex min-h-screen flex-col pt-16 lg:pl-64">
        <main className="flex-1">
          <Outlet />
        </main>
        <AppFooter roleLabel={roleLabel} />
      </div>
    </div>
  )
}
