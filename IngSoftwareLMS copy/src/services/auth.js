import api from './api'
import { clearSession, saveSession } from './session'
import { ApiError, normalizeApiError } from './api-errors'

function getUserFromResponse(data) {
  const user = data?.datos
  if (!user || typeof user !== 'object' || Array.isArray(user)) {
    throw new ApiError('El servidor no devolvió un perfil válido.')
  }
  return user
}

export async function fetchCurrentUser({ skipAuthRefresh = false } = {}) {
  const { data } = await api.get('usuarios/me/', { skipAuthRefresh })
  return getUserFromResponse(data)
}

export async function loginWithCredentials(email, password) {
  try {
    const { data } = await api.post('usuarios/login/', {
      correo_institucional: email.trim(),
      password,
    })

    const payload = data?.datos || data
    const access = payload?.access
    const refresh = payload?.refresh

    if (
      typeof access !== 'string' ||
      !access ||
      typeof refresh !== 'string' ||
      !refresh
    ) {
      throw new ApiError('El servidor no devolvió una sesión válida.')
    }

    saveSession({ access, refresh })
    return await fetchCurrentUser()
  } catch (error) {
    clearSession()
    if (error instanceof ApiError && error.status === 403) {
      throw error
    }
    if (
      error instanceof ApiError &&
      (error.status === 400 || error.status === 401)
    ) {
      throw new ApiError(
        'No se pudo iniciar sesión. Verifica tus credenciales.',
        error.status,
      )
    }
    throw normalizeApiError(error)
  }
}

export function logout() {
  clearSession()
  throw new ApiError(
    'La sesión se cerró en este dispositivo; el servidor aún no ofrece revocación.',
  )
}
