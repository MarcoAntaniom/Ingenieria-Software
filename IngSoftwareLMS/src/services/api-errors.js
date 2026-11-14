import axios from 'axios'

export class ApiError extends Error {
  constructor(message, status = null, options = {}) {
    super(message, options)
    this.name = 'ApiError'
    this.status = status
  }
}

export function normalizeApiError(error) {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error
      ? error
      : new ApiError('No se pudo completar la solicitud.')
  }

  const status = error.response?.status ?? null
  if (status === 403) {
    return new ApiError('No tienes permiso para acceder a este recurso.', status, {
      cause: error,
    })
  }
  if (status !== null && status >= 500) {
    return new ApiError(
      'El servicio no está disponible en este momento. Inténtalo más tarde.',
      status,
      { cause: error },
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
    'No se pudo completar la solicitud. Verifica los datos e inténtalo nuevamente.',
    status,
    { cause: error },
  )
}
