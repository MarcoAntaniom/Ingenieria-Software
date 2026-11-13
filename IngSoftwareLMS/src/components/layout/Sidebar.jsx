import { useLanguage } from '../../contexts/LanguageContext'

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
  const { t } = useLanguage()

  // Navegación contextual adaptada según el Rol del usuario con soporte multilingüe
  let navItems = []

  if (activeRole === 'Docente') {
    navItems = [
      { id: 'teacher-overview', label: t('nav.teacher_sections'), icon: 'dashboard', badge: null },
      {
        id: 'teacher-grading',
        label: t('nav.teacher_grading'),
        icon: 'rate_review',
        badge: 3,
        badgeColor:
          'bg-[#FEF3F2] text-[#B42318] dark:bg-[#46191D] dark:text-[#FCA5A5] [data-theme=contrast]_&:bg-[#0D0D0D] [data-theme=contrast]_&:text-[#FF4D5A] [data-theme=contrast]_&:border [data-theme=contrast]_&:border-[#FF4D5A]',
      },
      { id: 'teacher-gradebook', label: t('nav.teacher_gradebook'), icon: 'menu_book', badge: null },
      { id: 'teacher-contents', label: t('nav.teacher_contents'), icon: 'folder_open', badge: null },
      { id: 'teacher-evaluations', label: t('nav.teacher_evaluations'), icon: 'tune', badge: null },
      { id: 'teacher-announcements', label: t('nav.teacher_announcements'), icon: 'campaign', badge: null },
      { id: 'settings', label: t('nav.settings'), icon: 'settings', badge: null },
    ]
  } else if (activeRole === 'Administrador') {
    navItems = [
      { id: 'admin-overview', label: t('nav.admin_overview'), icon: 'speed', badge: null },
      { id: 'admin-users', label: t('nav.admin_users'), icon: 'group', badge: null },
      { id: 'admin-periods', label: t('nav.admin_periods'), icon: 'calendar_month', badge: null },
      { id: 'admin-catalog', label: t('nav.admin_catalog'), icon: 'menu_book', badge: null },
      { id: 'admin-enrollment', label: t('nav.admin_enrollment'), icon: 'how_to_reg', badge: null },
      { id: 'admin-archive', label: t('nav.admin_archive'), icon: 'archive', badge: null },
      { id: 'admin-audit', label: t('nav.admin_audit'), icon: 'policy', badge: null },
      { id: 'admin-settings', label: t('nav.admin_settings'), icon: 'settings_suggest', badge: null },
    ]
  } else {
    // Rol: Estudiante por defecto
    navItems = [
      { id: 'overview', label: t('nav.overview'), icon: 'dashboard', badge: null },
      { id: 'courses', label: t('nav.courses'), icon: 'school', badge: null },
      {
        id: 'tasks',
        label: t('nav.tasks'),
        icon: 'assignment_turned_in',
        badge: pendingCount > 0 ? pendingCount : null,
        badgeColor:
          'bg-[#FEF3F2] text-[#B42318] dark:bg-[#46191D] dark:text-[#FCA5A5] [data-theme=contrast]_&:bg-[#0D0D0D] [data-theme=contrast]_&:text-[#FF4D5A] [data-theme=contrast]_&:border [data-theme=contrast]_&:border-[#FF4D5A]',
      },
      { id: 'expediente', label: t('nav.expediente'), icon: 'history_edu', badge: null },
      { id: 'calendar', label: t('nav.calendar'), icon: 'calendar_month', badge: null },
      { id: 'archived', label: t('nav.archived'), icon: 'archive', badge: null },
      { id: 'settings', label: t('nav.settings'), icon: 'settings', badge: null },
    ]
  }

  function handleSelect(id) {
    onNavigate(id)
    setMenuOpen(false)
  }

  return (
    <>
      {/* Backdrop para pantallas móviles */}
      {menuOpen && (
        <button
          aria-label={t('header.close_nav')}
          className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px] lg:hidden"
          onClick={() => setMenuOpen(false)}
          type="button"
        />
      )}

      {/* Contenedor Sidebar: fondo #0F192A en oscuro, #0D0D0D en contraste, borde #2A3A52 / #A6A6A6 */}
      <aside
        aria-label="Navegación principal"
        className={`fixed bottom-0 left-0 top-16 z-40 flex flex-col justify-between border-r border-[#E2E8F0] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6] bg-white dark:bg-[#0F192A] [data-theme=contrast]_&:bg-[#0D0D0D] transition-all duration-200 lg:translate-x-0 ${
          isCollapsed ? 'w-[72px]' : 'w-[240px]'
        } ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}
        id="sidebar-nav"
      >
        <div className="flex flex-col py-4">
          <nav aria-label="Secciones principales" className="flex flex-col gap-1 px-3">
            {navItems.map((item) => {
              const isActive = activeView === item.id

              return (
                <button
                  aria-current={isActive ? 'page' : undefined}
                  className={`group relative flex items-center min-h-[44px] rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B5575] dark:focus-visible:ring-[#67E8F9] [data-theme=contrast]_&:focus-visible:ring-[#FFD400] ${
                    isCollapsed
                      ? 'justify-center py-2.5 px-0'
                      : 'justify-start px-3 py-2.5 gap-3'
                  } ${
                    isActive
                      ? 'border-l-[3px] border-[#0B5575] dark:border-l-[#2DD4BF] [data-theme=contrast]_&:border-l-[#FFFFFF] bg-[#EFF8FB] dark:bg-[#123B49] [data-theme=contrast]_&:bg-[#1A1A1A] text-[#0B5575] dark:text-[#67E8F9] [data-theme=contrast]_&:text-[#FFFFFF] font-bold shadow-xs'
                      : 'text-[#475569] dark:text-[#CBD5E1] [data-theme=contrast]_&:text-[#F2F2F2] hover:bg-[#F8FAFC] dark:hover:bg-[#16243A] [data-theme=contrast]_&:hover:bg-[#262626] hover:text-[#0F172A] dark:hover:text-[#F8FAFC] [data-theme=contrast]_&:hover:text-white font-semibold'
                  }`}
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  title={item.label}
                  type="button"
                >
                  <span
                    aria-hidden="true"
                    className={`material-symbols-outlined text-xl transition-colors shrink-0 ${
                      isActive
                        ? 'text-[#0B5575] dark:text-[#67E8F9] [data-theme=contrast]_&:text-[#00B7FF]'
                        : 'text-[#64748B] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9] group-hover:text-[#0F172A] dark:group-hover:text-[#F8FAFC] [data-theme=contrast]_&:group-hover:text-white'
                    }`}
                  >
                    {item.icon}
                  </span>

                  {!isCollapsed && (
                    <span className="flex-1 text-left text-xs sm:text-sm truncate">
                      {item.label}
                    </span>
                  )}

                  {/* Badge de Evaluaciones / Novedades */}
                  {item.badge !== null && (
                    <span
                      className={`grid min-w-5 h-5 place-items-center rounded-full px-1.5 text-[11px] font-black shrink-0 ${
                        item.badgeColor || 'bg-[#F1F5F9] text-[#0F172A]'
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

        {/* Botón de Colapso en Escritorio con Tooltip explicativo */}
        <div className="hidden lg:flex border-t border-[#E2E8F0] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6] p-3">
          <button
            aria-label={isCollapsed ? t('nav.expand') : t('nav.collapse')}
            className="flex w-full items-center justify-center gap-2 rounded-lg py-2 px-3 text-xs font-bold text-[#64748B] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9] hover:bg-[#F8FAFC] dark:hover:bg-[#16243A] [data-theme=contrast]_&:hover:bg-[#262626] hover:text-[#0F172A] dark:hover:text-white transition"
            onClick={onToggleCollapse}
            title={isCollapsed ? t('nav.expand') : t('nav.collapse')}
            type="button"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-lg">
              {isCollapsed ? 'chevron_right' : 'chevron_left'}
            </span>
            {!isCollapsed && <span>{t('nav.collapse')}</span>}
          </button>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
