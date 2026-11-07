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
import { SkeletonCard } from './feedback/SkeletonCard'
import { EmptyState } from './feedback/EmptyState'
import { Drawer } from './ui/Drawer'

const TABS = [
  { id: 'all', label: 'Todas' },
  { id: 'progress', label: 'En curso' },
  { id: 'pending', label: 'Con pendientes' },
  { id: 'completed', label: 'Completadas' },
]

const SORT_OPTIONS = [
  { id: 'recent', label: 'Más recientes' },
  { id: 'urgency', label: 'Próxima entrega' },
  { id: 'progress', label: 'Mayor progreso' },
  { id: 'name', label: 'Nombre de la asignatura' },
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
    <div className="min-h-screen bg-[#F5F7FA] font-sans text-xs sm:text-sm text-[#1F2937] antialiased">
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
          isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
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
                  {/* 1. Encabezado y Resumen del Estudiante (Un único título principal) */}
                  <div className="flex flex-col gap-3 rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h1 className="text-2xl sm:text-[26px] font-extrabold tracking-tight text-[#1F2937]">
                        Panel Central de Clases
                      </h1>
                      {/* Resumen útil que ofrece contexto inmediato */}
                      <p className="mt-1 text-xs sm:text-sm text-[#4B5563]">
                        Tienes <strong className="text-[#0B4F6C]">{activeCount} clases activas</strong> y{' '}
                        <strong className="text-[#C53030]">{pendingCount} actividades pendientes</strong>.
                      </p>
                    </div>

                    {/* Acción 'Revisar pendientes' */}
                    {pendingCount > 0 && (
                      <button
                        className="inline-flex items-center gap-2 self-start sm:self-center rounded-xl bg-[#0B4F6C] px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#083C53] transition active:scale-95"
                        onClick={() => setQuickResolutionOpen(true)}
                        type="button"
                      >
                        <span aria-hidden="true" className="material-symbols-outlined text-base">
                          assignment_late
                        </span>
                        <span>Revisar pendientes</span>
                        <span className="grid size-5 place-items-center rounded-full bg-[#C53030] text-[10px] font-bold text-white">
                          {pendingCount}
                        </span>
                      </button>
                    )}
                  </div>

                  {/* 2. Herramientas de Consulta: Filtros y Búsqueda */}
                  <div className="flex flex-col gap-3 rounded-2xl border border-[#E2E8F0] bg-white p-3 sm:p-4 shadow-xs lg:flex-row lg:items-center lg:justify-between">
                    {/* Pestañas de Segmentación en Escritorio */}
                    <div aria-label="Filtrar por estado" className="hidden lg:flex items-center gap-1.5 overflow-x-auto" role="tablist">
                      {TABS.map((item) => {
                        const count = courses.filter((c) => matchesTab(c, item.id)).length
                        const isSelected = activeTab === item.id

                        return (
                          <button
                            aria-selected={isSelected}
                            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#075477] ${
                              isSelected
                                ? 'bg-[#075477] text-white shadow-xs'
                                : 'text-[#4B5563] hover:bg-[#F1F5F9] hover:text-[#1F2937]'
                            }`}
                            key={item.id}
                            onClick={() => handleTabChange(item.id)}
                            role="tab"
                            type="button"
                          >
                            <span>{item.label}</span>
                            <span
                              className={`rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                                isSelected ? 'bg-white/25 text-white' : 'bg-[#E2E8F0] text-[#1F2937]'
                              }`}
                            >
                              {count}
                            </span>
                          </button>
                        )
                      })}
                    </div>

                    {/* Búsqueda, Botón Filtros Móvil y Ordenamiento */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 lg:min-w-[440px]">
                      {/* Búsqueda contextual */}
                      <div className="relative flex-1">
                        <span
                          aria-hidden="true"
                          className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg text-[#64748B]"
                        >
                          search
                        </span>
                        <input
                          aria-label="Buscar por asignatura, docente o código"
                          className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] py-2 pl-9 pr-8 text-xs text-[#1F2937] placeholder:text-[#64748B] focus:border-[#075477] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#075477]/20"
                          onChange={(e) => setSearchInput(e.target.value)}
                          placeholder="Buscar por asignatura, docente o código"
                          type="search"
                          value={searchInput}
                        />
                        {searchInput && (
                          <button
                            aria-label="Limpiar búsqueda"
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#1F2937]"
                            onClick={() => setSearchInput('')}
                            type="button"
                          >
                            <span className="material-symbols-outlined text-base">close</span>
                          </button>
                        )}
                      </div>

                      {/* Botón de Filtros en Pantallas Pequeñas (Recomendación 11) */}
                      <button
                        aria-label="Abrir panel de filtros"
                        className="inline-flex lg:hidden items-center justify-center gap-1.5 rounded-xl border border-[#dbe3ec] bg-white px-3 py-2 text-xs font-bold text-[#075477] hover:bg-[#f8fafc] shrink-0"
                        onClick={() => setMobileFiltersOpen(true)}
                        type="button"
                      >
                        <span className="material-symbols-outlined text-base">tune</span>
                        <span>Filtros {activeFiltersCount > 0 ? `· ${activeFiltersCount}` : ''}</span>
                      </button>

                      {/* Ordenamiento discreto */}
                      <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                        <label className="sr-only" htmlFor="sort-select">
                          Ordenar asignaturas
                        </label>
                        <select
                          className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] py-2 px-3 text-xs font-semibold text-[#1F2937] focus:border-[#075477] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#075477]/20"
                          id="sort-select"
                          onChange={(e) => handleSortChange(e.target.value)}
                          value={sortParam}
                        >
                          {SORT_OPTIONS.map((opt) => (
                            <option key={opt.id} value={opt.id}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Contador de resultados y estado de filtros */}
                  <div className="flex items-center justify-between px-1 text-xs text-[#64748b]">
                    <span>
                      Mostrando <strong className="text-[#172033]">{filteredCourses.length}</strong> de <strong className="text-[#172033]">{courses.length}</strong> clases
                    </span>
                    {activeFiltersCount > 0 && (
                      <button
                        className="font-bold text-[#075477] hover:underline"
                        onClick={handleClearFilters}
                        type="button"
                      >
                        Limpiar filtros ({activeFiltersCount})
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
                      actionLabel="Limpiar filtros"
                      description="No encontramos clases con estos filtros. Prueba eliminando algún filtro o realiza otra búsqueda."
                      onAction={handleClearFilters}
                      title="No encontramos clases con estos filtros"
                    />
                  )}

                  {/* Anuncios del Periodo */}
                  <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-6 shadow-xs">
                    <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3 mb-4">
                      <h2 className="text-base font-bold text-[#1F2937]">
                        Avisos Académicos
                      </h2>
                      <span className="text-xs text-[#64748B]">Semestre en curso</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {ANNOUNCEMENTS.map((a) => (
                        <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 text-xs" key={a.id}>
                          <div className="flex items-center justify-between text-[#64748B] mb-1">
                            <span className="font-bold text-[#0B4F6C]">{a.category}</span>
                            <span>{a.date}</span>
                          </div>
                          <h3 className="font-bold text-[#1F2937] text-xs sm:text-sm">{a.title}</h3>
                          <p className="text-[#4B5563] mt-1 line-clamp-2 leading-relaxed">{a.content}</p>
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
                  <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-6 shadow-xs">
                    <h1 className="text-2xl font-extrabold text-[#1F2937]">
                      Clases Inscritas
                    </h1>
                    <p className="text-xs sm:text-sm text-[#4B5563] mt-1">
                      Listado oficial de asignaturas vigentes durante el Semestre Otoño 2026.
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
        <footer className="mt-12 border-t border-[#E2E8F0] bg-white py-6 text-center text-xs text-[#64748B]">
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

      {/* Modal Interactivo de Aula Virtual (Conexión funcional del botón Ver Clase) */}
      {classroomModalCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-2xl">
            <button
              aria-label="Cerrar aula virtual"
              className="absolute right-4 top-4 rounded-full p-1.5 text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#1F2937]"
              onClick={() => setClassroomModalCourse(null)}
              type="button"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>

            <div className="border-b border-[#E2E8F0] pb-3">
              <span className="font-mono text-xs font-bold text-[#0B4F6C]">
                {classroomModalCourse.code} · Sec. {classroomModalCourse.section || 1}
              </span>
              <h3 className="text-lg font-extrabold text-[#1F2937] mt-0.5">
                {classroomModalCourse.title}
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Docente: {classroomModalCourse.teacher} · Semestre Otoño 2026
              </p>
            </div>

            <div className="my-4 space-y-3">
              <div className="rounded-xl border border-[#BAE6FD] bg-[#F0F9FF] p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#0369A1] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base">videocam</span>
                    Sesión Sincrónica Activa
                  </span>
                  <span className="rounded-full bg-[#16856A] px-2 py-0.5 text-[10px] font-bold text-white">
                    En Línea
                  </span>
                </div>
                <p className="text-[11px] text-[#0284C7] mt-1">
                  Sala de clase en vivo habilitada para la sección.
                </p>
                <div className="mt-2.5 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B4F6C] px-3 py-1.5 text-xs font-bold text-white shadow-xs">
                    <span className="material-symbols-outlined text-sm">meeting_room</span>
                    Aula Virtual Conectada
                  </span>
                  <span className="text-[10px] text-[#64748B]">Acceso institucional verificado</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  className="flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3 hover:bg-[#F1F5F9] text-left transition"
                  onClick={() => {
                    handleOpenMaterials(classroomModalCourse)
                    setClassroomModalCourse(null)
                  }}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[#0B4F6C]">folder</span>
                  <div>
                    <p className="font-bold text-[#1F2937]">Material Didáctico</p>
                    <p className="text-[10px] text-[#64748B]">Guías y recursos</p>
                  </div>
                </button>

                <button
                  className="flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3 hover:bg-[#F1F5F9] text-left transition"
                  onClick={() => {
                    handleOpenInteraction(classroomModalCourse)
                    setClassroomModalCourse(null)
                  }}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[#16856A]">forum</span>
                  <div>
                    <p className="font-bold text-[#1F2937]">Foro de Consulta</p>
                    <p className="text-[10px] text-[#64748B]">Canal de sección</p>
                  </div>
                </button>
              </div>

              <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#1F2937]">Progreso en la Asignatura</span>
                  <span className="font-mono font-bold text-[#0B4F6C]">
                    {classroomModalCourse.progress || 0}%
                  </span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#E2E8F0]">
                  <div
                    className="h-full bg-[#0B4F6C] transition-all"
                    style={{ width: `${classroomModalCourse.progress || 0}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-[#E2E8F0] pt-3">
              <button
                className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-2 text-xs font-bold text-[#4B5563] hover:bg-[#F8FAFC]"
                onClick={() => setClassroomModalCourse(null)}
                type="button"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

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
              Limpiar todos
            </button>
            <button
              className="rounded-[10px] bg-[#075477] px-4 py-2 text-xs font-bold text-white hover:bg-[#064563]"
              onClick={() => setMobileFiltersOpen(false)}
              type="button"
            >
              Aplicar filtros
            </button>
          </div>
        }
        onClose={() => setMobileFiltersOpen(false)}
        open={mobileFiltersOpen}
        subtitle="Herramientas de Consulta"
        title="Filtros y Ordenamiento"
      >
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-[#172033] mb-2">
              Estado de la Asignatura
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
                    <span>{tab.label}</span>
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
              Criterio de Ordenamiento
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
                    <span>{opt.label}</span>
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
