import { useCallback, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useDropzone } from 'react-dropzone'
import { toast } from 'sonner'
import { useAuth } from '../../../contexts/auth-context'
import { extractApiError } from '../../lib/pagination'
import { queryKeys } from '../../lib/queryKeys'
import { getUserRoleCode, ROLES } from '../../lib/roles'
import {
  downloadArchivo,
  formatFileSize,
  uploadArchivos,
} from '../../../features/archivos/api/archivosApi'
import ArchivoPreviewModal from '../../../features/archivos/components/ArchivoPreviewModal'

const DEFAULT_ACCEPT = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/msword': ['.doc'],
  'application/zip': ['.zip'],
  'application/vnd.rar': ['.rar'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'text/plain': ['.txt'],
  'text/csv': ['.csv'],
}

/**
 * Componente Drag & Drop reutilizable basado en `react-dropzone`.
 * Permite arrastrar y soltar archivos en la página, los sube al backend con barra de progreso
 * y entrega la lista de objetos `Archivo` subidos al componente padre.
 * Los estudiantes no pueden eliminar archivos ya subidos.
 */
export default function FileDropzoneUploader({
  uploadedFiles = [],
  onChangeUploadedFiles,
  onUploadComplete,
  customUploadFn,
  allowRemove,
  multiple = true,
  maxSizeMB = 50,
  label = 'Arrastra y suelta tus archivos aquí, o haz clic para seleccionarlos',
  helperText = 'Formatos admitidos: PDF, DOCX, ZIP, XLSX, PPTX, PNG, JPG (máx. 50 MB)',
  compact = false,
}) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const roleCode = getUserRoleCode(user)
  const isStudent = roleCode === ROLES.ESTUDIANTE
  const canRemoveFiles = allowRemove !== undefined ? allowRemove && !isStudent : !isStudent

  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [previewFile, setPreviewFile] = useState(null)
  const [downloadingId, setDownloadingId] = useState(null)

  async function handleDownloadFile(event, file) {
    event.stopPropagation()
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

  const onDrop = useCallback(
    async (acceptedFiles, fileRejections) => {
      if (fileRejections?.length > 0) {
        const firstError = fileRejections[0]?.errors?.[0]?.message
        toast.error(
          firstError ||
            `Archivo rechazado. Verifica el formato y que no supere ${maxSizeMB} MB.`,
        )
      }

      if (!acceptedFiles || acceptedFiles.length === 0) return

      setIsUploading(true)
      setProgress(5)

      try {
        const uploader = customUploadFn || uploadArchivos
        const createdRecords = await uploader(acceptedFiles, (pct) => {
          setProgress(pct)
        })

        const nextFiles = multiple
          ? [...uploadedFiles, ...createdRecords]
          : createdRecords.slice(0, 1)

        onChangeUploadedFiles?.(nextFiles)
        onUploadComplete?.(createdRecords)
        queryClient.invalidateQueries({ queryKey: queryKeys.archivos.all })
        toast.success(
          createdRecords.length === 1
            ? `Archivo "${createdRecords[0].nombre_original}" subido exitosamente.`
            : `${createdRecords.length} archivos subidos exitosamente.`,
        )
      } catch (err) {
        toast.error(extractApiError(err, 'No se pudo subir el archivo.'))
      } finally {
        setIsUploading(false)
        setProgress(0)
      }
    },
    [
      customUploadFn,
      maxSizeMB,
      multiple,
      onChangeUploadedFiles,
      onUploadComplete,
      queryClient,
      uploadedFiles,
    ],
  )

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
  } = useDropzone({
    onDrop,
    multiple,
    maxSize: maxSizeMB * 1024 * 1024,
    accept: DEFAULT_ACCEPT,
    disabled: isUploading,
  })

  function handleRemoveUploaded(id) {
    if (!canRemoveFiles || !onChangeUploadedFiles) return
    onChangeUploadedFiles(uploadedFiles.filter((item) => item.id !== id))
  }

  const borderStyle = isDragReject
    ? 'border-rose-400 bg-rose-50/70'
    : isDragAccept || isDragActive
      ? 'border-secondary bg-secondary/10 ring-2 ring-secondary/30'
      : 'border-line bg-subtle/60 hover:border-primary/50 hover:bg-subtle'

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={`cursor-pointer rounded-xl border-2 border-dashed transition-all ${borderStyle} ${
          compact ? 'p-4' : 'p-6 sm:p-8'
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center text-center">
          <span
            className={`grid place-items-center rounded-full ${
              compact ? 'size-10' : 'size-12'
            } ${
              isDragActive
                ? 'bg-secondary text-white'
                : 'bg-primary/10 text-primary'
            }`}
          >
            <span
              className="material-symbols-outlined text-2xl"
              aria-hidden="true"
            >
              {isUploading
                ? 'hourglass_top'
                : isDragActive
                  ? 'file_download'
                  : 'cloud_upload'}
            </span>
          </span>

          <p className="mt-2.5 text-xs font-bold text-ink sm:text-sm">
            {isDragActive
              ? '¡Suelta los archivos aquí para subirlos!'
              : label}
          </p>
          <p className="mt-1 text-[11px] text-muted">{helperText}</p>

          {isUploading && (
            <div className="mt-4 w-full max-w-xs space-y-1">
              <div className="flex justify-between text-[11px] font-bold text-primary">
                <span>Subiendo archivo...</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-line">
                <div
                  className="h-full rounded-full bg-secondary transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
              Archivos subidos ({uploadedFiles.length})
            </p>
            {isStudent && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700">
                <span className="material-symbols-outlined text-xs">lock</span>
                Los archivos subidos por estudiantes no pueden eliminarse
              </span>
            )}
          </div>
          <div className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-card">
            {uploadedFiles.map((file) => {
              const fileKey = file.id ?? file.nombre_original
              const isThisDownloading = downloadingId === fileKey
              return (
                <div
                  className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 text-xs"
                  key={fileKey}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="material-symbols-outlined shrink-0 text-lg text-secondary"
                      aria-hidden="true"
                    >
                      attach_file
                    </span>
                    <div className="min-w-0">
                      <button
                        className="block max-w-full truncate text-left font-bold text-primary hover:underline"
                        onClick={(e) => {
                          e.stopPropagation()
                          setPreviewFile(file)
                        }}
                        type="button"
                      >
                        {file.nombre_original}
                      </button>
                      <span className="text-[10px] text-muted">
                        {formatFileSize(file.peso_bytes)}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      className="inline-flex items-center gap-0.5 rounded-md border border-line bg-surface px-2 py-1 text-[11px] font-bold text-ink transition hover:bg-subtle"
                      onClick={(e) => {
                        e.stopPropagation()
                        setPreviewFile(file)
                      }}
                      title={`Ver ${file.nombre_original}`}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-xs">
                        visibility
                      </span>
                      Ver
                    </button>
                    <button
                      className="inline-flex items-center gap-0.5 rounded-md bg-primary/10 px-2 py-1 text-[11px] font-bold text-primary transition hover:bg-primary hover:text-white disabled:opacity-50"
                      disabled={isThisDownloading}
                      onClick={(e) => handleDownloadFile(e, file)}
                      title={`Descargar ${file.nombre_original}`}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-xs">
                        download
                      </span>
                      {isThisDownloading ? 'Descargando...' : 'Descargar'}
                    </button>
                    {canRemoveFiles && onChangeUploadedFiles && (
                      <button
                        aria-label={`Quitar ${file.nombre_original}`}
                        className="rounded-lg p-1 text-muted hover:bg-rose-50 hover:text-danger"
                        onClick={() => handleRemoveUploaded(file.id)}
                        type="button"
                      >
                        <span className="material-symbols-outlined text-base">
                          close
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <ArchivoPreviewModal
        archivo={previewFile}
        onClose={() => setPreviewFile(null)}
      />
    </div>
  )
}
