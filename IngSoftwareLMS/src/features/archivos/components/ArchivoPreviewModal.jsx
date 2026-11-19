import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  downloadArchivo,
  extractBlobErrorMessage,
  fetchArchivoBlob,
  formatFileSize,
  getFileExtension,
  getFilePreviewType,
} from '../api/archivosApi'

function ArchivoPreviewDialog({ archivo, onClose }) {
  const previewType = getFilePreviewType(archivo)
  const extension = getFileExtension(archivo)

  const [previewState, setPreviewState] = useState(() => ({
    status: previewType === 'unsupported' ? 'unsupported' : 'loading',
    blobUrl: null,
    textContent: '',
    errorMessage: '',
  }))
  const [isDownloading, setIsDownloading] = useState(false)
  const [reloadNonce, setReloadNonce] = useState(0)

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose?.()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  useEffect(() => {
    if (previewType === 'unsupported') return undefined

    let cancelled = false
    let createdObjectUrl = null

    async function loadPreview() {
      try {
        if (archivo.id) {
          const { blob } = await fetchArchivoBlob(archivo.id, {
            download: false,
          })
          if (cancelled) return

          const text = previewType === 'text' ? await blob.text() : ''
          if (cancelled) return

          createdObjectUrl = URL.createObjectURL(blob)
          setPreviewState({
            status: 'ready',
            blobUrl: createdObjectUrl,
            textContent: text,
            errorMessage: '',
          })
        } else if (archivo.url_publica) {
          setPreviewState({
            status: 'ready',
            blobUrl: archivo.url_publica,
            textContent: '',
            errorMessage: '',
          })
        } else {
          setPreviewState({
            status: 'error',
            blobUrl: null,
            textContent: '',
            errorMessage:
              'El archivo no tiene contenido disponible para previsualizar.',
          })
        }
      } catch (error) {
        if (cancelled) return
        const msg = await extractBlobErrorMessage(
          error,
          'No se pudo cargar la vista previa del archivo.',
        )
        setPreviewState({
          status: 'error',
          blobUrl: null,
          textContent: '',
          errorMessage: msg,
        })
      }
    }

    loadPreview()

    return () => {
      cancelled = true
      if (createdObjectUrl) {
        URL.revokeObjectURL(createdObjectUrl)
      }
    }
  }, [archivo.id, archivo.url_publica, previewType, reloadNonce])

  async function handleDownload() {
    setIsDownloading(true)
    try {
      await downloadArchivo(archivo)
      toast.success(`Descargando "${archivo.nombre_original}"...`)
    } catch (error) {
      toast.error(error?.message || 'No se pudo descargar el archivo.')
    } finally {
      setIsDownloading(false)
    }
  }

  function handleRetry() {
    setPreviewState({
      status: 'loading',
      blobUrl: null,
      textContent: '',
      errorMessage: '',
    })
    setReloadNonce((n) => n + 1)
  }

  function handleOpenNewTab() {
    const targetUrl = previewState.blobUrl || archivo.url_publica
    if (!targetUrl) {
      toast.error('No hay una URL disponible para abrir este archivo.')
      return
    }
    window.open(targetUrl, '_blank', 'noopener,noreferrer')
  }

  const isLoading = previewState.status === 'loading'
  const errorMessage =
    previewState.status === 'error' ? previewState.errorMessage : ''
  const blobUrl = previewState.blobUrl
  const textContent = previewState.textContent

  return (
    <div
      aria-labelledby="archivo-preview-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.()
      }}
      role="dialog"
    >
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-line bg-card shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-subtle/60 px-5 py-3.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              aria-hidden="true"
              className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"
            >
              <span className="material-symbols-outlined text-xl">
                {previewType === 'pdf'
                  ? 'picture_as_pdf'
                  : previewType === 'image'
                    ? 'image'
                    : previewType === 'text'
                      ? 'article'
                      : 'description'}
              </span>
            </span>
            <div className="min-w-0">
              <h2
                className="truncate text-sm font-extrabold text-ink"
                id="archivo-preview-title"
              >
                {archivo.nombre_original}
              </h2>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted">
                {extension && (
                  <span className="rounded border border-line bg-card px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase text-secondary">
                    .{extension}
                  </span>
                )}
                {archivo.peso_bytes != null && (
                  <span>{formatFileSize(archivo.peso_bytes)}</span>
                )}
                {archivo.subido_por_nombre && (
                  <span>· Subido por {archivo.subido_por_nombre}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {previewType !== 'unsupported' && blobUrl && (
              <button
                className="inline-flex items-center gap-1 rounded-lg border border-line bg-card px-3 py-1.5 text-xs font-bold text-ink transition hover:bg-subtle"
                onClick={handleOpenNewTab}
                type="button"
              >
                <span className="material-symbols-outlined text-sm">
                  open_in_new
                </span>
                Abrir en pestaña
              </button>
            )}

            <button
              className="inline-flex items-center gap-1 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-primary/90 disabled:opacity-50"
              disabled={isDownloading}
              onClick={handleDownload}
              type="button"
            >
              <span className="material-symbols-outlined text-sm">
                download
              </span>
              {isDownloading ? 'Descargando...' : 'Descargar'}
            </button>

            <button
              aria-label="Cerrar vista previa"
              className="rounded-lg border border-line bg-card p-1.5 text-muted transition hover:bg-subtle hover:text-ink"
              onClick={onClose}
              type="button"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-surface p-4">
          {isLoading ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center gap-3 text-xs font-semibold text-muted">
              <span className="size-7 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
              Cargando vista previa del archivo...
            </div>
          ) : errorMessage ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 rounded-xl border border-rose-200 bg-rose-50/70 p-6 text-center">
              <span className="material-symbols-outlined text-4xl text-danger">
                error_outline
              </span>
              <p className="text-sm font-bold text-ink">
                No se pudo mostrar la vista previa
              </p>
              <p className="max-w-md text-xs text-muted">{errorMessage}</p>
              <div className="mt-1 flex flex-wrap gap-2">
                <button
                  className="inline-flex items-center gap-1 rounded-lg border border-line bg-card px-3 py-1.5 text-xs font-bold text-ink hover:bg-subtle"
                  onClick={handleRetry}
                  type="button"
                >
                  <span className="material-symbols-outlined text-sm">
                    refresh
                  </span>
                  Reintentar
                </button>
                <button
                  className="inline-flex items-center gap-1 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-bold text-white hover:bg-primary/90 disabled:opacity-50"
                  disabled={isDownloading}
                  onClick={handleDownload}
                  type="button"
                >
                  <span className="material-symbols-outlined text-sm">
                    download
                  </span>
                  Descargar archivo
                </button>
              </div>
            </div>
          ) : previewType === 'pdf' && blobUrl ? (
            <iframe
              className="h-[72vh] w-full rounded-xl border border-line bg-white"
              src={blobUrl}
              title={`Vista previa de ${archivo.nombre_original}`}
            />
          ) : previewType === 'image' && blobUrl ? (
            <div className="flex min-h-[360px] items-center justify-center rounded-xl border border-line bg-card p-4">
              <img
                alt={archivo.nombre_original}
                className="max-h-[70vh] max-w-full rounded-lg object-contain shadow-xs"
                src={blobUrl}
              />
            </div>
          ) : previewType === 'text' ? (
            <pre className="max-h-[70vh] overflow-auto whitespace-pre-wrap break-words rounded-xl border border-line bg-card p-4 font-mono text-xs leading-relaxed text-ink">
              {textContent || '(Archivo sin contenido de texto)'}
            </pre>
          ) : (
            <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 rounded-xl border border-line bg-card p-8 text-center">
              <span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
                <span className="material-symbols-outlined text-3xl">
                  description
                </span>
              </span>
              <h3 className="text-sm font-extrabold text-ink">
                Vista previa no disponible para archivos{' '}
                {extension ? `.${extension.toUpperCase()}` : 'de este formato'}
              </h3>
              <p className="max-w-md text-xs text-muted">
                Los documentos comprimidos o de ofimática (DOCX, XLSX, PPTX, ZIP, RAR) deben descargarse para abrirlos en tu equipo.
              </p>
              <button
                className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white transition hover:bg-primary/90 disabled:opacity-50"
                disabled={isDownloading}
                onClick={handleDownload}
                type="button"
              >
                <span className="material-symbols-outlined text-base">
                  download
                </span>
                {isDownloading
                  ? 'Descargando...'
                  : `Descargar ${archivo.nombre_original}`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ArchivoPreviewModal({ archivo, onClose }) {
  if (!archivo) return null
  return (
    <ArchivoPreviewDialog
      archivo={archivo}
      key={archivo.id ?? archivo.nombre_original}
      onClose={onClose}
    />
  )
}
