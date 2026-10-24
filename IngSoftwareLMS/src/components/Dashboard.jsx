import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/auth-context'
import api from '../services/api'

const COURSE_COLORS = [
  'from-primary via-[#104c64] to-[#104c64]',
  'from-secondary via-teal-800 to-primary',
  'from-amber-900 via-amber-800 to-stone-900',
  'from-slate-800 via-slate-800 to-slate-900',
  'from-emerald-900 via-secondary to-primary',
  'from-slate-700 via-primary to-slate-800',
]

const TABS = [
  { id: 'all', label: 'Todas las clases' },
  { id: 'progress', label: 'En curso' },
  { id: 'pending', label: 'Con pendientes' },
  { id: 'completed', label: 'Completadas' },
]

function normalize(value) {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLocaleLowerCase('es')
}

function matchesTab(course, tab) {
  if (tab === 'progress') return course.status !== 'completed'
  if (tab === 'pending') return course.status === 'pending'
  if (tab === 'completed') return course.status === 'completed'
  return true
}

function CourseCard({ course }) {
  const hasProgress = Number.isInteger(course.progress)

  return (
    <article
      className={`flex flex-col overflow-hidden rounded-xl border border-line bg-card shadow-sm transition-transform motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-lg ${
        course.status === 'completed' ? 'opacity-90' : ''
      }`}
    >
      <div
        className={`flex min-h-36 flex-col justify-between bg-gradient-to-br p-4 text-white ${course.colors}`}
      >
        <div>
          <span className="rounded bg-white/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-secondary-fixed">
            {course.code}
            {course.section ? ` · Sec. ${course.section}` : ''}
          </span>
          <h2 className="mt-2 truncate text-base font-bold leading-tight" title={course.title}>
            {course.title}
          </h2>
          <p className="text-xs text-white/80">{course.teacher}</p>
        </div>
        <span className="mt-3 inline-flex w-max items-center gap-1 rounded-full bg-secondary-fixed px-2 py-0.5 text-[11px] font-bold text-primary">
          <span className="material-symbols-outlined text-sm" aria-hidden="true">
            {course.status === 'completed' ? 'verified' : 'school'}
          </span>
          {course.badge}
        </span>
      </div>

      <div className="flex flex-1 flex-col justify-between gap-4 p-4">
        <div>
          <div className="mb-2 flex justify-between text-[10px] font-bold uppercase tracking-wider">
            <span className="text-muted">Avance del curso</span>
            <span className="text-primary">
              {hasProgress ? `${course.progress}%` : 'Sin datos'}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-subtle">
            {hasProgress && (
              <div
                aria-label={`Avance ${course.progress}%`}
                aria-valuemax="100"
                aria-valuemin="0"
                aria-valuenow={course.progress}
                className="h-full rounded-full bg-secondary"
                role="progressbar"
                style={{ width: `${course.progress}%` }}
              />
            )}
          </div>
          <div className="mt-4 flex items-start gap-2.5 rounded-lg bg-subtle p-3">
            <span className="material-symbols-outlined shrink-0 text-secondary" aria-hidden="true">
              assignment
            </span>
            <div className="min-w-0">
              {course.taskTitle ? (
                <>
                  <p className="text-[10px] font-bold uppercase text-secondary">
                    {course.taskDate}
                  </p>
                  <p className="truncate text-xs font-bold">{course.taskTitle}</p>
                  <p className="text-[11px] text-muted">{course.taskDescription}</p>
                </>
              ) : (
                <p className="text-xs text-muted">No hay entregas pendientes.</p>
              )}
            </div>
          </div>
        </div>
        <p className="border-t border-line pt-3 text-[11px] text-muted">
          {course.period || 'Período académico activo'}
        </p>
      </div>
    </article>
  )
}

