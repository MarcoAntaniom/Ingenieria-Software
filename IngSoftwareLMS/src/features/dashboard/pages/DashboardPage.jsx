import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../../contexts/auth-context'
import { fetchSecciones } from '../../academico/api/academicoApi'
import CourseCard from '../../academico/components/CourseCard'
import { fetchAnuncios } from '../../comunicacion/api/comunicacionApi'
import {
  fetchEntregasEvaluacion,
  fetchEvaluacionTareas,
  isTaskClosedForSubmission,
  isTaskPastDeadlineWithLateAllowed,
} from '../../evaluaciones/api/evaluacionesApi'
import { fetchUnreadCount } from '../../notificaciones/api/notificacionesApi'
import { queryKeys } from '../../../shared/lib/queryKeys'
import { extractApiError } from '../../../shared/lib/pagination'
import {
  getRoleLabel,
  getUserDisplayName,
  getUserRoleCode,
  ROLES,
} from '../../../shared/lib/roles'
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '../../../shared/components/ui/StateViews'
import DashboardHero from '../components/DashboardHero'
import DashboardStatsGrid from '../components/DashboardStatsGrid'
import DashboardFilterBar from '../components/DashboardFilterBar'
import RecentAnnouncementsPanel from '../components/RecentAnnouncementsPanel'

const EMPTY_LIST = []

function normalizeText(value = '') {
  return value
    .toString()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLocaleLowerCase('es')
}

