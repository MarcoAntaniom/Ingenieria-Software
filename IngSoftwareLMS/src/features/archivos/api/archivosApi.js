import api from '../../../services/api'
import { extractApiError, unwrapListResponse } from '../../../shared/lib/pagination'

const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp'])
const TEXT_EXTENSIONS = new Set(['txt', 'csv', 'json', 'md'])

export function formatFileSize(bytes) {
  const num = Number(bytes)
  if (!Number.isFinite(num) || num <= 0) return '0 B'
  if (num < 1024) return `${num} B`
  if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`
  return `${(num / (1024 * 1024)).toFixed(2)} MB`
}

export function getFileExtension(archivo) {
  const explicit =
    archivo?.extension || archivo?.tipo_archivo?.extension || ''
  if (explicit) {
    return String(explicit).trim().toLowerCase().replace(/^\./, '')
  }
  const name = archivo?.nombre_original || ''
  const dotIdx = name.lastIndexOf('.')
  if (dotIdx > 0 && dotIdx < name.length - 1) {
    return name.slice(dotIdx + 1).trim().toLowerCase()
  }
  return ''
}

export function getFilePreviewType(archivo) {
  const ext = getFileExtension(archivo)
  const mime = (
    archivo?.mime_type ||
    archivo?.tipo_archivo?.mime_type ||
    ''
  ).toLowerCase()

  if (ext === 'pdf' || mime === 'application/pdf') return 'pdf'
  if (IMAGE_EXTENSIONS.has(ext) || mime.startsWith('image/')) return 'image'
  if (TEXT_EXTENSIONS.has(ext) || mime.startsWith('text/')) return 'text'
  return 'unsupported'
}

export function isPreviewableFile(archivo) {
  return getFilePreviewType(archivo) !== 'unsupported'
}

export async function extractBlobErrorMessage(
  error,
  fallback = 'No se pudo obtener el archivo.',
) {
  const data = error?.response?.data
  if (data instanceof Blob) {
    try {
      const text = await data.text()
      const parsed = JSON.parse(text)
      if (typeof parsed?.mensaje === 'string' && parsed.mensaje.trim()) {
        return parsed.mensaje
      }
      if (typeof parsed?.detail === 'string' && parsed.detail.trim()) {
        return parsed.detail
      }
    } catch {
      // No es JSON; continúa al fallback estándar
    }
  }
  return extractApiError(error, fallback)
}

export async function fetchArchivoBlob(archivoId, { download = false } = {}) {
  const response = await api.get(`archivos/${archivoId}/contenido/`, {
    params: download ? { download: '1' } : undefined,
    responseType: 'blob',
    timeout: 60000,
  })
  const contentType =
    response.headers?.['content-type'] || response.data?.type || ''
  const blob =
    response.data instanceof Blob
      ? response.data
      : new Blob([response.data], {
          type: contentType || 'application/octet-stream',
        })
  return { blob, contentType }
}

function triggerBlobDownload(blob, filename) {
  const blobUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = blobUrl
  link.download = filename || 'archivo'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.setTimeout(() => {
    URL.revokeObjectURL(blobUrl)
  }, 60000)
}

/**
 * Descarga un archivo autenticado mediante el endpoint de contenido del backend,
 * garantizando nombre original, validación de permisos y compatibilidad sin errores CORS.
 */
export async function downloadArchivo(archivo) {
  const filename = archivo?.nombre_original || 'archivo'
  if (archivo?.id) {
    try {
      const { blob } = await fetchArchivoBlob(archivo.id, { download: true })
      triggerBlobDownload(blob, filename)
      return
    } catch (error) {
      const status = error?.response?.status
      // Respetar errores explícitos de permisos o archivo inexistente
      if (status === 401 || status === 403 || status === 404) {
        const message = await extractBlobErrorMessage(
          error,
          'No se pudo descargar el archivo.',
        )
        throw new Error(message)
      }
      // Fallback directo si existe una URL prefirmada vigente y falló el streaming
      const directUrl = archivo?.url_descarga || archivo?.url_publica
      if (directUrl) {
        const link = document.createElement('a')
        link.href = directUrl
        link.download = filename
        link.target = '_blank'
        link.rel = 'noreferrer'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        return
      }
      const message = await extractBlobErrorMessage(
        error,
        'No se pudo descargar el archivo.',
      )
      throw new Error(message)
    }
  }

  const directUrl = archivo?.url_descarga || archivo?.url_publica
  if (!directUrl) {
    throw new Error('El archivo no tiene una referencia válida para descargar.')
  }
  const link = document.createElement('a')
  link.href = directUrl
  link.download = filename
  link.target = '_blank'
  link.rel = 'noreferrer'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Abre un archivo autenticado en una nueva pestaña del navegador para visualizarlo.
 */
export async function openArchivoInNewTab(archivo) {
  if (archivo?.id) {
    try {
      const { blob } = await fetchArchivoBlob(archivo.id, { download: false })
      const blobUrl = URL.createObjectURL(blob)
      const popup = window.open(blobUrl, '_blank', 'noopener,noreferrer')
      if (!popup) {
        triggerBlobDownload(blob, archivo?.nombre_original || 'archivo')
      }
      window.setTimeout(() => {
        URL.revokeObjectURL(blobUrl)
      }, 120000)
      return
    } catch (error) {
      const status = error?.response?.status
      if (status === 401 || status === 403 || status === 404) {
        const message = await extractBlobErrorMessage(
          error,
          'No se pudo abrir el archivo.',
        )
        throw new Error(message)
      }
      if (archivo?.url_publica) {
        window.open(archivo.url_publica, '_blank', 'noopener,noreferrer')
        return
      }
      const message = await extractBlobErrorMessage(
        error,
        'No se pudo abrir el archivo.',
      )
      throw new Error(message)
    }
  }

  if (archivo?.url_publica) {
    window.open(archivo.url_publica, '_blank', 'noopener,noreferrer')
    return
  }
  throw new Error('El archivo no tiene una URL válida para visualizar.')
}

export async function fetchArchivos(filters = {}) {
  const params = {}
  if (filters.mios) params.mios = 'true'
  const { data } = await api.get('archivos/', { params })
  return unwrapListResponse(data).items
}

export async function fetchMaterialesEstudio(filters = {}) {
  const params = {}
  if (filters.seccion) params.seccion = filters.seccion
  const { data } = await api.get('archivos/materiales/', { params })
  return unwrapListResponse(data).items
}

export async function fetchTiposArchivo() {
  const { data } = await api.get('archivos/tipos/')
  return unwrapListResponse(data).items
}

function normalizeUploadedRecords(data) {
  if (Array.isArray(data?.archivos)) {
    return data.archivos
  }
  if (Array.isArray(data?.datos)) {
    return data.datos
  }
  if (data?.datos && typeof data.datos === 'object') {
    return [data.datos]
  }
  return []
}

/**
 * Sube uno o varios archivos mediante `multipart/form-data` y reporta el porcentaje de avance.
 */
export async function uploadArchivos(files, onProgress) {
  const formData = new FormData()
  for (const file of files) {
    formData.append('archivos', file)
  }

  const { data } = await api.post('archivos/upload/', formData, {
    timeout: 60000,
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total && onProgress) {
        const percent = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total,
        )
        onProgress(percent)
      }
    },
  })

  return normalizeUploadedRecords(data)
}

/**
 * Sube materiales de estudio (solo permitido para Docentes y Administradores).
 */
export async function uploadMaterialEstudio(
  { files, seccion, titulo },
  onProgress,
) {
  const formData = new FormData()
  for (const file of files) {
    formData.append('archivos', file)
  }
  if (seccion) {
    formData.append('seccion', String(seccion))
  }
  if (titulo && titulo.trim()) {
    formData.append('titulo', titulo.trim())
  }

  const { data } = await api.post('archivos/materiales/', formData, {
    timeout: 60000,
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total && onProgress) {
        const percent = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total,
        )
        onProgress(percent)
      }
    },
  })

  return normalizeUploadedRecords(data)
}

export async function deleteArchivo(id) {
  await api.delete(`archivos/${id}/`)
}