function Dashboard() {
  const [tab, setTab] = useState('all')
  const [query, setQuery] = useState('')
  const [ascending, setAscending] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const [courses, setCourses] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    let active = true

    api
      .get('academico/cursos/')
      .then(({ data }) => {
        const rows = data?.datos ?? data?.results
        if (!Array.isArray(rows)) {
          throw new Error('El backend devolvió una lista de cursos no válida.')
        }
        if (active) {
          setCourses(
            rows.map((course, index) => ({
              ...course,
              colors: COURSE_COLORS[index % COURSE_COLORS.length],
            })),
          )
          setLoadError('')
        }
      })
      .catch((error) => {
        if (active) {
          setLoadError(
            error.response?.data?.detail ||
              'No se pudieron cargar tus cursos. Comprueba que el backend esté activo.',
          )
        }
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [reloadKey])

  useEffect(() => {
    function closeOnEscape(event) {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [])

  const filteredCourses = useMemo(() => {
    const normalizedQuery = normalize(query.trim())
    return courses.filter(
      (course) =>
        matchesTab(course, tab) &&
        normalize(`${course.title} ${course.teacher} ${course.code}`).includes(
          normalizedQuery,
        ),
    ).sort((a, b) =>
      a.title.localeCompare(b.title, 'es') * (ascending ? 1 : -1),
    )
  }, [ascending, courses, query, tab])

  const pendingCount = courses.filter((course) => course.status === 'pending').length
  const activeCount = courses.filter((course) => course.status !== 'completed').length
  const displayName =
    [user?.nombres, user?.apellidos].filter(Boolean).join(' ') ||
    user?.first_name ||
    user?.nombre ||
    user?.nombre_completo ||
    user?.correo_institucional ||
    'Usuario'

  async function handleLogout() {
    try {
      await signOut()
    } catch {
      navigate('/login', {
        replace: true,
        state: {
          notice:
            'La sesión se cerró en este dispositivo, pero el servidor no confirmó la revocación.',
        },
      })
      return
    }
    navigate('/login', { replace: true })
  }

  function selectTab(selectedTab) {
    setTab(selectedTab)
    setMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-surface font-sans text-sm text-ink antialiased">
      <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b border-line bg-card px-4 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            aria-controls="sidebar"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            className="rounded-full p-1.5 hover:bg-subtle lg:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            type="button"
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              menu
            </span>
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
            className="flex items-center gap-1.5 rounded-lg px-2 py-2 text-xs font-bold text-primary hover:bg-subtle sm:px-3"
            onClick={handleLogout}
            type="button"
          >
            <span className="material-symbols-outlined text-lg" aria-hidden="true">
              logout
            </span>
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </header>

      {menuOpen && (
        <button
          aria-label="Cerrar menú"
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setMenuOpen(false)}
          type="button"
        />
      )}

      <aside
        className={`fixed bottom-0 left-0 top-16 z-40 flex w-64 flex-col justify-between overflow-y-auto border-r border-line bg-card py-4 transition-transform motion-reduce:transition-none lg:translate-x-0 ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        id="sidebar"
      >
        <nav aria-label="Principal" className="flex flex-col gap-1 px-3">
          <button
            aria-current="page"
            className="flex items-center gap-3 rounded-lg bg-secondary-container px-3 py-2.5 text-left text-xs font-bold text-on-secondary-container"
            onClick={() => selectTab('all')}
            type="button"
          >
            <span className="material-symbols-outlined" aria-hidden="true">home</span>
            Inicio
          </button>
          {[
            ['calendar_today', 'Calendario'],
            ['assignment', 'Tareas pendientes'],
            ['folder_open', 'Clases inscritas'],
            ['archive', 'Cursos archivados'],
            ['settings', 'Ajustes'],
          ].map(([icon, label]) => (
            <button
              className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-left text-xs font-semibold text-muted/70"
              disabled
              key={label}
              title="Este módulo requiere integración con el backend."
              type="button"
            >
              <span className="material-symbols-outlined" aria-hidden="true">{icon}</span>
              {label}
              <span className="ml-auto text-[10px]">Próximamente</span>
            </button>
          ))}
        </nav>
        <div className="px-3">
          <div className="flex items-center justify-between rounded-xl border border-line bg-surface p-3">
            <p className="truncate text-xs font-bold">{displayName}</p>
            <span className="material-symbols-outlined text-secondary" aria-hidden="true">
              verified_user
            </span>
          </div>
        </div>
      </aside>

      <main className="min-h-screen pt-16 lg:pl-64">
        <section className="bg-gradient-to-r from-primary via-[#104c64] to-secondary px-6 py-8 text-white lg:px-10">
          <div className="mx-auto flex max-w-[1360px] flex-col justify-between gap-4 md:flex-row md:items-center">
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-secondary-fixed">
                Campus Digital
              </span>
              <div className="flex flex-wrap items-baseline gap-3">
                <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                  Panel Central de Clases
                </h1>
                <span className="rounded-full border border-secondary/50 bg-secondary/40 px-2.5 py-0.5 text-xs font-semibold">
                  {activeCount} asignaturas activas
                </span>
              </div>
              <p className="max-w-2xl text-sm text-white/90">
                Hola, {displayName}. Aquí podrás revisar tus clases y actividades.
              </p>
            </div>
            <button
              className="flex items-center gap-2 self-start rounded-xl bg-card px-4 py-2.5 text-xs font-bold text-primary transition hover:bg-secondary-container active:scale-95"
              onClick={() => selectTab('pending')}
              type="button"
            >
              <span className="material-symbols-outlined" aria-hidden="true">assignment_late</span>
              Revisar pendientes
              <span className="grid size-5 place-items-center rounded-full bg-danger text-[11px] text-white">
                {pendingCount}
              </span>
            </button>
          </div>
        </section>

        <section className="mx-auto flex max-w-[1360px] flex-col gap-6 px-6 pb-12 pt-6 lg:px-10">
          <div className="flex flex-col justify-between gap-4 rounded-xl border border-line bg-card p-3 shadow-sm lg:flex-row lg:items-center">
            <div aria-label="Filtrar asignaturas" className="flex gap-2 overflow-x-auto" role="tablist">
              {TABS.map((item) => {
                const count = courses.filter((course) =>
                  matchesTab(course, item.id),
                ).length
                return (
                  <button
                    aria-selected={tab === item.id}
                    className={`whitespace-nowrap rounded-full px-4 py-2 text-xs transition ${
                      tab === item.id
                        ? 'bg-primary font-bold text-white'
                        : 'font-semibold text-muted hover:bg-subtle'
                    }`}
                    key={item.id}
                    onClick={() => setTab(item.id)}
                    role="tab"
                    type="button"
                  >
                    {item.label}
                    {item.id !== 'all' && (
                      <span className="ml-1 rounded-full bg-subtle px-1.5 text-[10px] text-ink">
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
            <div className="flex items-center gap-2.5 lg:min-w-[300px]">
              <label className="sr-only" htmlFor="course-search">
                Buscar asignatura
              </label>
              <div className="relative w-full">
                <span
                  className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                  aria-hidden="true"
                >
                  search
                </span>
                <input
                  className="w-full rounded-lg border-transparent bg-subtle py-2 pl-10 pr-4 text-xs focus:border-primary/30 focus:bg-card focus:ring-0"
                  id="course-search"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar ramo, docente o código..."
                  type="search"
                  value={query}
                />
              </div>
              <button
                aria-label={`Ordenar por nombre (${ascending ? 'A-Z' : 'Z-A'})`}
                className="shrink-0 rounded-lg border border-line bg-subtle p-2 hover:bg-line/60"
                onClick={() => setAscending((current) => !current)}
                type="button"
              >
                <span className="material-symbols-outlined" aria-hidden="true">
                  {ascending ? 'arrow_upward' : 'arrow_downward'}
                </span>
              </button>
            </div>
          </div>

          {isLoading ? (
            <p className="rounded-xl border border-line bg-card px-6 py-12 text-center text-sm text-muted" role="status">
              Cargando tus cursos...
            </p>
          ) : loadError ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center" role="alert">
              <p className="text-sm font-semibold text-rose-800">{loadError}</p>
              <button
                className="mt-4 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white"
                onClick={() => {
                  setIsLoading(true)
                  setReloadKey((key) => key + 1)
                }}
                type="button"
              >
                Reintentar
              </button>
            </div>
          ) : filteredCourses.length ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredCourses.map((course) => (
                <CourseCard
                  course={course}
                  key={`${course.code}-${course.section}-${course.id}`}
                />
              ))}
            </div>
          ) : (
            <div
              className="flex flex-col items-center rounded-xl border border-line bg-card py-16 text-center"
              role="status"
            >
              <span className="material-symbols-outlined text-5xl text-muted" aria-hidden="true">
                search_off
              </span>
              <h2 className="mt-2 font-bold">No se encontraron asignaturas</h2>
              <p className="mt-1 text-xs text-muted">
                Prueba otros términos o cambia la categoría.
              </p>
              <button
                className="mt-4 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white"
                onClick={() => {
                  setTab('all')
                  setQuery('')
                }}
                type="button"
              >
                Restablecer filtros
              </button>
            </div>
          )}
        </section>

        <footer className="border-t border-line bg-card py-5 text-xs text-muted">
          <div className="mx-auto max-w-[1360px] px-6 lg:px-10">
            <p><strong className="text-ink">Campus Virtual LMS</strong> · Ambiente de aprendizaje</p>
          </div>
        </footer>
      </main>
    </div>
  )
}

export default Dashboard
