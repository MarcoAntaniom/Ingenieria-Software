import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { AuthContext } from './auth-context'
import { refreshAccessToken, SESSION_EXPIRED_EVENT } from '../services/api'
import {
  getRefreshToken,
  getStoredUser,
  saveSession,
  getAccessToken,
} from '../services/session'
import {
  loginWithCredentials,
  logout as revokeLoginSession,
} from '../services/auth'
import { fetchCurrentUserProfile } from '../features/usuarios/api/usuariosApi'

export function AuthProvider({ children }) {
  const queryClient = useQueryClient()
  const [user, setUser] = useState(() => getStoredUser())
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
      setIsInitializing(false)
    }

    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired)

    if (getRefreshToken()) {
      refreshAccessToken()
        .then(async (access) => {
          if (!active) return
          let profile = getStoredUser()
          try {
            const freshProfile = await fetchCurrentUserProfile()
            if (freshProfile && typeof freshProfile === 'object') {
              profile = freshProfile
              saveSession({
                access,
                refresh: getRefreshToken(),
                user: freshProfile,
              })
            }
          } catch {
            // Conserva el usuario almacenado si falla la consulta secundaria de perfil
          }
          if (active) {
            setUser(profile)
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
  }, [queryClient])

  async function login(email, password) {
    queryClient.clear()
    const authenticatedUser = await loginWithCredentials(email, password)
    setUser(authenticatedUser)
    setIsAuthenticated(true)
  }

  async function refreshProfile() {
    const freshProfile = await fetchCurrentUserProfile()
    if (freshProfile && typeof freshProfile === 'object') {
      setUser(freshProfile)
      const access = getAccessToken()
      const refresh = getRefreshToken()
      if (access && refresh) {
        saveSession({ access, refresh, user: freshProfile })
      }
    }
    return freshProfile
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

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isInitializing,
        login,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
