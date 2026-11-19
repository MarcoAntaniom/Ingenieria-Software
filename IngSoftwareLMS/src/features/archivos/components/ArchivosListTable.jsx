import { useState } from 'react'
import { toast } from 'sonner'
import {
  EmptyState,
  LoadingState,
} from '../../../shared/components/ui/StateViews'
import { downloadArchivo, formatFileSize } from '../api/archivosApi'
import ArchivoPreviewModal from './ArchivoPreviewModal'

export default function ArchivosListTable({
  archivos,
  isLoading,
  onDelete,
  isDeleting,
  canDelete = false,
  emptyTitle = 'Aún no hay archivos en este listado',
  emptyDescription = 'Los documentos y materiales publicados aparecerán aquí.',
}) {
  const [previewFile, setPreviewFile] = useState(null)
  const [downloadingId, setDownloadingId] = useState(null)

  async function handleDownload(archivo) {
    setDownloadingId(archivo.id)
    try {
      await downloadArchivo(archivo)
      toast.success(`Descargando "${archivo.nombre_original}"...`)
    } catch (error) {
      toast.error(error?.message || 'No se pudo descargar el archivo.')
    } finally {
      setDownloadingId(null)
    }
  }

  if (isLoading) {
    return <LoadingState label="Cargando repositorio de archivos..." />
  }

  if (archivos.length === 0) {
    return (
      <EmptyState
        icon="folder_off"
        title={emptyTitle}
        description={emptyDescription}
      />
    )
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-line bg-card shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-line bg-subtle text-[11px] font-bold uppercase text-muted">
            <tr>
              <th className="px-4 py-3">Archivo</th>
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3">Formato</th>
              <th className="px-4 py-3">Tamaño</th>
              <th className="px-4 py-3">Subido por</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {archivos.map((archivo) => {
              const isThisDownloading = downloadingId === archivo.id
              return (
                <tr className="hover:bg-subtle/40" key={archivo.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="material-symbols-outlined text-lg text-primary"
                        aria-hidden="true"
                      >
                        {archivo.es_material ? 'menu_book' : 'description'}
                      </span>
                      <button
                        className="text-left font-bold text-primary hover:underline"
                        onClick={() => setPreviewFile(archivo)}
                        type="button"
                      >
                        {archivo.nombre_original}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {archivo.es_material ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                        Material de Estudio
                        {archivo.seccion_id ? ` · Sec #${archivo.seccion_id}` : ''}
                      </span>
                    ) : (
                      <span className="rounded-full bg-subtle px-2 py-0.5 text-[10px] font-bold text-muted">
                        Archivo / Entrega
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-subtle px-2 py-0.5 text-[10px] font-bold uppercase text-secondary">
                      .{archivo.tipo_archivo?.extension || 'file'}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-muted">
                    {formatFileSize(archivo.peso_bytes)}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {archivo.subido_por_nombre || `Usuario #${archivo.subido_por}`}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {archivo.creado_en
                      ? new Date(archivo.creado_en).toLocaleString('es-CL')
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        className="inline-flex items-center gap-1 rounded-lg border border-line bg-surface px-2.5 py-1 text-[11px] font-bold text-ink transition hover:bg-subtle"
                        onClick={() => setPreviewFile(archivo)}
                        type="button"
                      >
                        <span className="material-symbols-outlined text-sm">
                          visibility
                        </span>
                        Ver
                      </button>
                      <button
                        className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary transition hover:bg-primary hover:text-white disabled:opacity-50"
                        disabled={isThisDownloading}
                        onClick={() => handleDownload(archivo)}
                        type="button"
                      >
                        <span className="material-symbols-outlined text-sm">
                          download
                        </span>
                        {isThisDownloading ? 'Descargando...' : 'Descargar'}
                      </button>
                      {canDelete && onDelete && (
                        <button
                          className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-danger hover:bg-rose-100 disabled:opacity-50"
                          disabled={isDeleting}
                          onClick={() => onDelete(archivo.id)}
                          type="button"
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <ArchivoPreviewModal
        archivo={previewFile}
        onClose={() => setPreviewFile(null)}
      />
    </>
  )
}
