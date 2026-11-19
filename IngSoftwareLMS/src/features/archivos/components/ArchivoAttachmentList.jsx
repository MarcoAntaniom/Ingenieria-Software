import { useState } from 'react'
import { toast } from 'sonner'
import { downloadArchivo, formatFileSize } from '../api/archivosApi'
import ArchivoPreviewModal from './ArchivoPreviewModal'

export default function ArchivoAttachmentList({
  files = [],
  tone = 'default',
  icon = 'attach_file',
  showView = true,
  showDownload = true,
  onBeforeAccess,
}) {
  const [previewFile, setPreviewFile] = useState(null)
  const [downloadingId, setDownloadingId] = useState(null)

  if (!files || files.length === 0) return null

  const cardClasses =
    tone === 'indigo'
      ? 'border-indigo-300 bg-white text-indigo-950'
      : tone === 'emerald'
        ? 'border-emerald-200 bg-white text-emerald-950'
        : 'border-line bg-surface text-ink'

  const iconColorClass =
    tone === 'indigo'
      ? 'text-indigo-700'
      : tone === 'emerald'
        ? 'text-emerald-700'
        : 'text-secondary'

  function handleView(event, file) {
    event.stopPropagation()
    onBeforeAccess?.(file, 'view')
    setPreviewFile(file)
  }

  async function handleDownload(event, file) {
    event.stopPropagation()
    onBeforeAccess?.(file, 'download')
    setDownloadingId(file.id ?? file.nombre_original)
    try {
      await downloadArchivo(file)
      toast.success(`Descargando "${file.nombre_original}"...`)
    } catch (error) {
      toast.error(error?.message || 'No se pudo descargar el archivo.')
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {files.map((file) => {
          const key = file.id ?? file.nombre_original
          const isThisDownloading = downloadingId === key

          return (
            <div
              className={`inline-flex max-w-full flex-wrap items-center gap-2 rounded-lg border px-3 py-1.5 text-xs shadow-2xs ${cardClasses}`}
              key={key}
            >
              <button
                className="inline-flex min-w-0 items-center gap-1.5 text-left font-bold text-primary hover:underline"
                onClick={(e) =>
                  showView ? handleView(e, file) : handleDownload(e, file)
                }
                title={
                  showView
                    ? `Ver ${file.nombre_original}`
                    : `Descargar ${file.nombre_original}`
                }
                type="button"
              >
                <span
                  aria-hidden="true"
                  className={`material-symbols-outlined shrink-0 text-base ${iconColorClass}`}
                >
                  {icon}
                </span>
                <span className="max-w-[220px] truncate sm:max-w-[280px]">
                  {file.nombre_original}
                </span>
              </button>

              {file.peso_bytes != null && (
                <span className="text-[10px] font-normal text-muted">
                  ({formatFileSize(file.peso_bytes)})
                </span>
              )}

              <div className="ml-0.5 inline-flex items-center gap-1">
                {showView && (
                  <button
                    className="inline-flex items-center gap-0.5 rounded-md border border-line bg-card px-2 py-0.5 text-[11px] font-bold text-ink transition hover:bg-subtle"
                    onClick={(e) => handleView(e, file)}
                    title={`Ver ${file.nombre_original}`}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-xs">
                      visibility
                    </span>
                    Ver
                  </button>
                )}

                {showDownload && (
                  <button
                    className="inline-flex items-center gap-0.5 rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary transition hover:bg-primary hover:text-white disabled:opacity-50"
                    disabled={isThisDownloading}
                    onClick={(e) => handleDownload(e, file)}
                    title={`Descargar ${file.nombre_original}`}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-xs">
                      download
                    </span>
                    {isThisDownloading ? 'Descargando...' : 'Descargar'}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <ArchivoPreviewModal
        archivo={previewFile}
        onClose={() => setPreviewFile(null)}
      />
    </>
  )
}
