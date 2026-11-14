import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/auth-context'
import { MODULES, SHOW_UNAVAILABLE_MODULES } from '../../features/modules/moduleRegistry'
import { getUserRole } from '../../utils/roles'

export default function AppShell({ children }) {
  const { user, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()
  const role = getUserRole(user)
  const displayName =
    [user?.nombres, user?.apellidos].filter(Boolean).join(' ') ||
    user?.correo_institucional ||
    'Usuario'
  const roleHome = MODULES.find(
    (module) =>
      (role === 'teacher' && module.key === 'teacher-sections') ||
      (role === 'admin' && module.key === 'admin-users'),
  )
  const links = [
    ...(role === 'student'
      ? [{ title: 'Mis cursos', path: '/dashboard', icon: 'home', key: 'dashboard' }]
      : []),
    ...(roleHome ? [roleHome] : []),
    ...(SHOW_UNAVAILABLE_MODULES
      ? MODULES.filter(
          (module) =>
            module.roles.includes(role) &&
            !module.path.includes(':') &&
            module.key !== roleHome?.key,
        )
      : []),
  ]

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
          onClick={() => setMenuOpen(false)}
          type="button"
        />
      )}

      <aside
        className={`fixed bottom-0 left-0 top-16 z-40 flex w-64 flex-col justify-between overflow-y-auto border-r border-line bg-card py-4 transition-transform motion-reduce:transition-none lg:translate-x-0 ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        id="app-sidebar"
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
              onClick={() => setMenuOpen(false)}
              to={link.path}
            >
              <span aria-hidden="true" className="material-symbols-outlined">{link.icon}</span>
              {link.title}
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

      <main className="min-h-screen pt-16 lg:pl-64">
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
