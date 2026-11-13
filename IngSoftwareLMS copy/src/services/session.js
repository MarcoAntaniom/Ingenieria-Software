const REFRESH_TOKEN_KEY = 'lms.refresh'

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

export function saveSession({ access, refresh }) {
  accessToken = access
  sessionStorage.setItem(REFRESH_TOKEN_KEY, refresh)
}

export function saveRefreshedSession({ access, refresh }) {
  accessToken = access
  if (refresh) {
    sessionStorage.setItem(REFRESH_TOKEN_KEY, refresh)
  }
}

export function clearSession() {
  accessToken = null
  sessionStorage.removeItem(REFRESH_TOKEN_KEY)
}
