import { getAccessToken } from '../../services/session'

/**
 * Construye la URL del WebSocket de notificaciones a partir de `VITE_WS_URL`
 * o derivándola de `VITE_API_URL` (`http://localhost:8000/api/v1/` -> `ws://localhost:8000/ws/notificaciones/`).
 */
export function buildNotificationsWsUrl(token) {
  const explicitWsBase = import.meta.env.VITE_WS_URL
  if (explicitWsBase) {
    const url = new URL(explicitWsBase, window.location.origin)
    url.searchParams.set('token', token)
    return url.toString()
  }

  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1/'
  const parsedApi = new URL(apiBase, window.location.origin)
  const wsProtocol = parsedApi.protocol === 'https:' ? 'wss:' : 'ws:'
  const wsUrl = new URL(`${wsProtocol}//${parsedApi.host}/ws/notificaciones/`)
  wsUrl.searchParams.set('token', token)
  return wsUrl.toString()
}

/**
 * Cliente WebSocket resiliente con reconexión exponencial y ping/pong.
 * No registra la URL con el token en consola para proteger credenciales.
 */
export function createNotificationsSocket({ onNotification, onStatusChange }) {
  let socket = null
  let pingTimer = null
  let reconnectTimer = null
  let attempts = 0
  let closedIntentionally = false

  function clearTimers() {
    if (pingTimer) {
      clearInterval(pingTimer)
      pingTimer = null
    }
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
  }

  function connect() {
    if (closedIntentionally) return

    const token = getAccessToken()
    if (!token) {
      onStatusChange?.('disconnected')
      return
    }

    try {
      onStatusChange?.('connecting')
      socket = new WebSocket(buildNotificationsWsUrl(token))
    } catch {
      scheduleReconnect()
      return
    }

    socket.onopen = () => {
      attempts = 0
      onStatusChange?.('connected')
      pingTimer = setInterval(() => {
        if (socket?.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: 'ping' }))
        }
      }, 25000)
    }

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data)
        if (payload?.type === 'notification' && payload.notification) {
          onNotification?.(payload.notification)
        }
      } catch {
        // Ignora tramas malformadas sin interrumpir la sesión
      }
    }

    socket.onerror = () => {
      onStatusChange?.('error')
    }

    socket.onclose = () => {
      clearTimers()
      onStatusChange?.('disconnected')
      if (!closedIntentionally) {
        scheduleReconnect()
      }
    }
  }

  function scheduleReconnect() {
    if (closedIntentionally) return
    attempts += 1
    const delayMs = Math.min(1000 * 2 ** Math.min(attempts, 5), 30000)
    reconnectTimer = setTimeout(() => {
      connect()
    }, delayMs)
  }

  function disconnect() {
    closedIntentionally = true
    clearTimers()
    if (socket) {
      socket.onclose = null
      socket.close()
      socket = null
    }
    onStatusChange?.('disconnected')
  }

  connect()

  return {
    disconnect,
    reconnect: () => {
      clearTimers()
      if (socket) {
        socket.onclose = null
        socket.close()
      }
      closedIntentionally = false
      attempts = 0
      connect()
    },
  }
}
