import { useEffect, useRef } from 'react'
import { useLanguage } from '../contexts/LanguageContext'

export function ClassroomModal({
  course,
  isOpen,
  onClose,
  onOpenMaterials,
  onOpenInteraction,
}) {
  const { t } = useLanguage()
  const modalRef = useRef(null)
  const previousActiveElement = useRef(null)

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement
      document.body.style.overflow = 'hidden'

      const timer = setTimeout(() => {
        if (modalRef.current) {
          modalRef.current.focus()
        }
      }, 50)

      function handleKeyDown(e) {
        if (e.key === 'Escape') {
          e.preventDefault()
          onClose()
        }
      }

      window.addEventListener('keydown', handleKeyDown)

      return () => {
        clearTimeout(timer)
        document.body.style.overflow = ''
        window.removeEventListener('keydown', handleKeyDown)
        if (previousActiveElement.current?.focus) {
          previousActiveElement.current.focus()
        }
      }
    }
  }, [isOpen, onClose])

  if (!isOpen || !course) return null

  return (
    <div
      aria-labelledby="classroom-modal-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px] animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
    >
      <div
        className="relative w-full max-w-[600px] rounded-2xl border border-[#E2E8F0] dark:border-[#2A3A52] [data-theme=contrast]_&:border-white bg-white dark:bg-[#1D2F46] [data-theme=contrast]_&:bg-[#0D0D0D] p-6 shadow-2xl outline-none"
        ref={modalRef}
        style={{ width: 'min(100% - 32px, 600px)' }}
        tabIndex={-1}
      >
        {/* Botón de Cierre */}
        <button
          aria-label={t('classroom_modal.close')}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A] dark:text-[#94A3B8] dark:hover:bg-[#223047] dark:hover:text-white [data-theme=contrast]_&:text-white [data-theme=contrast]_&:hover:bg-[#262626] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B5575] dark:focus-visible:ring-[#67E8F9] [data-theme=contrast]_&:focus-visible:ring-[#FFD400]"
          onClick={onClose}
          type="button"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-xl">
            close
          </span>
        </button>

        {/* Cabecera del Curso */}
        <div className="border-b border-[#E2E8F0] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6] pb-3 pr-8">
          <span className="font-mono text-xs font-bold text-[#0B5575] dark:text-[#67E8F9] [data-theme=contrast]_&:text-[#00B7FF]">
            {course.code} · Sec. {course.section || 1}
          </span>
          <h2
            className="text-lg sm:text-xl font-extrabold text-[#0F172A] dark:text-[#F8FAFC] [data-theme=contrast]_&:text-white mt-0.5 tracking-tight"
            id="classroom-modal-title"
          >
            {course.title}
          </h2>
          <p className="text-xs text-[#475569] dark:text-[#CBD5E1] [data-theme=contrast]_&:text-[#F2F2F2] mt-0.5">
            {course.teacher} · {t('header.semester')}
          </p>
        </div>

        <div className="my-4 space-y-3">
          {/* Bloque Prioritario: Sesión sincrónica activa */}
          <div className="rounded-xl border border-[#BAE6FD] dark:border-[#155E75] [data-theme=contrast]_&:border-[#00B7FF] [data-theme=contrast]_&:border-2 bg-[#EFF8FB] dark:bg-[#102F46] [data-theme=contrast]_&:bg-black p-4 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#0B5575] dark:text-[#7DD3FC] [data-theme=contrast]_&:text-[#00B7FF] flex items-center gap-1.5 text-xs sm:text-sm">
                <span aria-hidden="true" className="material-symbols-outlined text-lg">
                  videocam
                </span>
                {t('classroom_modal.live_session')}
              </span>
              <span className="rounded-full bg-[#067647] dark:bg-[#123B30] dark:text-[#6EE7B7] dark:border dark:border-[#0F766E] [data-theme=contrast]_&:bg-black [data-theme=contrast]_&:text-[#00F084] [data-theme=contrast]_&:border-2 [data-theme=contrast]_&:border-[#00F084] px-2.5 py-0.5 text-[10px] font-bold text-white shadow-xs">
                {t('classroom_modal.online_badge')}
              </span>
            </div>
            <p className="text-[11px] text-[#074968] dark:text-[#CBD5E1] [data-theme=contrast]_&:text-[#F2F2F2] mt-1 leading-relaxed">
              {t('classroom_modal.live_desc')}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2.5">
              <button
                className="btn-primary inline-flex items-center gap-2 rounded-lg bg-[#0B5575] hover:bg-[#074968] dark:bg-[#0E7490] dark:hover:bg-[#155E75] px-4 py-2 text-xs font-bold text-white shadow-xs transition active:scale-98 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B5575] dark:focus-visible:ring-[#67E8F9] [data-theme=contrast]_&:focus-visible:ring-[#FFD400]"
                onClick={() => {
                  window.open('https://meet.google.com', '_blank', 'noopener,noreferrer')
                }}
                type="button"
              >
                <span aria-hidden="true" className="material-symbols-outlined text-base">
                  meeting_room
                </span>
                {t('classroom_modal.connected_button')}
              </button>
              <span className="text-[11px] font-medium text-[#475569] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9]">
                {t('classroom_modal.verified_access')}
              </span>
            </div>
          </div>

          {/* Tarjetas Secundarias: Clickeables completas, altura 72px */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              className="flex items-center gap-3 rounded-xl border border-[#E2E8F0] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6] bg-[#F8FAFC] dark:bg-[#16243A] [data-theme=contrast]_&:bg-[#0D0D0D] hover:bg-[#F1F5F9] dark:hover:bg-[#1D2F46] [data-theme=contrast]_&:hover:bg-[#262626] p-3.5 h-[72px] text-left transition shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B5575] dark:focus-visible:ring-[#67E8F9] [data-theme=contrast]_&:focus-visible:ring-[#FFD400]"
              onClick={() => {
                onOpenMaterials?.(course)
                onClose()
              }}
              type="button"
            >
              <span className="grid size-10 place-items-center rounded-lg bg-[#EFF8FB] dark:bg-[#123B49] text-[#0B5575] dark:text-[#67E8F9] [data-theme=contrast]_&:bg-black [data-theme=contrast]_&:border [data-theme=contrast]_&:border-[#00B7FF] [data-theme=contrast]_&:text-[#00B7FF] shrink-0">
                <span aria-hidden="true" className="material-symbols-outlined text-xl">
                  folder
                </span>
              </span>
              <div className="min-w-0">
                <p className="font-bold text-[#0F172A] dark:text-[#F8FAFC] [data-theme=contrast]_&:text-white text-xs truncate">
                  {t('classroom_modal.didactic_title')}
                </p>
                <p className="text-[11px] text-[#475569] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9] truncate">
                  {t('classroom_modal.didactic_subtitle')}
                </p>
              </div>
            </button>

            <button
              className="flex items-center gap-3 rounded-xl border border-[#E2E8F0] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6] bg-[#F8FAFC] dark:bg-[#16243A] [data-theme=contrast]_&:bg-[#0D0D0D] hover:bg-[#F1F5F9] dark:hover:bg-[#1D2F46] [data-theme=contrast]_&:hover:bg-[#262626] p-3.5 h-[72px] text-left transition shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B5575] dark:focus-visible:ring-[#67E8F9] [data-theme=contrast]_&:focus-visible:ring-[#FFD400]"
              onClick={() => {
                onOpenInteraction?.(course)
                onClose()
              }}
              type="button"
            >
              <span className="grid size-10 place-items-center rounded-lg bg-[#ECFDF3] dark:bg-[#123B30] text-[#067647] dark:text-[#6EE7B7] [data-theme=contrast]_&:bg-black [data-theme=contrast]_&:border [data-theme=contrast]_&:border-[#00F084] [data-theme=contrast]_&:text-[#00F084] shrink-0">
                <span aria-hidden="true" className="material-symbols-outlined text-xl">
                  forum
                </span>
              </span>
              <div className="min-w-0">
                <p className="font-bold text-[#0F172A] dark:text-[#F8FAFC] [data-theme=contrast]_&:text-white text-xs truncate">
                  {t('classroom_modal.forum_title')}
                </p>
                <p className="text-[11px] text-[#475569] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9] truncate">
                  {t('classroom_modal.forum_subtitle')}
                </p>
              </div>
            </button>
          </div>

          {/* Progreso en la Asignatura */}
          <div className="rounded-xl border border-[#E2E8F0] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6] bg-[#F8FAFC] dark:bg-[#16243A] [data-theme=contrast]_&:bg-[#0D0D0D] p-3.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#0F172A] dark:text-[#F8FAFC] [data-theme=contrast]_&:text-white">
                {t('classroom_modal.course_progress')}
              </span>
              <span className="font-mono font-bold tabular-nums text-[#0B5575] dark:text-[#67E8F9] [data-theme=contrast]_&:text-[#00B7FF]">
                {course.progress || 0}%
              </span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#E2E8F0] dark:bg-[#2A3A52] [data-theme=contrast]_&:bg-black [data-theme=contrast]_&:border [data-theme=contrast]_&:border-[#A6A6A6]">
              <div
                className="h-full bg-[#0B5575] dark:bg-[#2DD4BF] [data-theme=contrast]_&:bg-[#00F084] transition-all duration-300"
                style={{ width: `${course.progress || 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Pie con botón de cierre */}
        <div className="flex justify-end gap-2 border-t border-[#E2E8F0] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6] pt-3">
          <button
            className="btn-secondary rounded-lg border border-[#CBD5E1] dark:border-[#2A3A52] [data-theme=contrast]_&:border-white bg-white dark:bg-[#16243A] [data-theme=contrast]_&:bg-black px-4 py-2 text-xs font-bold text-[#475569] dark:text-[#CBD5E1] [data-theme=contrast]_&:text-white hover:bg-[#F8FAFC] dark:hover:bg-[#1D2F46] [data-theme=contrast]_&:hover:bg-[#262626] transition"
            onClick={onClose}
            type="button"
          >
            {t('classroom_modal.close')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ClassroomModal
