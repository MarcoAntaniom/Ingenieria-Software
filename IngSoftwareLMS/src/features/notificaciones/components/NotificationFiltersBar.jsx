const READ_FILTERS = [
  { id: 'all', label: 'Todas' },
  { id: 'unread', label: 'No leídas' },
  { id: 'read', label: 'Leídas' },
]

export default function NotificationFiltersBar({
  readFilter,
  onSelectReadFilter,
  selectedType,
  onSelectType,
  types,
}) {
  return (
    <div className="flex flex-col justify-between gap-4 rounded-xl border border-line bg-card p-3 shadow-xs sm:flex-row sm:items-center">
      <div className="flex flex-wrap gap-2" role="tablist">
        {READ_FILTERS.map((tab) => (
          <button
            aria-selected={readFilter === tab.id}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
              readFilter === tab.id
                ? 'bg-primary text-white'
                : 'text-muted hover:bg-subtle'
            }`}
            key={tab.id}
            onClick={() => onSelectReadFilter(tab.id)}
            role="tab"
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <label className="text-xs font-semibold text-muted" htmlFor="tipo-select">
          Categoría:
        </label>
        <select
          className="rounded-lg border border-line bg-subtle px-3 py-1.5 text-xs font-semibold text-ink focus:border-primary focus:bg-card focus:ring-0"
          id="tipo-select"
          onChange={(e) => onSelectType(e.target.value)}
          value={selectedType}
        >
          <option value="">Todos los tipos</option>
          {types.map((t) => (
            <option key={t.codigo} value={t.codigo}>
              {t.nombre || t.codigo}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
