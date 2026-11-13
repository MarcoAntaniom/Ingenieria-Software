import axios from 'axios'

export class ApiError extends Error {
  constructor(message, status = null, options = {}) {
    super(message, options)
    this.name = 'ApiError'
    this.status = status
    this.details = options.details ?? null
    this.fieldErrors = options.fieldErrors ?? {}
  }
}

function getFieldErrors(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return {}

  return Object.fromEntries(
    Object.entries(data)
      .filter(
        ([key, value]) =>
          !['detail', 'mensaje', 'error', 'non_field_errors'].includes(key) &&
          (typeof value === 'string' ||
            (Array.isArray(value) && value.every((item) => typeof item === 'string'))),
      )
      .map(([key, value]) => [key, Array.isArray(value) ? value.join(' ') : value]),
  )
}

export function normalizeApiError(error) {
  if (axios.isCancel(error)) return error

  if (!axios.isAxiosError(error)) {
    return error instanceof Error
      ? error
      : new ApiError('No se pudo completar la solicitud.')
  }

  const status = error.response?.status ?? null
  const data = error.response?.data
  const details =
    typeof data?.detail === 'string'
      ? data.detail
      : typeof data?.mensaje === 'string'
        ? data.mensaje
        : typeof data?.error === 'string'
          ? data.error
          : Array.isArray(data?.non_field_errors)
            ? data.non_field_errors.join(' ')
            : null
  const fieldErrors = getFieldErrors(data)

  if (status === 403) {
    return new ApiError('No tienes permiso para acceder a este recurso.', status, {
      cause: error,
      details,
    })
  }
  if (status === 404) {
    return new ApiError('El recurso solicitado ya no está disponible.', status, {
      cause: error,
      details,
    })
  }
  if (status === 409) {
    return new ApiError(
      details || 'El recurso cambió. Actualiza la información e inténtalo nuevamente.',
      status,
      { cause: error, details },
    )
  }
  if (status === 413) {
    return new ApiError('El archivo supera el límite permitido por el servidor.', status, {
      cause: error,
      details,
    })
  }
  if (status === 429) {
    return new ApiError('Se hicieron demasiadas solicitudes. Espera e inténtalo nuevamente.', status, {
      cause: error,
      details,
    })
  }
  if (status === 400 || status === 422) {
    return new ApiError(
      details || 'El servidor rechazó los datos. Revisa los campos e inténtalo nuevamente.',
      status,
      { cause: error, details, fieldErrors },
    )
  }
  if (status !== null && status >= 500) {
    return new ApiError(
      'El servicio no está disponible en este momento. Inténtalo más tarde.',
      status,
      { cause: error, details },
    )
  }
  if (!error.response) {
    return new ApiError(
      'No se pudo conectar con el servicio. Inténtalo nuevamente.',
      null,
      { cause: error },
    )
  }

  return new ApiError(
    details || 'No se pudo completar la solicitud. Verifica los datos e inténtalo nuevamente.',
    status,
    { cause: error, details, fieldErrors },
  )
}
