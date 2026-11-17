import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuth } from '../../../contexts/auth-context'
import { queryKeys } from '../../../shared/lib/queryKeys'
import { extractApiError } from '../../../shared/lib/pagination'
import { getUserRoleCode, ROLES } from '../../../shared/lib/roles'
import { EmptyState, PageHeader } from '../../../shared/components/ui/StateViews'
import { fetchSecciones } from '../../academico/api/academicoApi'
import {
  calificarEntregaEvaluacion,
  confirmarEntregaEvaluacion,
  createEvaluacionTarea,
  createRubrica,
  fetchEntregasEvaluacion,
  fetchEvaluacionTareas,
  fetchRubricas,
  marcarEnRevisionEvaluacion,
  reabrirEntregaEvaluacion,
  submitEntregaEvaluacion,
} from '../api/evaluacionesApi'
import CreateTareaForm from '../components/CreateTareaForm'
import TareasList from '../components/TareasList'
import EntregasPanel from '../components/EntregasPanel'

export default function EvaluacionesPage() {
  const { user } = useAuth()
  const roleCode = getUserRoleCode(user)
  const canCreateOrGrade =
    roleCode === ROLES.DOCENTE || roleCode === ROLES.ADMIN
  const isStudent = roleCode === ROLES.ESTUDIANTE

  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedTaskId, setSelectedTaskId] = useState(null)
  const queryClient = useQueryClient()

  const seccionFromUrl = searchParams.get('seccion') || ''

  const seccionesQuery = useQuery({
    queryKey: queryKeys.academico.secciones(),
    queryFn: fetchSecciones,
  })

  const sections = seccionesQuery.data?.items || []
  const activeSeccionId =
    seccionFromUrl || (sections.length > 0 ? String(sections[0].id) : '')

  const tareasQuery = useQuery({
    queryKey: queryKeys.evaluaciones.tareas({
      seccion: activeSeccionId ? Number(activeSeccionId) : undefined,
    }),
    queryFn: () =>
      fetchEvaluacionTareas({
        seccion: activeSeccionId ? Number(activeSeccionId) : undefined,
      }),
    enabled: Boolean(activeSeccionId),
  })

  const entregasQuery = useQuery({
    queryKey: queryKeys.evaluaciones.entregas({
      seccion: activeSeccionId ? Number(activeSeccionId) : undefined,
      tarea: selectedTaskId,
    }),
    queryFn: () =>
      fetchEntregasEvaluacion({
        seccion: activeSeccionId ? Number(activeSeccionId) : undefined,
        tarea: selectedTaskId || undefined,
      }),
    enabled: Boolean(activeSeccionId),
  })

  const rubricasQuery = useQuery({
    queryKey: ['evaluaciones', 'rubricas'],
    queryFn: fetchRubricas,
    enabled: canCreateOrGrade,
  })

  const createRubricaMutation = useMutation({
    mutationFn: createRubrica,
    onSuccess: () => {
      toast.success('Rúbrica creada exitosamente.')
      queryClient.invalidateQueries({ queryKey: ['evaluaciones', 'rubricas'] })
    },
    onError: (err) => {
      toast.error(extractApiError(err, 'No se pudo crear la rúbrica.'))
    },
  })

  const markInReviewMutation = useMutation({
    mutationFn: marcarEnRevisionEvaluacion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluaciones', 'entregas'] })
    },
  })

  const reopenDeliveryMutation = useMutation({
    mutationFn: reabrirEntregaEvaluacion,
    onSuccess: () => {
      toast.success('Entrega reabierta para que el estudiante realice un nuevo intento.')
      queryClient.invalidateQueries({ queryKey: ['evaluaciones', 'entregas'] })
    },
    onError: (err) => {
      toast.error(extractApiError(err, 'No se pudo reabrir la entrega.'))
    },
  })

  const createTaskMutation = useMutation({
    mutationFn: createEvaluacionTarea,
    onSuccess: () => {
      toast.success(
        'Tarea creada exitosamente. Se enviarán notificaciones si está visible.',
      )
      queryClient.invalidateQueries({ queryKey: ['evaluaciones', 'tareas'] })
    },
    onError: (err) => {
      toast.error(extractApiError(err, 'No se pudo crear la tarea.'))
    },
  })

  const submitDeliveryMutation = useMutation({
    mutationFn: submitEntregaEvaluacion,
    onSuccess: (_data, variables) => {
      if (variables?.es_borrador) {
        toast.success(
          'Entrega guardada en estado BORRADOR. Puedes continuar editándola antes del envío definitivo.',
        )
      } else {
        toast.success(
          'Entrega enviada de forma definitiva. Ya no admite modificaciones.',
        )
      }
      queryClient.invalidateQueries({ queryKey: ['evaluaciones', 'entregas'] })
    },
    onError: (err) => {
      toast.error(extractApiError(err, 'No se pudo registrar la entrega.'))
    },
  })

  const confirmDraftMutation = useMutation({
    mutationFn: confirmarEntregaEvaluacion,
    onSuccess: () => {
      toast.success(
        'Entrega enviada de forma definitiva. Ya no admite modificaciones.',
      )
      queryClient.invalidateQueries({ queryKey: ['evaluaciones', 'entregas'] })
    },
    onError: (err) => {
      toast.error(
        extractApiError(err, 'No se pudo confirmar el envío definitivo.'),
      )
    },
  })

  const gradeDeliveryMutation = useMutation({
    mutationFn: calificarEntregaEvaluacion,
    onSuccess: () => {
      toast.success('Calificación guardada y notificada al estudiante.')
      queryClient.invalidateQueries({ queryKey: ['evaluaciones', 'entregas'] })
    },
    onError: (err) => {
      toast.error(extractApiError(err, 'No se pudo calificar la entrega.'))
    },
  })

  const tasks = (tareasQuery.data || []).filter(
    (task) => Number(task.seccion) === Number(activeSeccionId),
  )
  const taskIds = new Set(tasks.map((t) => Number(t.id)))
  const entregas = (entregasQuery.data || []).filter((e) =>
    taskIds.has(Number(e.tarea)),
  )

  function handleSelectSeccion(nextSeccionId) {
    setSelectedTaskId(null)
    if (nextSeccionId) {
      setSearchParams({ seccion: String(nextSeccionId) })
    } else {
      setSearchParams({})
    }
  }

  return (
    <div className="flex flex-col">
      <PageHeader
        eyebrow="Módulo de Evaluaciones por Sección"
        title="Tareas, Entregas (Borrador / Definitiva) y Calificaciones"
        badge={`${tasks.length} tareas en la sección`}
        description="Selecciona una sección académica para consultar y entregar únicamente las tareas correspondientes a esa sección."
      />

      <div className="mx-auto flex w-full max-w-[1360px] flex-col gap-6 px-6 py-6 lg:px-10">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-card p-4 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lg text-primary">
              filter_alt
            </span>
            <div>
              <p className="text-xs font-extrabold text-ink">
                Sección académica seleccionada
              </p>
              <p className="text-[11px] text-muted">
                Solo se muestran las tareas y entregas que pertenecen a la sección activa.
              </p>
            </div>
          </div>

          <select
            className="min-w-[260px] rounded-xl border border-line bg-subtle px-3.5 py-2 text-xs font-bold text-ink"
            onChange={(e) => handleSelectSeccion(e.target.value)}
            value={activeSeccionId}
          >
            {sections.length === 0 ? (
              <option value="">Sin secciones disponibles</option>
            ) : (
              sections.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.code} · {sec.title} (Sección {sec.section})
                </option>
              ))
            )}
          </select>
        </div>

        {!activeSeccionId ? (
          <EmptyState
            icon="school"
            title="Selecciona una sección académica"
            description="Elige una sección para visualizar sus tareas asignadas."
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {canCreateOrGrade && (
              <div className="lg:col-span-5">
                <CreateTareaForm
                  defaultSeccionId={Number(activeSeccionId)}
                  isPending={createTaskMutation.isPending}
                  onCreateRubrica={(payload, onDone) =>
                    createRubricaMutation.mutate(payload, {
                      onSuccess: (created) => onDone?.(created),
                    })
                  }
                  onCreateTask={(payload, resetForm) =>
                    createTaskMutation.mutate(
                      { ...payload, seccion: Number(activeSeccionId) },
                      { onSuccess: resetForm },
                    )
                  }
                  rubricas={rubricasQuery.data || []}
                  sections={sections}
                />
              </div>
            )}

            <div
              className={`space-y-6 ${
                canCreateOrGrade ? 'lg:col-span-7' : 'lg:col-span-12'
              }`}
            >
              <section className="space-y-3">
                <h2 className="text-sm font-extrabold text-ink">
                  Tareas de la sección ({tasks.length})
                </h2>
                <TareasList
                  entregas={entregas}
                  isLoading={tareasQuery.isLoading}
                  isStudent={isStudent}
                  isSubmittingDelivery={submitDeliveryMutation.isPending}
                  onSelectTask={setSelectedTaskId}
                  onSubmitDelivery={(payload, reset) =>
                    submitDeliveryMutation.mutate(payload, { onSuccess: reset })
                  }
                  selectedTaskId={selectedTaskId}
                  tasks={tasks}
                />
              </section>

              <section className="space-y-3">
                <h2 className="text-sm font-extrabold text-ink">
                  Entregas y Calificaciones de la sección ({entregas.length})
                </h2>
                <EntregasPanel
                  canGrade={canCreateOrGrade}
                  entregas={entregas}
                  isConfirmingDraft={confirmDraftMutation.isPending}
                  isGrading={gradeDeliveryMutation.isPending}
                  isLoading={entregasQuery.isLoading}
                  isStudent={isStudent}
                  onConfirmDraftDelivery={(entregaId, reset) =>
                    confirmDraftMutation.mutate(entregaId, { onSuccess: reset })
                  }
                  onGradeDelivery={(payload, reset) =>
                    gradeDeliveryMutation.mutate(payload, { onSuccess: reset })
                  }
                  onMarkInReview={(entregaId) =>
                    markInReviewMutation.mutate(entregaId)
                  }
                  onReopenDelivery={(entregaId) =>
                    reopenDeliveryMutation.mutate(entregaId)
                  }
                />
              </section>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
