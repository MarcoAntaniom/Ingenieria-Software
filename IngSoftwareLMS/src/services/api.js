import axios from 'axios'
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  saveRefreshedSession,
} from './session'

export const SESSION_EXPIRED_EVENT = 'lms:session-expired'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1/',
  timeout: 15000,
})

let refreshRequest

function isAuthenticationRequest(url = '') {
  return (
    url.includes('usuarios/login/') ||
    url.includes('usuarios/refresh/') ||
    url.includes('usuarios/logout/')
  )
}

function notifySessionExpired() {
  clearSession()
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
}

export async function refreshAccessToken() {
  const refresh = getRefreshToken()
  if (!refresh) {
    notifySessionExpired()
    throw new Error('La sesión expiró. Inicia sesión nuevamente.')
  }

  if (!refreshRequest) {
    const refreshUrl = api.getUri({ url: 'usuarios/refresh/' })
    refreshRequest = axios
      .post(refreshUrl, { refresh }, { timeout: api.defaults.timeout })
      .then(({ data }) => {
        if (typeof data?.access !== 'string' || !data.access) {
          throw new Error('El servidor no entregó un token de acceso válido.')
        }
        saveRefreshedSession({
          access: data.access,
          refresh: typeof data.refresh === 'string' ? data.refresh : null,
        })
        return data.access
      })
      .catch((error) => {
        notifySessionExpired()
        throw error
      })
      .finally(() => {
        refreshRequest = null
      })
  }

  return refreshRequest
}

api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      isAuthenticationRequest(originalRequest.url)
    ) {
      return Promise.reject(error)
    }

    originalRequest._retry = true
    try {
      const access = await refreshAccessToken()
      originalRequest.headers.set('Authorization', `Bearer ${access}`)
      return api(originalRequest)
    } catch (refreshError) {
      return Promise.reject(refreshError)
    }
  },
)

export default api
