import { EmptyState, LoadingState } from '../../../shared/components/ui/StateViews'
import ArchivoAttachmentList from '../../archivos/components/ArchivoAttachmentList'

export default function AnunciosWall({ anuncios, isLoading }) {
  if (isLoading) {
    return <LoadingState label="Cargando muro de anuncios..." />
  }

  if (anuncios.length === 0) {
    return (
      <EmptyState
        icon="campaign"
        title="No hay anuncios publicados"
        description="Los anuncios de tus secciones aparecerán en este listado."
      />
    )
  }

  return (
    <div className="space-y-4">
      {anuncios.map((anuncio) => (
        <article
          className="rounded-xl border border-line bg-card p-5 shadow-xs"
          key={anuncio.id}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="rounded bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
              {anuncio.es_global || !anuncio.seccion
                ? 'Para todos'
                : `Sección #${anuncio.seccion}`}
            </span>
            {anuncio.fijado && (
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
                Destacado
              </span>
            )}
          </div>
          <h3 className="mt-2 text-base font-bold text-ink">{anuncio.titulo}</h3>
          <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-muted">
            {anuncio.contenido}
          </p>

          {anuncio.archivos_adjuntos?.length > 0 && (
            <div className="mt-3">
              <ArchivoAttachmentList files={anuncio.archivos_adjuntos} />
            </div>
          )}

          {anuncio.autor_nombre && (
            <p className="mt-3 text-[11px] text-muted/80">
              Publicado por {anuncio.autor_nombre}
            </p>
          )}
        </article>
      ))}
    </div>
  )
}
