import { useState } from 'react'
import { EmptyState, LoadingState } from '../../../shared/components/ui/StateViews'
import FileDropzoneUploader from '../../../shared/components/ui/FileDropzoneUploader'

export default function TareasList({
  tasks,
  isLoading,
  selectedTaskId,
  onSelectTask,
  onSubmitDelivery,
  isSubmittingDelivery,
}) {
  const [comentario, setComentario] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [activeDeliveryTaskId, setActiveDeliveryTaskId] = useState(null)

  if (isLoading) {
    return <LoadingState label="Cargando tareas evaluadas..." />
  }

  if (tasks.length === 0) {
    return (
      <EmptyState
        icon="assignment"
        title="No hay tareas publicadas"
        description="Las tareas creadas por los docentes en las secciones aparecerán aquí."
      />
    )
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <div
          className={`rounded-xl border p-4 shadow-xs transition ${
            selectedTaskId === task.id
              ? 'border-primary bg-primary/5'
              : 'border-line bg-card'
          }`}
          key={task.id}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="rounded bg-subtle px-2 py-0.5 text-[10px] font-bold text-primary">
              {task.seccion_info
                ? `${task.seccion_info.codigo_asignatura} · Sec. ${task.seccion_info.numero_seccion}`
                : `Sección #${task.seccion}`}
            </span>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
              {task.puntaje_maximo} pts
            </span>
          </div>

          <h3 className="mt-2 text-sm font-bold text-ink">{task.titulo}</h3>
          <p className="mt-1 text-xs text-muted">{task.instrucciones}</p>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-[11px] text-muted">
            <span>
              Límite:{' '}
              {task.fecha_limite
                ? new Date(task.fecha_limite).toLocaleString('es-CL')
                : '—'}
            </span>
            <div className="flex gap-2">
              <button
                className="inline-flex items-center gap-1 rounded-lg border border-line bg-surface px-3 py-1 text-xs font-bold text-ink hover:bg-subtle"
                onClick={() => {
                  setActiveDeliveryTaskId((prev) =>
                    prev === task.id ? null : task.id,
                  )
                  setUploadedFiles([])
                }}
                type="button"
              >
                <span className="material-symbols-outlined text-sm" aria-hidden="true">
                  upload_file
                </span>
                Subir entrega
              </button>
              <button
                className="rounded-lg bg-primary/10 px-3 py-1 text-xs font-bold text-primary hover:bg-primary hover:text-white"
                onClick={() =>
                  onSelectTask(selectedTaskId === task.id ? null : task.id)
                }
                type="button"
              >
                {selectedTaskId === task.id ? 'Ver todas' : 'Filtrar entregas'}
              </button>
            </div>
          </div>

          {activeDeliveryTaskId === task.id && (
            <form
              className="mt-3 space-y-3 rounded-xl border border-line bg-surface p-4"
              onSubmit={(e) => {
                e.preventDefault()
                onSubmitDelivery(
                  {
                    tarea: task.id,
                    observaciones_generales: comentario.trim(),
                    archivos_ids: uploadedFiles.map((f) => f.id),
                  },
                  () => {
                    setComentario('')
                    setUploadedFiles([])
                    setActiveDeliveryTaskId(null)
                  },
                )
              }}
            >
              <p className="text-xs font-extrabold text-ink">
                Adjuntar archivos de la entrega (Arrastra y suelta)
              </p>

              <FileDropzoneUploader
                compact
                label="Arrastra y suelta tu archivo de entrega aquí o haz clic para buscarlo"
                onChangeUploadedFiles={setUploadedFiles}
                uploadedFiles={uploadedFiles}
              />

              <input
                className="w-full rounded-lg border border-line bg-card px-3 py-2 text-xs"
                onChange={(e) => setComentario(e.target.value)}
                placeholder="Comentario para el docente (opcional si adjuntas archivo)..."
                required={uploadedFiles.length === 0}
                value={comentario}
              />
              <div className="flex justify-end gap-2">
                <button
                  className="rounded-lg border border-line px-3 py-1.5 text-xs font-bold text-muted"
                  onClick={() => setActiveDeliveryTaskId(null)}
                  type="button"
                >
                  Cancelar
                </button>
                <button
                  className="rounded-lg bg-secondary px-4 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                  disabled={isSubmittingDelivery}
                  type="submit"
                >
                  {isSubmittingDelivery ? 'Enviando...' : 'Confirmar entrega'}
                </button>
              </div>
            </form>
          )}
        </div>
      ))}
    </div>
  )
}
