import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { AuthContext } from './auth-context'
import {
  refreshAccessToken,
  SESSION_EXPIRED_EVENT,
  SESSION_REFRESHED_EVENT,
} from '../services/api'
import { clearSession, getRefreshToken } from '../services/session'
import {
  fetchCurrentUser,
  loginWithCredentials,
  logout as revokeLoginSession,
} from '../services/auth'

export function AuthProvider({ children }) {
  const queryClient = useQueryClient()
  const [user, setUser] = useState(null)
  const [authNotice, setAuthNotice] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isInitializing, setIsInitializing] = useState(() =>
    Boolean(getRefreshToken()),
  )

  useEffect(() => {
    let active = true

    function handleSessionExpired() {
      queryClient.clear()
      setIsAuthenticated(false)
      setUser(null)
      setAuthNotice('La sesión expiró. Inicia sesión nuevamente.')
      setIsInitializing(false)
    }

    function handleSessionRefreshed() {
      fetchCurrentUser({ skipAuthRefresh: true })
        .then((authenticatedUser) => {
          if (active) {
            setUser(authenticatedUser)
            setIsAuthenticated(true)
          }
        })
        .catch((error) => {
          if (!active) return
          if (error?.status === 401 || error?.status === 403) {
            clearSession()
            handleSessionExpired()
            return
          }
          const message =
            'No se pudo actualizar la información de la cuenta. Inténtalo nuevamente.'
          setAuthNotice(message)
          toast.error(message)
        })
    }

    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired)
    window.addEventListener(SESSION_REFRESHED_EVENT, handleSessionRefreshed)

    if (getRefreshToken()) {
      refreshAccessToken()
        .then(fetchCurrentUser)
        .then((authenticatedUser) => {
          if (active) {
            setUser(authenticatedUser)
            setIsAuthenticated(true)
          }
        })
        .catch(() => {
          clearSession()
          if (active) {
            setUser(null)
            setIsAuthenticated(false)
            setAuthNotice(
              'No se pudo reanudar la sesión. Inicia sesión nuevamente.',
            )
          }
        })
        .finally(() => {
          if (active) setIsInitializing(false)
        })
    }

    return () => {
      active = false
      window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired)
      window.removeEventListener(SESSION_REFRESHED_EVENT, handleSessionRefreshed)
    }
  }, [queryClient])

  async function login(email, password) {
    const authenticatedUser = await loginWithCredentials(email, password)
    queryClient.clear()
    setUser(authenticatedUser)
    setIsAuthenticated(true)
    setAuthNotice('')
    return authenticatedUser
  }

  async function signOut() {
    try {
      await revokeLoginSession()
    } finally {
      queryClient.clear()
      setUser(null)
      setIsAuthenticated(false)
    }
  }

  function clearAuthNotice() {
    setAuthNotice('')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        authNotice,
        clearAuthNotice,
        isAuthenticated,
        isInitializing,
        login,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
