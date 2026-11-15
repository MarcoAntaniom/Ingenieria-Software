const TABS = [
  { id: 'all', label: 'Todas las secciones' },
  { id: 'progress', label: 'En curso' },
  { id: 'completed', label: 'Finalizadas' },
]

export default function DashboardFilterBar({
  tab,
  onSelectTab,
  query,
  onChangeQuery,
  ascending,
  onToggleAscending,
}) {
  return (
    <div className="flex flex-col justify-between gap-4 rounded-xl border border-line bg-card p-3 shadow-xs lg:flex-row lg:items-center">
      <div
        aria-label="Filtrar secciones"
        className="flex gap-2 overflow-x-auto"
        role="tablist"
      >
        {TABS.map((item) => (
          <button
            aria-selected={tab === item.id}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-xs transition ${
              tab === item.id
                ? 'bg-primary font-bold text-white'
                : 'font-semibold text-muted hover:bg-subtle'
            }`}
            key={item.id}
            onClick={() => onSelectTab(item.id)}
            role="tab"
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2.5 lg:min-w-[320px]">
        <label className="sr-only" htmlFor="dashboard-course-search">
          Buscar asignatura
        </label>
        <div className="relative w-full">
          <span
            className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            aria-hidden="true"
          >
            search
          </span>
          <input
            className="w-full rounded-lg border-transparent bg-subtle py-2 pl-10 pr-4 text-xs focus:border-primary/30 focus:bg-card focus:ring-0"
            id="dashboard-course-search"
            onChange={(event) => onChangeQuery(event.target.value)}
            placeholder="Buscar por asignatura, código o carrera..."
            type="search"
            value={query}
          />
        </div>
        <button
          aria-label={`Ordenar por nombre (${ascending ? 'A-Z' : 'Z-A'})`}
          className="shrink-0 rounded-lg border border-line bg-subtle p-2 hover:bg-line/60"
          onClick={onToggleAscending}
          type="button"
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            {ascending ? 'arrow_upward' : 'arrow_downward'}
          </span>
        </button>
      </div>
    </div>
  )
}
