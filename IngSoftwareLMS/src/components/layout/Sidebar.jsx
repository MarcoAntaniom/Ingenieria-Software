export function Sidebar({
  activeView,
  activeRole = 'Estudiante',
  onNavigate,
  menuOpen,
  setMenuOpen,
  isCollapsed = false,
  onToggleCollapse,
  pendingCount = 0,
}) {
  // Navegación contextual adaptada según el Rol del usuario
  let navItems = []

  if (activeRole === 'Docente') {
    navItems = [
      { id: 'teacher-overview', label: 'Mis Secciones', icon: 'dashboard', badge: null },
      {
        id: 'teacher-grading',
        label: 'Calificación y Entregas',
        icon: 'rate_review',
        badge: 3,
        badgeColor: 'bg-[#C53030] text-white',
      },
      { id: 'teacher-gradebook', label: 'Libro de Notas y Actas', icon: 'menu_book', badge: null },
      { id: 'teacher-contents', label: 'Gestión Contenidos', icon: 'folder_open', badge: null },
      { id: 'teacher-evaluations', label: 'Configurar Evaluaciones', icon: 'tune', badge: null },
      { id: 'teacher-announcements', label: 'Avisos y Foros', icon: 'campaign', badge: null },
      { id: 'settings', label: 'Ajustes', icon: 'settings', badge: null },
    ]
  } else if (activeRole === 'Administrador') {
    navItems = [
      { id: 'admin-overview', label: 'Panel Global', icon: 'speed', badge: null },
      { id: 'admin-users', label: 'Gestión de Usuarios', icon: 'group', badge: null },
      { id: 'admin-periods', label: 'Periodos Académicos', icon: 'calendar_month', badge: null },
      { id: 'admin-catalog', label: 'Catálogo y Secciones', icon: 'menu_book', badge: null },
      { id: 'admin-enrollment', label: 'Matrícula y Asignación', icon: 'how_to_reg', badge: null },
      { id: 'admin-archive', label: 'Archivo y Cierre', icon: 'archive', badge: null },
      { id: 'admin-audit', label: 'Auditoría y Logs', icon: 'policy', badge: null },
      { id: 'admin-settings', label: 'Parámetros del Sistema', icon: 'settings_suggest', badge: null },
    ]
  } else {
    // Rol: Estudiante por defecto
    navItems = [
      { id: 'overview', label: 'Panel de Clases', icon: 'dashboard', badge: null },
      { id: 'courses', label: 'Mis Clases', icon: 'school', badge: null },
      {
        id: 'tasks',
        label: 'Evaluaciones',
        icon: 'assignment_turned_in',
        badge: pendingCount > 0 ? pendingCount : null,
        badgeColor: 'bg-[#C53030] text-white',
      },
      { id: 'expediente', label: 'Expediente Académico', icon: 'history_edu', badge: null },
      { id: 'calendar', label: 'Calendario', icon: 'calendar_month', badge: null },
      { id: 'archived', label: 'Cursos Archivados', icon: 'archive', badge: null },
      { id: 'settings', label: 'Ajustes', icon: 'settings', badge: null },
    ]
  }

  function handleSelect(id) {
    onNavigate(id)
    setMenuOpen(false)
  }

  return (
    <>
      {/* Backdrop para móvil */}
      {menuOpen && (
        <button
          aria-label="Cerrar navegación"
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden"
          onClick={() => setMenuOpen(false)}
          type="button"
        />
      )}

      {/* Contenedor Sidebar */}
      <aside
        aria-label="Navegación principal"
        className={`fixed bottom-0 left-0 top-16 z-40 flex flex-col justify-between border-r border-[#E2E8F0] bg-white transition-all duration-200 lg:translate-x-0 ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}
        id="sidebar-nav"
      >
        <div className="flex flex-col py-4">
          {/* Navegación por ítems principales */}
          <nav aria-label="Secciones" className="flex flex-col gap-1 px-3">
            {navItems.map((item) => {
              const isActive = activeView === item.id

              return (
                <button
                  aria-current={isActive ? 'page' : undefined}
                  className={`group relative flex items-center rounded-[10px] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#075477] ${
                    isCollapsed ? 'justify-center py-3 px-0' : 'justify-start px-3.5 py-2.5 gap-3'
                  } ${
                    isActive
                      ? 'bg-[#E8F3F8] text-[#075477] font-bold'
                      : 'text-[#64748b] hover:bg-[#f8fafc] hover:text-[#172033] font-semibold'
                  }`}
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  title={item.label}
                  type="button"
                >
                  {/* Barra lateral indicadora visible para la sección activa */}
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-md bg-[#075477]"
                    />
                  )}

                  <span
                    aria-hidden="true"
                    className={`material-symbols-outlined text-xl transition-colors shrink-0 ${
                      isActive ? 'text-[#075477]' : 'text-[#64748b] group-hover:text-[#172033]'
                    }`}
                  >
                    {item.icon}
                  </span>

                  {!isCollapsed && (
                    <span className="flex-1 text-left text-xs sm:text-sm truncate">
                      {item.label}
                    </span>
                  )}

                  {item.badge !== null && (
                    <span
                      className={`grid min-w-5 place-items-center rounded-full px-1.5 py-0.2 text-[10px] font-black shrink-0 ${
                        item.badgeColor || 'bg-[#F1F5F9] text-[#1F2937]'
                      } ${isCollapsed ? 'absolute -top-1 -right-1' : ''}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Botón de Colapso de Navegación en Escritorio */}
        <div className="hidden lg:flex border-t border-[#E2E8F0] p-3">
          <button
            aria-label={isCollapsed ? 'Expandir menú lateral' : 'Colapsar menú lateral'}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-2 px-3 text-xs font-bold text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#1F2937] transition"
            onClick={onToggleCollapse}
            type="button"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-lg">
              {isCollapsed ? 'chevron_right' : 'chevron_left'}
            </span>
            {!isCollapsed && <span>Colapsar menú</span>}
          </button>
        </div>
      </aside>
    </>
  )
}
