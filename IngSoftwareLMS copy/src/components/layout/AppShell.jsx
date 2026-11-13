import { useEffect, useRef, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/auth-context'
import { MODULES, SHOW_UNAVAILABLE_MODULES } from '../../features/modules/moduleRegistry'
import { getUserRole } from '../../utils/roles'
import { useUnreadNotificationCount } from '../../features/notificaciones/useNotifications'

export default function AppShell({ children }) {
  const { user, signOut } = useAuth()
  const unreadNotifications = useUnreadNotificationCount()
  const [menuOpen, setMenuOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const menuButtonRef = useRef(null)
  const sidebarRef = useRef(null)
  const navigate = useNavigate()
  const role = getUserRole(user)
  const displayName =
    [user?.nombres, user?.apellidos].filter(Boolean).join(' ') ||
    user?.correo_institucional ||
    'Usuario'
  const roleHome = MODULES.find(
    (module) =>
      (role === 'teacher' && module.key === 'teacher-tasks') ||
      (role === 'admin' && module.key === 'admin-users'),
  )
  const visibleModules = MODULES.filter(
    (module) =>
      module.roles.includes(role) &&
      (module.available || SHOW_UNAVAILABLE_MODULES) &&
      !module.path.includes(':'),
  )
  const links = [
    ...(role === 'student'
      ? [{ title: 'Mis cursos', path: '/dashboard', icon: 'home', key: 'dashboard' }]
      : []),
    ...(roleHome && (roleHome.available || SHOW_UNAVAILABLE_MODULES)
      ? [roleHome]
      : []),
    ...visibleModules.filter((module) => module.key !== roleHome?.key),
  ]

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1024px)')
    const updateViewport = () => setIsDesktop(mediaQuery.matches)
    updateViewport()
    mediaQuery.addEventListener('change', updateViewport)
    return () => mediaQuery.removeEventListener('change', updateViewport)
  }, [])

  useEffect(() => {
    if (!menuOpen || isDesktop) return undefined

    const sidebar = sidebarRef.current
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const getFocusableItems = () =>
      sidebar?.querySelectorAll('a[href], button:not([disabled])') || []
    getFocusableItems()[0]?.focus()

    function handleMenuKeyDown(event) {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        menuButtonRef.current?.focus()
        return
      }
      if (event.key !== 'Tab') return

      const items = getFocusableItems()
      if (items.length === 0) return
      const firstItem = items[0]
      const lastItem = items[items.length - 1]
      if (event.shiftKey && document.activeElement === firstItem) {
        event.preventDefault()
        lastItem.focus()
      } else if (!event.shiftKey && document.activeElement === lastItem) {
        event.preventDefault()
        firstItem.focus()
      }
    }

    document.addEventListener('keydown', handleMenuKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleMenuKeyDown)
    }
  }, [isDesktop, menuOpen])

  async function handleLogout() {
    try {
      await signOut()
      navigate('/login', { replace: true })
    } catch (error) {
      navigate('/login', {
        replace: true,
        state: { notice: error.message },
      })
    }
  }

  return (
    <div className="min-h-screen bg-surface font-sans text-sm text-ink antialiased">
      <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b border-line bg-card px-4 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            aria-controls="app-sidebar"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            className="rounded-full p-1.5 text-primary hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary lg:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            ref={menuButtonRef}
            type="button"
          >
            <span aria-hidden="true" className="material-symbols-outlined">menu</span>
          </button>
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-lg bg-primary font-extrabold text-white">
              C
            </span>
            <span className="flex flex-col leading-tight">
              <span className="font-bold text-primary">Campus Virtual</span>
              <span className="text-[11px] font-medium text-muted">Ambiente de aprendizaje</span>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden max-w-44 truncate text-xs font-semibold text-muted sm:block">
            {displayName}
          </span>
          <button
            aria-label="Cerrar sesión"
            className="flex items-center gap-1.5 rounded-lg px-2 py-2 text-xs font-bold text-primary hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:px-3"
            onClick={handleLogout}
            type="button"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-lg">logout</span>
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </header>

      {menuOpen && (
        <button
          aria-label="Cerrar menú"
          className="fixed inset-0 z-30 bg-ink/40 lg:hidden"
          onClick={() => {
            setMenuOpen(false)
            menuButtonRef.current?.focus()
          }}
          tabIndex={-1}
          type="button"
        />
      )}

      <aside
        className={`fixed bottom-0 left-0 top-16 z-40 flex w-64 flex-col justify-between overflow-y-auto border-r border-line bg-card py-4 transition-transform motion-reduce:transition-none lg:translate-x-0 ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-hidden={!isDesktop && !menuOpen}
        inert={!isDesktop && !menuOpen}
        id="app-sidebar"
        ref={sidebarRef}
      >
        <nav aria-label="Principal" className="flex flex-col gap-1 px-3">
          {links.map((link) => (
            <NavLink
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs ${
                  isActive
                    ? 'bg-secondary-container font-bold text-on-secondary-container'
                    : 'font-semibold text-muted hover:bg-subtle hover:text-ink'
                }`
              }
              end
              key={link.key || link.path}
              onClick={() => {
                setMenuOpen(false)
                menuButtonRef.current?.focus()
              }}
              to={link.path}
            >
              <span aria-hidden="true" className="material-symbols-outlined">{link.icon}</span>
              {link.title}
              {link.key === 'notifications' && unreadNotifications.data > 0 && (
                <span
                  aria-label={`${unreadNotifications.data} sin leer`}
                  className="ml-auto min-w-5 rounded-full bg-danger-strong px-1.5 py-0.5 text-center text-[10px] font-bold text-white"
                >
                  {unreadNotifications.data > 99 ? '99+' : unreadNotifications.data}
                </span>
              )}
            </NavLink>
          ))}
          {links.length === 0 && (
            <p className="px-3 py-2 text-xs text-muted">
              No hay módulos disponibles en la navegación.
            </p>
          )}
        </nav>
        <div className="px-3">
          <div className="flex items-center justify-between gap-2 rounded-xl border border-line bg-surface p-3">
            <p className="truncate text-xs font-bold">{displayName}</p>
            <span aria-hidden="true" className="material-symbols-outlined text-secondary">
              verified_user
            </span>
          </div>
        </div>
      </aside>

      <main className="min-h-screen pt-16 lg:pl-64" inert={!isDesktop && menuOpen}>
        {children}
        <footer className="border-t border-line bg-card py-5 text-xs text-muted">
          <div className="mx-auto max-w-[1360px] px-6 lg:px-10">
            <p><strong className="text-ink">Campus Virtual LMS</strong> · Ambiente de aprendizaje</p>
          </div>
        </footer>
      </main>
    </div>
  )
}
