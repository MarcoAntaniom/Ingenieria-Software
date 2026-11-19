export default function NotificationItemCard({
  item,
  onMarkAsRead,
  isPending,
}) {
  return (
    <article
      className={`flex flex-col justify-between gap-4 p-4 transition sm:flex-row sm:items-center ${
        item.leida ? 'bg-card opacity-80' : 'bg-sky-50/40'
      }`}
    >
      <div className="flex items-start gap-3.5">
        <span
          className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg ${
            item.leida ? 'bg-subtle text-muted' : 'bg-primary text-white'
          }`}
        >
          <span className="material-symbols-outlined text-lg" aria-hidden="true">
            {item.tipo === 'evaluacion'
              ? 'assignment'
              : item.tipo === 'comunicacion'
                ? 'forum'
                : 'notifications'}
          </span>
        </span>
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-bold text-ink">{item.titulo}</h2>
            {item.tipo && (
              <span className="rounded bg-subtle px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-secondary">
                {item.tipo}
              </span>
            )}
            {!item.leida && (
              <span className="rounded-full bg-secondary-container px-2 py-0.5 text-[10px] font-bold text-on-secondary-container">
                Nueva
              </span>
            )}
          </div>
          {item.mensaje && (
            <p className="text-xs leading-relaxed text-muted">{item.mensaje}</p>
          )}
          {item.creada_en && (
            <p className="text-[11px] text-muted/80">
              {new Date(item.creada_en).toLocaleString('es-CL')}
            </p>
          )}
        </div>
      </div>

      {!item.leida && (
        <button
          className="self-end rounded-lg border border-line bg-card px-3 py-1.5 text-xs font-bold text-primary transition hover:bg-subtle sm:self-center"
          disabled={isPending}
          onClick={() => onMarkAsRead(item.id)}
          type="button"
        >
          Marcar leída
        </button>
      )}
    </article>
  )
}
