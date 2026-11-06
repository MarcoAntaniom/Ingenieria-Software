import { useMemo, useState } from 'react'
import AppShell from './layout/AppShell'
import Button from './ui/Button'
import Card from './ui/Card'
import EmptyState from './ui/EmptyState'
import Skeleton from './ui/Skeleton'
import StatusBadge from './ui/StatusBadge'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { useCursos } from '../features/academico/useCursos'
import { useAuth } from '../contexts/auth-context'
import { PermissionDeniedPage } from '../pages/StatusPages'

const COURSE_COLORS = [
  'from-primary to-primary-container',
  'from-secondary to-primary',
  'from-primary-container to-secondary',
  'from-primary-dark to-primary',
]
const EMPTY_COURSES = []

function normalize(value = '') {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLocaleLowerCase('es')
}

function CourseCard({ course, color }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-line bg-card shadow-sm transition-transform motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-lg">
      <div className={`flex min-h-36 flex-col justify-between bg-gradient-to-br p-4 text-white ${color}`}>
        <div>
          <span className="rounded bg-white/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-secondary-fixed">
            {course.code}
            {course.section !== null ? ` · Sec. ${course.section}` : ''}
          </span>
          <h2
            className="mt-2 truncate text-base font-bold leading-tight"
            title={course.title}
          >
            {course.title}
          </h2>
          <p className="text-xs text-white/85">
            Docente: {course.teacher || 'Sin datos'}
          </p>
        </div>
        <StatusBadge tone={course.status ? 'info' : 'neutral'}>
          Estado de inscripción: {course.status || 'Sin datos'}
        </StatusBadge>
      </div>

      <div className="flex flex-1 flex-col justify-between gap-4 p-4">
        <div>
          <div className="mb-2 flex justify-between text-[10px] font-bold uppercase tracking-wider">
            <span className="text-muted">Avance del curso</span>
            <span className="text-primary">
              {Number.isFinite(course.progress) ? `${course.progress}%` : 'Sin datos'}
            </span>
          </div>
          {Number.isFinite(course.progress) && (
            <div
              aria-label={`Avance ${course.progress}%`}
              aria-valuemax="100"
              aria-valuemin="0"
              aria-valuenow={course.progress}
              className="h-1.5 overflow-hidden rounded-full bg-subtle"
              role="progressbar"
            >
              <div
                className="h-full rounded-full bg-secondary"
                style={{ width: `${course.progress}%` }}
              />
            </div>
          )}
          <div className="mt-4 flex items-start gap-2.5 rounded-lg bg-subtle p-3">
            <span aria-hidden="true" className="material-symbols-outlined shrink-0 text-secondary">
              assignment
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase text-secondary-dark">
                Próxima tarea
              </p>
              <p className="truncate text-xs font-bold">
                {course.taskTitle || 'Sin datos'}
              </p>
              <p className="text-[11px] text-muted">
                {course.taskDate || 'Sin datos'}
              </p>
            </div>
          </div>
        </div>
        <p className="border-t border-line pt-3 text-[11px] text-muted">
          Período: {course.period}
        </p>
      </div>
    </article>
  )
}

function CourseSkeletons() {
  return (
    <div
      aria-label="Cargando cursos"
      className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3"
      role="status"
    >
      {Array.from({ length: 3 }, (_, index) => (
        <Card className="overflow-hidden p-4" key={index}>
          <Skeleton className="h-32 w-full" />
          <Skeleton className="mt-5 h-4 w-2/3" />
          <Skeleton className="mt-3 h-16 w-full" />
        </Card>
      ))}
    </div>
  )
}

function CoursePagination({ data, isFetching, onPageChange, page }) {
  if (!data?.hasNext && !data?.hasPrevious) return null

  return (
    <nav
      aria-label="Paginación de asignaturas"
      className="flex items-center justify-center gap-4"
    >
      <Button
        disabled={!data.hasPrevious || isFetching}
        onClick={() => onPageChange((current) => Math.max(1, current - 1))}
        variant="secondary"
      >
        Anterior
      </Button>
      <span aria-live="polite" className="text-xs text-muted">
        Página {page} · {data.count} inscripciones
      </span>
      <Button
        disabled={!data.hasNext || isFetching}
        onClick={() => onPageChange((current) => current + 1)}
        variant="secondary"
      >
        Siguiente
      </Button>
    </nav>
  )
}

