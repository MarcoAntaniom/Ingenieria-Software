import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../../contexts/auth-context'
import { fetchSecciones } from '../../academico/api/academicoApi'
import CourseCard from '../../academico/components/CourseCard'
import { fetchAnuncios } from '../../comunicacion/api/comunicacionApi'
import { fetchUnreadCount } from '../../notificaciones/api/notificacionesApi'
import { queryKeys } from '../../../shared/lib/queryKeys'
import { extractApiError } from '../../../shared/lib/pagination'
import {
  getRoleLabel,
  getUserDisplayName,
  getUserRoleCode,
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

  const courses = seccionesQuery.data?.items ?? EMPTY_LIST
  const allAnnouncements = anunciosQuery.data ?? EMPTY_LIST
  const recentAnnouncements = allAnnouncements.slice(0, 4)
  const unreadCount = unreadQuery.data ?? 0

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
