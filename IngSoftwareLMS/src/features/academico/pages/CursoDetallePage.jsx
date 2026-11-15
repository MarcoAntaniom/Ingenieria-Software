import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuth } from '../../../contexts/auth-context'
import { queryKeys } from '../../../shared/lib/queryKeys'
import { extractApiError } from '../../../shared/lib/pagination'
import { getUserRoleCode, ROLES } from '../../../shared/lib/roles'
import {
  ErrorState,
  LoadingState,
  PageHeader,
} from '../../../shared/components/ui/StateViews'
import { fetchSeccionById } from '../api/academicoApi'
import {
  createAnuncio,
  createForo,
  fetchAnuncios,
  fetchForos,
} from '../../comunicacion/api/comunicacionApi'
import { fetchEvaluacionTareas } from '../../evaluaciones/api/evaluacionesApi'
import SectionAnnouncementsTab from '../components/SectionAnnouncementsTab'
import SectionForumsTab from '../components/SectionForumsTab'
import SectionTasksTab from '../components/SectionTasksTab'

export default function CursoDetallePage() {
  const { seccionId } = useParams()
  const numericSeccionId = Number(seccionId)
  const [activeTab, setActiveTab] = useState('anuncios')

  const { user } = useAuth()
  const roleCode = getUserRoleCode(user)
  const canManageSection =
    roleCode === ROLES.DOCENTE || roleCode === ROLES.ADMIN
  const queryClient = useQueryClient()

  const seccionQuery = useQuery({
    queryKey: queryKeys.academico.seccionDetail(seccionId),
    queryFn: () => fetchSeccionById(seccionId),
  })

  const anunciosQuery = useQuery({
    queryKey: queryKeys.comunicacion.anuncios({ seccion: numericSeccionId }),
    queryFn: () => fetchAnuncios({ seccion: numericSeccionId }),
  })

  const forosQuery = useQuery({
    queryKey: queryKeys.comunicacion.foros({ seccion: numericSeccionId }),
    queryFn: () => fetchForos({ seccion: numericSeccionId }),
  })

  const tareasQuery = useQuery({
    queryKey: queryKeys.evaluaciones.tareas({ seccion: numericSeccionId }),
    queryFn: () => fetchEvaluacionTareas({ seccion: numericSeccionId }),
  })

  const createAnuncioMutation = useMutation({
    mutationFn: createAnuncio,
    onSuccess: () => {
      toast.success('Anuncio publicado en la sección.')
      queryClient.invalidateQueries({ queryKey: ['comunicacion', 'anuncios'] })
    },
    onError: (err) => {
      toast.error(extractApiError(err, 'No se pudo publicar el anuncio.'))
    },
  })

  const createForoMutation = useMutation({
    mutationFn: createForo,
    onSuccess: () => {
      toast.success('Foro creado para la sección.')
      queryClient.invalidateQueries({ queryKey: ['comunicacion', 'foros'] })
    },
    onError: (err) => {
      toast.error(extractApiError(err, 'No se pudo crear el foro.'))
    },
  })

  if (seccionQuery.isLoading) {
    return (
      <div className="p-8">
        <LoadingState label="Abriendo aula virtual de la sección..." />
      </div>
    )
  }

  if (seccionQuery.isError) {
    return (
      <div className="p-8">
        <ErrorState
          message={extractApiError(
            seccionQuery.error,
            'No se encontró la sección solicitada.',
          )}
          onRetry={() => seccionQuery.refetch()}
        />
      </div>
    )
  }

  const course = seccionQuery.data
  const sectionAnuncios = anunciosQuery.data || []
  const sectionForos = forosQuery.data || []
  const sectionTareas = tareasQuery.data || []

  return (
    <div className="flex flex-col">
      <PageHeader
        eyebrow={`${course.code} · Sección ${course.section}`}
        title={course.title}
        badge={course.period}
        description={`Carrera: ${course.careerName}`}
        actions={
          <Link
            className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-card px-3.5 py-2 text-xs font-bold text-ink hover:bg-subtle"
            to="/cursos"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Volver a cursos
          </Link>
        }
      />

      <div className="mx-auto flex w-full max-w-[1360px] flex-col gap-6 px-6 py-6 lg:px-10">
        <div className="flex flex-wrap gap-2 rounded-xl border border-line bg-card p-2 shadow-xs">
          {[
            {
              id: 'anuncios',
              label: `Anuncios (${sectionAnuncios.length})`,
              icon: 'campaign',
            },
            {
              id: 'foros',
              label: `Foros de Debate (${sectionForos.length})`,
              icon: 'forum',
            },
            {
              id: 'tareas',
              label: `Tareas Evaluadas (${sectionTareas.length})`,
              icon: 'assignment',
            },
          ].map((t) => (
            <button
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
                activeTab === t.id
                  ? 'bg-primary text-white'
                  : 'text-muted hover:bg-subtle'
              }`}
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              type="button"
            >
              <span className="material-symbols-outlined text-base" aria-hidden="true">
                {t.icon}
              </span>
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === 'anuncios' && (
          <SectionAnnouncementsTab
            announcements={sectionAnuncios}
            canManageSection={canManageSection}
            isPending={createAnuncioMutation.isPending}
            onCreateAnnouncement={(payload, resetForm) =>
              createAnuncioMutation.mutate(
                { ...payload, seccion: numericSeccionId },
                { onSuccess: resetForm },
              )
            }
          />
        )}

        {activeTab === 'foros' && (
          <SectionForumsTab
            canManageSection={canManageSection}
            forums={sectionForos}
            isPending={createForoMutation.isPending}
            onCreateForum={(payload, resetForm) =>
              createForoMutation.mutate(
                { ...payload, seccion: numericSeccionId },
                { onSuccess: resetForm },
              )
            }
          />
        )}

        {activeTab === 'tareas' && <SectionTasksTab tasks={sectionTareas} />}
      </div>
    </div>
  )
}
