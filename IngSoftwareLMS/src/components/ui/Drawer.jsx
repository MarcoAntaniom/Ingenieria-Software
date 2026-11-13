import { useEffect, useRef } from 'react'

export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  position = 'right', // 'right' | 'left'
  width = 'w-full sm:w-[420px] max-w-[440px]',
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
      className="fixed inset-0 z-50 overflow-hidden bg-black/45 backdrop-blur-[2px] animate-in fade-in duration-200"
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
        } z-50 flex ${width} flex-col justify-between bg-white dark:bg-[#1D2F46] [data-theme=contrast]_&:bg-[#0D0D0D] shadow-2xl transition-transform duration-200 border-l border-[#E2E8F0] dark:border-[#2A3A52] [data-theme=contrast]_&:border-white outline-none`}
        ref={drawerRef}
        role="dialog"
        tabIndex={-1}
      >
        {/* Cabecera del Drawer */}
        <div className="flex items-start justify-between border-b border-[#E2E8F0] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6] p-5 sm:p-6 bg-white dark:bg-[#1D2F46] [data-theme=contrast]_&:bg-[#0D0D0D]">
          <div className="min-w-0 pr-4">
            {subtitle && (
              <span className="block text-[11px] font-bold uppercase tracking-wider text-[#0B5575] dark:text-[#67E8F9] [data-theme=contrast]_&:text-[#00B7FF] mb-0.5">
                {subtitle}
              </span>
            )}
            <h2 className="text-lg sm:text-xl font-extrabold text-[#0F172A] dark:text-[#F8FAFC] [data-theme=contrast]_&:text-white tracking-tight truncate">
              {title}
            </h2>
          </div>

          <button
            aria-label="Cerrar panel lateral"
            className="grid size-8 shrink-0 place-items-center rounded-lg text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A] dark:text-[#94A3B8] dark:hover:bg-[#16243A] dark:hover:text-[#F8FAFC] [data-theme=contrast]_&:text-white [data-theme=contrast]_&:hover:bg-[#262626] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B5575] dark:focus-visible:ring-[#67E8F9] [data-theme=contrast]_&:focus-visible:ring-[#FFD400]"
            onClick={onClose}
            type="button"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-xl">
              close
            </span>
          </button>
        </div>

        {/* Cuerpo del Drawer */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 text-xs sm:text-sm text-[#0F172A] dark:text-[#F8FAFC] [data-theme=contrast]_&:text-white">
          {children}
        </div>

        {/* Pie con acciones */}
        {footer && (
          <div className="border-t border-[#E2E8F0] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6] bg-[#F8FAFC] dark:bg-[#16243A] [data-theme=contrast]_&:bg-[#0D0D0D] p-4 sm:p-5">
            {footer}
          </div>
        )}
      </aside>
    </div>
  )
}

export default Drawer
