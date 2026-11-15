import { useState } from 'react'
import { EmptyState, LoadingState } from '../../../shared/components/ui/StateViews'
import { formatFileSize } from '../../archivos/api/archivosApi'

export default function EntregasPanel({
  entregas,
  isLoading,
  canGrade,
  onGradeDelivery,
  isGrading,
}) {
  const [gradingId, setGradingId] = useState(null)
  const [notaFinal, setNotaFinal] = useState('')
  const [observaciones, setObservaciones] = useState('')

  if (isLoading) {
    return <LoadingState label="Consultando entregas registradas..." />
  }

  if (entregas.length === 0) {
    return (
      <EmptyState
        icon="Rule"
        title="Sin entregas registradas"
        description="Cuando los estudiantes envíen sus tareas, aparecerán aquí para seguimiento y calificación."
      />
    )
  }

  return (
    <div className="space-y-3">
      {entregas.map((entrega) => (
        <div
          className="rounded-xl border border-line bg-card p-4 shadow-xs"
          key={entrega.id}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold text-ink">
                {entrega.tarea_titulo || `Tarea #${entrega.tarea}`}
              </span>
              <p className="text-[11px] text-muted">
                Estudiante: {entrega.estudiante_nombre || `Perfil #${entrega.estudiante}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-secondary-container px-2.5 py-0.5 text-[10px] font-bold text-on-secondary-container">
                {entrega.estado_codigo}
              </span>
              {entrega.nota_final != null && (
                <span className="rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-extrabold text-white">
                  Nota: {entrega.nota_final}
                </span>
              )}
            </div>
          </div>

          {entrega.observaciones_generales && (
            <p className="mt-2 rounded-lg bg-subtle p-2.5 text-xs text-muted">
              {entrega.observaciones_generales}
            </p>
          )}

          {entrega.archivos_adjuntos?.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-2">
              {entrega.archivos_adjuntos.map((file) => (
                <a
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-bold text-primary transition hover:bg-subtle"
                  href={file.url_publica}
                  key={file.id}
                  rel="noreferrer"
                  target="_blank"
                >
                  <span className="material-symbols-outlined text-base text-secondary">
                    attach_file
                  </span>
                  <span>{file.nombre_original}</span>
                  <span className="text-[10px] font-normal text-muted">
                    ({formatFileSize(file.peso_bytes)})
                  </span>
                </a>
              ))}
            </div>
          )}

          {canGrade && (
            <div className="mt-3 border-t border-line pt-3">
              {gradingId === entrega.id ? (
                <form
                  className="space-y-2"
                  onSubmit={(e) => {
                    e.preventDefault()
                    onGradeDelivery(
                      {
                        entregaId: entrega.id,
                        nota_final: Number(notaFinal),
                        observaciones_generales: observaciones.trim(),
                      },
                      () => {
                        setGradingId(null)
                        setNotaFinal('')
                        setObservaciones('')
                      },
                    )
                  }}
                >
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <input
                      className="rounded-lg border border-line bg-subtle px-3 py-1.5 text-xs"
                      min="0"
                      onChange={(e) => setNotaFinal(e.target.value)}
                      placeholder="Nota final (ej. 95)"
                      required
                      step="0.1"
                      type="number"
                      value={notaFinal}
                    />
                    <input
                      className="rounded-lg border border-line bg-subtle px-3 py-1.5 text-xs sm:col-span-2"
                      onChange={(e) => setObservaciones(e.target.value)}
                      placeholder="Retroalimentación docente..."
                      value={observaciones}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white"
                      disabled={isGrading}
                      type="submit"
                    >
                      Publicar calificación
                    </button>
                    <button
                      className="rounded-lg border border-line px-3 py-1.5 text-xs font-bold text-muted"
                      onClick={() => setGradingId(null)}
                      type="button"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  className="text-xs font-bold text-primary hover:underline"
                  onClick={() => {
                    setGradingId(entrega.id)
                    setNotaFinal(entrega.nota_final ?? '')
                    setObservaciones(entrega.observaciones_generales ?? '')
                  }}
                  type="button"
                >
                  {entrega.nota_final != null ? 'Editar calificación' : 'Calificar entrega'}
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
