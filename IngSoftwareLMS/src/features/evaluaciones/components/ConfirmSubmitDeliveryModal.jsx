/**
 * Modal de confirmación previa al envío definitivo de una entrega de tarea.
 * Advierte explícitamente al estudiante que una vez enviada la entrega,
 * no se podrá modificar nada (ni archivos ni comentarios).
 */
export default function ConfirmSubmitDeliveryModal({
  isOpen,
  taskTitle,
  filesCount = 0,
  comment = '',
  isSubmitting = false,
  onCancel,
  onConfirm,
}) {
  if (!isOpen) return null

  return (
    <div
      aria-labelledby="confirm-submit-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-xs"
      role="dialog"
    >
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-line bg-card shadow-2xl">
        <div className="flex items-start gap-3 border-b border-line bg-amber-50/90 px-6 py-4">
          <span
            aria-hidden="true"
            className="material-symbols-outlined mt-0.5 text-2xl text-amber-600"
          >
            warning
          </span>
          <div>
            <h3
              className="text-sm font-extrabold text-ink"
              id="confirm-submit-title"
            >
              ¿Estás seguro de que deseas enviar esta entrega?
            </h3>
            {taskTitle && (
              <p className="mt-0.5 text-xs font-semibold text-muted">
                Tarea: {taskTitle}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-4 px-6 py-5 text-xs text-ink">
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-rose-950">
            <p className="font-extrabold">
              Advertencia importante: Acción irreversible
            </p>
            <p className="mt-1 leading-relaxed text-rose-900">
              Una vez que confirmes el envío definitivo, tu entrega pasará a estado{' '}
              <strong>ENVIADA</strong> y <strong>no podrás cambiar nada después de esto</strong>{' '}
              (no podrás agregar ni reemplazar archivos, ni editar tu comentario).
            </p>
          </div>

          <div className="rounded-xl border border-line bg-subtle p-3 text-[11px] text-muted">
            <p className="font-bold text-ink">Resumen del envío:</p>
            <ul className="mt-1 list-inside list-disc space-y-0.5">
              <li>
                Archivos adjuntos incluidos: <strong>{filesCount}</strong>
              </li>
              <li>
                Comentario:{' '}
                <strong>
                  {comment?.trim() ? `"${comment.trim()}"` : 'Sin comentario adicional'}
                </strong>
              </li>
            </ul>
          </div>

          <p className="text-[11px] text-muted">
            Si todavía necesitas revisar o completar tu trabajo más tarde, cancela este envío y usa{' '}
            <strong>&ldquo;Guardar en borrador&rdquo;</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2.5 border-t border-line bg-subtle/60 px-6 py-3.5">
          <button
            className="rounded-xl border border-line bg-card px-4 py-2 text-xs font-bold text-ink hover:bg-subtle disabled:opacity-50"
            disabled={isSubmitting}
            onClick={onCancel}
            type="button"
          >
            Volver al borrador
          </button>
          <button
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-primary/90 disabled:opacity-50"
            disabled={isSubmitting}
            onClick={onConfirm}
            type="button"
          >
            <span className="material-symbols-outlined text-sm">
              send
            </span>
            {isSubmitting
              ? 'Enviando definitivamente...'
              : 'Sí, estoy seguro — Enviar definitivamente'}
          </button>
        </div>
      </div>
    </div>
  )
}
