import { useState } from 'react'
import { toast } from 'sonner'
import { EmptyState, LoadingState } from '../../../shared/components/ui/StateViews'
import FileDropzoneUploader from '../../../shared/components/ui/FileDropzoneUploader'
import ArchivoAttachmentList from '../../archivos/components/ArchivoAttachmentList'
import {
  isTaskClosedForSubmission,
  isTaskLateWindowExpired,
  isTaskPastDeadlineWithLateAllowed,
} from '../api/evaluacionesApi'
import ConfirmSubmitDeliveryModal from './ConfirmSubmitDeliveryModal'

export default function TareasList({
  tasks,
  entregas = [],
  isStudent = false,
  isLoading,
  selectedTaskId,
  onSelectTask,
  onSubmitDelivery,
  isSubmittingDelivery,
}) {
  const [comentario, setComentario] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [activeDeliveryTaskId, setActiveDeliveryTaskId] = useState(null)
  const [confirmModalTask, setConfirmModalTask] = useState(null)

  if (isLoading) {
    return <LoadingState label="Cargando tareas evaluadas..." />
  }

  if (tasks.length === 0) {
    return (
      <EmptyState
        icon="assignment"
        title="No hay tareas publicadas en esta sección"
        description="Las tareas asignadas por el docente para esta sección aparecerán aquí."
      />
    )
  }

  function getStudentDeliveryForTask(taskId) {
    if (!isStudent) return null
    return entregas.find((e) => Number(e.tarea) === Number(taskId)) || null
  }

  function handleOpenDeliveryForm(task, existingDelivery) {
    if (isTaskClosedForSubmission(task, existingDelivery)) {
      toast.error(
        isTaskLateWindowExpired(task)
          ? 'El plazo máximo de 1 hora para entregas tardías ya venció. La entrega está bloqueada.'
          : 'El tiempo de subida para esta tarea ya venció y no tiene asignadas entregas tardías.',
      )
      return
    }
    if (activeDeliveryTaskId === task.id) {
      setActiveDeliveryTaskId(null)
      return
    }
    setActiveDeliveryTaskId(task.id)
    setComentario(existingDelivery?.observaciones_generales || '')
    setUploadedFiles(existingDelivery?.archivos_adjuntos || [])
  }

  function validateTaskAndContent(task) {
    const existingDelivery = getStudentDeliveryForTask(task.id)
    if (isTaskClosedForSubmission(task, existingDelivery)) {
      toast.error(
        isTaskLateWindowExpired(task)
          ? 'El plazo máximo de 1 hora para entregas tardías ya venció. No se permite entregar nada.'
          : 'El tiempo de subida ya pasó y esta tarea no permite entregas tardías. No se permite entregar nada.',
      )
      setActiveDeliveryTaskId(null)
      setConfirmModalTask(null)
      return false
    }
    if (uploadedFiles.length === 0 && !comentario.trim()) {
      toast.error(
        'Debes adjuntar al menos un archivo o escribir un comentario para tu entrega.',
      )
      return false
    }
    return true
  }

  function handleSaveDraft(task) {
    if (!validateTaskAndContent(task)) return
    onSubmitDelivery(
      {
        tarea: task.id,
        observaciones_generales: comentario.trim(),
        archivos_ids: uploadedFiles.map((f) => f.id),
        es_borrador: true,
      },
      () => {
        setActiveDeliveryTaskId(null)
      },
    )
  }

  function handleRequestFinalSend(task) {
    if (!validateTaskAndContent(task)) return
    setConfirmModalTask(task)
  }

  function handleConfirmFinalSend() {
    if (!confirmModalTask) return
    if (!validateTaskAndContent(confirmModalTask)) return
    onSubmitDelivery(
      {
        tarea: confirmModalTask.id,
        observaciones_generales: comentario.trim(),
        archivos_ids: uploadedFiles.map((f) => f.id),
        es_borrador: false,
      },
      () => {
        setComentario('')
        setUploadedFiles([])
        setActiveDeliveryTaskId(null)
        setConfirmModalTask(null)
      },
    )
  }

  return (
    <>
      <div className="space-y-3">
        {tasks.map((task) => {
          const existingDelivery = getStudentDeliveryForTask(task.id)
          const estadoCodigo = existingDelivery?.estado_codigo || null
          const isReopened = estadoCodigo === 'REABIERTA'
          const isDraft = estadoCodigo === 'BORRADOR'
          const isLockedBySent =
            estadoCodigo != null && !isDraft && !isReopened
          const isClosedByDeadline = isTaskClosedForSubmission(
            task,
            existingDelivery,
          )
          const isLateAllowedAndPast = isTaskPastDeadlineWithLateAllowed(task)
          const isLateExpired = isTaskLateWindowExpired(task)

          return (
            <div
              className={`rounded-xl border p-4 shadow-xs transition ${
                selectedTaskId === task.id
                  ? 'border-primary bg-primary/5'
                  : 'border-line bg-card'
              }`}
              key={task.id}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-subtle px-2 py-0.5 text-[10px] font-bold text-primary">
                    {task.seccion_info
                      ? `${task.seccion_info.codigo_asignatura} · Sec. ${task.seccion_info.numero_seccion}`
                      : `Sección #${task.seccion}`}
                  </span>

                  {task.fecha_limite ? (
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        task.permitir_entregas_tardias
                          ? 'bg-sky-100 text-sky-900'
                          : 'bg-slate-200 text-slate-800'
                      }`}
                    >
                      {task.permitir_entregas_tardias
                        ? 'Admite entrega tardía (máx. 1h · -1% nota)'
                        : 'Sin entregas tardías'}
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-700">
                      Sin fecha de término
                    </span>
                  )}

                  {task.rubrica_detalle && (
                    <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-[10px] font-bold text-indigo-900">
                      Rúbrica: {task.rubrica_detalle.titulo}
                    </span>
                  )}

                  {isClosedByDeadline && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-extrabold text-rose-900">
                      <span className="material-symbols-outlined text-xs">
                        timer_off
                      </span>
                      {isLateExpired
                        ? 'Plazo tardío de 1h vencido (Bloqueada)'
                        : 'Plazo vencido (Cerrada)'}
                    </span>
                  )}

                  {isLateAllowedAndPast && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-900">
                      <span className="material-symbols-outlined text-xs">
                        schedule
                      </span>
                      Ventana tardía activa (máx. 1h de espera · -1% nota)
                    </span>
                  )}

                  {isStudent && isReopened && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-0.5 text-[10px] font-extrabold text-indigo-900">
                      <span className="material-symbols-outlined text-xs">
                        lock_open
                      </span>
                      Reabierta por el docente (Nuevo intento habilitado)
                    </span>
                  )}

                  {isStudent && isDraft && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-900">
                      <span className="material-symbols-outlined text-xs">
                        edit_document
                      </span>
                      En Borrador {isClosedByDeadline ? '(Plazo expirado)' : '(editable)'}
                    </span>
                  )}

                  {isStudent && isLockedBySent && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-900">
                      <span className="material-symbols-outlined text-xs">
                        lock
                      </span>
                      Enviada definitivamente ({estadoCodigo})
                    </span>
                  )}
                </div>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  Máx. {task.puntaje_maximo}
                </span>
              </div>

              <h3 className="mt-2 text-sm font-bold text-ink">{task.titulo}</h3>
              <p className="mt-1 text-xs text-muted">{task.instrucciones}</p>

              {isStudent && isLockedBySent && existingDelivery?.comprobante && (
                <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50/70 px-3 py-1.5 text-[11px] text-emerald-950">
                  <span>
                    <strong>
                      Comprobante #{existingDelivery.comprobante.codigo}:
                    </strong>{' '}
                    Emitido el{' '}
                    {new Date(
                      existingDelivery.comprobante.timestamp,
                    ).toLocaleString('es-CL')}
                  </span>
                  <span className="font-bold">
                    {existingDelivery.es_tardia
                      ? 'Entrega en ventana tardía (-1%)'
                      : 'Entrega a tiempo'}
                  </span>
                </div>
              )}

              {isStudent && existingDelivery?.archivos_adjuntos?.length > 0 && (
                <div className="mt-2.5 space-y-1.5 rounded-lg border border-line bg-subtle/50 p-2.5">
                  <p className="text-[11px] font-bold text-ink">
                    Tus archivos subidos ({existingDelivery.archivos_adjuntos.length}):
                  </p>
                  <ArchivoAttachmentList
                    files={existingDelivery.archivos_adjuntos}
                  />
                </div>
              )}

              {isStudent &&
                existingDelivery?.archivos_retroalimentacion?.length > 0 && (
                  <div className="mt-2 space-y-1.5 rounded-lg border border-indigo-200 bg-indigo-50/70 p-2.5">
                    <p className="text-[11px] font-extrabold text-indigo-950">
                      Retroalimentación adjuntada por el docente:
                    </p>
                    <ArchivoAttachmentList
                      files={existingDelivery.archivos_retroalimentacion}
                      icon="rate_review"
                      tone="indigo"
                    />
                  </div>
                )}

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-[11px] text-muted">
                <span>
                  Límite:{' '}
                  {task.fecha_limite
                    ? new Date(task.fecha_limite).toLocaleString('es-CL')
                    : 'Sin fecha de término'}
                </span>
                <div className="flex flex-wrap gap-2">
                  {isLockedBySent ? (
                    <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
                      <span
                        aria-hidden="true"
                        className="material-symbols-outlined text-sm"
                      >
                        lock
                      </span>
                      Entrega enviada — No admite cambios
                    </span>
                  ) : isClosedByDeadline ? (
                    <span className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-rose-50 px-3 py-1 text-xs font-bold text-rose-900">
                      <span
                        aria-hidden="true"
                        className="material-symbols-outlined text-sm"
                      >
                        block
                      </span>
                      {isLateExpired
                        ? 'Tiempo tardío de 1h vencido — Entrega bloqueada'
                        : 'Tiempo de subida vencido — No se permite entregar nada'}
                    </span>
                  ) : (
                    <button
                      className="inline-flex items-center gap-1 rounded-lg border border-line bg-surface px-3 py-1 text-xs font-bold text-ink hover:bg-subtle"
                      onClick={() =>
                        handleOpenDeliveryForm(task, existingDelivery)
                      }
                      type="button"
                    >
                      <span
                        aria-hidden="true"
                        className="material-symbols-outlined text-sm"
                      >
                        {isDraft || isReopened ? 'edit_note' : 'upload_file'}
                      </span>
                      {isReopened
                        ? 'Subir nuevo intento (Reabierta)'
                        : isDraft
                          ? 'Continuar borrador / Enviar'
                          : 'Preparar entrega'}
                    </button>
                  )}

                  {!isStudent && onSelectTask && (
                    <button
                      className="rounded-lg bg-primary/10 px-3 py-1 text-xs font-bold text-primary hover:bg-primary hover:text-white"
                      onClick={() =>
                        onSelectTask(selectedTaskId === task.id ? null : task.id)
                      }
                      type="button"
                    >
                      {selectedTaskId === task.id
                        ? 'Ver todas'
                        : 'Filtrar entregas'}
                    </button>
                  )}
                </div>
              </div>

              {activeDeliveryTaskId === task.id &&
                !isLockedBySent &&
                !isClosedByDeadline && (
                  <div className="mt-3 space-y-3 rounded-xl border border-line bg-surface p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-extrabold text-ink">
                        {isDraft
                          ? 'Editando entrega en estado Borrador'
                          : 'Nueva entrega de tarea (puedes guardarla en borrador o enviarla)'}
                      </p>
                      <span className="text-[11px] font-semibold text-amber-800">
                        Los archivos subidos no podrán ser eliminados
                      </span>
                    </div>

                    <FileDropzoneUploader
                      allowRemove={false}
                      compact
                      label="Arrastra y suelta tu archivo de entrega aquí o haz clic para buscarlo"
                      onChangeUploadedFiles={setUploadedFiles}
                      uploadedFiles={uploadedFiles}
                    />

                    <input
                      className="w-full rounded-lg border border-line bg-card px-3 py-2 text-xs"
                      onChange={(e) => setComentario(e.target.value)}
                      placeholder="Comentario o notas para el docente..."
                      value={comentario}
                    />

                    <div className="rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 text-[11px] text-amber-950">
                      <strong>Modo Borrador:</strong> Puedes guardar tu avance en{' '}
                      <strong>BORRADOR</strong> todas las veces que necesites mientras esté dentro del plazo permitido. Cuando uses{' '}
                      <strong>&ldquo;Enviar entrega definitiva&rdquo;</strong>, se te pedirá
                      confirmación y ya no podrás cambiar nada.
                    </div>

                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        className="rounded-lg border border-line px-3 py-1.5 text-xs font-bold text-muted hover:bg-subtle"
                        onClick={() => setActiveDeliveryTaskId(null)}
                        type="button"
                      >
                        Cerrar
                      </button>
                      <button
                        className="inline-flex items-center gap-1 rounded-lg border border-amber-400 bg-amber-100 px-3.5 py-1.5 text-xs font-bold text-amber-950 hover:bg-amber-200 disabled:opacity-50"
                        disabled={isSubmittingDelivery}
                        onClick={() => handleSaveDraft(task)}
                        type="button"
                      >
                        <span className="material-symbols-outlined text-sm">
                          save
                        </span>
                        {isSubmittingDelivery
                          ? 'Guardando...'
                          : 'Guardar como borrador'}
                      </button>
                      <button
                        className="inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-1.5 text-xs font-bold text-white hover:bg-primary/90 disabled:opacity-50"
                        disabled={isSubmittingDelivery}
                        onClick={() => handleRequestFinalSend(task)}
                        type="button"
                      >
                        <span className="material-symbols-outlined text-sm">
                          send
                        </span>
                        Enviar entrega definitiva...
                      </button>
                    </div>
                  </div>
                )}
            </div>
          )
        })}
      </div>

      <ConfirmSubmitDeliveryModal
        comment={comentario}
        filesCount={uploadedFiles.length}
        isOpen={Boolean(confirmModalTask)}
        isSubmitting={isSubmittingDelivery}
        onCancel={() => setConfirmModalTask(null)}
        onConfirm={handleConfirmFinalSend}
        taskTitle={confirmModalTask?.titulo}
      />
    </>
  )
}
