import { useCallback, useEffect, useRef, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import Button from './Button'

const MIME_TYPES = {
  pdf: ['application/pdf'],
  docx: [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  zip: ['application/zip', 'application/x-zip-compressed'],
}

const MAX_FILE_SIZE = 50 * 1024 * 1024

export default function FileDropzone({
  allowedExtensions = ['pdf', 'docx', 'zip'],
  onUpload,
}) {
  const [file, setFile] = useState(null)
  const [error, setError] = useState('')
  const [uploadState, setUploadState] = useState('idle')
  const [progress, setProgress] = useState(0)
  const controllerRef = useRef(null)
  const accept = Object.fromEntries(
    allowedExtensions
      .filter((extension) => MIME_TYPES[extension.toLowerCase()])
      .flatMap((extension) =>
        MIME_TYPES[extension.toLowerCase()].map((mime) => [
          mime,
          [`.${extension.toLowerCase()}`],
        ]),
      ),
  )

  useEffect(() => () => controllerRef.current?.abort(), [])

  const onDrop = useCallback(
    (acceptedFiles, rejectedFiles) => {
      setError('')
      setFile(null)
      setProgress(0)
      setUploadState('idle')

      if (rejectedFiles.length > 0) {
        setError('El archivo no cumple con el tipo o tamaño permitido.')
        return
      }

      const selectedFile = acceptedFiles[0]
      if (!selectedFile) return

      const extension = selectedFile.name.split('.').pop()?.toLowerCase()
      const permittedMimes = MIME_TYPES[extension] || []
      if (
        !allowedExtensions.map((item) => item.toLowerCase()).includes(extension) ||
        !permittedMimes.includes(selectedFile.type) ||
        selectedFile.size > MAX_FILE_SIZE
      ) {
        setError('El archivo no cumple con el tipo o tamaño permitido.')
        return
      }

      setFile(selectedFile)
    },
    [allowedExtensions],
  )

  const { getInputProps, getRootProps, isDragActive } = useDropzone({
    accept,
    maxFiles: 1,
    maxSize: MAX_FILE_SIZE,
    multiple: false,
    onDrop,
  })

  async function startUpload() {
    if (!file || !onUpload) return
    const controller = new AbortController()
    controllerRef.current = controller
    setUploadState('uploading')
    setError('')

    try {
      await onUpload(file, {
        signal: controller.signal,
        onProgress: (nextProgress) => {
          setProgress(Math.max(0, Math.min(100, Math.round(nextProgress))))
        },
      })
      setProgress(100)
      setUploadState('complete')
    } catch {
      if (controller.signal.aborted) {
        setUploadState('cancelled')
        return
      }
      setUploadState('error')
      setError('No se pudo subir el archivo. Inténtalo nuevamente.')
    } finally {
      controllerRef.current = null
    }
  }

  function cancelUpload() {
    controllerRef.current?.abort()
  }

  const extensionLabel = allowedExtensions.map((item) => `.${item}`).join(', ')

  return (
    <section aria-label="Subir archivo" className="space-y-3">
      <div
        {...getRootProps({
          className: `cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition focus-within:ring-2 focus-within:ring-primary ${isDragActive ? 'border-primary bg-secondary-container/30' : 'border-line bg-card'}`,
        })}
      >
        <input {...getInputProps({ 'aria-label': 'Seleccionar archivo' })} />
        <p className="font-semibold text-ink">
          {isDragActive ? 'Suelta el archivo aquí' : 'Arrastra un archivo o selecciónalo'}
        </p>
        <p className="mt-1 text-xs text-muted">
          {extensionLabel || 'Sin extensiones configuradas'} · Máximo 50 MB
        </p>
      </div>
      {file && (
        <p className="text-sm text-ink">
          {file.name} · {(file.size / (1024 * 1024)).toFixed(2)} MB
        </p>
      )}
      {!onUpload && (
        <p className="text-xs text-muted">
          La subida estará disponible cuando el backend publique el endpoint correspondiente.
        </p>
      )}
      {uploadState === 'uploading' && (
        <div className="space-y-2" aria-live="polite">
          <progress aria-label="Progreso de subida" className="w-full" max="100" value={progress} />
          <Button onClick={cancelUpload} variant="secondary">Cancelar subida</Button>
        </div>
      )}
      {error && <p className="text-sm text-danger-strong" role="alert">{error}</p>}
      {uploadState === 'complete' && (
        <p className="text-sm text-success" role="status">Archivo subido.</p>
      )}
      {uploadState === 'cancelled' && (
        <p className="text-sm text-muted" role="status">Subida cancelada.</p>
      )}
      {file && onUpload && uploadState === 'idle' && (
        <Button onClick={startUpload}>Subir archivo</Button>
      )}
    </section>
  )
}
