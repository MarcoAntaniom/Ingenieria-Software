import { NavLink } from 'react-router-dom'

export default function SidebarNav({
  menuOpen,
  onCloseMenu,
  navItems,
  managementItems,
  displayName,
  roleLabel,
  wsStatus,
}) {
  return (
    <>
      {menuOpen && (
        <button
          aria-label="Cerrar menú"
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={onCloseMenu}
          type="button"
        />
      )}

      <aside
        className={`fixed bottom-0 left-0 top-16 z-40 flex w-64 flex-col justify-between overflow-y-auto border-r border-line bg-card py-4 transition-transform motion-reduce:transition-none lg:translate-x-0 ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        id="sidebar"
      >
        <div className="space-y-6 px-3">
          <nav aria-label="Navegación principal" className="flex flex-col gap-1">
            <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted">
              Plataforma
            </p>
            {navItems.map((item) => (
              <NavLink
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs transition ${
                    isActive
                      ? 'bg-secondary-container font-bold text-on-secondary-container'
                      : 'font-semibold text-muted hover:bg-subtle hover:text-ink'
                  }`
                }
                key={item.to}
                onClick={onCloseMenu}
                to={item.to}
              >
                <span className="material-symbols-outlined text-lg" aria-hidden="true">
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
                {item.badge != null && (
                  <span className="ml-auto rounded-full bg-danger px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          {managementItems.length > 0 && (
            <nav aria-label="Gestión y administración" className="flex flex-col gap-1">
              <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted">
                Gestión ({roleLabel})
              </p>
              {managementItems.map((item) => (
                <NavLink
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs transition ${
                      isActive
                        ? 'bg-secondary-container font-bold text-on-secondary-container'
                        : 'font-semibold text-muted hover:bg-subtle hover:text-ink'
                    }`
                  }
                  key={item.to}
                  onClick={onCloseMenu}
                  to={item.to}
                >
                  <span className="material-symbols-outlined text-lg" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                </NavLink>
              ))}
            </nav>
          )}
        </div>

        <div className="space-y-2 px-3 pt-4">
          <div className="rounded-xl border border-line bg-surface p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-ink">{displayName}</p>
                <p className="text-[11px] font-semibold text-secondary">{roleLabel}</p>
              </div>
              <span
                className="material-symbols-outlined shrink-0 text-secondary"
                aria-hidden="true"
              >
                verified_user
              </span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 border-t border-line pt-2 text-[11px] text-muted">
              <span
                className={`size-2 rounded-full ${
                  wsStatus === 'connected'
                    ? 'bg-emerald-500'
                    : wsStatus === 'connecting'
                      ? 'bg-amber-500'
                      : 'bg-slate-400'
                }`}
              />
              <span>
                {wsStatus === 'connected'
                  ? 'Notificaciones en vivo'
                  : 'Sincronización REST'}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
