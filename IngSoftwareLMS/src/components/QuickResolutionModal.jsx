import { useState } from 'react'
import { useLanguage } from '../contexts/LanguageContext'

export function QuickResolutionModal({
  isOpen,
  onClose,
  criticalAlerts,
  onResolve,
}) {
  const { t } = useLanguage()
  const [resolvedIds, setResolvedIds] = useState([])
  const [resolvingId, setResolvingId] = useState(null)

  if (!isOpen) return null

  function handleQuickResolve(alertItem) {
    setResolvingId(alertItem.id)
    setTimeout(() => {
      setResolvedIds((prev) => [...prev, alertItem.id])
      setResolvingId(null)
      onResolve?.(alertItem)
    }, 700)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl rounded-2xl border border-line [data-theme=contrast]_&:border-white bg-card p-6 shadow-2xl">
        <button
          aria-label="Cerrar modal"
          className="absolute right-4 top-4 rounded-full p-1.5 text-muted hover:bg-subtle hover:text-ink"
          onClick={onClose}
          type="button"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <div className="border-b border-line pb-3">
          <div className="flex items-center gap-2 text-danger">
            <span className="material-symbols-outlined">assignment_late</span>
            <span className="text-xs font-bold uppercase tracking-wider">
              {t('quick_resolution.badge')}
            </span>
          </div>
          <h3 className="text-xl font-extrabold text-ink mt-0.5">
            {t('quick_resolution.title')}
          </h3>
          <p className="text-xs text-muted mt-0.5">
            {t('quick_resolution.subtitle')}
          </p>
        </div>

        <div className="my-4 space-y-3 max-h-96 overflow-y-auto pr-1">
          {criticalAlerts.map((item) => {
            const isResolved = resolvedIds.includes(item.id)

            return (
              <div
                className={`rounded-xl border p-4 transition ${
                  isResolved
                    ? 'border-emerald-200 bg-emerald-50/70 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40'
                    : 'border-line border-l-4 border-l-[#B42318] dark:border-l-[#FCA5A5] [data-theme=contrast]_&:border-l-[#FF5A67] [data-theme=contrast]_&:border-[#A6A6A6] bg-card'
                }`}
                key={item.id}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                        {item.courseCode}
                      </span>
                      <span className="text-[11px] font-semibold text-muted">
                        {item.courseTitle}
                      </span>
                    </div>
                    <h4 className="font-extrabold text-xs text-ink">{item.title}</h4>
                    <p className="text-[11px] text-danger font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">timer</span>
                      {item.remaining} · Plazo: {item.dueDate}
                    </p>
                    <p className="text-[10px] text-muted">{item.guidelines}</p>
                  </div>

                  <div>
                    {isResolved ? (
                      <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs">
                        <span className="material-symbols-outlined text-sm">check</span>
                        {t('quick_resolution.resolved')}
                      </span>
                    ) : (
                      <button
                        className="flex items-center gap-1.5 rounded-xl bg-primary [data-theme=contrast]_&:bg-white [data-theme=contrast]_&:text-black [data-theme=contrast]_&:hover:bg-[#FFD400] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-primary-dark transition disabled:opacity-70"
                        disabled={resolvingId === item.id}
                        onClick={() => handleQuickResolve(item)}
                        type="button"
                      >
                        <span className="material-symbols-outlined text-sm">upload_file</span>
                        {resolvingId === item.id ? t('quick_resolution.resolving') : t('quick_resolution.resolve_btn')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex justify-end pt-2 border-t border-line">
          <button
            className="rounded-xl bg-subtle px-4 py-2 text-xs font-bold text-ink hover:bg-line transition"
            onClick={onClose}
            type="button"
          >
            {t('calendar.close')}
          </button>
        </div>
      </div>
    </div>
  )
}
