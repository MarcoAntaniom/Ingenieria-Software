import { useEffect, useState } from 'react'
import { AuthContext } from './auth-context'
import { refreshAccessToken, SESSION_EXPIRED_EVENT } from '../services/api'
import { clearSession, getRefreshToken } from '../services/session'
import {
  fetchCurrentUser,
  loginWithCredentials,
  logout as revokeLoginSession,
} from '../services/auth'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [authNotice, setAuthNotice] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isInitializing, setIsInitializing] = useState(() =>
    Boolean(getRefreshToken()),
  )

  useEffect(() => {
    let active = true

    function handleSessionExpired() {
      setIsAuthenticated(false)
      setUser(null)
      setAuthNotice('La sesión expiró. Inicia sesión nuevamente.')
      setIsInitializing(false)
    }

    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired)

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
    }
  }, [])

  async function login(email, password) {
    const authenticatedUser = await loginWithCredentials(email, password)
    setUser(authenticatedUser)
    setIsAuthenticated(true)
    setAuthNotice('')
    return authenticatedUser
  }

  async function signOut() {
    try {
      await revokeLoginSession()
    } finally {
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
