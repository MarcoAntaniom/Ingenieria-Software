import axios from 'axios'
import api from './api'
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  saveSession,
} from './session'

function getServerErrorMessage(data) {
  if (typeof data === 'string') return data
  if (!data || typeof data !== 'object') return null

  const errorData = data.error
  const message =
    data.detail ||
    data.message ||
    data.non_field_errors?.[0] ||
    errorData?.detail ||
    errorData?.non_field_errors?.[0] ||
    (errorData && typeof errorData === 'object'
      ? Object.values(errorData)
          .flat()
          .find((value) => typeof value === 'string')
      : null) ||
    Object.values(data)
      .flat()
      .find((value) => typeof value === 'string')

  return typeof message === 'string' ? message : null
}

export async function loginWithCredentials(email, password) {
  try {
    const { data } = await api.post('usuarios/login/', {
      correo_institucional: email.trim(),
      password,
    })

    if (
      typeof data?.access !== 'string' ||
      !data.access ||
      typeof data?.refresh !== 'string' ||
      !data.refresh
    ) {
      throw new Error(
        'La respuesta del servidor no contiene los tokens de sesión requeridos.',
      )
    }

    const returnedUser = data.user ?? data.usuario
    const user =
      returnedUser && typeof returnedUser === 'object' && !Array.isArray(returnedUser)
        ? returnedUser
        : { correo_institucional: email.trim() }

    saveSession({ access: data.access, refresh: data.refresh, user })
    return user
  } catch (error) {
    clearSession()
    if (error instanceof Error && !axios.isAxiosError(error)) {
      throw error
    }

    if (axios.isAxiosError(error)) {
      const serverMessage = getServerErrorMessage(error.response?.data)
      if (serverMessage) {
        throw new Error(serverMessage, { cause: error })
      }
      if (!error.response) {
        throw new Error(
          'No se pudo conectar con el servidor. Verifica que el backend esté activo.',
          { cause: error },
        )
      }
      if (error.response.status >= 500) {
        throw new Error('El servidor tuvo un problema. Inténtalo más tarde.', {
          cause: error,
        })
      }
    }

    throw new Error('No se pudo iniciar sesión. Inténtalo de nuevo.', {
      cause: error,
    })
  }
}

export function logout() {
  const refresh = getRefreshToken()
  const access = getAccessToken()
  if (!refresh || !access) {
    clearSession()
    return Promise.resolve()
  }

  return api
    .post('usuarios/logout/', { refresh })
    .finally(() => clearSession())
}
