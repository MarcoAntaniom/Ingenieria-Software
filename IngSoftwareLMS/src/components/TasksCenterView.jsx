import { useState } from 'react'
import { useLanguage } from '../contexts/LanguageContext'

export function TasksCenterView({ courses, onTaskSubmitted }) {
  const { t } = useLanguage()
  const [selectedTask, setSelectedTask] = useState(null)
  const [submissionModalOpen, setSubmissionModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submissionFile, setSubmissionFile] = useState(null)
  const [comment, setComment] = useState('')
  const [submissionReceipt, setSubmissionReceipt] = useState(null)
  const [filterState, setFilterState] = useState('pending') // 'pending' | 'urgent' | 'submitted' | 'all'
  const [draftNotice, setDraftNotice] = useState(null)

  // Generamos lista de tareas a partir de los cursos activos
  const tasks = courses
    .filter((c) => c.status !== 'completed' && c.taskTitle)
    .map((c) => ({
      id: `task-${c.id}`,
      courseId: c.id,
      courseCode: c.code,
      courseTitle: c.title,
      teacher: c.teacher,
      title: c.taskTitle,
      dueDate: c.taskDate,
      type: c.taskType || 'Evaluación Sumativa',
      description: c.taskDescription,
      guidelines: c.taskGuidelines,
      urgent: c.taskUrgent,
      status: 'pending', // 'pending' | 'draft' | 'submitted'
      allowLate: true,
      penaltyLate: true,
    }))

  const urgentCount = tasks.filter((t) => t.urgent).length
  const totalCount = tasks.length

  function openSubmission(task) {
    setSelectedTask(task)
    setSubmissionFile(null)
    setComment('')
    setSubmissionReceipt(null)
    setSubmissionModalOpen(true)
  }

  function handleSaveDraft() {
    setDraftNotice(
      `Borrador guardado exitosamente para: "${selectedTask.title}". Puedes modificarlo antes del vencimiento oficial.`,
    )
    setSubmissionModalOpen(false)
    setTimeout(() => setDraftNotice(null), 5000)
  }

  function handleConfirmSubmission(e) {
    e.preventDefault()
    setSubmitting(true)

    setTimeout(() => {
      const receipt = {
        id: `ENT-${Math.floor(100000 + Math.random() * 900000)}`,
        taskTitle: selectedTask.title,
        course: `${selectedTask.courseCode} - ${selectedTask.courseTitle}`,
        fileName: submissionFile ? submissionFile.name : 'informe_entrega_final.zip',
        fileSize: submissionFile ? `${(submissionFile.size / (1024 * 1024)).toFixed(2)} MB` : '3.8 MB',
        timestamp: new Date().toISOString(),
        formattedTime: new Date().toLocaleString('es-CL'),
        status: 'ENVIADO_DEFINITIVO',
        sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      }
      setSubmitting(false)
      setSubmissionReceipt(receipt)
      onTaskSubmitted?.(selectedTask.courseId)
    }, 900)
  }

  return (
    <div className="space-y-6">
      {/* Banner de Confirmación de Borrador */}
      {draftNotice && (
        <div
          className="flex items-center justify-between rounded-2xl border border-[#BAE6FD] bg-[#F0F9FF] p-4 text-xs font-semibold text-[#075477] shadow-xs animate-in fade-in"
          role="status"
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lg text-[#0284C7]">bookmark_added</span>
            <span>{draftNotice}</span>
          </div>
          <button
            aria-label="Cerrar notificación"
            className="rounded-lg p-1 text-[#0369A1] hover:bg-[#E0F2FE]"
            onClick={() => setDraftNotice(null)}
            type="button"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      )}

      {/* Encabezado del Módulo */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-line [data-theme=contrast]_&:border-white bg-card p-6 shadow-xs md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2 text-secondary">
            <span className="material-symbols-outlined">assignment_turned_in</span>
            <span className="text-xs font-bold uppercase tracking-wider">
              {t('tasks.badge')}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <h2 className="text-2xl font-extrabold text-ink">
              {t('tasks.title')}
            </h2>
            <span className="grid size-6 place-items-center rounded-full bg-danger text-xs font-bold text-white shadow-xs">
              {totalCount}
            </span>
          </div>
          <p className="text-xs text-muted mt-0.5">
            {t('tasks.subtitle')}
          </p>
        </div>

        {/* Resumen numérico */}
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-2.5 text-center">
            <span className="block text-xl font-black text-danger">{urgentCount}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-danger">{t('tasks.urgent_kpi')}</span>
          </div>
          <div className="rounded-xl border border-line bg-subtle px-4 py-2.5 text-center">
            <span className="block text-xl font-black text-primary">{totalCount}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted">{t('tasks.total_kpi')}</span>
          </div>
        </div>
      </div>

      {/* Listado de Tareas */}
      <div className="grid grid-cols-1 gap-4">
        {tasks.map((task) => (
          <div
            className={`rounded-2xl border bg-card p-5 shadow-xs transition hover:shadow-md ${
              task.urgent
                ? 'border-line border-l-4 border-l-[#B42318] dark:border-l-[#FCA5A5] [data-theme=contrast]_&:border-l-[#FF5A67] [data-theme=contrast]_&:border-[#A6A6A6]'
                : 'border-line [data-theme=contrast]_&:border-[#A6A6A6]'
            }`}
            key={task.id}
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
                    {task.courseCode} · {task.courseTitle}
                  </span>
                  <span className="rounded-md bg-subtle px-2 py-0.5 text-[10px] font-semibold text-muted">
                    {task.type}
                  </span>
                  {task.urgent && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#B42318] text-white dark:bg-[#46191D] dark:text-[#FCA5A5] [data-theme=contrast]_&:bg-[#FF5A67] [data-theme=contrast]_&:text-black px-2 py-0.5 text-[10px] font-bold animate-pulse">
                      <span className="material-symbols-outlined text-xs">timer</span>
                      {t('tasks.urgent_tag')}
                    </span>
                  )}
                </div>

                <h3 className="text-base font-extrabold text-ink">{task.title}</h3>
                <p className="text-xs text-muted leading-relaxed">{task.description}</p>

                {/* Pautas Técnicas Breves */}
                {task.guidelines && (
                  <div className="rounded-xl border border-line [data-theme=contrast]_&:border-[#A6A6A6] bg-subtle/80 p-3 text-xs text-ink space-y-1">
                    <span className="flex items-center gap-1.5 font-bold text-secondary text-[11px] uppercase tracking-wider">
                      <span className="material-symbols-outlined text-sm">build</span>
                      {t('tasks.guidelines_label')}
                    </span>
                    <p className="text-[11px] text-muted">{task.guidelines}</p>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-4 text-xs pt-1 text-muted">
                  <span className="flex items-center gap-1 font-bold text-primary">
                    <span className="material-symbols-outlined text-sm text-secondary">event</span>
                    {t('tasks.due_prefix')} {task.dueDate}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm text-muted">person</span>
                    {task.teacher}
                  </span>
                  {task.allowLate && (
                    <span className="text-amber-800 text-[11px] font-semibold">
                      {t('tasks.allow_late_notice')}
                    </span>
                  )}
                </div>
              </div>

              {/* Botón de Entrega */}
              <button
                className="flex items-center justify-center gap-2 rounded-xl bg-primary [data-theme=contrast]_&:bg-white [data-theme=contrast]_&:text-black [data-theme=contrast]_&:hover:bg-[#FFD400] px-5 py-3 text-xs font-bold text-white shadow-xs hover:bg-primary-dark transition active:scale-95 shrink-0 self-start sm:self-center"
                onClick={() => openSubmission(task)}
                type="button"
              >
                <span className="material-symbols-outlined text-base">upload_file</span>
                {t('tasks.submit_btn')}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Envío de Actividad Evaluativa */}
      {submissionModalOpen && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl rounded-2xl border border-line [data-theme=contrast]_&:border-white bg-card p-6 shadow-2xl">
            <button
              aria-label="Cerrar modal"
              className="absolute right-4 top-4 rounded-full p-1.5 text-muted hover:bg-subtle hover:text-ink"
              onClick={() => setSubmissionModalOpen(false)}
              type="button"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            {!submissionReceipt ? (
              <form onSubmit={handleConfirmSubmission} className="space-y-4">
                <div className="border-b border-line pb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">
                    {selectedTask.courseCode} · {selectedTask.type}
                  </span>
                  <h3 className="text-lg font-bold text-ink mt-0.5">
                    {selectedTask.title}
                  </h3>
                  <p className="text-xs text-muted mt-1">
                    Plazo límite: <strong>{selectedTask.dueDate}</strong>
                  </p>
                </div>

                {/* Zona de Dropzone para Archivos */}
                <div>
                  <label className="block text-xs font-bold text-ink mb-1.5">
                    {t('tasks.modal_dropzone')}
                  </label>
                  <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-line bg-subtle p-6 cursor-pointer hover:border-secondary hover:bg-secondary/5 transition">
                    <span className="material-symbols-outlined text-4xl text-secondary mb-2">
                      cloud_upload
                    </span>
                    <span className="text-xs font-bold text-ink">
                      {submissionFile ? submissionFile.name : t('tasks.modal_dropzone')}
                    </span>
                    <span className="text-[11px] text-muted mt-1">
                      {submissionFile
                        ? `${(submissionFile.size / (1024 * 1024)).toFixed(2)} MB`
                        : 'Formatos: .pdf, .docx, .zip, .rar, .sql (Max 50MB)'}
                    </span>
                    <input
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setSubmissionFile(e.target.files[0])
                        }
                      }}
                      type="file"
                    />
                  </label>
                </div>

                {/* Comentarios del Estudiante */}
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">
                    {t('tasks.modal_comment_label')}
                  </label>
                  <textarea
                    className="w-full rounded-xl border border-line bg-subtle p-3 text-xs focus:border-primary focus:bg-card focus:ring-0"
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={t('tasks.modal_comment_label')}
                    rows={3}
                    value={comment}
                  />
                </div>

                {/* Botones de Acción */}
                <div className="flex items-center justify-between pt-3 border-t border-line">
                  <button
                    className="flex items-center gap-1.5 rounded-xl border border-line bg-subtle px-4 py-2.5 text-xs font-bold text-ink hover:bg-line transition"
                    onClick={handleSaveDraft}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-base">save</span>
                    {t('tasks.modal_draft_btn')}
                  </button>
                  <div className="flex gap-2">
                    <button
                      className="rounded-xl px-4 py-2.5 text-xs font-semibold text-muted hover:bg-subtle transition"
                      onClick={() => setSubmissionModalOpen(false)}
                      type="button"
                    >
                      {t('calendar.close')}
                    </button>
                    <button
                      className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-primary-dark transition disabled:opacity-70"
                      disabled={submitting}
                      type="submit"
                    >
                      <span className="material-symbols-outlined text-base">check_circle</span>
                      {submitting ? t('tasks.modal_submitting') : t('tasks.modal_confirm_btn')}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              /* Comprobante Oficial con Timestamp */
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-emerald-700">
                  <span className="grid size-10 place-items-center rounded-xl bg-emerald-100">
                    <span className="material-symbols-outlined text-2xl text-emerald-700">task_alt</span>
                  </span>
                  <div>
                    <h3 className="text-lg font-black text-emerald-900">
                      {t('tasks.receipt_title')}
                    </h3>
                    <p className="text-xs text-emerald-800">
                      Tu archivo ha sido sellado con marca de tiempo y almacenado en el repositorio institucional.
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs space-y-2 text-ink font-mono">
                  <div className="flex justify-between border-b border-emerald-200/60 pb-1.5">
                    <span className="text-muted font-sans font-bold">{t('tasks.receipt_code')}</span>
                    <span className="font-bold text-primary">{submissionReceipt.id}</span>
                  </div>
                  <div className="flex justify-between border-b border-emerald-200/60 pb-1.5">
                    <span className="text-muted font-sans font-bold">Actividad:</span>
                    <span className="font-bold">{submissionReceipt.taskTitle}</span>
                  </div>
                  <div className="flex justify-between border-b border-emerald-200/60 pb-1.5">
                    <span className="text-muted font-sans font-bold">Archivo:</span>
                    <span>{submissionReceipt.fileName} ({submissionReceipt.fileSize})</span>
                  </div>
                  <div className="flex justify-between border-b border-emerald-200/60 pb-1.5">
                    <span className="text-muted font-sans font-bold">Timestamp:</span>
                    <span className="font-bold text-emerald-800">{submissionReceipt.formattedTime}</span>
                  </div>
                  <div className="flex flex-col gap-0.5 pt-1">
                    <span className="text-muted font-sans font-bold">{t('tasks.receipt_digital_hash')}</span>
                    <span className="text-[10px] break-all text-muted">{submissionReceipt.sha256}</span>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-primary-dark transition"
                    onClick={() => setSubmissionModalOpen(false)}
                    type="button"
                  >
                    {t('tasks.receipt_close')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
