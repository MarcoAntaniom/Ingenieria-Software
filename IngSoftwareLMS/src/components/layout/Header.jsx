import { useState, useRef, useEffect } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { useLanguage, LANGUAGES } from '../../contexts/LanguageContext'

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
  const { theme, isDark, isContrast, toggleTheme } = useTheme()
  const { language, setLanguage, t } = useLanguage()

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [langDropdownOpen, setLangDropdownOpen] = useState(false)
  const [notifFilter, setNotifFilter] = useState('all') // 'all' | 'unread' | 'academic' | 'deadline'

  const profileRef = useRef(null)
  const notifRef = useRef(null)
  const langRef = useRef(null)

  const unreadCount = notifications.filter((n) => n.unread).length

  // Contador de notificaciones con formato 0, 1-9 y +9
  const formattedUnread = unreadCount > 9 ? '9+' : unreadCount > 0 ? String(unreadCount) : null

  // Filtrado de notificaciones por categoría
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
        return {
          icon: 'assignment',
          bg: 'bg-[#EFF8FB] dark:bg-[#102F46] [data-theme=contrast]_&:bg-[#0D0D0D]',
          text: 'text-[#0B5575] dark:text-[#7DD3FC] [data-theme=contrast]_&:text-[#66D9FF]',
          border: 'border-[#BAE6FD] dark:border-[#155E75] [data-theme=contrast]_&:border-[#66D9FF]',
        }
      case 'deadline':
        return {
          icon: 'warning',
          bg: 'bg-[#FEF3F2] dark:bg-[#46191D] [data-theme=contrast]_&:bg-[#0D0D0D]',
          text: 'text-[#B42318] dark:text-[#FCA5A5] [data-theme=contrast]_&:text-[#FF5A67]',
          border: 'border-[#FECDCA] dark:border-[#7F1D1D] [data-theme=contrast]_&:border-[#FF5A67]',
        }
      case 'forum':
        return {
          icon: 'forum',
          bg: 'bg-[#ECFDF3] dark:bg-[#123B30] [data-theme=contrast]_&:bg-[#0D0D0D]',
          text: 'text-[#067647] dark:text-[#6EE7B7] [data-theme=contrast]_&:text-[#00F084]',
          border: 'border-[#A6F4C5] dark:border-[#0F766E] [data-theme=contrast]_&:border-[#00F084]',
        }
      case 'system':
      default:
        return {
          icon: 'verified',
          bg: 'bg-[#F8FAFC] dark:bg-[#16243A] [data-theme=contrast]_&:bg-[#0D0D0D]',
          text: 'text-[#475569] dark:text-[#CBD5E1] [data-theme=contrast]_&:text-white',
          border: 'border-[#E2E8F0] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6]',
        }
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
      if (langRef.current && !langRef.current.contains(e.target)) {
        setLangDropdownOpen(false)
      }
    }
    window.addEventListener('mousedown', handleClickOutside)
    return () => window.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex h-16 min-h-[64px] items-center justify-between border-b border-[#E2E8F0] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6] bg-white dark:bg-[#111B2E] [data-theme=contrast]_&:bg-[#0D0D0D] px-4 lg:px-6 transition-colors duration-200">
      {/* 1. Izquierda: Menú móvil + Logo Campus Virtual + Badge Semestre Contextual */}
      <div className="flex items-center gap-3">
        <button
          aria-controls="sidebar-nav"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? t('header.close_nav') : t('header.open_nav')}
          className="rounded-lg p-2 text-[#0F172A] dark:text-[#F8FAFC] [data-theme=contrast]_&:text-white hover:bg-[#F1F5F9] dark:hover:bg-[#16243A] [data-theme=contrast]_&:hover:bg-[#262626] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B5575] dark:focus-visible:ring-[#67E8F9] [data-theme=contrast]_&:focus-visible:ring-[#FFD400] lg:hidden"
          onClick={() => setMenuOpen((open) => !open)}
          type="button"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-2xl">
            {menuOpen ? 'close' : 'menu'}
          </span>
        </button>

        <button
          className="flex items-center gap-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B5575] dark:focus-visible:ring-[#67E8F9] [data-theme=contrast]_&:focus-visible:ring-[#FFD400] rounded-xl"
          onClick={() => onNavigate?.('overview')}
          type="button"
        >
          <span className="grid size-9 place-items-center rounded-xl bg-[#0B5575] dark:bg-[#0E7490] [data-theme=contrast]_&:bg-white [data-theme=contrast]_&:text-black font-black text-sm text-white shadow-xs">
            LMS
          </span>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-extrabold tracking-tight text-[#0B5575] dark:text-[#F8FAFC] [data-theme=contrast]_&:text-white">
              Campus Virtual
            </span>
            <span className="text-[11px] font-semibold text-[#64748B] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9]">
              {t('app_tagline')}
            </span>
          </div>
        </button>

        {/* Badge Semestre Contextual: Neutro/Azul suave, h: 28px, rounded-full */}
        <span className="hidden sm:inline-flex items-center gap-1.5 h-7 rounded-full border border-[#BAE6FD] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6] bg-[#EFF8FB] dark:bg-[#16243A] [data-theme=contrast]_&:bg-[#0D0D0D] px-3 text-xs font-semibold text-[#0B5575] dark:text-[#BAE6FD] [data-theme=contrast]_&:text-[#66D9FF]">
          <span className="size-2 rounded-full bg-[#067647] dark:bg-[#2DD4BF] [data-theme=contrast]_&:bg-[#00F084]" />
          {t('header.semester')}
        </span>
      </div>

      {/* 2. Derecha: [Selector Idioma] [Toggle Modo Oscuro / Contraste] [Campana Notificaciones] [Perfil Usuario] */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* Selector de Idioma (i18n) */}
        <div className="relative" ref={langRef}>
          <button
            aria-expanded={langDropdownOpen}
            aria-label={t('header.language')}
            className="flex items-center gap-1.5 h-9 rounded-xl border border-[#CBD5E1] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6] bg-white dark:bg-[#16243A] [data-theme=contrast]_&:bg-[#0D0D0D] px-2.5 text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC] [data-theme=contrast]_&:text-white hover:bg-[#F8FAFC] dark:hover:bg-[#1D2F46] [data-theme=contrast]_&:hover:bg-[#262626] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B5575] dark:focus-visible:ring-[#67E8F9] [data-theme=contrast]_&:focus-visible:ring-[#FFD400] transition"
            onClick={() => setLangDropdownOpen((prev) => !prev)}
            type="button"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-base text-[#0B5575] dark:text-[#67E8F9] [data-theme=contrast]_&:text-[#00B7FF]">
              language
            </span>
            <span className="uppercase text-[11px] font-extrabold tracking-wide">
              {language}
            </span>
            <span aria-hidden="true" className="material-symbols-outlined text-sm text-[#64748B] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9]">
              expand_more
            </span>
          </button>

          {langDropdownOpen && (
            <div className="absolute right-0 top-11 z-50 w-44 rounded-xl border border-[#CBD5E1] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6] bg-white dark:bg-[#1D2F46] [data-theme=contrast]_&:bg-[#0D0D0D] p-1.5 shadow-xl animate-in fade-in duration-100">
              <span className="block px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9]">
                {t('header.language')}
              </span>
              <div className="space-y-0.5">
                {LANGUAGES.map((item) => (
                  <button
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                      language === item.code
                        ? 'bg-[#EFF8FB] text-[#0B5575] dark:bg-[#123B49] dark:text-[#67E8F9] [data-theme=contrast]_&:bg-[#1A1A1A] [data-theme=contrast]_&:text-[#66D9FF] font-bold'
                        : 'text-[#0F172A] dark:text-[#CBD5E1] [data-theme=contrast]_&:text-white hover:bg-[#F8FAFC] dark:hover:bg-[#16243A] [data-theme=contrast]_&:hover:bg-[#262626]'
                    }`}
                    key={item.code}
                    onClick={() => {
                      setLanguage(item.code)
                      setLangDropdownOpen(false)
                    }}
                    type="button"
                  >
                    <span>{item.native}</span>
                    <span className="text-[10px] font-mono text-[#64748B] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9]">
                      {item.short}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Toggle Modo Oscuro / Alto Contraste: Ciclo Claro -> Oscuro -> Alto Contraste -> Claro */}
        <button
          aria-label={
            theme === 'light'
              ? t('header.dark_mode')
              : theme === 'dark'
              ? t('header.contrast_mode')
              : t('header.light_mode')
          }
          className="grid size-9 place-items-center rounded-xl border border-[#CBD5E1] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6] bg-white dark:bg-[#16243A] [data-theme=contrast]_&:bg-[#0D0D0D] text-[#475569] dark:text-[#F8FAFC] [data-theme=contrast]_&:text-white hover:bg-[#F8FAFC] dark:hover:bg-[#1D2F46] [data-theme=contrast]_&:hover:bg-[#262626] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B5575] dark:focus-visible:ring-[#67E8F9] [data-theme=contrast]_&:focus-visible:ring-[#FFD400] transition"
          onClick={toggleTheme}
          title={
            theme === 'light'
              ? t('header.dark_mode')
              : theme === 'dark'
              ? t('header.contrast_mode')
              : t('header.light_mode')
          }
          type="button"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-lg">
            {theme === 'light' ? 'dark_mode' : theme === 'dark' ? 'contrast' : 'light_mode'}
          </span>
        </button>

        {/* Campana de Notificaciones con Badge 0, 1-9, +9 */}
        <div className="relative" ref={notifRef}>
          <button
            aria-expanded={notificationsOpen}
            aria-label={t('header.notifications_aria', { count: unreadCount })}
            className="relative grid size-9 place-items-center rounded-xl border border-[#CBD5E1] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6] bg-white dark:bg-[#16243A] [data-theme=contrast]_&:bg-[#0D0D0D] text-[#475569] dark:text-[#F8FAFC] [data-theme=contrast]_&:text-white hover:bg-[#F8FAFC] dark:hover:bg-[#1D2F46] [data-theme=contrast]_&:hover:bg-[#262626] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B5575] dark:focus-visible:ring-[#67E8F9] [data-theme=contrast]_&:focus-visible:ring-[#FFD400] transition"
            onClick={() => setNotificationsOpen((prev) => !prev)}
            type="button"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-lg">
              notifications
            </span>
            {formattedUnread && (
              <span className="absolute -top-1 -right-1 grid min-w-4.5 h-4.5 px-1 place-items-center rounded-full bg-[#B42318] text-white dark:bg-[#7F1D1D] dark:text-[#FECACA] [data-theme=contrast]_&:bg-[#FF5A67] [data-theme=contrast]_&:text-black text-[10px] font-extrabold shadow-xs">
                {formattedUnread}
              </span>
            )}
          </button>

          {/* Menú Desplegable de Notificaciones */}
          {notificationsOpen && (
            <div className="absolute right-0 top-11 z-50 w-84 sm:w-96 rounded-2xl border border-[#CBD5E1] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6] bg-white dark:bg-[#1D2F46] [data-theme=contrast]_&:bg-[#0D0D0D] p-3.5 shadow-2xl animate-in fade-in duration-100">
              <div className="mb-2.5 flex items-center justify-between border-b border-[#E2E8F0] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6] pb-2.5 px-1">
                <span className="font-extrabold text-[#0F172A] dark:text-[#F8FAFC] [data-theme=contrast]_&:text-white text-xs">
                  {t('header.notifications')} ({unreadCount})
                </span>
                {unreadCount > 0 && (
                  <button
                    className="text-[11px] font-bold text-[#0B5575] dark:text-[#67E8F9] [data-theme=contrast]_&:text-[#00B7FF] hover:underline"
                    onClick={onMarkNotificationsRead}
                    type="button"
                  >
                    {t('header.mark_all_read')}
                  </button>
                )}
              </div>

              {/* Filtros de Categoría */}
              <div className="flex items-center gap-1 mb-2.5 overflow-x-auto pb-1">
                {[
                  { id: 'all', label: t('header.all') },
                  { id: 'unread', label: t('header.unread') },
                  { id: 'academic', label: t('header.academic') },
                  { id: 'deadline', label: t('header.deadlines') },
                ].map((f) => (
                  <button
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold transition shrink-0 ${
                      notifFilter === f.id
                        ? 'bg-[#0B5575] text-white dark:bg-[#0E7490] [data-theme=contrast]_&:bg-white [data-theme=contrast]_&:text-black shadow-xs'
                        : 'bg-[#F8FAFC] dark:bg-[#16243A] [data-theme=contrast]_&:bg-[#0D0D0D] text-[#475569] dark:text-[#CBD5E1] [data-theme=contrast]_&:text-white border border-[#CBD5E1] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6] hover:bg-[#F1F5F9] dark:hover:bg-[#1D2F46]'
                    }`}
                    key={f.id}
                    onClick={() => setNotifFilter(f.id)}
                    type="button"
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Lista de Notificaciones */}
              <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                {filteredNotifications.length > 0 ? (
                  filteredNotifications.map((n) => {
                    const catStyle = getNotifCategoryStyles(n.type)

                    return (
                      <div
                        className={`flex items-start gap-2.5 rounded-xl border p-2.5 text-xs transition ${
                          n.unread
                            ? 'bg-[#EFF8FB] dark:bg-[#123B49] [data-theme=contrast]_&:bg-[#1A1A1A] border-[#BAE6FD] dark:border-[#0E7490] [data-theme=contrast]_&:border-[#66D9FF]'
                            : 'bg-white dark:bg-[#111B2E] [data-theme=contrast]_&:bg-[#0D0D0D] border-[#E2E8F0] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6] hover:bg-[#F8FAFC] dark:hover:bg-[#16243A]'
                        }`}
                        key={n.id}
                      >
                        <span
                          className={`grid size-7.5 place-items-center rounded-full shrink-0 border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}
                        >
                          <span className="material-symbols-outlined text-base">
                            {catStyle.icon}
                          </span>
                        </span>

                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-[#0F172A] dark:text-[#F8FAFC] [data-theme=contrast]_&:text-white leading-snug line-clamp-1">
                            {n.title}
                          </p>
                          <p className="text-[#475569] dark:text-[#CBD5E1] [data-theme=contrast]_&:text-[#F2F2F2] text-[11px] mt-0.5 leading-relaxed line-clamp-2">
                            {n.description}
                          </p>
                          <span className="mt-1 block text-[10px] text-[#64748B] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9] font-medium">
                            {n.time}
                          </span>
                        </div>

                        {n.unread && (
                          <button
                            aria-label="Marcar notificación como leída"
                            className="grid size-6 place-items-center rounded-full text-[#0B5575] dark:text-[#67E8F9] [data-theme=contrast]_&:text-[#00B7FF] hover:bg-white dark:hover:bg-[#16243A] shrink-0"
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
                  <p className="py-6 text-center text-xs text-[#64748B] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9]">
                    {t('header.no_notifications')}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Perfil de Usuario con Menú Desplegable (width: 280px) */}
        <div className="relative" ref={profileRef}>
          <button
            aria-expanded={profileDropdownOpen}
            aria-label="Menú de cuenta de usuario"
            className="flex items-center gap-2 rounded-xl border border-[#CBD5E1] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6] bg-white dark:bg-[#16243A] [data-theme=contrast]_&:bg-[#0D0D0D] px-2.5 py-1.5 transition hover:bg-[#F8FAFC] dark:hover:bg-[#1D2F46] [data-theme=contrast]_&:hover:bg-[#262626] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B5575] dark:focus-visible:ring-[#67E8F9] [data-theme=contrast]_&:focus-visible:ring-[#FFD400]"
            onClick={() => setProfileDropdownOpen((prev) => !prev)}
            type="button"
          >
            {/* Avatar 36px en Topbar */}
            <span className="grid size-9 place-items-center rounded-lg bg-[#0B5575] dark:bg-[#0E7490] [data-theme=contrast]_&:bg-white [data-theme=contrast]_&:text-black font-bold text-xs text-white">
              {displayName.charAt(0).toUpperCase()}
            </span>
            <div className="hidden flex-col items-start leading-tight sm:flex">
              <span className="max-w-28 truncate text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC] [data-theme=contrast]_&:text-white">
                {displayName}
              </span>
              <span className="text-[10px] font-semibold text-[#0B5575] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9]">
                {activeRole}
              </span>
            </div>
            <span aria-hidden="true" className="material-symbols-outlined text-base text-[#64748B] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9]">
              expand_more
            </span>
          </button>

          {/* Menú Desplegable con ancho estricto de 280px */}
          {profileDropdownOpen && (
            <div className="absolute right-0 top-11 z-50 w-[280px] rounded-2xl border border-[#CBD5E1] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6] bg-white dark:bg-[#1D2F46] [data-theme=contrast]_&:bg-[#0D0D0D] p-3 shadow-2xl animate-in fade-in duration-100">
              {/* Cabecera con Avatar de 44px y Nombre en 14px bold */}
              <div className="flex items-center gap-3 border-b border-[#E2E8F0] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6] pb-3">
                <span className="grid size-11 place-items-center rounded-xl bg-[#0B5575] dark:bg-[#0E7490] [data-theme=contrast]_&:bg-white [data-theme=contrast]_&:text-black font-extrabold text-sm text-white">
                  {displayName.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC] [data-theme=contrast]_&:text-white">
                    {displayName}
                  </p>
                  <span className="inline-flex items-center gap-1 text-[11px] text-[#067647] dark:text-[#6EE7B7] [data-theme=contrast]_&:text-[#00F084] font-bold">
                    <span className="material-symbols-outlined text-sm">verified</span>
                    {t('header.verified_account')}
                  </span>
                </div>
              </div>

              {/* Bloque Independiente: ROL ACTIVO con Check Visual */}
              <div className="my-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6] bg-[#F8FAFC] dark:bg-[#16243A] [data-theme=contrast]_&:bg-[#1A1A1A] p-2.5">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9] mb-1.5">
                  {t('header.active_role')}: {activeRole}
                </span>

                {userRole === 'Administrador' ? (
                  <div className="grid grid-cols-3 gap-1">
                    {['Estudiante', 'Docente', 'Administrador'].map((r) => (
                      <button
                        className={`rounded-lg py-1 px-1 text-[11px] font-bold transition truncate text-center ${
                          activeRole === r
                            ? 'bg-[#0B5575] text-white dark:bg-[#0E7490] [data-theme=contrast]_&:bg-white [data-theme=contrast]_&:text-black shadow-xs'
                            : 'bg-white dark:bg-[#1D2F46] [data-theme=contrast]_&:bg-[#0D0D0D] text-[#475569] dark:text-[#CBD5E1] [data-theme=contrast]_&:text-white border border-[#CBD5E1] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6] hover:bg-[#F1F5F9] dark:hover:bg-[#16243A]'
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
                  <div className="flex items-center justify-between rounded-lg border border-[#CBD5E1] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6] bg-white dark:bg-[#1D2F46] [data-theme=contrast]_&:bg-[#0D0D0D] px-2.5 py-1.5 text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC] [data-theme=contrast]_&:text-white">
                    <span className="flex items-center gap-1.5 font-bold">
                      <span className="material-symbols-outlined text-[#067647] dark:text-[#6EE7B7] [data-theme=contrast]_&:text-[#00F084] text-base">
                        check_circle
                      </span>
                      {activeRole}
                    </span>
                    <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9]">
                      {t('header.verified_session')}
                    </span>
                  </div>
                )}
              </div>

              {/* Acciones: Ajustes de cuenta y Cerrar sesión */}
              <div className="space-y-0.5 border-t border-[#E2E8F0] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6] pt-2 text-xs">
                <button
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 font-medium text-[#0F172A] dark:text-[#CBD5E1] [data-theme=contrast]_&:text-white hover:bg-[#F8FAFC] dark:hover:bg-[#16243A] [data-theme=contrast]_&:hover:bg-[#262626] transition"
                  onClick={() => {
                    onNavigate?.('settings')
                    setProfileDropdownOpen(false)
                  }}
                  type="button"
                >
                  <span className="material-symbols-outlined text-base text-[#64748B] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9]">
                    settings
                  </span>
                  <span>{t('header.account_settings')}</span>
                </button>

                {/* Botón de acción destructiva */}
                <button
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 font-bold text-[#B42318] dark:text-[#FCA5A5] [data-theme=contrast]_&:text-[#FF5A67] hover:bg-[#FEF3F2] dark:hover:bg-[#46191D] transition"
                  onClick={onLogout}
                  type="button"
                >
                  <span className="material-symbols-outlined text-base">
                    logout
                  </span>
                  <span>{t('header.logout')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