export default function DashboardPage() {
  const [tab, setTab] = useState('all')
  const [query, setQuery] = useState('')
  const [ascending, setAscending] = useState(true)
  const { user } = useAuth()

  const roleCode = getUserRoleCode(user)
  const roleLabel = getRoleLabel(user)
  const displayName = getUserDisplayName(user)

  const seccionesQuery = useQuery({
    queryKey: queryKeys.academico.secciones(),
    queryFn: fetchSecciones,
  })

  const anunciosQuery = useQuery({
    queryKey: queryKeys.comunicacion.anuncios(),
    queryFn: () => fetchAnuncios(),
  })

  const unreadQuery = useQuery({
    queryKey: queryKeys.notificaciones.unreadCount,
    queryFn: fetchUnreadCount,
  })

  const tareasQuery = useQuery({
    queryKey: ['evaluaciones', 'tareas', 'dashboard'],
    queryFn: () => fetchEvaluacionTareas(),
  })

  const entregasQuery = useQuery({
    queryKey: ['evaluaciones', 'entregas', 'dashboard'],
    queryFn: () => fetchEntregasEvaluacion(),
  })

  const courses = seccionesQuery.data?.items ?? EMPTY_LIST
  const allAnnouncements = anunciosQuery.data ?? EMPTY_LIST
  const recentAnnouncements = allAnnouncements.slice(0, 4)
  const unreadCount = unreadQuery.data ?? 0
  const allTasks = tareasQuery.data ?? EMPTY_LIST
  const allEntregas = entregasQuery.data ?? EMPTY_LIST
  const isStudent = roleCode === ROLES.ESTUDIANTE

  // RF-41 / RF-42: "Mis Pendientes" ordenado cronológicamente y depurado tras entregar
  const pendingTasks = useMemo(() => {
    if (!isStudent) return []
    const deliveryByTask = new Map(
      allEntregas.map((e) => [Number(e.tarea), e]),
    )
    return allTasks
      .filter((task) => {
        const delivery = deliveryByTask.get(Number(task.id))
        const isAlreadySubmitted =
          delivery &&
          delivery.estado_codigo !== 'BORRADOR' &&
          delivery.estado_codigo !== 'REABIERTA'
        if (isAlreadySubmitted) return false
        if (isTaskClosedForSubmission(task, delivery)) return false
        return true
      })
      .sort((a, b) => {
        if (!a.fecha_limite && !b.fecha_limite) return 0
        if (!a.fecha_limite) return 1
        if (!b.fecha_limite) return -1
        return (
          new Date(a.fecha_limite).getTime() -
          new Date(b.fecha_limite).getTime()
        )
      })
  }, [allEntregas, allTasks, isStudent])

  // RF-43 / RF-44 / RF-45: Ficha Académica Estudiantil y Learning Analytics Docente
  const analyticsSummary = useMemo(() => {
    const submitted = allEntregas.filter(
      (e) => e.estado_codigo && e.estado_codigo !== 'BORRADOR',
    )
    const drafts = allEntregas.filter((e) => e.estado_codigo === 'BORRADOR')
    const graded = submitted.filter((e) => e.nota_final != null)
    const grades = graded
      .map((e) => Number(e.nota_final))
      .filter((n) => Number.isFinite(n))
    const avgGrade =
      grades.length > 0
        ? (grades.reduce((acc, v) => acc + v, 0) / grades.length).toFixed(1)
        : null
    const approvedCount = grades.filter((g) => g >= 4.0).length
    const failedCount = grades.filter((g) => g < 4.0).length
    const lateCount = submitted.filter((e) => e.es_tardia).length
    return {
      totalTasks: allTasks.length,
      submittedCount: submitted.length,
      draftsCount: drafts.length,
      graded,
      avgGrade,
      approvedCount,
      failedCount,
      lateCount,
    }
  }, [allEntregas, allTasks])

  const filteredCourses = useMemo(() => {
    const normalizedQuery = normalizeText(query.trim())
    return courses
      .filter((course) => {
        if (tab === 'progress' && course.status === 'completed') return false
        if (tab === 'completed' && course.status !== 'completed') return false
        return normalizeText(
          `${course.title} ${course.code} ${course.careerName} ${course.period}`,
        ).includes(normalizedQuery)
      })
      .sort(
        (a, b) =>
          a.title.localeCompare(b.title, 'es') * (ascending ? 1 : -1),
      )
  }, [ascending, courses, query, tab])

  const activeCount = courses.filter((c) => c.status !== 'completed').length

  return (
    <div className="flex flex-col">
      <DashboardHero
        activeCount={activeCount}
        displayName={displayName}
        roleCode={roleCode}
        roleLabel={roleLabel}
        unreadCount={unreadCount}
      />

      <section className="mx-auto flex w-full max-w-[1360px] flex-col gap-6 px-6 pb-12 pt-6 lg:px-10">
        <DashboardStatsGrid
          announcementsCount={allAnnouncements.length}
          coursesCount={courses.length}
          roleLabel={roleLabel}
          unreadCount={unreadCount}
        />

        <DashboardFilterBar
          ascending={ascending}
          onChangeQuery={setQuery}
          onSelectTab={setTab}
          onToggleAscending={() => setAscending((prev) => !prev)}
          query={query}
          tab={tab}
        />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <div className="xl:col-span-8">
            {seccionesQuery.isLoading ? (
              <LoadingState label="Cargando tus secciones académicas..." />
            ) : seccionesQuery.isError ? (
              <ErrorState
                message={extractApiError(
                  seccionesQuery.error,
                  'No se pudieron cargar tus cursos.',
                )}
                onRetry={() => seccionesQuery.refetch()}
              />
            ) : filteredCourses.length > 0 ? (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {filteredCourses.map((course) => (
                  <CourseCard
                    course={course}
                    key={`${course.code}-${course.section}-${course.id}`}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon="search_off"
                title="No se encontraron secciones académicas"
                description="Prueba con otros términos de búsqueda o revisa el catálogo académico."
                action={
                  (query || tab !== 'all') && (
                    <button
                      className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white"
                      onClick={() => {
                        setTab('all')
                        setQuery('')
                      }}
                      type="button"
                    >
                      Restablecer filtros
                    </button>
                  )
                }
              />
            )}
          </div>

          <aside className="space-y-4 xl:col-span-4">
            {isStudent ? (
              <>
                <div className="rounded-xl border border-line bg-card p-5 shadow-xs">
                  <div className="flex items-center justify-between border-b border-line pb-3">
                    <div>
                      <h2 className="text-sm font-extrabold text-ink">
                        Mis Pendientes ({pendingTasks.length})
                      </h2>
                      <p className="text-[11px] text-muted">
                        Ordenados por vencimiento · Se depuran al entregar
                      </p>
                    </div>
                    <span className="material-symbols-outlined text-primary">
                      event_upcoming
                    </span>
                  </div>
                  {pendingTasks.length === 0 ? (
                    <p className="py-4 text-xs text-muted">
                      ¡Estás al día! No tienes tareas pendientes por entregar.
                    </p>
                  ) : (
                    <ul className="mt-3 space-y-2.5">
                      {pendingTasks.slice(0, 5).map((task) => {
                        const inLateWindow =
                          isTaskPastDeadlineWithLateAllowed(task)
                        return (
                          <li
                            className="rounded-lg border border-line bg-subtle p-3 text-xs"
                            key={task.id}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-ink">
                                {task.titulo}
                              </span>
                              {inLateWindow && (
                                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                                  Ventana tardía (1h máx.)
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-[11px] text-muted">
                              {task.fecha_limite
                                ? `Vence: ${new Date(
                                    task.fecha_limite,
                                  ).toLocaleString('es-CL')}`
                                : 'Sin fecha de término'}
                            </p>
                            <Link
                              className="mt-1.5 inline-block text-[11px] font-bold text-primary hover:underline"
                              to={`/cursos/${task.seccion}`}
                            >
                              Ir a entregar →
                            </Link>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>

                <div className="rounded-xl border border-line bg-card p-5 shadow-xs">
                  <div className="flex items-center justify-between border-b border-line pb-3">
                    <div>
                      <h2 className="text-sm font-extrabold text-ink">
                        Mi Ficha Académica
                      </h2>
                      <p className="text-[11px] text-muted">
                        Notas parciales y promedio de presentación (1.0 - 7.0)
                      </p>
                    </div>
                    {analyticsSummary.avgGrade && (
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-extrabold ${
                          Number(analyticsSummary.avgGrade) >= 4.0
                            ? 'bg-emerald-100 text-emerald-900'
                            : 'bg-rose-100 text-rose-900'
                        }`}
                      >
                        Promedio: {analyticsSummary.avgGrade}
                      </span>
                    )}
                  </div>
                  {analyticsSummary.graded.length === 0 ? (
                    <p className="py-4 text-xs text-muted">
                      Aún no tienes evaluaciones calificadas registradas.
                    </p>
                  ) : (
                    <ul className="mt-3 space-y-2">
                      {analyticsSummary.graded.slice(0, 5).map((ent) => {
                        const nota = Number(ent.nota_final)
                        const ok = nota >= 4.0
                        return (
                          <li
                            className="flex items-center justify-between rounded-lg border border-line bg-subtle px-3 py-2 text-xs"
                            key={ent.id}
                          >
                            <span className="font-semibold text-ink">
                              {ent.tarea_titulo}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-primary">
                                {nota.toFixed(1)}
                              </span>
                              <span
                                className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                                  ok
                                    ? 'bg-emerald-100 text-emerald-900'
                                    : 'bg-rose-100 text-rose-900'
                                }`}
                              >
                                {ok ? 'Aprobado' : 'Reprobado'}
                              </span>
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-line bg-card p-5 shadow-xs">
                <div className="flex items-center justify-between border-b border-line pb-3">
                  <div>
                    <h2 className="text-sm font-extrabold text-ink">
                      Learning Analytics y Alertas
                    </h2>
                    <p className="text-[11px] text-muted">
                      Rendimiento, entregas y alertas tempranas
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-primary">
                    monitoring
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2.5 text-xs">
                  <div className="rounded-lg border border-line bg-subtle p-2.5">
                    <p className="text-[10px] text-muted">Entregas recibidas</p>
                    <p className="text-base font-extrabold text-ink">
                      {analyticsSummary.submittedCount}
                    </p>
                  </div>
                  <div className="rounded-lg border border-line bg-subtle p-2.5">
                    <p className="text-[10px] text-muted">Promedio general</p>
                    <p className="text-base font-extrabold text-primary">
                      {analyticsSummary.avgGrade || '—'}
                    </p>
                  </div>
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-2.5">
                    <p className="text-[10px] text-emerald-900">
                      Aprobados (&ge; 4.0)
                    </p>
                    <p className="text-base font-extrabold text-emerald-900">
                      {analyticsSummary.approvedCount}
                    </p>
                  </div>
                  <div className="rounded-lg border border-rose-200 bg-rose-50/70 p-2.5">
                    <p className="text-[10px] text-rose-900">
                      En riesgo (&lt; 4.0)
                    </p>
                    <p className="text-base font-extrabold text-rose-900">
                      {analyticsSummary.failedCount}
                    </p>
                  </div>
                </div>
                <p className="mt-2.5 text-[11px] text-muted">
                  Borradores activos: {analyticsSummary.draftsCount} · Entregas
                  tardías (ventana 1h): {analyticsSummary.lateCount}
                </p>
              </div>
            )}

            <RecentAnnouncementsPanel
              announcements={recentAnnouncements}
              isLoading={anunciosQuery.isLoading}
            />
          </aside>
        </div>
      </section>
    </div>
  )
}
