import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { refreshAccessToken } from '../../services/api'
import {
  fetchNotificationTypes,
  fetchNotifications,
  fetchUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../services/notifications'
import api from '../../services/api'

export const notificationKeys = {
  lists: ['notifications', 'list'],
  list: (filters) => ['notifications', 'list', filters],
  types: ['notifications', 'types'],
  unread: ['notifications', 'unread'],
}

export function useNotifications(filters) {
  return useQuery({
    queryKey: notificationKeys.list(filters),
    queryFn: ({ signal }) => fetchNotifications(filters, signal),
    placeholderData: (previousData) => previousData,
  })
}

export function useNotificationTypes() {
  return useQuery({
    queryKey: notificationKeys.types,
    queryFn: ({ signal }) => fetchNotificationTypes(signal),
    staleTime: 30 * 60 * 1000,
  })
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: notificationKeys.unread,
    queryFn: ({ signal }) => fetchUnreadNotificationCount(signal),
    refetchInterval: 60 * 1000,
    refetchOnWindowFocus: true,
    staleTime: 30 * 1000,
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists })
      queryClient.invalidateQueries({ queryKey: notificationKeys.unread })
    },
  })
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists })
      queryClient.invalidateQueries({ queryKey: notificationKeys.unread })
    },
  })
}

export function useNotificationRealtime(userId) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!userId) return undefined

    let active = true
    let socket = null
    let retryTimeout = null
    let pingInterval = null
    let attempts = 0
    const receivedIds = new Set()

    function refreshNotificationQueries() {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists })
      queryClient.invalidateQueries({ queryKey: notificationKeys.unread })
    }

    function refreshWhenVisible() {
      if (document.visibilityState === 'visible') refreshNotificationQueries()
    }

    function scheduleReconnect() {
      if (!active || retryTimeout || attempts >= 5) return
      const delay = Math.min(1000 * 2 ** attempts, 30_000)
      attempts += 1
      retryTimeout = window.setTimeout(() => {
        retryTimeout = null
        connect()
      }, delay)
    }

    async function connect() {
      try {
        const token = await refreshAccessToken()
        if (!active) return

        const apiBase = new URL(api.defaults.baseURL, window.location.href)
        const socketUrl = new URL('/ws/notificaciones/', apiBase.origin)
        socketUrl.protocol = apiBase.protocol === 'https:' ? 'wss:' : 'ws:'
        socketUrl.searchParams.set('token', token)

        const connection = new WebSocket(socketUrl.toString())
        socket = connection
        let openedAt = 0
        let connectionPingInterval = null
        connection.onopen = () => {
          openedAt = Date.now()
          connectionPingInterval = window.setInterval(() => {
            if (connection.readyState === WebSocket.OPEN) {
              connection.send(JSON.stringify({ type: 'ping' }))
            }
          }, 25_000)
          pingInterval = connectionPingInterval
          refreshNotificationQueries()
        }
        connection.onmessage = (event) => {
          let payload
          try {
            payload = JSON.parse(event.data)
          } catch {
            console.error('El canal de notificaciones envió un evento JSON no válido.')
            return
          }

          const notification = payload?.notification
          const id = notification?.id
          if (payload?.type !== 'notification' || (typeof id !== 'number' && typeof id !== 'string')) {
            return
          }
          if (receivedIds.has(id)) return
          receivedIds.add(id)
          if (receivedIds.size > 500) {
            receivedIds.delete(receivedIds.values().next().value)
          }
          refreshNotificationQueries()
        }
        connection.onclose = () => {
          if (connectionPingInterval) window.clearInterval(connectionPingInterval)
          if (pingInterval === connectionPingInterval) pingInterval = null
          if (socket === connection) socket = null
          if (Date.now() - openedAt >= 60_000) attempts = 0
          scheduleReconnect()
        }
        connection.onerror = () => connection.close()
      } catch (error) {
        if (error?.status !== 401) scheduleReconnect()
      }
    }

    document.addEventListener('visibilitychange', refreshWhenVisible)
    connect()
    return () => {
      active = false
      document.removeEventListener('visibilitychange', refreshWhenVisible)
      if (retryTimeout) window.clearTimeout(retryTimeout)
      if (pingInterval) window.clearInterval(pingInterval)
      socket?.close(1000, 'Sesión finalizada')
    }
  }, [queryClient, userId])
}
