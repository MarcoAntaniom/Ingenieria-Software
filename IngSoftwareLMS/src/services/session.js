const REFRESH_TOKEN_KEY = 'lms.refresh'
const USER_KEY = 'lms.user'

let accessToken = null

export function getAccessToken() {
  return accessToken
}

export function setAccessToken(token) {
  accessToken = token
}

export function getRefreshToken() {
  return sessionStorage.getItem(REFRESH_TOKEN_KEY)
}

export function saveSession({ access, refresh, user }) {
  accessToken = access
  sessionStorage.setItem(REFRESH_TOKEN_KEY, refresh)
  sessionStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function saveRefreshedSession({ access, refresh }) {
  accessToken = access
  if (refresh) {
    sessionStorage.setItem(REFRESH_TOKEN_KEY, refresh)
  }
}

export function getStoredUser() {
  const serializedUser = sessionStorage.getItem(USER_KEY)
  if (!serializedUser) return null

  try {
    const user = JSON.parse(serializedUser)
    return user && typeof user === 'object' && !Array.isArray(user)
      ? user
      : null
  } catch (error) {
    if (error instanceof SyntaxError) {
      sessionStorage.removeItem(USER_KEY)
      return null
    }
    throw error
  }
}

export function clearSession() {
  accessToken = null
  sessionStorage.removeItem(REFRESH_TOKEN_KEY)
  sessionStorage.removeItem(USER_KEY)
}
