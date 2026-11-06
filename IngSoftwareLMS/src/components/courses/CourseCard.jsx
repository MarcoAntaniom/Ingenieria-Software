import { useState, useRef, useEffect } from 'react'
import { Badge } from '../ui/Badge'
import { ProgressBar } from '../ui/ProgressBar'

export function CourseCard({
  course,
  onOpenSyllabus,
  onOpenMaterials,
  onOpenInteraction,
  onTogglePin,
  onEnterClassroom,
  onViewRecord,
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  const isCompleted = course.status === 'completed'
  const isPending = course.status === 'pending'
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

  // Estado descriptivo explícito (WCAG: no depender sólo del color)
  const statusInfo = isCompleted
    ? { label: 'Completado', variant: 'success', borderAccent: 'border-l-[#16856a]' }
    : isPending
    ? { label: 'Requiere atención', variant: 'warning', borderAccent: 'border-l-[#b7791f]' }
    : { label: 'En curso', variant: 'primary', borderAccent: 'border-l-[#075477]' }

  // Acción principal unificada (40-44px, primario)
  const isActionCompleted = isCompleted

  return (
    <article
      className={`relative flex flex-col justify-between rounded-[14px] border border-[#dbe3ec] bg-white p-5 shadow-[0_3px_12px_rgba(15,23,42,0.06)] hover:shadow-md transition-all duration-150 border-l-4 ${statusInfo.borderAccent}`}
    >
      <div>
        {/* 1. Fila Superior: Código · Sección, Estado y Menú de Opciones */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-[#075477]">
              {course.code}
              {course.section ? ` · Sec. ${course.section}` : ''}
            </span>

            <Badge size="sm" variant={statusInfo.variant}>
              {statusInfo.label}
            </Badge>

            {course.isPinned && (
              <span
                className="grid size-4.5 place-items-center rounded bg-[#FEF3C7] text-[#92400E]"
                title="Asignatura fijada"
              >
                <span className="material-symbols-outlined text-xs">push_pin</span>
              </span>
            )}
          </div>

          {/* Menú secundario discreto de tres puntos para no sobrecargar la tarjeta */}
          <div className="relative" ref={menuRef}>
            <button
              aria-expanded={menuOpen}
              aria-label={`Opciones de la asignatura ${course.title}`}
              className="grid size-7.5 place-items-center rounded-[8px] text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#172033] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#075477]"
              onClick={() => setMenuOpen((prev) => !prev)}
              type="button"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-lg">
                more_vert
              </span>
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-8 z-30 w-52 rounded-[10px] border border-[#dbe3ec] bg-white p-1 text-xs text-[#172033] shadow-lg animate-in fade-in duration-100">
                <button
                  className="flex w-full items-center gap-2 rounded-[6px] px-2.5 py-1.5 font-medium hover:bg-[#f8fafc] text-left"
                  onClick={() => {
                    onOpenSyllabus?.(course)
                    setMenuOpen(false)
                  }}
                  type="button"
                >
                  <span className="material-symbols-outlined text-base text-[#075477]">
                    menu_book
                  </span>
                  Ver syllabus oficial
                </button>
                <button
                  className="flex w-full items-center gap-2 rounded-[6px] px-2.5 py-1.5 font-medium hover:bg-[#f8fafc] text-left"
                  onClick={() => {
                    onOpenMaterials?.(course)
                    setMenuOpen(false)
                  }}
                  type="button"
                >
                  <span className="material-symbols-outlined text-base text-[#14b8a6]">
                    folder
                  </span>
                  Material didáctico
                </button>
                <button
                  className="flex w-full items-center gap-2 rounded-[6px] px-2.5 py-1.5 font-medium hover:bg-[#f8fafc] text-left"
                  onClick={() => {
                    onOpenInteraction?.(course)
                    setMenuOpen(false)
                  }}
                  type="button"
                >
                  <span className="material-symbols-outlined text-base text-[#64748b]">
                    forum
                  </span>
                  Foros y consultas
                </button>
                <div className="border-t border-[#dbe3ec] my-1" />
                <button
                  className="flex w-full items-center gap-2 rounded-[6px] px-2.5 py-1.5 font-medium hover:bg-[#f8fafc] text-left"
                  onClick={() => {
                    onTogglePin?.(course.id)
                    setMenuOpen(false)
                  }}
                  type="button"
                >
                  <span className="material-symbols-outlined text-base text-[#b7791f]">
                    {course.isPinned ? 'keep_off' : 'push_pin'}
                  </span>
                  {course.isPinned ? 'Desfijar' : 'Fijar al inicio'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 2. Nombre de la Asignatura */}
        <h3
          className="text-base sm:text-[17px] font-bold leading-snug text-[#172033] line-clamp-2"
          title={course.title}
        >
          {course.title}
        </h3>

        {/* 3. Docente o modalidad */}
        <p className="mt-1 text-xs text-[#64748b] truncate">
          {course.teacher} {course.badge ? `· ${course.badge}` : ''}
        </p>

        {/* 4. Progreso del Curso y Porcentaje (85%) */}
        <div className="mt-4">
          <ProgressBar
            label="Progreso del curso"
            showLabel={true}
            value={hasProgress ? course.progress : 0}
          />
        </div>

        {/* 5. Próxima Actividad */}
        <div className="mt-3.5 rounded-[10px] border border-[#dbe3ec] bg-[#f8fafc] p-3 text-xs">
          {isCompleted ? (
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#16856a] flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">verified</span>
                Asignatura Acreditada
              </span>
              <span className="font-extrabold text-[#172033]">Nota: {course.finalGrade || '6.4'}</span>
            </div>
          ) : course.taskTitle ? (
            <div>
              <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                <span className="text-[#075477]">Próxima actividad</span>
                <span className="text-[#c53030]">{course.taskDate}</span>
              </div>
              <p className="font-bold text-[#172033] text-xs truncate">
                {course.taskTitle}
              </p>
            </div>
          ) : (
            <p className="text-[#64748b] text-xs italic flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">done_all</span>
              Sin actividades pendientes para esta semana
            </p>
          )}
        </div>
      </div>

      {/* 6. Botón de Acción Principal (Unificado, 42px alto) */}
      <div className="mt-4 pt-3 border-t border-[#f1f5f9]">
        {isActionCompleted ? (
          <button
            className="flex w-full items-center justify-center gap-2 rounded-[10px] border border-[#dbe3ec] bg-white py-2.5 px-4 text-xs sm:text-sm font-bold text-[#075477] hover:bg-[#f8fafc] hover:border-[#cbd5e1] shadow-xs transition active:scale-[0.98] min-h-[42px]"
            onClick={() => onViewRecord?.(course)}
            type="button"
          >
            <span>Ver expediente</span>
            <span aria-hidden="true" className="material-symbols-outlined text-base">
              history_edu
            </span>
          </button>
        ) : (
          <button
            className="flex w-full items-center justify-center gap-2 rounded-[10px] bg-[#075477] py-2.5 px-4 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-[#064563] transition active:scale-[0.98] min-h-[42px]"
            onClick={() => onEnterClassroom?.(course)}
            type="button"
          >
            <span>Ver clase</span>
            <span aria-hidden="true" className="material-symbols-outlined text-base">
              arrow_forward
            </span>
          </button>
        )}
      </div>
    </article>
  )
}
