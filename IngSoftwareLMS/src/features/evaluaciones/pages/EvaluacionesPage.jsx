import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuth } from '../../../contexts/auth-context'
import { queryKeys } from '../../../shared/lib/queryKeys'
import { extractApiError } from '../../../shared/lib/pagination'
import { getUserRoleCode, ROLES } from '../../../shared/lib/roles'
import { PageHeader } from '../../../shared/components/ui/StateViews'
import { fetchSecciones } from '../../academico/api/academicoApi'
import {
  calificarEntregaEvaluacion,
  createEvaluacionTarea,
  fetchEntregasEvaluacion,
  fetchEvaluacionTareas,
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
  const [selectedTaskId, setSelectedTaskId] = useState(null)
  const queryClient = useQueryClient()

  const seccionesQuery = useQuery({
    queryKey: queryKeys.academico.secciones(),
    queryFn: fetchSecciones,
  })

  const tareasQuery = useQuery({
    queryKey: queryKeys.evaluaciones.tareas(),
    queryFn: () => fetchEvaluacionTareas(),
  })

  const entregasQuery = useQuery({
    queryKey: queryKeys.evaluaciones.entregas({ tarea: selectedTaskId }),
    queryFn: () =>
      fetchEntregasEvaluacion({ tarea: selectedTaskId || undefined }),
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
    onSuccess: () => {
      toast.success('Entrega registrada exitosamente.')
      queryClient.invalidateQueries({ queryKey: ['evaluaciones', 'entregas'] })
    },
    onError: (err) => {
      toast.error(extractApiError(err, 'No se pudo registrar la entrega.'))
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

  const sections = seccionesQuery.data?.items || []
  const tasks = tareasQuery.data || []
  const entregas = entregasQuery.data || []

  return (
    <div className="flex flex-col">
      <PageHeader
        eyebrow="Módulo de Evaluaciones"
        title="Tareas, Entregas y Calificaciones"
        badge={`${tasks.length} tareas`}
        description="Gestión integral de actividades evaluadas, envíos estudiantiles y calificación con aviso automático por WebSocket."
      />

      <div className="mx-auto grid w-full max-w-[1360px] grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-12 lg:px-10">
        {canCreateOrGrade && (
          <div className="lg:col-span-5">
            <CreateTareaForm
              isPending={createTaskMutation.isPending}
              onCreateTask={(payload, resetForm) =>
                createTaskMutation.mutate(payload, { onSuccess: resetForm })
              }
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
              Tareas publicadas ({tasks.length})
            </h2>
            <TareasList
              isLoading={tareasQuery.isLoading}
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
              Entregas y Calificaciones ({entregas.length})
            </h2>
            <EntregasPanel
              canGrade={canCreateOrGrade}
              entregas={entregas}
              isGrading={gradeDeliveryMutation.isPending}
              isLoading={entregasQuery.isLoading}
              onGradeDelivery={(payload, reset) =>
                gradeDeliveryMutation.mutate(payload, { onSuccess: reset })
              }
            />
          </section>
        </div>
      </div>
    </div>
  )
}
