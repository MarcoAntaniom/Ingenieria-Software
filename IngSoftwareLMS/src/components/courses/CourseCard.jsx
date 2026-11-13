import { useState, useRef, useEffect } from 'react'
import { Badge } from '../ui/Badge'
import { ProgressBar } from '../ui/ProgressBar'
import { useLanguage } from '../../contexts/LanguageContext'

export function CourseCard({
  course,
  onOpenSyllabus,
  onOpenMaterials,
  onOpenInteraction,
  onTogglePin,
  onEnterClassroom,
  onViewRecord,
}) {
  const { t } = useLanguage()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  const isCompleted = course.status === 'completed'
  const isPending = course.status === 'pending'
  const hasNoTasks = course.status === 'no_tasks' || (!course.taskTitle && !isCompleted && !isPending)
  const hasProgress = Number.isInteger(course.progress)

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    window.addEventListener('mousedown', handleClickOutside)
    return () => window.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Semántica única de badges y estado
  const statusInfo = isCompleted
    ? {
        label: t('course_card.status_completed'),
        variant: 'success',
      }
    : isPending
    ? {
        label: t('course_card.status_attention'),
        variant: 'warning',
      }
    : hasNoTasks
    ? {
        label: t('course_card.status_no_tasks'),
        variant: 'neutral',
      }
    : {
        label: t('course_card.status_in_progress'),
        variant: 'primary',
      }

  // Comprobar si la fecha de la próxima actividad es crítica/hoy
  const isCriticalDate =
    course.taskDate &&
    (course.taskDate.toLowerCase().includes('hoy') ||
      course.taskDate.toLowerCase().includes('urgente') ||
      course.taskDate.toLowerCase().includes('atrasad') ||
      course.taskDate.includes('23:59'))

  return (
    <article
      className={`relative flex flex-col justify-between rounded-2xl border bg-white dark:bg-[#111B2E] [data-theme=contrast]_&:bg-[#0D0D0D] p-5 shadow-[0_3px_12px_rgba(15,23,42,0.06)] dark:shadow-none hover:shadow-md dark:hover:bg-[#16243A] dark:hover:border-[#5D718B] [data-theme=contrast]_&:hover:bg-[#262626] [data-theme=contrast]_&:hover:border-white transition-all duration-150 ${
        isPending
          ? 'border-[#FCD34D] dark:border-[#FCD34D] [data-theme=contrast]_&:border-[#FFE600]'
          : course.isPinned
          ? 'border-[#0B5575]/40 dark:border-[#5D718B] [data-theme=contrast]_&:border-white [data-theme=contrast]_&:border-2'
          : 'border-[#E2E8F0] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6]'
      }`}
    >
      <div>
        {/* 1. Fila Superior: Código · Sección, Semántica única de badge y Menú */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Código y sección en 11-12px */}
            <span className="font-mono text-[11px] sm:text-xs font-bold text-[#475569] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9]">
              {course.code}
              {course.section ? ` · Sec. ${course.section}` : ''}
            </span>

            <Badge size="sm" variant={statusInfo.variant}>
              {statusInfo.label}
            </Badge>

            {course.isPinned && (
              <span
                className="grid size-5 place-items-center rounded bg-[#FEF3C7] dark:bg-[#422C0A] [data-theme=contrast]_&:bg-black [data-theme=contrast]_&:border [data-theme=contrast]_&:border-[#FFE600] text-[#92400E] dark:text-[#FCD34D] [data-theme=contrast]_&:text-[#FFE600]"
                title="Asignatura fijada"
              >
                <span className="material-symbols-outlined text-xs">push_pin</span>
              </span>
            )}
          </div>

          {/* Menú de 3 puntos funcional con área de clic de 36x36px */}
          <div className="relative" ref={menuRef}>
            <button
              aria-expanded={menuOpen}
              aria-label={t('course_card.options_aria', { title: course.title })}
              className="grid size-9 place-items-center rounded-lg text-[#64748B] dark:text-[#94A3B8] [data-theme=contrast]_&:text-white hover:bg-[#F1F5F9] dark:hover:bg-[#16243A] [data-theme=contrast]_&:hover:bg-[#262626] hover:text-[#0F172A] dark:hover:text-[#F8FAFC] [data-theme=contrast]_&:hover:text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B5575] dark:focus-visible:ring-[#67E8F9] [data-theme=contrast]_&:focus-visible:ring-[#FFD400]"
              onClick={() => setMenuOpen((prev) => !prev)}
              type="button"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-lg">
                more_vert
              </span>
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-10 z-30 w-52 rounded-xl border border-[#CBD5E1] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6] bg-white dark:bg-[#1D2F46] [data-theme=contrast]_&:bg-[#0D0D0D] p-1.5 text-xs text-[#0F172A] dark:text-[#F8FAFC] [data-theme=contrast]_&:text-white shadow-xl animate-in fade-in duration-100">
                <button
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 font-medium hover:bg-[#F8FAFC] dark:hover:bg-[#16243A] [data-theme=contrast]_&:hover:bg-[#262626] text-left transition"
                  onClick={() => {
                    onOpenSyllabus?.(course)
                    setMenuOpen(false)
                  }}
                  type="button"
                >
                  <span className="material-symbols-outlined text-base text-[#0B5575] dark:text-[#67E8F9] [data-theme=contrast]_&:text-[#00B7FF]">
                    menu_book
                  </span>
                  <span>{t('course_card.view_syllabus')}</span>
                </button>

                <button
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 font-medium hover:bg-[#F8FAFC] dark:hover:bg-[#16243A] [data-theme=contrast]_&:hover:bg-[#262626] text-left transition"
                  onClick={() => {
                    onOpenMaterials?.(course)
                    setMenuOpen(false)
                  }}
                  type="button"
                >
                  <span className="material-symbols-outlined text-base text-[#087F78] dark:text-[#5EEAD4] [data-theme=contrast]_&:text-[#00F084]">
                    folder
                  </span>
                  <span>{t('course_card.didactic_material')}</span>
                </button>

                <button
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 font-medium hover:bg-[#F8FAFC] dark:hover:bg-[#16243A] [data-theme=contrast]_&:hover:bg-[#262626] text-left transition"
                  onClick={() => {
                    onOpenInteraction?.(course)
                    setMenuOpen(false)
                  }}
                  type="button"
                >
                  <span className="material-symbols-outlined text-base text-[#64748B] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9]">
                    forum
                  </span>
                  <span>{t('course_card.forums_queries')}</span>
                </button>

                <div className="border-t border-[#E2E8F0] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6] my-1" />

                <button
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 font-medium hover:bg-[#F8FAFC] dark:hover:bg-[#16243A] [data-theme=contrast]_&:hover:bg-[#262626] text-left transition"
                  onClick={() => {
                    onTogglePin?.(course.id)
                    setMenuOpen(false)
                  }}
                  type="button"
                >
                  <span className="material-symbols-outlined text-base text-[#B54708] dark:text-[#FCD34D] [data-theme=contrast]_&:text-[#FFE600]">
                    {course.isPinned ? 'keep_off' : 'push_pin'}
                  </span>
                  <span>
                    {course.isPinned
                      ? t('course_card.unpin_course')
                      : t('course_card.pin_course')}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 2. Nombre de la Asignatura */}
        <h3
          className="text-base sm:text-[17px] font-bold leading-snug text-[#0F172A] dark:text-[#F8FAFC] [data-theme=contrast]_&:text-white line-clamp-2"
          title={course.title}
        >
          {course.title}
        </h3>

        {/* 3. Docente */}
        <p className="mt-1 text-xs text-[#475569] dark:text-[#CBD5E1] [data-theme=contrast]_&:text-[#F2F2F2] truncate">
          {course.teacher}
        </p>

        {/* 4. Barra de Progreso Accesible (Track 6px, cifra textual explícita) */}
        <div className="mt-4">
          <ProgressBar
            label={t('course_card.progress_label')}
            showLabel={true}
            value={hasProgress ? course.progress : 0}
          />
        </div>

        {/* 5. Bloque 'Próxima Actividad' */}
        <div className="mt-3.5 rounded-xl border border-[#E2E8F0] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6] bg-[#F8FAFC] dark:bg-[#16243A] [data-theme=contrast]_&:bg-[#0D0D0D] p-3 text-xs">
          {isCompleted ? (
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#067647] dark:text-[#6EE7B7] [data-theme=contrast]_&:text-[#00F084] flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">verified</span>
                {t('course_card.accredited')}
              </span>
              <span className="font-extrabold text-[#0F172A] dark:text-[#F8FAFC] [data-theme=contrast]_&:text-white tabular-nums">
                {t('course_card.final_grade', { grade: course.finalGrade || '6.4' })}
              </span>
            </div>
          ) : course.taskTitle ? (
            <div>
              <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                <span className="text-[#0B5575] dark:text-[#67E8F9] [data-theme=contrast]_&:text-[#00B7FF]">
                  {t('course_card.next_activity')}
                </span>
                {/* Rojo reservado exclusivamente para vencimientos críticos/hoy */}
                <span
                  className={
                    isCriticalDate
                      ? 'text-[#B42318] dark:text-[#FCA5A5] [data-theme=contrast]_&:text-[#FF5A67] font-extrabold'
                      : 'text-[#475569] dark:text-[#CBD5E1] [data-theme=contrast]_&:text-white'
                  }
                >
                  {course.taskDate}
                </span>
              </div>
              <p className="font-bold text-[#0F172A] dark:text-[#F8FAFC] [data-theme=contrast]_&:text-white text-xs truncate">
                {course.taskTitle}
              </p>
            </div>
          ) : (
            <p className="text-[#64748B] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9] text-xs italic flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">done_all</span>
              {t('course_card.no_pending_this_week')}
            </p>
          )}
        </div>
      </div>

      {/* 6. Botón de Acción Principal (Ancho completo 100%, altura 40px) */}
      <div className="mt-4 pt-3 border-t border-[#F1F5F9] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6]">
        {isCompleted ? (
          <button
            className="btn-secondary flex w-full items-center justify-center gap-2 rounded-lg border border-[#CBD5E1] dark:border-[#2A3A52] [data-theme=contrast]_&:border-white bg-white dark:bg-[#111B2E] [data-theme=contrast]_&:bg-black h-10 min-h-[40px] px-4 text-xs sm:text-sm font-bold text-[#0B5575] dark:text-[#67E8F9] [data-theme=contrast]_&:text-white hover:bg-[#EFF8FB] dark:hover:bg-[#16243A] [data-theme=contrast]_&:hover:bg-[#262626] shadow-xs transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B5575] dark:focus-visible:ring-[#67E8F9] [data-theme=contrast]_&:focus-visible:ring-[#FFD400]"
            onClick={() => onViewRecord?.(course)}
            type="button"
          >
            <span>{t('course_card.view_record')}</span>
            <span aria-hidden="true" className="material-symbols-outlined text-base">
              history_edu
            </span>
          </button>
        ) : (
          <button
            className="btn-primary flex w-full items-center justify-center gap-2 rounded-lg bg-[#0B5575] hover:bg-[#074968] dark:bg-[#0E7490] dark:hover:bg-[#155E75] dark:active:bg-[#164E63] [data-theme=contrast]_&:bg-white [data-theme=contrast]_&:text-black [data-theme=contrast]_&:hover:bg-[#FFD400] [data-theme=contrast]_&:hover:text-black h-10 min-h-[40px] px-4 text-xs sm:text-sm font-bold text-white shadow-xs transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B5575] dark:focus-visible:ring-[#67E8F9] [data-theme=contrast]_&:focus-visible:ring-[#FFD400]"
            onClick={() => onEnterClassroom?.(course)}
            type="button"
          >
            <span>{t('course_card.enter_class')}</span>
            <span aria-hidden="true" className="material-symbols-outlined text-base">
              arrow_forward
            </span>
          </button>
        )}
      </div>
    </article>
  )
}

export default CourseCard
