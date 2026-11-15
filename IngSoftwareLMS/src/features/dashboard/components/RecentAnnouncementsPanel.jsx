import { Link } from 'react-router-dom'

export default function RecentAnnouncementsPanel({ isLoading, announcements }) {
  return (
    <div className="rounded-xl border border-line bg-card p-5 shadow-xs">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-extrabold text-ink">Anuncios recientes</h2>
        <Link
          className="text-xs font-bold text-secondary hover:underline"
          to="/comunicacion"
        >
          Ver todos
        </Link>
      </div>

      {isLoading ? (
        <p className="py-6 text-center text-xs text-muted">Cargando anuncios...</p>
      ) : announcements.length === 0 ? (
        <p className="rounded-lg bg-subtle p-4 text-center text-xs text-muted">
          Aún no hay anuncios publicados en tus secciones.
        </p>
      ) : (
        <div className="space-y-3">
          {announcements.map((anuncio) => (
            <div
              className="rounded-lg border border-line bg-surface p-3"
              key={anuncio.id}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                  Sección #{anuncio.seccion}
                </span>
                {anuncio.fijado && (
                  <span className="text-[10px] font-bold text-amber-700">
                    ★ Fijado
                  </span>
                )}
              </div>
              <h3 className="mt-1.5 text-xs font-bold text-ink">
                {anuncio.titulo}
              </h3>
              <p className="mt-1 line-clamp-2 text-xs text-muted">
                {anuncio.contenido}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
