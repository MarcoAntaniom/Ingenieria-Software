export default function EmptyState({
  icon = 'inbox',
  title,
  description,
  action,
}) {
  return (
    <div
      aria-live="polite"
      className="flex flex-col items-center rounded-xl border border-line bg-card px-6 py-14 text-center"
      role="status"
    >
      <span aria-hidden="true" className="material-symbols-outlined text-5xl text-muted">
        {icon}
      </span>
      <h2 className="mt-3 font-bold text-ink">{title}</h2>
      {description && <p className="mt-1 max-w-lg text-sm text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
