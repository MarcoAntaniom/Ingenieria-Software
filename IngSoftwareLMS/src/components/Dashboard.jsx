import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/auth-context'
import api from '../services/api'
import {
  INITIAL_COURSES,
  CALENDAR_EVENTS,
  CRITICAL_ALERTS,
  NOTIFICATIONS as INITIAL_NOTIFICATIONS,
  ANNOUNCEMENTS,
} from '../data/mockData'
import { useDebounce } from '../hooks/useDebounce'
import { Header } from './layout/Header'
import { Sidebar } from './layout/Sidebar'
import { CourseCard } from './courses/CourseCard'
import { CalendarView } from './CalendarView'
import { TasksCenterView } from './TasksCenterView'
import { ArchivedCoursesView } from './ArchivedCoursesView'
import { SettingsView } from './SettingsView'
import { AcademicRecordView } from './student/AcademicRecordView'
import { TeacherDashboardView } from './teacher/TeacherDashboardView'
import { AdminDashboardView } from './admin/AdminDashboardView'
import { QuickResolutionModal } from './QuickResolutionModal'
import { DidacticMaterialModal } from './DidacticMaterialModal'
import { InteractionModal } from './InteractionModal'
import { SyllabusModal } from './SyllabusModal'
import { ClassroomModal } from './ClassroomModal'
import { useLanguage } from '../contexts/LanguageContext'
import { SkeletonCard } from './feedback/SkeletonCard'
import { EmptyState } from './feedback/EmptyState'
import { Drawer } from './ui/Drawer'

const TABS = [
  { id: 'all', label: 'Todas', i18nKey: 'dashboard.tabs.all' },
  { id: 'progress', label: 'En curso', i18nKey: 'dashboard.tabs.progress' },
  { id: 'pending', label: 'Con pendientes', i18nKey: 'dashboard.tabs.pending' },
  { id: 'completed', label: 'Completadas', i18nKey: 'dashboard.tabs.completed' },
]

const SORT_OPTIONS = [
  { id: 'recent', label: 'Más recientes', i18nKey: 'dashboard.sort_recent' },
  { id: 'urgency', label: 'Próxima entrega', i18nKey: 'dashboard.sort_urgency' },
  { id: 'progress', label: 'Mayor progreso', i18nKey: 'dashboard.sort_progress' },
  { id: 'name', label: 'Nombre de la asignatura', i18nKey: 'dashboard.sort_name' },
]

const ROLE_ALLOWED_VIEWS = {
  Estudiante: [
    'overview',
    'courses',
    'tasks',
    'expediente',
    'calendar',
    'archived',
    'settings',
  ],
  Docente: [
    'teacher-overview',
    'teacher-grading',
    'teacher-gradebook',
    'teacher-contents',
    'teacher-evaluations',
    'teacher-announcements',
    'courses',
    'calendar',
    'settings',
  ],
  Administrador: [
    'admin-overview',
    'admin-users',
    'admin-periods',
    'admin-catalog',
    'admin-enrollment',
    'admin-archive',
    'admin-audit',
    'admin-settings',
    'teacher-overview',
    'teacher-grading',
    'teacher-gradebook',
    'teacher-contents',
    'teacher-evaluations',
    'teacher-announcements',
    'overview',
    'courses',
    'tasks',
    'expediente',
    'calendar',
    'archived',
    'settings',
  ],
}

function getCanonicalRole(user) {
  const raw = user?.rol?.nombre || user?.rol?.codigo || user?.role || ''
  const upper = String(raw).toUpperCase()
  if (upper.includes('ADMIN')) return 'Administrador'
  if (upper.includes('DOC')) return 'Docente'
  return 'Estudiante'
}

function normalize(value = '') {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLocaleLowerCase('es')
}

function matchesTab(course, tab) {
  if (tab === 'progress') return course.status === 'progress' || course.status === 'pending'
  if (tab === 'pending') return course.status === 'pending'
  if (tab === 'completed') return course.status === 'completed'
  return true
}

