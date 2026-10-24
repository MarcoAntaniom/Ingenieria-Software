import { useEffect, useState } from 'react'
import { AuthContext } from './auth-context'
import { refreshAccessToken, SESSION_EXPIRED_EVENT } from '../services/api'
import { getRefreshToken, getStoredUser } from '../services/session'
import {
  loginWithCredentials,
  logout as revokeLoginSession,
} from '../services/auth'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser())
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isInitializing, setIsInitializing] = useState(() =>
    Boolean(getRefreshToken()),
  )

  useEffect(() => {
    let active = true

    function handleSessionExpired() {
      setIsAuthenticated(false)
      setUser(null)
      setIsInitializing(false)
    }

    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired)

    if (getRefreshToken()) {
      refreshAccessToken()
        .then(() => {
          if (active) {
            setUser(getStoredUser())
            setIsAuthenticated(true)
          }
        })
        .catch(() => {
          if (active) {
            setUser(null)
            setIsAuthenticated(false)
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
  }

  async function signOut() {
    try {
      await revokeLoginSession()
    } finally {
      setUser(null)
      setIsAuthenticated(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, isInitializing, login, signOut }}
    >
      {children}
    </AuthContext.Provider>
  )
}
