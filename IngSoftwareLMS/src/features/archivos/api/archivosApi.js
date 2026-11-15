import api from '../../../services/api'
import { unwrapListResponse } from '../../../shared/lib/pagination'

export function formatFileSize(bytes) {
  const num = Number(bytes)
  if (!Number.isFinite(num) || num <= 0) return '0 B'
  if (num < 1024) return `${num} B`
  if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`
  return `${(num / (1024 * 1024)).toFixed(2)} MB`
}

export async function fetchArchivos(filters = {}) {
  const params = {}
  if (filters.mios) params.mios = 'true'
  const { data } = await api.get('archivos/', { params })
  return unwrapListResponse(data).items
}

export async function fetchTiposArchivo() {
  const { data } = await api.get('archivos/tipos/')
  return unwrapListResponse(data).items
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

export async function deleteArchivo(id) {
  await api.delete(`archivos/${id}/`)
}
