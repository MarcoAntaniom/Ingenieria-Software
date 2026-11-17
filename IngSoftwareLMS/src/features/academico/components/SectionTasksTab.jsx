import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { queryKeys } from '../../../shared/lib/queryKeys'
import { extractApiError } from '../../../shared/lib/pagination'
import {
  calificarEntregaEvaluacion,
  confirmarEntregaEvaluacion,
  createEvaluacionTarea,
  createRubrica,
  fetchEntregasEvaluacion,
  fetchRubricas,
  marcarEnRevisionEvaluacion,
  reabrirEntregaEvaluacion,
  submitEntregaEvaluacion,
} from '../../evaluaciones/api/evaluacionesApi'
import CreateTareaForm from '../../evaluaciones/components/CreateTareaForm'
import TareasList from '../../evaluaciones/components/TareasList'
import EntregasPanel from '../../evaluaciones/components/EntregasPanel'

/**
 * Pestaña de Tareas Evaluadas dentro del apartado de una Sección (`/cursos/:seccionId`).
 * Muestra únicamente las tareas filtradas de esa sección y permite subir entregas
 * (respetando estado borrador, confirmación de envío y bloqueo por plazo vencido)
 * o crear/calificar tareas en el caso de docentes/administradores.
 */
export default function SectionTasksTab({
  seccionId,
  tasks = [],
  isLoadingTasks = false,
  canManageSection = false,
  isStudent = false,
}) {
  const [selectedTaskId, setSelectedTaskId] = useState(null)
  const queryClient = useQueryClient()

  // Filtra estrictamente las tareas pertenecientes a esta sección
  const sectionTasks = tasks.filter(
    (task) => Number(task.seccion) === Number(seccionId),
  )

  const entregasQuery = useQuery({
    queryKey: queryKeys.evaluaciones.entregas({
      seccion: seccionId,
      tarea: selectedTaskId || undefined,
    }),
    queryFn: () =>
      fetchEntregasEvaluacion({
        seccion: seccionId,
        tarea: selectedTaskId || undefined,
      }),
  })

  const rubricasQuery = useQuery({
    queryKey: ['evaluaciones', 'rubricas'],
    queryFn: fetchRubricas,
    enabled: canManageSection,
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
      toast.success('Tarea creada exitosamente para esta sección.')
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

  const sectionTaskIds = new Set(sectionTasks.map((t) => Number(t.id)))
  const entregas = (entregasQuery.data || []).filter((e) =>
    sectionTaskIds.has(Number(e.tarea)),
  )

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {canManageSection && (
        <div className="lg:col-span-5">
          <CreateTareaForm
            defaultSeccionId={seccionId}
            isPending={createTaskMutation.isPending}
            onCreateRubrica={(payload, onDone) =>
              createRubricaMutation.mutate(payload, {
                onSuccess: (created) => onDone?.(created),
              })
            }
            onCreateTask={(payload, resetForm) =>
              createTaskMutation.mutate(
                { ...payload, seccion: Number(seccionId) },
                { onSuccess: resetForm },
              )
            }
            rubricas={rubricasQuery.data || []}
          />
        </div>
      )}

      <div
        className={`space-y-6 ${
          canManageSection ? 'lg:col-span-7' : 'lg:col-span-12'
        }`}
      >
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-extrabold text-ink">
              Tareas de esta sección ({sectionTasks.length})
            </h2>
            <span className="rounded-lg bg-subtle px-2.5 py-1 text-[11px] font-semibold text-muted">
              Mostrando únicamente tareas de la Sección #{seccionId}
            </span>
          </div>

          <TareasList
            entregas={entregas}
            isLoading={isLoadingTasks}
            isStudent={isStudent}
            isSubmittingDelivery={submitDeliveryMutation.isPending}
            onSelectTask={setSelectedTaskId}
            onSubmitDelivery={(payload, reset) =>
              submitDeliveryMutation.mutate(payload, { onSuccess: reset })
            }
            selectedTaskId={selectedTaskId}
            tasks={sectionTasks}
          />
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-extrabold text-ink">
            Entregas de esta sección ({entregas.length})
          </h2>
          <EntregasPanel
            canGrade={canManageSection}
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
            onMarkInReview={(entregaId) => markInReviewMutation.mutate(entregaId)}
            onReopenDelivery={(entregaId) =>
              reopenDeliveryMutation.mutate(entregaId)
            }
          />
        </section>
      </div>
    </div>
  )
}
