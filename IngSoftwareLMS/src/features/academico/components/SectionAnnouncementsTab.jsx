import { useState } from 'react'
import { EmptyState } from '../../../shared/components/ui/StateViews'
import FileDropzoneUploader from '../../../shared/components/ui/FileDropzoneUploader'
import { formatFileSize } from '../../archivos/api/archivosApi'

export default function SectionAnnouncementsTab({
  announcements,
  canManageSection,
  onCreateAnnouncement,
  isPending,
}) {
  const [titulo, setTitulo] = useState('')
  const [contenido, setContenido] = useState('')
  const [fijado, setFijado] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState([])

  function handleSubmit(event) {
    event.preventDefault()
    onCreateAnnouncement(
      {
        titulo: titulo.trim(),
        contenido: contenido.trim(),
        fijado,
        archivos_ids: uploadedFiles.map((f) => f.id),
      },
      () => {
        setTitulo('')
        setContenido('')
        setFijado(false)
        setUploadedFiles([])
      },
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <div className="space-y-4 lg:col-span-7">
        {announcements.length === 0 ? (
          <EmptyState
            icon="campaign"
            title="Sin anuncios en esta sección"
            description="Los avisos importantes publicados por el equipo docente aparecerán aquí."
          />
        ) : (
          announcements.map((anuncio) => (
            <article
              className="rounded-xl border border-line bg-card p-5 shadow-xs"
              key={anuncio.id}
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-bold text-ink">{anuncio.titulo}</h2>
                {anuncio.fijado && (
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
                    Fijado
                  </span>
                )}
              </div>
              <p className="mt-2 whitespace-pre-line text-xs leading-relaxed text-muted">
                {anuncio.contenido}
              </p>

              {anuncio.archivos_adjuntos?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {anuncio.archivos_adjuntos.map((file) => (
                    <a
                      className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-bold text-primary transition hover:bg-subtle"
                      href={file.url_publica}
                      key={file.id}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <span className="material-symbols-outlined text-base text-secondary">
                        attach_file
                      </span>
                      <span>{file.nombre_original}</span>
                      <span className="text-[10px] font-normal text-muted">
                        ({formatFileSize(file.peso_bytes)})
                      </span>
                    </a>
                  ))}
                </div>
              )}

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted/80">
                {anuncio.autor_nombre && <span>Por {anuncio.autor_nombre}</span>}
                {anuncio.creado_en && (
                  <span>
                    Publicado el {new Date(anuncio.creado_en).toLocaleString('es-CL')}
                  </span>
                )}
              </div>
            </article>
          ))
        )}
      </div>

      {canManageSection && (
        <form
          className="h-max space-y-3 rounded-xl border border-line bg-card p-5 shadow-xs lg:col-span-5"
          onSubmit={handleSubmit}
        >
          <h3 className="text-sm font-extrabold text-ink">
            Publicar anuncio en esta sección
          </h3>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">
              Título
            </label>
            <input
              className="w-full rounded-lg border border-line bg-subtle px-3 py-2 text-xs"
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej. Material de clase o recordatorio de entrega"
              required
              value={titulo}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">
              Contenido
            </label>
            <textarea
              className="w-full rounded-lg border border-line bg-subtle px-3 py-2 text-xs"
              onChange={(e) => setContenido(e.target.value)}
              placeholder="Escribe el detalle del aviso para los estudiantes inscritos..."
              required
              rows={3}
              value={contenido}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">
              Material adjunto (opcional)
            </label>
            <FileDropzoneUploader
              compact
              label="Arrastra y suelta archivos aquí para adjuntarlos al anuncio"
              onChangeUploadedFiles={setUploadedFiles}
              uploadedFiles={uploadedFiles}
            />
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-ink">
            <input
              checked={fijado}
              className="rounded border-line text-primary focus:ring-primary"
              onChange={(e) => setFijado(e.target.checked)}
              type="checkbox"
            />
            Fijar como anuncio destacado
          </label>
          <button
            className="w-full rounded-xl bg-primary py-2.5 text-xs font-bold text-white transition hover:bg-primary-dark disabled:opacity-50"
            disabled={isPending}
            type="submit"
          >
            {isPending ? 'Publicando...' : 'Publicar anuncio'}
          </button>
        </form>
      )}
    </div>
  )
}
