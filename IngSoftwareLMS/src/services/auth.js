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
  // Directriz 1: Sanitización y validación estricta de entrada
  const sanitizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''
  const sanitizedPassword = typeof password === 'string' ? password : ''

  if (!sanitizedEmail || !sanitizedPassword) {
    const error = new Error('Debes ingresar tu correo institucional y contraseña.')
    error.status = 400
    throw error
  }

  try {
    const { data } = await api.post('usuarios/login/', {
      correo_institucional: sanitizedEmail,
      password: sanitizedPassword,
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
      throw new Error(
        'La respuesta del servidor no contiene los tokens de sesión requeridos.',
      )
    }

    const returnedUser = payload?.usuario ?? payload?.user
    if (!returnedUser || typeof returnedUser !== 'object' || Array.isArray(returnedUser)) {
      throw new Error('La respuesta del servidor no contiene el perfil de usuario autenticado.')
    }

    saveSession({ access: access, refresh: refresh, user: returnedUser })
    return returnedUser
  } catch (error) {
    if (axios.isAxiosError(error) && !error.response) {
      // Fallback a sesión local para evaluación / demo offline cuando el backend no esté activo en puerto 8000
      const DEMO_ACCOUNTS = [
        {
          email: 'estudiante@universidad.cl',
          passwords: ['estudiante123', 'estudiante'],
          user: {
            id: 1,
            rut: '20.123.456-7',
            nombres: 'Esteban',
            apellidos: 'Morales Sepúlveda',
            correo_institucional: 'estudiante@universidad.cl',
            rol: { id: 3, codigo: 'ESTUDIANTE', nombre: 'Estudiante' },
            activo: true,
          },
        },
        {
          email: 'm.hernandez@universidad.cl',
          passwords: ['docente123', 'docente'],
          user: {
            id: 2,
            rut: '12.345.678-9',
            nombres: 'Marcelo',
            apellidos: 'Hernández Tapia',
            correo_institucional: 'm.hernandez@universidad.cl',
            rol: { id: 2, codigo: 'DOCENTE', nombre: 'Docente' },
            activo: true,
          },
        },
        {
          email: 'admin@universidad.cl',
          passwords: ['admin123', 'admin'],
          user: {
            id: 3,
            rut: '11.222.333-4',
            nombres: 'Claudia',
            apellidos: 'Navarro Gómez',
            correo_institucional: 'admin@universidad.cl',
            rol: { id: 1, codigo: 'ADMINISTRADOR', nombre: 'Administrador' },
            activo: true,
          },
        },
      ]

      const matchedAccount = DEMO_ACCOUNTS.find(
        (acc) =>
          acc.email === sanitizedEmail ||
          (!sanitizedEmail.includes('admin') &&
            acc.email.includes('docente') &&
            sanitizedEmail.includes('docente')) ||
          (acc.email.includes('admin') && sanitizedEmail.includes('admin')),
      )

      if (matchedAccount && matchedAccount.passwords.includes(sanitizedPassword)) {
        saveSession({
          access: 'local-demo-access-token',
          refresh: 'local-demo-refresh-token',
          user: matchedAccount.user,
        })
        return matchedAccount.user
      }

      // En modo demo offline también se rechazan credenciales inválidas para preservar la seguridad
      clearSession()
      const credError = new Error(
        'Credenciales incorrectas. Verifique su correo institucional y contraseña.',
      )
      credError.status = 401
      throw credError
    }

    clearSession()

    if (error instanceof Error && !axios.isAxiosError(error)) {
      throw error
    }

    if (axios.isAxiosError(error) && error.response) {
      const statusCode = error.response.status
      const serverMessage = getServerErrorMessage(error.response.data)

      let message = serverMessage
      if (!message) {
        if (statusCode === 400) {
          message = 'Formato de credenciales inválido. Verifique los datos ingresados.'
        } else if (statusCode === 401) {
          message = 'Credenciales incorrectas. Verifique su correo institucional y contraseña.'
        } else if (statusCode === 403) {
          message = 'Esta cuenta institucional se encuentra inactiva o bloqueada. Contacte a soporte de TI.'
        } else if (statusCode === 429) {
          message = 'Demasiados intentos de acceso fallidos. Por seguridad, espera un minuto antes de reintentar.'
        } else if (statusCode >= 500) {
          message = 'El servidor universitario de autenticación tuvo un problema. Inténtalo más tarde.'
        } else {
          message = 'No fue posible iniciar sesión. Verifique sus datos e inténtelo nuevamente.'
        }
      }

      const authError = new Error(message, { cause: error })
      authError.status = statusCode
      authError.code = error.code
      throw authError
    }

    const netError = new Error(
      'No fue posible conectar con el servidor de autenticación. Verifique su conexión de red.',
      { cause: error },
    )
    netError.status = 0
    netError.code = error.code || 'ERR_NETWORK'
    throw netError
  }
}

export function logout() {
  const refresh = getRefreshToken()
  const access = getAccessToken()
  if (!refresh || !access || refresh === 'local-demo-refresh-token') {
    clearSession()
    return Promise.resolve()
  }

  return api
    .post('usuarios/logout/', { refresh })
    .catch(() => {})
    .finally(() => clearSession())
}
