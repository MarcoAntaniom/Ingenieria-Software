import { useState, useRef, useEffect } from 'react'

export function Header({
  displayName,
  activeRole,
  userRole,
  setActiveRole,
  notifications = [],
  onMarkNotificationsRead,
  menuOpen,
  setMenuOpen,
  onNavigate,
  onLogout,
}) {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifFilter, setNotifFilter] = useState('all') // 'all' | 'unread' | 'academic' | 'deadline'
  const profileRef = useRef(null)
  const notifRef = useRef(null)

  const unreadCount = notifications.filter((n) => n.unread).length

  // Filtrado de notificaciones (Recomendación 9)
  const filteredNotifications = notifications.filter((n) => {
    if (notifFilter === 'unread') return n.unread
    if (notifFilter === 'academic') return n.type === 'academic' || n.type === 'material'
    if (notifFilter === 'deadline') return n.type === 'deadline'
    return true
  })

  function getNotifCategoryStyles(type) {
    switch (type) {
      case 'academic':
      case 'material':
        return { icon: 'assignment', bg: 'bg-[#F0F9FF]', text: 'text-[#075477]', border: 'border-[#BAE6FD]' }
      case 'deadline':
        return { icon: 'warning', bg: 'bg-[#FEF2F2]', text: 'text-[#C53030]', border: 'border-[#FECACA]' }
      case 'forum':
        return { icon: 'forum', bg: 'bg-[#F0FDFA]', text: 'text-[#0D9488]', border: 'border-[#99F6E4]' }
      case 'system':
      default:
        return { icon: 'verified', bg: 'bg-[#F8FAFC]', text: 'text-[#475569]', border: 'border-[#E2E8F0]' }
    }
  }

  useEffect(() => {
    function handleClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileDropdownOpen(false)
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotificationsOpen(false)
      }
    }
    window.addEventListener('mousedown', handleClickOutside)
    return () => window.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b border-[#E2E8F0] bg-white px-4 lg:px-8">
      {/* Izquierda: Menú móvil + Logo */}
      <div className="flex items-center gap-3">
        <button
          aria-controls="sidebar-nav"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? 'Cerrar navegación' : 'Abrir navegación'}
          className="rounded-lg p-2 text-[#1F2937] hover:bg-[#F1F5F9] focus-visible:ring-2 focus-visible:ring-[#0B4F6C] lg:hidden"
          onClick={() => setMenuOpen((open) => !open)}
          type="button"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-2xl">
            {menuOpen ? 'close' : 'menu'}
          </span>
        </button>

        <button
          className="flex items-center gap-2.5 text-left focus:outline-none"
          onClick={() => onNavigate?.('overview')}
          type="button"
        >
          <span className="grid size-9 place-items-center rounded-xl bg-[#0B4F6C] font-black text-sm text-white shadow-xs">
            LMS
          </span>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-extrabold tracking-tight text-[#0B4F6C]">
              Campus Virtual
            </span>
            <span className="text-[11px] font-semibold text-[#64748B]">
              Ambiente de Aprendizaje
            </span>
          </div>
        </button>

        {/* Indicador discreto del semestre activo */}
        <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-1 text-xs font-semibold text-[#4B5563]">
          <span className="size-2 rounded-full bg-[#16856A]" />
          Semestre Otoño 2026
        </span>
      </div>

      {/* Derecha: Notificaciones y Perfil */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Campana de Notificaciones */}
        <div className="relative" ref={notifRef}>
          <button
            aria-expanded={notificationsOpen}
            aria-label={`Notificaciones del sistema (${unreadCount} pendientes)`}
            className="relative grid size-9.5 place-items-center rounded-xl border border-[#E2E8F0] bg-white text-[#4B5563] hover:bg-[#F8FAFC] hover:text-[#1F2937] focus-visible:ring-2 focus-visible:ring-[#0B4F6C]"
            onClick={() => setNotificationsOpen((prev) => !prev)}
            type="button"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-xl">
              notifications
            </span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 grid size-4.5 place-items-center rounded-full bg-[#C53030] text-[10px] font-bold text-white shadow-xs">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Menú Desplegable de Notificaciones Rediseñado (Recomendación 9) */}
          {notificationsOpen && (
            <div className="absolute right-0 top-11 z-50 w-84 sm:w-96 rounded-[14px] border border-[#dbe3ec] bg-white p-3.5 shadow-xl animate-in fade-in duration-100">
              <div className="mb-2.5 flex items-center justify-between border-b border-[#dbe3ec] pb-2.5 px-1">
                <span className="font-extrabold text-[#172033] text-xs">
                  Notificaciones ({unreadCount} sin leer)
                </span>
                {unreadCount > 0 && (
                  <button
                    className="text-[11px] font-bold text-[#075477] hover:underline"
                    onClick={onMarkNotificationsRead}
                    type="button"
                  >
                    Marcar todas como leídas
                  </button>
                )}
              </div>

              {/* Filtros de Categoría */}
              <div className="flex items-center gap-1 mb-2.5 overflow-x-auto pb-1">
                {[
                  { id: 'all', label: 'Todas' },
                  { id: 'unread', label: 'No leídas' },
                  { id: 'academic', label: 'Académicas' },
                  { id: 'deadline', label: 'Fechas límite' },
                ].map((f) => (
                  <button
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold transition shrink-0 ${
                      notifFilter === f.id
                        ? 'bg-[#075477] text-white shadow-xs'
                        : 'bg-[#f8fafc] text-[#64748b] border border-[#dbe3ec] hover:bg-[#f1f5f9]'
                    }`}
                    key={f.id}
                    onClick={() => setNotifFilter(f.id)}
                    type="button"
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Lista con scroll y espacio holgado */}
              <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                {filteredNotifications.length > 0 ? (
                  filteredNotifications.map((n) => {
                    const catStyle = getNotifCategoryStyles(n.type)

                    return (
                      <div
                        className={`flex items-start gap-2.5 rounded-[10px] border p-2.5 text-xs transition ${
                          n.unread
                            ? 'bg-[#F0F9FF]/60 border-[#BAE6FD]'
                            : 'bg-white border-[#dbe3ec] hover:bg-[#f8fafc]'
                        }`}
                        key={n.id}
                      >
                        {/* Icono suave por categoría */}
                        <span
                          className={`grid size-7.5 place-items-center rounded-full shrink-0 border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}
                        >
                          <span className="material-symbols-outlined text-base">
                            {catStyle.icon}
                          </span>
                        </span>

                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-[#172033] leading-snug line-clamp-1">{n.title}</p>
                          <p className="text-[#64748b] text-[11px] mt-0.5 leading-relaxed line-clamp-2">
                            {n.description}
                          </p>
                          <span className="mt-1 block text-[10px] text-[#94a3b8] font-medium">{n.time}</span>
                        </div>

                        {/* Botón individual de marcar como leída */}
                        {n.unread && (
                          <button
                            aria-label="Marcar notificación como leída"
                            className="grid size-6 place-items-center rounded-full text-[#075477] hover:bg-[#E8F3F8] shrink-0"
                            onClick={() => onMarkNotificationsRead?.(n.id)}
                            title="Marcar como leída"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-sm">done</span>
                          </button>
                        )}
                      </div>
                    )
                  })
                ) : (
                  <p className="py-6 text-center text-xs text-[#64748b]">
                    No tienes notificaciones en esta categoría.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Menú de Perfil */}
        <div className="relative" ref={profileRef}>
          <button
            aria-expanded={profileDropdownOpen}
            aria-label="Menú de cuenta de usuario"
            className="flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-2.5 py-1.5 transition hover:bg-[#F8FAFC] focus-visible:ring-2 focus-visible:ring-[#0B4F6C]"
            onClick={() => setProfileDropdownOpen((prev) => !prev)}
            type="button"
          >
            <span className="grid size-7.5 place-items-center rounded-lg bg-[#0B4F6C] font-bold text-xs text-white">
              {displayName.charAt(0).toUpperCase()}
            </span>
            <div className="hidden flex-col items-start leading-tight sm:flex">
              <span className="max-w-28 truncate text-xs font-bold text-[#1F2937]">
                {displayName}
              </span>
              <span className="text-[10px] font-semibold text-[#0B4F6C]">
                {activeRole}
              </span>
            </div>
            <span aria-hidden="true" className="material-symbols-outlined text-base text-[#64748B]">
              expand_more
            </span>
          </button>

          {profileDropdownOpen && (
            <div className="absolute right-0 top-11 z-50 w-64 rounded-2xl border border-[#E2E8F0] bg-white p-2.5 shadow-xl animate-in fade-in duration-100">
              <div className="flex items-center gap-2.5 border-b border-[#E2E8F0] pb-2.5 px-1">
                <span className="grid size-9 place-items-center rounded-lg bg-[#0B4F6C] font-bold text-xs text-white">
                  {displayName.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-[#1F2937]">{displayName}</p>
                  <span className="inline-flex items-center gap-1 text-[10px] text-[#16856A] font-bold">
                    <span className="material-symbols-outlined text-xs">verified</span>
                    Cuenta Verificada
                  </span>
                </div>
              </div>

              {/* Selector de Rol Seguro (Solo administradores pueden alternar; solo lectura para estudiante y docente) */}
              <div className="my-2 rounded-xl bg-[#F8FAFC] p-2">
                <span className="block text-[10px] font-bold uppercase text-[#64748B] mb-1">
                  Rol activo
                </span>
                {userRole === 'Administrador' ? (
                  <div className="grid grid-cols-3 gap-1">
                    {['Estudiante', 'Docente', 'Administrador'].map((r) => (
                      <button
                        className={`rounded-lg py-1 px-1 text-[11px] font-bold transition truncate text-center ${
                          activeRole === r
                            ? 'bg-[#0B4F6C] text-white shadow-xs'
                            : 'bg-white text-[#4B5563] border border-[#E2E8F0] hover:bg-[#F1F5F9]'
                        }`}
                        key={r}
                        onClick={() => setActiveRole(r)}
                        title={`Cambiar a rol ${r}`}
                        type="button"
                      >
                        {r === 'Administrador' ? 'Admin' : r}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-between rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#1F2937]">
                    <span className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-[#16856A]" />
                      {activeRole}
                    </span>
                    <span className="text-[10px] text-[#64748B]">Verificado en sesión</span>
                  </div>
                )}
              </div>

              <div className="space-y-0.5 border-t border-[#E2E8F0] pt-1.5 text-xs">
                <button
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 font-medium text-[#1F2937] hover:bg-[#F8FAFC]"
                  onClick={() => {
                    onNavigate?.('settings')
                    setProfileDropdownOpen(false)
                  }}
                  type="button"
                >
                  <span className="material-symbols-outlined text-base text-[#64748B]">settings</span>
                  Ajustes de cuenta
                </button>
                <button
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 font-bold text-[#C53030] hover:bg-[#FEF2F2]"
                  onClick={onLogout}
                  type="button"
                >
                  <span className="material-symbols-outlined text-base">logout</span>
                  Cerrar sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
