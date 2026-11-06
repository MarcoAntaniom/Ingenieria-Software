import { useEffect, useRef } from 'react'

export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  position = 'right', // 'right' | 'left'
  width = 'max-w-md',
}) {
  const drawerRef = useRef(null)
  const previousActiveElement = useRef(null)

  useEffect(() => {
    if (open) {
      previousActiveElement.current = document.activeElement
      document.body.style.overflow = 'hidden'

      const timer = setTimeout(() => {
        if (drawerRef.current) {
          drawerRef.current.focus()
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
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="presentation"
    >
      <aside
        aria-label={title}
        aria-modal="true"
        className={`fixed inset-y-0 ${
          position === 'right' ? 'right-0' : 'left-0'
        } z-50 flex w-full ${width} flex-col justify-between bg-white shadow-2xl transition-transform duration-200 border-l border-[#dbe3ec] outline-none`}
        ref={drawerRef}
        role="dialog"
        tabIndex={-1}
      >
        {/* Cabecera del Drawer */}
        <div className="flex items-start justify-between border-b border-[#dbe3ec] p-5 sm:p-6 bg-white">
          <div className="min-w-0 pr-4">
            {subtitle && (
              <span className="block text-[11px] font-bold uppercase tracking-wider text-[#075477] mb-0.5">
                {subtitle}
              </span>
            )}
            <h2 className="text-lg sm:text-xl font-extrabold text-[#172033] tracking-tight truncate">
              {title}
            </h2>
          </div>

          <button
            aria-label="Cerrar panel lateral"
            className="grid size-8 shrink-0 place-items-center rounded-[8px] text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#172033] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#075477]"
            onClick={onClose}
            type="button"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-xl">
              close
            </span>
          </button>
        </div>

        {/* Cuerpo del Drawer */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 text-xs text-[#172033]">
          {children}
        </div>

        {/* Pie con acciones */}
        {footer && (
          <div className="border-t border-[#dbe3ec] bg-[#f8fafc] p-4 sm:p-5">
            {footer}
          </div>
        )}
      </aside>
    </div>
  )
}
