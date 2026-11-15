export function PageHeader({ eyebrow, title, description, badge, actions }) {
  return (
    <div className="flex flex-col justify-between gap-4 border-b border-line bg-card px-6 py-6 lg:flex-row lg:items-center lg:px-10">
      <div className="space-y-1">
        {eyebrow && (
          <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
            {eyebrow}
          </span>
        )}
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
            {title}
          </h1>
          {badge && (
            <span className="rounded-full bg-secondary-container/60 px-2.5 py-0.5 text-xs font-bold text-on-secondary-container">
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="max-w-2xl text-xs text-muted sm:text-sm">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
    </div>
  )
}

export function LoadingState({ label = 'Cargando información...' }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 rounded-xl border border-line bg-card px-6 py-14 text-center"
      role="status"
    >
      <span className="size-6 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
      <p className="text-xs font-semibold text-muted">{label}</p>
    </div>
  )
}

export function ErrorState({ message = 'No se pudo cargar la información.', onRetry }) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-xl border border-rose-200 bg-rose-50/80 p-6 text-center"
      role="alert"
    >
      <span className="material-symbols-outlined text-3xl text-danger" aria-hidden="true">
        error
      </span>
      <p className="mt-2 text-sm font-semibold text-rose-900">{message}</p>
      {onRetry && (
        <button
          className="mt-4 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white transition hover:bg-primary-dark"
          onClick={onRetry}
          type="button"
        >
          Reintentar
        </button>
      )}
    </div>
  )
}

export function EmptyState({ icon = 'inbox', title, description, action }) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-card px-6 py-14 text-center"
      role="status"
    >
      <span className="material-symbols-outlined text-4xl text-muted/70" aria-hidden="true">
        {icon}
      </span>
      <h2 className="mt-2 text-sm font-bold text-ink">{title}</h2>
      {description && (
        <p className="mt-1 max-w-md text-xs text-muted">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function Modal({ open, onClose, title, children }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-line bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between border-b border-line pb-3">
          <h2 className="text-base font-bold text-ink">{title}</h2>
          <button
            aria-label="Cerrar ventana"
            className="rounded-lg p-1 text-muted hover:bg-subtle hover:text-ink"
            onClick={onClose}
            type="button"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
