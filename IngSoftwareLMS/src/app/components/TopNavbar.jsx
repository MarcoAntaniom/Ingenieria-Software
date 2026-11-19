import { NavLink } from 'react-router-dom'

export default function TopNavbar({
  menuOpen,
  onToggleMenu,
  unreadCount,
  displayName,
  roleLabel,
  onLogout,
}) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b border-line bg-card px-4 lg:px-8">
      <div className="flex items-center gap-3">
        <button
          aria-controls="sidebar"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          className="rounded-full p-1.5 hover:bg-subtle lg:hidden"
          onClick={onToggleMenu}
          type="button"
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            menu
          </span>
        </button>
        <NavLink className="flex items-center gap-2.5" to="/dashboard">
          <span className="grid size-9 place-items-center rounded-lg bg-primary font-extrabold text-white">
            C
          </span>
          <span className="flex flex-col leading-tight">
            <span className="font-bold text-primary">Campus Virtual</span>
            <span className="text-[11px] font-medium text-muted">
              Ambiente de aprendizaje
            </span>
          </span>
        </NavLink>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <NavLink
          aria-label="Ver notificaciones"
          className="relative grid size-9 place-items-center rounded-lg text-muted transition hover:bg-subtle hover:text-primary"
          to="/notificaciones"
        >
          <span className="material-symbols-outlined text-xl" aria-hidden="true">
            notifications
          </span>
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid min-w-4.5 place-items-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </NavLink>

        <div className="hidden items-center gap-2 border-l border-line pl-3 sm:flex">
          <div className="text-right">
            <p className="max-w-44 truncate text-xs font-bold text-ink">
              {displayName}
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-secondary">
              {roleLabel}
            </p>
          </div>
        </div>

        <button
          aria-label="Cerrar sesión"
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-bold text-primary transition hover:bg-subtle"
          onClick={onLogout}
          type="button"
        >
          <span className="material-symbols-outlined text-lg" aria-hidden="true">
            logout
          </span>
          <span className="hidden sm:inline">Salir</span>
        </button>
      </div>
    </header>
  )
}
