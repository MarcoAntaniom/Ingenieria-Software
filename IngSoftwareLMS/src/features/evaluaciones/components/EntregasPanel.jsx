import { useState } from 'react'
import { toast } from 'sonner'
import { EmptyState, LoadingState } from '../../../shared/components/ui/StateViews'
import FileDropzoneUploader from '../../../shared/components/ui/FileDropzoneUploader'
import ArchivoAttachmentList from '../../archivos/components/ArchivoAttachmentList'
import { LATE_SUBMISSION_MAX_WAIT_MS } from '../api/evaluacionesApi'
import ConfirmSubmitDeliveryModal from './ConfirmSubmitDeliveryModal'

function isEntregaDeadlineClosed(entrega) {
  if (entrega?.estado_codigo === 'REABIERTA') return false
  if (!entrega?.tarea_fecha_limite) return false
  const deadlineMs = new Date(entrega.tarea_fecha_limite).getTime()
  if (!Number.isFinite(deadlineMs)) return false
  const nowMs = Date.now()
  if (nowMs <= deadlineMs) return false
  if (!entrega.tarea_permitir_entregas_tardias) return true
  return nowMs > deadlineMs + LATE_SUBMISSION_MAX_WAIT_MS
}

export default function EntregasPanel({
  entregas,
  isLoading,
  canGrade,
  isStudent = false,
  onGradeDelivery,
  isGrading,
  onConfirmDraftDelivery,
  isConfirmingDraft = false,
  onMarkInReview,
  onReopenDelivery,
}) {
  const [gradingId, setGradingId] = useState(null)
  const [notaFinal, setNotaFinal] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [eximirPenalizacion, setEximirPenalizacion] = useState(false)
  const [feedbackFiles, setFeedbackFiles] = useState([])
  const [selectedRubricLevels, setSelectedRubricLevels] = useState({})
  const [draftToConfirm, setDraftToConfirm] = useState(null)

  if (isLoading) {
    return <LoadingState label="Consultando entregas registradas..." />
  }

  if (entregas.length === 0) {
    return (
      <EmptyState
        icon="Rule"
        title="Sin entregas registradas"
        description="Cuando los estudiantes guarden borradores o envíen sus tareas, aparecerán aquí para seguimiento y calificación."
      />
    )
  }

  function handleSelectRubricLevel(entrega, criterio, nivel) {
    const nextLevels = {
      ...selectedRubricLevels,
      [criterio.id]: nivel,
    }
    setSelectedRubricLevels(nextLevels)

    // Cálculo automático de la nota sugerida a partir de la rúbrica (RF-28)
    const criterios = entrega.tarea_rubrica?.criterios || []
    let totalWeight = 0
    let weightedSum = 0
    for (const crit of criterios) {
      const chosen = nextLevels[crit.id]
      if (chosen) {
        const w = Number(crit.ponderacion_porcentaje) || 1
        totalWeight += w
        weightedSum += Number(chosen.puntaje) * w
      }
    }
    if (totalWeight > 0) {
      const suggested = Math.min(7.0, Math.max(1.0, weightedSum / totalWeight))
      setNotaFinal(suggested.toFixed(1))
    }
  }

  return (
    <>
      <div className="space-y-3">
        {entregas.map((entrega) => {
          const isDraft = entrega.estado_codigo === 'BORRADOR'
          const isReopened = entrega.estado_codigo === 'REABIERTA'
          const isEditableDraftOrReopened = isDraft || isReopened
          const isClosedByDeadline = isEntregaDeadlineClosed(entrega)
          const numericGrade =
            entrega.nota_final != null ? Number(entrega.nota_final) : null
          const isApproved = numericGrade != null && numericGrade >= 4.0

          const previewInputGrade =
            notaFinal !== '' && Number.isFinite(Number(notaFinal))
              ? Number(notaFinal)
              : null
          const previewFinalGrade =
            previewInputGrade != null
              ? entrega.es_tardia && !eximirPenalizacion
                ? Math.max(1.0, Number((previewInputGrade * 0.99).toFixed(1)))
                : Number(previewInputGrade.toFixed(1))
              : null

          return (
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
                    Estudiante:{' '}
                    {entrega.estudiante_nombre || `Perfil #${entrega.estudiante}`}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {entrega.comprobante && (
                    <span className="rounded-full border border-line bg-subtle px-2.5 py-0.5 font-mono text-[10px] font-bold text-ink">
                      #{entrega.comprobante.codigo}
                    </span>
                  )}

                  {entrega.es_tardia && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-900">
                      <span className="material-symbols-outlined text-xs">
                        schedule
                      </span>
                      Tardía (ventana 1h · -1%)
                    </span>
                  )}

                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      isDraft
                        ? 'bg-amber-100 text-amber-900'
                        : isReopened
                          ? 'bg-indigo-100 text-indigo-900'
                          : entrega.estado_codigo === 'EN_REVISION'
                            ? 'bg-sky-100 text-sky-900'
                            : 'bg-emerald-100 text-emerald-900'
                    }`}
                  >
                    <span className="material-symbols-outlined text-xs">
                      {isDraft
                        ? 'edit_document'
                        : isReopened
                          ? 'lock_open'
                          : entrega.estado_codigo === 'EN_REVISION'
                            ? 'visibility'
                            : 'lock'}
                    </span>
                    {isDraft
                      ? 'BORRADOR (Sin enviar)'
                      : isReopened
                        ? 'REABIERTA (Nuevo intento)'
                        : `${entrega.estado_codigo} (Definitiva)`}
                  </span>

                  {numericGrade != null && (
                    <>
                      <span className="rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-extrabold text-white">
                        Nota: {numericGrade.toFixed(1)}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                          isApproved
                            ? 'bg-emerald-100 text-emerald-900'
                            : 'bg-rose-100 text-rose-900'
                        }`}
                      >
                        {entrega.estado_conceptual ||
                          (isApproved ? 'APROBADO' : 'REPROBADO')}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {entrega.observaciones_generales && (
                <p className="mt-2 rounded-lg bg-subtle p-2.5 text-xs text-muted">
                  {entrega.observaciones_generales}
                </p>
              )}

              {entrega.archivos_adjuntos?.length > 0 && (
                <div className="mt-2.5 space-y-1.5">
                  <p className="text-[11px] font-bold text-muted">
                    {isStudent
                      ? 'Tus archivos subidos:'
                      : 'Archivos adjuntos de la entrega:'}
                  </p>
                  <ArchivoAttachmentList
                    files={entrega.archivos_adjuntos}
                    onBeforeAccess={() => {
                      if (
                        canGrade &&
                        entrega.estado_codigo === 'ENVIADA' &&
                        onMarkInReview
                      ) {
                        onMarkInReview(entrega.id)
                      }
                    }}
                  />
                </div>
              )}

              {entrega.archivos_retroalimentacion?.length > 0 && (
                <div className="mt-2.5 space-y-1.5 rounded-lg border border-indigo-200 bg-indigo-50/70 p-2.5">
                  <p className="text-[11px] font-extrabold text-indigo-950">
                    Archivos corregidos adjuntados por el docente:
                  </p>
                  <ArchivoAttachmentList
                    files={entrega.archivos_retroalimentacion}
                    icon="rate_review"
                    tone="indigo"
                  />
                </div>
              )}

              {entrega.evaluaciones_criterios?.length > 0 && (
                <div className="mt-2.5 rounded-lg border border-line bg-subtle/60 p-2.5 text-[11px]">
                  <p className="mb-1 font-bold text-ink">
                    Desglose de evaluación por rúbrica:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {entrega.evaluaciones_criterios.map((ev) => (
                      <span
                        className="rounded border border-line bg-card px-2 py-0.5 text-muted"
                        key={ev.id}
                      >
                        <strong>{ev.criterio_titulo}:</strong> {ev.nivel_nombre}{' '}
                        ({Number(ev.puntaje_asignado).toFixed(1)})
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {isStudent &&
                isEditableDraftOrReopened &&
                onConfirmDraftDelivery && (
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
                    {isClosedByDeadline ? (
                      <span className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-900">
                        <span className="material-symbols-outlined text-sm">
                          block
                        </span>
                        El tiempo de subida (incluida la espera máxima de 1h) venció. No se permite entregar este borrador.
                      </span>
                    ) : (
                      <>
                        <span className="text-[11px] text-amber-900">
                          Esta entrega está en{' '}
                          <strong>
                            {isReopened ? 'REABIERTA' : 'BORRADOR'}
                          </strong>
                          . Cuando estés listo, confírmala para enviarla al docente.
                        </span>
                        <button
                          className="inline-flex items-center gap-1 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-bold text-white hover:bg-primary/90 disabled:opacity-50"
                          disabled={isConfirmingDraft}
                          onClick={() => setDraftToConfirm(entrega)}
                          type="button"
                        >
                          <span className="material-symbols-outlined text-sm">
                            send
                          </span>
                          Enviar definitivamente...
                        </button>
                      </>
                    )}
                  </div>
                )}

              {canGrade && (
                <div className="mt-3 border-t border-line pt-3">
                  {gradingId === entrega.id ? (
                    <form
                      className="space-y-3"
                      onSubmit={(e) => {
                        e.preventDefault()
                        const parsed = Number(notaFinal)
                        if (
                          !Number.isFinite(parsed) ||
                          parsed < 1.0 ||
                          parsed > 7.0
                        ) {
                          toast.error(
                            'La calificación debe estar en la escala chilena entre 1.0 y 7.0.',
                          )
                          return
                        }
                        const criteriosPayload = Object.entries(
                          selectedRubricLevels,
                        ).map(([criterioId, niv]) => ({
                          criterio_id: Number(criterioId),
                          nivel_id: Number(niv.id),
                        }))
                        onGradeDelivery(
                          {
                            entregaId: entrega.id,
                            nota_final: Number(parsed.toFixed(1)),
                            observaciones_generales: observaciones.trim(),
                            eximir_penalizacion: eximirPenalizacion,
                            archivos_retroalimentacion_ids: feedbackFiles.map(
                              (f) => f.id,
                            ),
                            evaluaciones_criterios: criteriosPayload,
                          },
                          () => {
                            setGradingId(null)
                            setNotaFinal('')
                            setObservaciones('')
                            setEximirPenalizacion(false)
                            setFeedbackFiles([])
                            setSelectedRubricLevels({})
                          },
                        )
                      }}
                    >
                      {entrega.tarea_rubrica?.criterios?.length > 0 && (
                        <div className="space-y-2 rounded-xl border border-indigo-200 bg-indigo-50/50 p-3">
                          <p className="text-xs font-extrabold text-indigo-950">
                            Rúbrica interactiva: {entrega.tarea_rubrica.titulo}{' '}
                            (calcula nota sugerida automáticamente)
                          </p>
                          {entrega.tarea_rubrica.criterios.map((crit) => (
                            <div
                              className="space-y-1 rounded-lg bg-card p-2 border border-line"
                              key={crit.id}
                            >
                              <p className="text-[11px] font-bold text-ink">
                                {crit.titulo}{' '}
                                <span className="font-normal text-muted">
                                  ({crit.ponderacion_porcentaje}%)
                                </span>
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {(crit.niveles || []).map((niv) => {
                                  const isSelected =
                                    selectedRubricLevels[crit.id]?.id === niv.id
                                  return (
                                    <button
                                      className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition ${
                                        isSelected
                                          ? 'border-primary bg-primary text-white'
                                          : 'border-line bg-subtle text-ink hover:bg-surface'
                                      }`}
                                      key={niv.id}
                                      onClick={() =>
                                        handleSelectRubricLevel(
                                          entrega,
                                          crit,
                                          niv,
                                        )
                                      }
                                      type="button"
                                    >
                                      {niv.nombre_nivel} ({niv.puntaje})
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        <div>
                          <label className="mb-1 block text-[11px] font-bold text-ink">
                            Nota (Escala 1.0 a 7.0)
                          </label>
                          <input
                            className="w-full rounded-lg border border-line bg-subtle px-3 py-1.5 text-xs"
                            max="7.0"
                            min="1.0"
                            onChange={(e) => setNotaFinal(e.target.value)}
                            placeholder="Ej. 5.8"
                            required
                            step="0.1"
                            type="number"
                            value={notaFinal}
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="mb-1 block text-[11px] font-bold text-ink">
                            Retroalimentación cualitativa
                          </label>
                          <input
                            className="w-full rounded-lg border border-line bg-subtle px-3 py-1.5 text-xs"
                            onChange={(e) => setObservaciones(e.target.value)}
                            placeholder="Comentarios y observaciones para el estudiante..."
                            value={observaciones}
                          />
                        </div>
                      </div>

                      {entrega.es_tardia && (
                        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-950">
                          <span>
                            Esta entrega se realizó en la ventana tardía (máx. 1h). Aplica{' '}
                            <strong>descuento automático del 1%</strong>.
                          </span>
                          <label className="flex items-center gap-1.5 font-bold">
                            <input
                              checked={eximirPenalizacion}
                              className="rounded border-amber-400 text-primary"
                              onChange={(e) =>
                                setEximirPenalizacion(e.target.checked)
                              }
                              type="checkbox"
                            />
                            Eximir descuento del 1% (justificación)
                          </label>
                        </div>
                      )}

                      {previewFinalGrade != null && (
                        <div className="flex items-center gap-2 text-[11px] font-bold text-ink">
                          <span>
                            Nota final a registrar: {previewFinalGrade.toFixed(1)}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] ${
                              previewFinalGrade >= 4.0
                                ? 'bg-emerald-100 text-emerald-900'
                                : 'bg-rose-100 text-rose-900'
                            }`}
                          >
                            {previewFinalGrade >= 4.0 ? 'APROBADO' : 'REPROBADO'}
                          </span>
                        </div>
                      )}

                      <FileDropzoneUploader
                        compact
                        label="Adjuntar archivo corregido de retroalimentación (opcional)"
                        onChangeUploadedFiles={setFeedbackFiles}
                        uploadedFiles={feedbackFiles}
                      />

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
                          onClick={() => {
                            setGradingId(null)
                            setFeedbackFiles([])
                            setSelectedRubricLevels({})
                          }}
                          type="button"
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <button
                        className="text-xs font-bold text-primary hover:underline"
                        onClick={() => {
                          if (
                            entrega.estado_codigo === 'ENVIADA' &&
                            onMarkInReview
                          ) {
                            onMarkInReview(entrega.id)
                          }
                          setGradingId(entrega.id)
                          setNotaFinal(entrega.nota_final ?? '')
                          setObservaciones(entrega.observaciones_generales ?? '')
                          setEximirPenalizacion(false)
                          setFeedbackFiles([])
                          setSelectedRubricLevels({})
                        }}
                        type="button"
                      >
                        {entrega.nota_final != null
                          ? 'Editar calificación / retroalimentación'
                          : 'Revisar y calificar entrega (Escala 1.0 - 7.0)'}
                      </button>

                      {onReopenDelivery &&
                        entrega.estado_codigo !== 'BORRADOR' &&
                        entrega.estado_codigo !== 'REABIERTA' && (
                          <button
                            className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-900 hover:bg-indigo-100"
                            onClick={() => onReopenDelivery(entrega.id)}
                            type="button"
                          >
                            <span className="material-symbols-outlined text-xs">
                              lock_open
                            </span>
                            Reabrir plazo al estudiante
                          </button>
                        )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <ConfirmSubmitDeliveryModal
        comment={draftToConfirm?.observaciones_generales || ''}
        filesCount={draftToConfirm?.archivos_adjuntos?.length || 0}
        isOpen={Boolean(draftToConfirm)}
        isSubmitting={isConfirmingDraft}
        onCancel={() => setDraftToConfirm(null)}
        onConfirm={() => {
          if (!draftToConfirm) return
          if (isEntregaDeadlineClosed(draftToConfirm)) {
            toast.error(
              'El tiempo de subida (incluida la espera máxima de 1 hora) ya venció y la entrega está bloqueada.',
            )
            setDraftToConfirm(null)
            return
          }
          onConfirmDraftDelivery(draftToConfirm.id, () => {
            setDraftToConfirm(null)
          })
        }}
        taskTitle={draftToConfirm?.tarea_titulo}
      />
    </>
  )
}
