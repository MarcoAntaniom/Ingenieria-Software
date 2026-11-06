export function EmptyState({
  icon = 'search_off',
  title = 'No se encontraron resultados',
  description = 'Prueba ajustando los términos de búsqueda o eliminando los filtros aplicados.',
  actionLabel,
  onAction,
  className = '',
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-[#E2E8F0] bg-white p-10 text-center shadow-xs ${className}`}
      role="status"
    >
      <div className="grid size-14 place-items-center rounded-2xl bg-[#F1F5F9] text-[#64748B] mb-3">
        <span aria-hidden="true" className="material-symbols-outlined text-3xl">
          {icon}
        </span>
      </div>
      <h3 className="text-base font-bold text-[#1F2937]">{title}</h3>
      <p className="mt-1 max-w-sm text-xs sm:text-sm text-[#64748B] leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#0B4F6C] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#083C53] transition active:scale-95"
          onClick={onAction}
          type="button"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
