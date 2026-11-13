import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import AppShell from '../components/layout/AppShell'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import EmptyState from '../components/ui/EmptyState'
import Modal from '../components/ui/Modal'
import Skeleton from '../components/ui/Skeleton'
import StatusBadge from '../components/ui/StatusBadge'
import {
  useConfirmarEnvio,
  useTareaDetail,
  useTareas,
  useTodasLasEntregasTareas,
} from '../features/academico/useTareas'
import {
  ESTADO_ENTREGA_META,
  formatDateTimeCL,
  getFileNameFromUrl,
} from '../features/academico/formatters'

function TaskSkeletons() {
  return (
    <div className="space-y-3" role="status">
      {Array.from({ length: 3 }, (_, index) => (
        <Card className="space-y-3 p-5" key={index}>
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
        </Card>
      ))}
    </div>
  )
}

export default function StudentTasksPage() {
  const [page, setPage] = useState(1)
  const [selectedTask, setSelectedTask] = useState(null)
  const [receipt, setReceipt] = useState(null)
  const tareasQuery = useTareas(page)
  const entregasQuery = useTodasLasEntregasTareas()
  const taskDetailQuery = useTareaDetail(selectedTask?.id)
  const confirmarEnvio = useConfirmarEnvio()
  const entregasByTareaId = useMemo(
    () =>
      new Map(
        (entregasQuery.data || []).map((entrega) => [
          String(entrega.tarea),
          entrega,
        ]),
      ),
    [entregasQuery.data],
  )

  const tareas = tareasQuery.data?.results || []
  const taskDetails = taskDetailQuery.data || selectedTask
  const selectedEntrega = selectedTask
    ? entregasByTareaId.get(String(selectedTask.id))
    : null
  const isLocked = ['ENVIADO', 'EN_REVISION'].includes(selectedEntrega?.estado)

  async function handleConfirmFinalSubmission() {
    if (!selectedEntrega?.id) return

    try {
      const response = await confirmarEnvio.mutateAsync(selectedEntrega.id)
      setReceipt(response?.comprobante || null)
      toast.success(response?.mensaje || 'Entrega confirmada exitosamente.')
    } catch (error) {
      toast.error(error.message || 'No se pudo confirmar el envío definitivo.')
    }
  }

  function openTask(tarea) {
    setSelectedTask(tarea)
    setReceipt(null)
  }

  return (
    <AppShell>
      <section className="mx-auto flex max-w-[1100px] flex-col gap-6 px-4 py-8 sm:px-6 lg:px-10">
        <header>
          <p className="text-xs font-bold uppercase tracking-wider text-secondary-dark">
            Módulo Académico
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-primary">
            Tareas y entregas
          </h1>
          <p className="mt-1 text-sm text-muted">
            Revisa tus tareas y el estado de tus entregas.
          </p>
        </header>

        <Card className="border border-warning/40 bg-warning-soft p-4 text-sm text-ink" role="status">
          La subida de archivos y el guardado de borradores están pausados: el
          endpoint local de borradores falla y la API de archivos no aísla los
          documentos por usuario. Puedes confirmar un borrador existente que ya
          tenga un archivo adjunto.
        </Card>

        {entregasQuery.isError && (
          <Card className="p-5 text-sm text-danger-strong" role="alert">
            No se pudo verificar el estado de tus entregas: {entregasQuery.error.message}
            <Button
              className="ml-3"
              onClick={() => entregasQuery.refetch()}
              variant="secondary"
            >
              Reintentar
            </Button>
          </Card>
        )}

        {tareasQuery.isPending ? (
          <TaskSkeletons />
        ) : tareasQuery.error ? (
          <Card className="p-6 text-center" role="alert">
            <p className="text-sm font-semibold text-danger-strong">
              {tareasQuery.error.message}
            </p>
            <Button className="mt-4" onClick={() => tareasQuery.refetch()}>
              Reintentar
            </Button>
          </Card>
        ) : tareas.length === 0 ? (
          <EmptyState
            description="Cuando se publiquen tareas académicas, aparecerán aquí."
            icon="assignment"
            title="No hay tareas disponibles"
          />
        ) : (
          <div className="space-y-4">
            {tareas.map((tarea) => {
              const entrega = entregasByTareaId.get(String(tarea.id))
              const meta = entrega
                ? ESTADO_ENTREGA_META[entrega.estado] || {
                    label: entrega.estado,
                    tone: 'neutral',
                  }
                : {
                    label: entregasQuery.isPending
                      ? 'Cargando estado...'
                      : entregasQuery.isError
                        ? 'Estado no disponible'
                        : 'Pendiente de entrega',
                    tone: 'neutral',
                  }
              const isExpired =
                tarea.fecha_cierre && new Date(tarea.fecha_cierre) < new Date()

              return (
                <Card
                  className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center"
                  key={tarea.id}
                >
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-bold text-ink">{tarea.titulo}</h2>
                      <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
                      {entrega?.es_fuera_de_plazo && (
                        <StatusBadge tone="danger">Fuera de plazo</StatusBadge>
                      )}
                      {isExpired && !entrega && (
                        <StatusBadge
                          tone={tarea.permite_atrasados ? 'warning' : 'danger'}
                        >
                          {tarea.permite_atrasados ? 'Acepta atraso' : 'Plazo vencido'}
                        </StatusBadge>
                      )}
                    </div>
                    {tarea.descripcion && (
                      <p className="line-clamp-2 text-sm text-muted">{tarea.descripcion}</p>
                    )}
                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
                      <span>Cierre: {formatDateTimeCL(tarea.fecha_cierre)}</span>
                      {tarea.aplica_penalizacion_atraso && (
                        <span>Penalización por atraso: 1% por hora</span>
                      )}
                      {entrega?.calificacion_final !== null &&
                        entrega?.calificacion_final !== undefined && (
                          <span className="font-bold text-primary">
                            Nota final: {entrega.calificacion_final}
                          </span>
                        )}
                    </div>
                  </div>
                  <Button
                    disabled={entregasQuery.isPending || entregasQuery.isError}
                    onClick={() => openTask(tarea)}
                    variant={entrega ? 'secondary' : 'primary'}
                  >
                    {entrega ? 'Ver entrega' : 'Ver tarea'}
                  </Button>
                </Card>
              )
            })}
          </div>
        )}

        {(tareasQuery.data?.hasNext || tareasQuery.data?.hasPrevious) && (
          <nav
            aria-label="Paginación de tareas"
            className="flex items-center justify-center gap-4"
          >
            <Button
              disabled={!tareasQuery.data.hasPrevious || tareasQuery.isFetching}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              variant="secondary"
            >
              Anterior
            </Button>
            <span aria-live="polite" className="text-xs text-muted">
              Página {page}
            </span>
            <Button
              disabled={!tareasQuery.data.hasNext || tareasQuery.isFetching}
              onClick={() => setPage((current) => current + 1)}
              variant="secondary"
            >
              Siguiente
            </Button>
          </nav>
        )}
      </section>

      <Modal
        onClose={() => {
          setSelectedTask(null)
          setReceipt(null)
        }}
        open={Boolean(selectedTask)}
        title={taskDetails ? `Tarea: ${taskDetails.titulo}` : 'Detalle de tarea'}
      >
        {taskDetails && (
          <div className="space-y-5">
            {taskDetailQuery.isError && (
              <p className="text-sm text-danger-strong" role="alert">
                No se pudo actualizar el detalle de la tarea. Se muestra la
                información del listado.
              </p>
            )}
            {taskDetails.descripcion && (
              <div className="rounded-lg bg-subtle p-3 text-sm text-ink">
                {taskDetails.descripcion}
              </div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
              <span>Fecha límite: {formatDateTimeCL(taskDetails.fecha_cierre)}</span>
              {selectedEntrega && (
                <StatusBadge
                  tone={ESTADO_ENTREGA_META[selectedEntrega.estado]?.tone || 'neutral'}
                >
                  {ESTADO_ENTREGA_META[selectedEntrega.estado]?.label || selectedEntrega.estado}
                </StatusBadge>
              )}
            </div>
            {selectedEntrega?.archivo && (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface p-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-muted">Archivo adjunto</p>
                  <p className="truncate text-sm font-bold text-ink">
                    {getFileNameFromUrl(selectedEntrega.archivo)}
                  </p>
                </div>
                <a
                  className="shrink-0 text-xs font-bold text-primary underline"
                  href={selectedEntrega.archivo}
                  rel="noreferrer"
                  target="_blank"
                >
                  Descargar
                </a>
              </div>
            )}
            {selectedEntrega?.comentario_estudiante && (
              <p className="rounded-lg bg-subtle p-3 text-sm text-ink">
                <strong>Tu comentario:</strong> {selectedEntrega.comentario_estudiante}
              </p>
            )}
            {receipt && (
              <div
                className="space-y-1 rounded-xl border border-success/40 bg-success-soft p-4 text-xs text-success"
                role="status"
              >
                <p className="text-sm font-bold">Comprobante de envío registrado</p>
                {receipt.id_entrega !== undefined && (
                  <p>ID Entrega: #{receipt.id_entrega}</p>
                )}
                {receipt.timestamp_oficial && (
                  <p>Timestamp oficial: {formatDateTimeCL(receipt.timestamp_oficial)}</p>
                )}
                {receipt.archivo && <p>Archivo: {receipt.archivo}</p>}
              </div>
            )}
            {isLocked ? (
              <p className="rounded-lg border border-line p-4 text-sm text-muted">
                Esta entrega ya fue enviada y no admite modificaciones.
                {selectedEntrega.fecha_envio_definitivo &&
                  ` Enviada el ${formatDateTimeCL(selectedEntrega.fecha_envio_definitivo)}.`}
              </p>
            ) : (
              <div className="space-y-3 border-t border-line pt-4">
                <p className="text-sm text-muted">
                  Solo puedes confirmar un borrador existente con archivo. La
                  carga y edición del borrador están deshabilitadas hasta que
                  el backend corrija y proteja esos endpoints.
                </p>
                <div className="flex justify-end">
                  <Button
                    disabled={
                      !selectedEntrega?.archivo ||
                      entregasQuery.isError ||
                      confirmarEnvio.isPending
                    }
                    onClick={handleConfirmFinalSubmission}
                  >
                    {confirmarEnvio.isPending
                      ? 'Confirmando envío...'
                      : 'Confirmar envío definitivo'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </AppShell>
  )
}
