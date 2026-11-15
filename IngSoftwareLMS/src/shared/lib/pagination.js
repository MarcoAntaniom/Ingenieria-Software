import axios from 'axios'

/**
 * Normaliza respuestas del backend Django REST Framework:
 * - Paginación estándar DRF: `{ count, next, previous, results: [...] }`
 * - Envoltorio personalizado: `{ mensaje, datos: [...] }`
 * - Arreglos directos: `[...]`
 */
export function unwrapListResponse(payload) {
  if (Array.isArray(payload)) {
    return {
      items: payload,
      count: payload.length,
      next: null,
      previous: null,
    }
  }

  if (payload && typeof payload === 'object') {
    if (Array.isArray(payload.results)) {
      return {
        items: payload.results,
        count: typeof payload.count === 'number' ? payload.count : payload.results.length,
        next: payload.next ?? null,
        previous: payload.previous ?? null,
      }
    }

    if (Array.isArray(payload.datos)) {
      return {
        items: payload.datos,
        count: payload.datos.length,
        next: null,
        previous: null,
      }
    }
  }

  return {
    items: [],
    count: 0,
    next: null,
    previous: null,
  }
}

export function unwrapEntityResponse(payload) {
  if (!payload || typeof payload !== 'object') return payload
  if (payload.datos && typeof payload.datos === 'object' && !Array.isArray(payload.datos)) {
    return payload.datos
  }
  return payload
}

export function extractApiError(error, fallbackMessage = 'Ocurrió un error al procesar la solicitud.') {
  if (!error) return fallbackMessage

  if (axios.isAxiosError(error)) {
    const data = error.response?.data
    if (typeof data === 'string' && data.trim()) return data

    if (data && typeof data === 'object') {
      const candidates = [
        data.detail,
        data.mensaje,
        data.message,
        data.error,
        data.non_field_errors?.[0],
      ]

      for (const candidate of candidates) {
        if (typeof candidate === 'string' && candidate.trim()) {
          return candidate
        }
        if (candidate && typeof candidate === 'object') {
          const nested = Object.values(candidate)
            .flat()
            .find((val) => typeof val === 'string' && val.trim())
          if (nested) return nested
        }
      }

      const firstFieldError = Object.entries(data)
        .map(([field, messages]) => {
          const text = Array.isArray(messages) ? messages[0] : messages
          return typeof text === 'string' ? `${field}: ${text}` : null
        })
        .find(Boolean)

      if (firstFieldError) return firstFieldError
    }

    if (!error.response) {
      return 'No hay conexión con el servidor backend.'
    }
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallbackMessage
}
