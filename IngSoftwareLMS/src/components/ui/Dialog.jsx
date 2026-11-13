import { useEffect, useRef } from 'react'

export function Dialog({
  open,
  onClose,
  title,
  subtitle,
  description,
  children,
  footer,
  size = 'md', // 'sm' | 'md' | 'lg' | 'xl'
  initialFocusRef,
}) {
  const dialogRef = useRef(null)
  const previousActiveElement = useRef(null)

  // Manejo de foco, tecla Escape y bloqueo de scroll
  useEffect(() => {
    if (open) {
      previousActiveElement.current = document.activeElement
      document.body.style.overflow = 'hidden'

      const timer = setTimeout(() => {
        if (initialFocusRef?.current) {
          initialFocusRef.current.focus()
        } else if (dialogRef.current) {
          dialogRef.current.focus()
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
  }, [open, onClose, initialFocusRef])

  if (!open) return null

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[2px] animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
      role="presentation"
    >
      <dialog
        aria-describedby={description || subtitle ? 'dialog-description' : undefined}
        aria-labelledby="dialog-title"
        aria-modal="true"
        className={`relative w-full ${sizeClasses[size] || sizeClasses.md} rounded-2xl border border-[#E2E8F0] dark:border-[#2A3A52] [data-theme=contrast]_&:border-white bg-white dark:bg-[#1D2F46] [data-theme=contrast]_&:bg-[#0D0D0D] p-0 shadow-2xl outline-none overflow-hidden block`}
        open
        ref={dialogRef}
        tabIndex={-1}
      >
        {/* Cabecera estructurada */}
        <div className="flex items-start justify-between border-b border-[#E2E8F0] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6] p-5 sm:p-6 bg-white dark:bg-[#1D2F46] [data-theme=contrast]_&:bg-[#0D0D0D]">
          <div className="min-w-0 pr-6">
            {subtitle && (
              <span className="block text-[11px] font-bold uppercase tracking-wider text-[#0B5575] dark:text-[#67E8F9] [data-theme=contrast]_&:text-[#00B7FF] mb-1">
                {subtitle}
              </span>
            )}
            <h2
              className="text-lg sm:text-xl font-extrabold text-[#0F172A] dark:text-[#F8FAFC] [data-theme=contrast]_&:text-white tracking-tight leading-snug"
              id="dialog-title"
            >
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-xs text-[#475569] dark:text-[#CBD5E1] [data-theme=contrast]_&:text-[#F2F2F2] leading-relaxed" id="dialog-description">
                {description}
              </p>
            )}
          </div>

          <button
            aria-label="Cerrar modal"
            className="grid size-8 shrink-0 place-items-center rounded-lg text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A] dark:text-[#94A3B8] dark:hover:bg-[#16243A] dark:hover:text-[#F8FAFC] [data-theme=contrast]_&:text-white [data-theme=contrast]_&:hover:bg-[#262626] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B5575] dark:focus-visible:ring-[#67E8F9] [data-theme=contrast]_&:focus-visible:ring-[#FFD400]"
            onClick={onClose}
            type="button"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-xl">
              close
            </span>
          </button>
        </div>

        {/* Cuerpo del contenido */}
        <div className="p-5 sm:p-6 text-xs sm:text-sm text-[#0F172A] dark:text-[#F8FAFC] [data-theme=contrast]_&:text-white">
          {children}
        </div>

        {/* Pie opcional para acciones de cierre/confirmación */}
        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[#E2E8F0] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6] bg-[#F8FAFC] dark:bg-[#16243A] [data-theme=contrast]_&:bg-[#0D0D0D] p-4 sm:p-5">
            {footer}
          </div>
        )}
      </dialog>
    </div>
  )
}

export default Dialog