export function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { user, signOut } = useAuth()
  const { t, language } = useLanguage()
  const navigate = useNavigate()

  // Sincronización de filtros y búsqueda con URL Search Params
  const activeView = searchParams.get('vista') || 'overview'
  const activeTab = searchParams.get('estado') || 'all'
  const sortParam = searchParams.get('orden') || 'urgency'
  const queryParam = searchParams.get('q') || ''

  const [searchInput, setSearchInput] = useState(queryParam)
  const debouncedSearch = useDebounce(searchInput, 200)

  // Estados de datos
  const [courses, setCourses] = useState(INITIAL_COURSES)
  const [isLoading, setIsLoading] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS)
  // Sincronización y consistencia de Rol basado en sesión (RBAC)
  const userRole = useMemo(() => getCanonicalRole(user), [user])
  const [activeRole, setActiveRole] = useState(userRole)
  const [rbacAlert, setRbacAlert] = useState(null)

  useEffect(() => {
    setActiveRole(userRole)
  }, [userRole])

  // Guarda de Ruta / Vista RBAC: Redirección inmediata si se solicita una vista no autorizada
  useEffect(() => {
    const allowed = ROLE_ALLOWED_VIEWS[activeRole] || ROLE_ALLOWED_VIEWS.Estudiante
    if (!allowed.includes(activeView)) {
      const defaultView =
        activeRole === 'Administrador'
          ? 'admin-overview'
          : activeRole === 'Docente'
          ? 'teacher-overview'
          : 'overview'
      updateParam('vista', defaultView)
      setRbacAlert(
        `Acceso Denegado (403): La vista "${activeView}" está restringida para el rol "${activeRole}". Has sido redirigido a tu panel autorizado.`,
      )
    }
  }, [activeView, activeRole])

  // Modales
  const [quickResolutionOpen, setQuickResolutionOpen] = useState(false)
  const [activeModalCourse, setActiveModalCourse] = useState(null)
  const [classroomModalCourse, setClassroomModalCourse] = useState(null)
  const [materialModalOpen, setMaterialModalOpen] = useState(false)
  const [interactionModalOpen, setInteractionModalOpen] = useState(false)
  const [syllabusModalOpen, setSyllabusModalOpen] = useState(false)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  // Actualizar URL cuando cambia la búsqueda debounced
  useEffect(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (debouncedSearch.trim()) {
        next.set('q', debouncedSearch.trim())
      } else {
        next.delete('q')
      }
      return next
    })
  }, [debouncedSearch, setSearchParams])

  // Carga tolerante desde API
  useEffect(() => {
    let active = true

    api
      .get('academico/inscripciones/')
      .then(({ data }) => {
        const rows =
          data?.datos ??
          data?.results ??
          (Array.isArray(data) ? data : null)
        if (Array.isArray(rows) && rows.length > 0 && active) {
          setCourses((prev) =>
            rows.map((row, index) => {
              const code =
                row.code ||
                row.seccion?.asignatura?.codigo ||
                row.codigo_asignatura ||
                `INF-${300 + index}`
              const title =
                row.title ||
                row.seccion?.asignatura?.nombre ||
                row.asignatura_nombre ||
                `Asignatura ${code}`
              const existing = prev.find((c) => c.code === code) || {}

              return {
                ...existing,
                id: row.id || index + 1,
                code,
                section: row.section || row.seccion?.numero_seccion || 1,
                title,
                teacher: row.teacher || existing.teacher || 'Docente Titular',
                period:
                  row.period ||
                  row.seccion?.periodo_academico?.codigo ||
                  row.periodo ||
                  existing.period ||
                  'Semestre Otoño 2026',
                status: row.status || existing.status || 'progress',
                badge: row.badge || existing.badge || 'Trabajo colaborativo',
                progress:
                  row.progress !== undefined
                    ? row.progress
                    : existing.progress || 60,
                taskTitle: row.taskTitle !== undefined ? row.taskTitle : existing.taskTitle,
                taskDate: row.taskDate !== undefined ? row.taskDate : existing.taskDate,
                taskType: row.taskType || existing.taskType,
                taskDescription: row.taskDescription || existing.taskDescription,
                taskGuidelines: row.taskGuidelines || existing.taskGuidelines,
                acredited: row.acredited || existing.acredited,
                actaClosed: row.actaClosed || existing.actaClosed,
                finalGrade: row.finalGrade || existing.finalGrade,
                materials: existing.materials || INITIAL_COURSES[0].materials,
                forums: existing.forums || INITIAL_COURSES[0].forums,
                syllabus: existing.syllabus || INITIAL_COURSES[0].syllabus,
              }
            }),
          )
        }
      })
      .catch((error) => {
        if (active) {
          console.error('No se pudieron cargar las inscripciones.', error)
        }
      })

    return () => {
      active = false
    }
  }, [])

  // Modificadores de URL para navegación limpia
  function updateParam(key, value) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value && value !== 'all' && value !== 'overview') {
        next.set(key, value)
      } else {
        next.delete(key)
      }
      return next
    })
  }

  function handleViewChange(viewId) {
    updateParam('vista', viewId)
    setMenuOpen(false)
  }

  function handleTabChange(tabId) {
    updateParam('estado', tabId)
  }

  function handleSortChange(sortId) {
    updateParam('orden', sortId)
  }

  function handleClearFilters() {
    setSearchInput('')
    setSearchParams({})
  }

  // Filtrado y ordenamiento de cursos
  const filteredCourses = useMemo(() => {
    const norm = normalize(debouncedSearch.trim())

    return courses
      .filter((course) => {
        const matchesQuery = normalize(
          `${course.title} ${course.teacher} ${course.code} ${course.badge}`,
        ).includes(norm)

        if (activeView === 'courses') {
          return course.status !== 'completed' && matchesQuery
        }

        return matchesTab(course, activeTab) && matchesQuery
      })
      .sort((a, b) => {
        // Asignaturas fijadas al inicio
        if (a.isPinned && !b.isPinned) return -1
        if (!a.isPinned && b.isPinned) return 1

        if (sortParam === 'urgency') {
          const aUrg = a.taskUrgent ? 1 : 0
          const bUrg = b.taskUrgent ? 1 : 0
          if (aUrg !== bUrg) return bUrg - aUrg
        }

        if (sortParam === 'progress') {
          return (b.progress || 0) - (a.progress || 0)
        }

        if (sortParam === 'name') {
          return a.title.localeCompare(b.title, 'es')
        }

        // 'recent' o por defecto
        return b.id - a.id
      })
  }, [activeTab, activeView, courses, debouncedSearch, sortParam])

  // Métricas principales del estudiante
  const pendingCount = courses.filter((c) => c.status === 'pending').length
  const activeCount = courses.filter((c) => c.status !== 'completed').length
  const completedCount = courses.filter((c) => c.status === 'completed').length
  const activeFiltersCount =
    (activeTab !== 'all' ? 1 : 0) +
    (sortParam !== 'urgency' ? 1 : 0) +
    (debouncedSearch.trim() ? 1 : 0)

  const displayName =
    [user?.nombres, user?.apellidos].filter(Boolean).join(' ') ||
    user?.first_name ||
    user?.nombre ||
    'Esteban Morales'

  async function handleLogout() {
    try {
      await signOut()
    } finally {
      navigate('/login', { replace: true })
    }
  }

  // Handlers para las tarjetas de curso
  function handleTogglePin(courseId) {
    setCourses((prev) =>
      prev.map((c) => (c.id === courseId ? { ...c, isPinned: !c.isPinned } : c)),
    )
  }

  function handleOpenMaterials(course) {
    setActiveModalCourse(course)
    setMaterialModalOpen(true)
  }

  function handleOpenInteraction(course) {
    setActiveModalCourse(course)
    setInteractionModalOpen(true)
  }

  function handleOpenSyllabus(course) {
    setActiveModalCourse(course)
    setSyllabusModalOpen(true)
  }

  function handleRoleChange(newRole) {
    if (userRole !== 'Administrador' && newRole !== userRole) {
      setRbacAlert(
        'Acceso Denegado (403): Tu perfil no posee privilegios administrativos para cambiar de rol.',
      )
      return
    }
    setActiveRole(newRole)
    setRbacAlert(null)
    if (newRole === 'Docente') {
      handleViewChange('teacher-overview')
    } else if (newRole === 'Administrador') {
      handleViewChange('admin-overview')
    } else {
      handleViewChange('overview')
    }
  }

  function handleEnterClassroom(course) {
    setClassroomModalCourse(course)
  }

  function handleViewRecord() {
    handleViewChange('expediente')
  }

  return (
    <div className="min-h-screen bg-[#F6F8FB] dark:bg-[#0B1220] [data-theme=contrast]_&:bg-black font-sans text-xs sm:text-sm text-[#0F172A] dark:text-[#F8FAFC] [data-theme=contrast]_&:text-white antialiased transition-colors duration-200">
      {/* Encabezado Superior Global con RBAC */}
      <Header
        activeRole={activeRole}
        displayName={displayName}
        menuOpen={menuOpen}
        notifications={notifications}
        onLogout={handleLogout}
        onMarkNotificationsRead={() =>
          setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })))
        }
        onNavigate={handleViewChange}
        setActiveRole={handleRoleChange}
        setMenuOpen={setMenuOpen}
        userRole={userRole}
      />

      {/* Navegación Lateral Simplificada y Colapsable */}
      <Sidebar
        activeRole={activeRole}
        activeView={activeView}
        isCollapsed={isSidebarCollapsed}
        menuOpen={menuOpen}
        onNavigate={handleViewChange}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        pendingCount={pendingCount}
        setMenuOpen={setMenuOpen}
      />

      {/* Contenido Principal */}
      <main
        className={`min-h-screen pt-16 transition-all duration-200 ${
          isSidebarCollapsed ? 'lg:pl-[72px]' : 'lg:pl-[240px]'
        }`}
      >
        <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {/* Banner de Seguridad RBAC */}
          {rbacAlert && (
            <div
              className="mb-6 flex items-center justify-between rounded-2xl border border-[#FECACA] bg-[#FEF2F2] p-4 text-xs text-[#991B1B] shadow-xs animate-in fade-in"
              role="alert"
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-lg text-[#C53030]">
                  gpp_bad
                </span>
                <span className="font-semibold">{rbacAlert}</span>
              </div>
              <button
                aria-label="Cerrar notificación de seguridad"
                className="rounded-lg p-1 text-[#991B1B] hover:bg-[#FEE2E2]"
                onClick={() => setRbacAlert(null)}
                type="button"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>
          )}
          {/* Vista Global: Ajustes del Sistema */}
          {activeView === 'settings' && (
            <SettingsView activeRole={activeRole} displayName={displayName} />
          )}

          {/* Vista Especializada: Rol Docente */}
          {activeRole === 'Docente' && activeView !== 'settings' && (
            <TeacherDashboardView
              activeSubView={activeView}
              onNavigate={handleViewChange}
            />
          )}

          {/* Vista Especializada: Rol Administrador */}
          {activeRole === 'Administrador' && activeView !== 'settings' && (
            <AdminDashboardView
              activeSubView={activeView}
              onNavigate={handleViewChange}
            />
          )}

          {/* Vistas Especializadas: Rol Estudiante */}
          {activeRole === 'Estudiante' && (
            <>
              {/* Vista Principal: Panel de Clases */}
              {activeView === 'overview' && (
                <div className="space-y-6">
                  {/* 1. Encabezado y Resumen del Estudiante (Un único título principal, métricas jerarquizadas) */}
                  <div className="flex flex-col gap-3 rounded-2xl border border-[#E2E8F0] dark:border-[#2A3A52] [data-theme=contrast]_&:border-white bg-white dark:bg-[#111B2E] [data-theme=contrast]_&:bg-[#0D0D0D] p-5 sm:p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h1 className="text-2xl sm:text-[26px] font-extrabold tracking-tight text-[#0F172A] dark:text-white">
                        {t('dashboard.title')}
                      </h1>
                      {/* Resumen métrico jerarquizado */}
                      <p className="mt-1 text-xs sm:text-sm text-[#475569] dark:text-[#94A3B8]">
                        {language === 'es' ? (
                          <>
                            Tienes <strong className="font-bold text-[#0F172A] dark:text-white">{activeCount} clases activas</strong> y{' '}
                            <strong className="font-bold text-[#B54708] dark:text-[#FCA5A5]">{pendingCount} actividades pendientes</strong>.
                          </>
                        ) : language === 'arn' ? (
                          <>
                            Nieymi <strong className="font-bold text-[#0F172A] dark:text-white">{activeCount} chillkatuwe petu tremkülelu</strong> ka{' '}
                            <strong className="font-bold text-[#B54708] dark:text-[#FCA5A5]">{pendingCount} pepikawal küdaw</strong>.
                          </>
                        ) : (
                          <>
                            You have <strong className="font-bold text-[#0F172A] dark:text-white">{activeCount} active classes</strong> and{' '}
                            <strong className="font-bold text-[#B54708] dark:text-[#FCA5A5]">{pendingCount} pending activities</strong>.
                          </>
                        )}
                      </p>
                    </div>

                    {/* Acción 'Revisar pendientes' (altura 40-44px con badge numérico integrado) */}
                    {pendingCount > 0 && (
                      <button
                        className="btn-primary inline-flex items-center gap-2 self-start sm:self-center rounded-xl bg-[#0B5575] hover:bg-[#074968] dark:bg-[#0E7490] dark:hover:bg-[#155E75] h-11 min-h-[44px] px-4 text-xs font-bold text-white shadow-xs transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B5575] dark:focus-visible:ring-[#67E8F9] [data-theme=contrast]_&:focus-visible:ring-[#FFD400]"
                        onClick={() => setQuickResolutionOpen(true)}
                        type="button"
                      >
                        <span aria-hidden="true" className="material-symbols-outlined text-base">
                          assignment_late
                        </span>
                        <span>{t('dashboard.review_pending')}</span>
                        <span className="grid size-5 place-items-center rounded-full bg-[#B42318] text-[10px] font-bold text-white shadow-xs">
                          {pendingCount}
                        </span>
                      </button>
                    )}
                  </div>

                  {/* 2. Herramientas de Consulta: Chips a la izq, Búsqueda al centro, Orden a la der */}
                  <div className="flex flex-col gap-3 rounded-2xl border border-[#E2E8F0] dark:border-[#2A3A52] [data-theme=contrast]_&:border-white bg-white dark:bg-[#111B2E] [data-theme=contrast]_&:bg-[#0D0D0D] p-3 sm:p-4 shadow-xs lg:flex-row lg:items-center lg:justify-between">
                    {/* Chips de filtro (min-height: 36px) con aria-pressed */}
                    <div aria-label="Filtrar por estado" className="hidden lg:flex items-center gap-1.5 overflow-x-auto" role="tablist">
                      {TABS.map((item) => {
                        const count = courses.filter((c) => matchesTab(c, item.id)).length
                        const isSelected = activeTab === item.id
                        const label = item.i18nKey ? t(item.i18nKey) : item.label

                        return (
                          <button
                            aria-pressed={isSelected}
                            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl h-9 min-h-[36px] px-3.5 text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B5575] ${
                              isSelected
                                ? 'bg-[#0B5575] text-white dark:bg-[#0E7490] [data-theme=contrast]_&:bg-white [data-theme=contrast]_&:text-black shadow-xs'
                                : 'bg-white dark:bg-[#16243A] [data-theme=contrast]_&:bg-[#0D0D0D] text-[#475569] dark:text-[#CBD5E1] [data-theme=contrast]_&:text-white border border-[#CBD5E1] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6] hover:bg-[#F8FAFC] dark:hover:bg-[#1D2F46] [data-theme=contrast]_&:hover:bg-[#262626]'
                            }`}
                            key={item.id}
                            onClick={() => handleTabChange(item.id)}
                            type="button"
                          >
                            <span>{label}</span>
                            <span
                              className={`rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                                isSelected ? 'bg-white/25 text-white' : 'bg-[#E2E8F0] dark:bg-[#334155] text-[#0F172A] dark:text-white'
                              }`}
                            >
                              {count}
                            </span>
                          </button>
                        )
                      })}
                    </div>

                    {/* Búsqueda flexible al centro (min 40px, max 280px) y Ordenamiento fijo a la der */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                      {/* Búsqueda contextual flexible */}
                      <div className="relative w-full sm:w-[260px] lg:max-w-[280px]">
                        <span
                          aria-hidden="true"
                          className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg text-[#64748B] dark:text-[#94A3B8]"
                        >
                          search
                        </span>
                        <input
                          aria-label={t('dashboard.search_placeholder')}
                          className="w-full h-10 min-h-[40px] rounded-xl border border-[#CBD5E1] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6] bg-[#F8FAFC] dark:bg-[#16243A] [data-theme=contrast]_&:bg-black py-2 pl-9 pr-8 text-xs text-[#0F172A] dark:text-[#F8FAFC] [data-theme=contrast]_&:text-white placeholder:text-[#64748B] dark:placeholder:text-[#94A3B8] focus:border-[#0B5575] dark:focus:border-[#67E8F9] [data-theme=contrast]_&:focus:border-[#FFD400] focus:bg-white dark:focus:bg-[#11182E] [data-theme=contrast]_&:focus:bg-black focus:outline-none focus:ring-2 focus:ring-[#0B5575]/20"
                          onChange={(e) => setSearchInput(e.target.value)}
                          placeholder={t('dashboard.search_placeholder')}
                          type="search"
                          value={searchInput}
                        />
                        {searchInput && (
                          <button
                            aria-label="Limpiar búsqueda"
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white"
                            onClick={() => setSearchInput('')}
                            type="button"
                          >
                            <span className="material-symbols-outlined text-base">close</span>
                          </button>
                        )}
                      </div>

                      {/* Botón de Filtros en Pantallas Pequeñas */}
                      <button
                        aria-label="Abrir panel de filtros"
                        className="inline-flex lg:hidden items-center justify-center gap-1.5 rounded-xl border border-[#CBD5E1] dark:border-[#2A3A52] bg-white dark:bg-[#16243A] [data-theme=contrast]_&:bg-[#0D0D0D] [data-theme=contrast]_&:border-[#A6A6A6] h-10 px-3 text-xs font-bold text-[#0B5575] dark:text-[#67E8F9] [data-theme=contrast]_&:text-[#00B7FF] hover:bg-[#F8FAFC] dark:hover:bg-[#1D2F46] shrink-0"
                        onClick={() => setMobileFiltersOpen(true)}
                        type="button"
                      >
                        <span className="material-symbols-outlined text-base">tune</span>
                        <span>{t('dashboard.filters')} {activeFiltersCount > 0 ? `· ${activeFiltersCount}` : ''}</span>
                      </button>

                      {/* Ordenamiento fijo a la derecha */}
                      <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                        <label className="sr-only" htmlFor="sort-select">
                          {t('dashboard.sort_by')}
                        </label>
                        <select
                          className="h-10 min-h-[40px] rounded-xl border border-[#CBD5E1] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6] bg-[#F8FAFC] dark:bg-[#16243A] [data-theme=contrast]_&:bg-black py-2 px-3 text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC] [data-theme=contrast]_&:text-white focus:border-[#0B5575] dark:focus:border-[#67E8F9] [data-theme=contrast]_&:focus:border-[#FFD400] focus:bg-white dark:focus:bg-[#111B2E] [data-theme=contrast]_&:focus:bg-black focus:outline-none focus:ring-2 focus:ring-[#0B5575]/20"
                          id="sort-select"
                          onChange={(e) => handleSortChange(e.target.value)}
                          value={sortParam}
                        >
                          {SORT_OPTIONS.map((opt) => (
                            <option key={opt.id} value={opt.id}>
                              {opt.i18nKey ? t(opt.i18nKey) : opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Contador de resultados y estado de filtros */}
                  <div className="flex items-center justify-between px-1 text-xs text-[#64748b]">
                    <span>
                      {t('dashboard.showing_courses', { shown: filteredCourses.length, total: courses.length })}
                    </span>
                    {activeFiltersCount > 0 && (
                      <button
                        className="font-bold text-[#075477] hover:underline"
                        onClick={handleClearFilters}
                        type="button"
                      >
                        {t('dashboard.clear_filters')} ({activeFiltersCount})
                      </button>
                    )}
                  </div>

                  {/* 3. Lista de Asignaturas */}
                  {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                      <SkeletonCard />
                      <SkeletonCard />
                      <SkeletonCard />
                    </div>
                  ) : filteredCourses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                      {filteredCourses.map((course) => (
                        <CourseCard
                          course={course}
                          key={`${course.code}-${course.section}-${course.id}`}
                          onEnterClassroom={handleEnterClassroom}
                          onOpenInteraction={handleOpenInteraction}
                          onOpenMaterials={handleOpenMaterials}
                          onOpenSyllabus={handleOpenSyllabus}
                          onTogglePin={handleTogglePin}
                          onViewRecord={handleViewRecord}
                        />
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      actionLabel={t('dashboard.clear_filters')}
                      description={t('dashboard.no_courses_desc')}
                      onAction={handleClearFilters}
                      title={t('dashboard.no_courses_title')}
                    />
                  )}

                  {/* Anuncios del Periodo */}
                  <div className="rounded-2xl border border-[#E2E8F0] dark:border-[#2A3A52] [data-theme=contrast]_&:border-white bg-white dark:bg-[#111B2E] [data-theme=contrast]_&:bg-[#0D0D0D] p-5 sm:p-6 shadow-xs">
                    <div className="flex items-center justify-between border-b border-[#E2E8F0] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6] pb-3 mb-4">
                      <h2 className="text-base font-bold text-[#0F172A] dark:text-white">
                        {t('dashboard.announcements_title')}
                      </h2>
                      <span className="text-xs text-[#64748B] dark:text-[#94A3B8]">{t('dashboard.current_semester')}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {ANNOUNCEMENTS.map((a) => (
                        <div className="rounded-xl border border-[#E2E8F0] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6] bg-[#F8FAFC] dark:bg-[#16243A] [data-theme=contrast]_&:bg-[#0D0D0D] p-4 text-xs" key={a.id}>
                          <div className="flex items-center justify-between text-[#64748B] dark:text-[#94A3B8] mb-1">
                            <span className="font-bold text-[#0B5575] dark:text-[#67E8F9] [data-theme=contrast]_&:text-[#00B7FF]">{a.category}</span>
                            <span className="tabular-nums">{a.date}</span>
                          </div>
                          <h3 className="font-bold text-[#0F172A] dark:text-white text-xs sm:text-sm">{a.title}</h3>
                          <p className="text-[#475569] dark:text-[#CBD5E1] mt-1 line-clamp-2 leading-relaxed">{a.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Vista: Calendario */}
              {activeView === 'calendar' && (
                <CalendarView
                  events={CALENDAR_EVENTS}
                  onNavigateToCourse={() => handleViewChange('courses')}
                  onNavigateToTasks={() => handleViewChange('tasks')}
                />
              )}

              {/* Vista: Clases Inscritas */}
              {activeView === 'courses' && (
                <div className="space-y-6">
                  <div className="rounded-2xl border border-[#E2E8F0] dark:border-[#2A3A52] [data-theme=contrast]_&:border-white bg-white dark:bg-[#111B2E] [data-theme=contrast]_&:bg-[#0D0D0D] p-5 sm:p-6 shadow-xs">
                    <h1 className="text-2xl font-extrabold text-[#1F2937]">
                      {t('dashboard.enrolled_courses')}
                    </h1>
                    <p className="text-xs sm:text-sm text-[#4B5563] mt-1">
                      {t('dashboard.enrolled_desc')}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {courses
                      .filter((c) => c.status !== 'completed')
                      .map((course) => (
                        <CourseCard
                          course={course}
                          key={course.id}
                          onEnterClassroom={handleEnterClassroom}
                          onOpenInteraction={handleOpenInteraction}
                          onOpenMaterials={handleOpenMaterials}
                          onOpenSyllabus={handleOpenSyllabus}
                          onTogglePin={handleTogglePin}
                          onViewRecord={handleViewRecord}
                        />
                      ))}
                  </div>
                </div>
              )}

              {/* Vista: Evaluaciones y Pendientes */}
              {activeView === 'tasks' && (
                <TasksCenterView courses={courses} />
              )}

              {/* Vista: Expediente Académico del Estudiante */}
              {activeView === 'expediente' && (
                <AcademicRecordView onBackToDashboard={() => handleViewChange('overview')} />
              )}

              {/* Vista: Cursos Archivados */}
              {activeView === 'archived' && (
                <ArchivedCoursesView
                  archivedCourses={courses.filter((c) => c.status === 'completed')}
                  onOpenMaterials={handleOpenMaterials}
                  onOpenSyllabus={handleOpenSyllabus}
                />
              )}
            </>
          )}
        </div>

        {/* Footer Discreto */}
        <footer className="mt-12 border-t border-[#E2E8F0] dark:border-[#2A3A52] [data-theme=contrast]_&:border-white bg-white dark:bg-[#111B2E] [data-theme=contrast]_&:bg-[#0D0D0D] py-6 text-center text-xs text-[#64748B] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9]">
          Campus Virtual LMS · 2026
        </footer>
      </main>

      {/* Modales */}
      <QuickResolutionModal
        criticalAlerts={CRITICAL_ALERTS}
        isOpen={quickResolutionOpen}
        onClose={() => setQuickResolutionOpen(false)}
        onResolve={(alertItem) => {
          setCourses((prev) =>
            prev.map((c) =>
              c.code === alertItem.courseCode
                ? {
                    ...c,
                    status: 'progress',
                    taskTitle: 'Entrega completada',
                    taskUrgent: false,
                    progress: Math.min(100, (c.progress || 50) + 15),
                  }
                : c,
            ),
          )
        }}
      />

      {/* Modal Interactivo de Aula Virtual */}
      <ClassroomModal
        course={classroomModalCourse}
        isOpen={Boolean(classroomModalCourse)}
        onClose={() => setClassroomModalCourse(null)}
        onOpenInteraction={handleOpenInteraction}
        onOpenMaterials={handleOpenMaterials}
      />

      <DidacticMaterialModal
        course={activeModalCourse}
        isOpen={materialModalOpen}
        onClose={() => setMaterialModalOpen(false)}
      />

      <InteractionModal
        course={activeModalCourse}
        isOpen={interactionModalOpen}
        onClose={() => setInteractionModalOpen(false)}
      />

      <SyllabusModal
        course={activeModalCourse}
        isOpen={syllabusModalOpen}
        onClose={() => setSyllabusModalOpen(false)}
      />

      {/* Drawer de Filtros Móviles (Recomendación 11) */}
      <Drawer
        footer={
          <div className="flex items-center justify-between w-full">
            <button
              className="text-xs font-bold text-[#64748b] hover:text-[#172033]"
              onClick={() => {
                handleClearFilters()
                setMobileFiltersOpen(false)
              }}
              type="button"
            >
              {t('dashboard.drawer_clear_all')}
            </button>
            <button
              className="rounded-[10px] bg-[#075477] px-4 py-2 text-xs font-bold text-white hover:bg-[#064563]"
              onClick={() => setMobileFiltersOpen(false)}
              type="button"
            >
              {t('dashboard.drawer_apply')}
            </button>
          </div>
        }
        onClose={() => setMobileFiltersOpen(false)}
        open={mobileFiltersOpen}
        subtitle={t('dashboard.drawer_subtitle')}
        title={t('dashboard.drawer_title')}
      >
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-[#172033] mb-2">
              {t('dashboard.drawer_course_status')}
            </label>
            <div className="grid grid-cols-1 gap-1.5">
              {TABS.map((tab) => {
                const isSelected = activeTab === tab.id
                const count = courses.filter((c) => matchesTab(c, tab.id)).length

                return (
                  <button
                    className={`flex items-center justify-between rounded-[8px] p-2.5 text-xs font-bold transition ${
                      isSelected
                        ? 'bg-[#075477] text-white shadow-xs'
                        : 'bg-[#f8fafc] text-[#64748b] border border-[#dbe3ec] hover:bg-[#f1f5f9]'
                    }`}
                    key={tab.id}
                    onClick={() => {
                      handleTabChange(tab.id)
                      setMobileFiltersOpen(false)
                    }}
                    type="button"
                  >
                    <span>{tab.i18nKey ? t(tab.i18nKey) : tab.label}</span>
                    <span
                      className={`text-[10px] rounded-full px-1.5 py-0.2 font-black ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-[#e2e8f0] text-[#172033]'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="border-t border-[#dbe3ec] pt-4">
            <label className="block text-xs font-bold text-[#172033] mb-2">
              {t('dashboard.drawer_sort_criteria')}
            </label>
            <div className="grid grid-cols-1 gap-1.5">
              {SORT_OPTIONS.map((opt) => {
                const isSelected = sortParam === opt.id

                return (
                  <button
                    className={`flex items-center justify-between rounded-[8px] p-2.5 text-xs font-bold transition ${
                      isSelected
                        ? 'bg-[#075477] text-white shadow-xs'
                        : 'bg-[#f8fafc] text-[#64748b] border border-[#dbe3ec] hover:bg-[#f1f5f9]'
                    }`}
                    key={opt.id}
                    onClick={() => {
                      handleSortChange(opt.id)
                      setMobileFiltersOpen(false)
                    }}
                    type="button"
                  >
                    <span>{opt.i18nKey ? t(opt.i18nKey) : opt.label}</span>
                    {isSelected && (
                      <span className="material-symbols-outlined text-sm">check</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </Drawer>
    </div>
  )
}

export default Dashboard
