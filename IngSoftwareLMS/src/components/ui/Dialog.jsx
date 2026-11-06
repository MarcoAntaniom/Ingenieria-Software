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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
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
        className={`relative w-full ${sizeClasses[size] || sizeClasses.md} rounded-[14px] border border-[#dbe3ec] bg-white p-0 shadow-[0_18px_50px_rgba(15,23,42,0.18)] outline-none overflow-hidden block`}
        open
        ref={dialogRef}
        tabIndex={-1}
      >
        {/* Cabecera estructurada */}
        <div className="flex items-start justify-between border-b border-[#dbe3ec] p-5 sm:p-6 bg-white">
          <div className="min-w-0 pr-6">
            {subtitle && (
              <span className="block text-[11px] font-bold uppercase tracking-wider text-[#075477] mb-1">
                {subtitle}
              </span>
            )}
            <h2
              className="text-lg sm:text-xl font-extrabold text-[#172033] tracking-tight leading-snug"
              id="dialog-title"
            >
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-xs text-[#64748b] leading-relaxed" id="dialog-description">
                {description}
              </p>
            )}
          </div>

          <button
            aria-label="Cerrar ventana modal"
            className="grid size-8 shrink-0 place-items-center rounded-[8px] text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#172033] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#075477]"
            onClick={onClose}
            type="button"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-xl">
              close
            </span>
          </button>
        </div>

        {/* Contenido principal con scroll interno controlado */}
        <div className="max-h-[calc(85vh-140px)] overflow-y-auto p-5 sm:p-6 text-xs text-[#172033]">
          {children}
        </div>

        {/* Acciones finales */}
        {footer && (
          <div className="flex items-center justify-between border-t border-[#dbe3ec] bg-[#f8fafc] px-5 py-4 sm:px-6">
            {footer}
          </div>
        )}
      </dialog>
    </div>
  )
}