export default function Dashboard() {
  const [query, setQuery] = useState('')
  const [ascending, setAscending] = useState(true)
  const [page, setPage] = useState(1)
  const debouncedQuery = useDebouncedValue(query)
  const {
    data: pageData,
    error,
    isFetching,
    isPending,
    refetch,
  } = useCursos(page)
  const courses = pageData?.courses ?? EMPTY_COURSES
  const { user } = useAuth()
  const displayName =
    [user?.nombres, user?.apellidos].filter(Boolean).join(' ') ||
    user?.correo_institucional ||
    'Usuario'

  const filteredCourses = useMemo(() => {
    const searchTerm = normalize(debouncedQuery.trim())
    return [...courses]
      .filter((course) =>
        normalize(`${course.title} ${course.code}`).includes(searchTerm),
      )
      .sort((first, second) =>
        first.title.localeCompare(second.title, 'es') * (ascending ? 1 : -1),
      )
  }, [ascending, courses, debouncedQuery])

  if (error?.status === 403) {
    return <PermissionDeniedPage />
  }

  return (
    <AppShell>
      <section className="bg-gradient-to-r from-primary via-primary-container to-secondary px-6 py-8 text-white lg:px-10">
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
                {pageData?.count ?? 0} inscripciones
              </span>
            </div>
            <p className="max-w-2xl text-sm text-white/90">
              Hola, {displayName}. Aquí puedes revisar tus asignaturas.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto flex max-w-[1360px] flex-col gap-6 px-6 pb-12 pt-6 lg:px-10">
        <Card className="flex flex-col justify-between gap-4 p-3 shadow-sm lg:flex-row lg:items-center">
          <span className="whitespace-nowrap rounded-full bg-primary px-4 py-2 text-xs font-bold text-white">
            Todas las asignaturas
          </span>
          <div className="flex items-center gap-2.5 lg:min-w-[300px]">
            <label className="sr-only" htmlFor="course-search">
              Buscar asignatura
            </label>
            <div className="relative w-full">
              <span
                aria-hidden="true"
                className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              >
                search
              </span>
              <input
                className="w-full rounded-lg border border-transparent bg-subtle py-2 pl-10 pr-4 text-xs text-ink focus:border-primary/30 focus:bg-card focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                id="course-search"
                onChange={(event) => {
                  setQuery(event.target.value)
                  setPage(1)
                }}
                placeholder="Buscar asignatura o código..."
                type="search"
                value={query}
              />
            </div>
            <button
              aria-label={`Ordenar por nombre (${ascending ? 'A-Z' : 'Z-A'})`}
              className="shrink-0 rounded-lg border border-line bg-subtle p-2 text-primary hover:bg-line/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              onClick={() => setAscending((current) => !current)}
              type="button"
            >
              <span aria-hidden="true" className="material-symbols-outlined">
                {ascending ? 'arrow_upward' : 'arrow_downward'}
              </span>
            </button>
          </div>
        </Card>

        {isPending ? (
          <CourseSkeletons />
        ) : error ? (
          <Card className="p-6 text-center" role="alert">
            <p className="text-sm font-semibold text-danger">
              {error.message || 'No se pudieron cargar tus asignaturas.'}
            </p>
            <Button className="mt-4" onClick={() => refetch()}>
              Reintentar
            </Button>
          </Card>
        ) : filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredCourses.map((course, index) => (
              <CourseCard
                color={COURSE_COLORS[index % COURSE_COLORS.length]}
                course={course}
                key={course.id ?? `${course.code}-${course.section}-${index}`}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            action={
              query ? (
                <Button
                  onClick={() => setQuery('')}
                  variant="secondary"
                >
                  Restablecer búsqueda
                </Button>
              ) : null
            }
            description={
              query
                ? 'Prueba con otro nombre o código.'
                : 'No hay inscripciones disponibles para esta cuenta.'
            }
            icon="search_off"
            title={query ? 'No se encontraron asignaturas' : 'Aún no tienes asignaturas'}
          />
        )}
        {!isPending && !error && (
          <CoursePagination
            data={pageData}
            isFetching={isFetching}
            onPageChange={setPage}
            page={page}
          />
        )}
      </section>
    </AppShell>
  )
}
