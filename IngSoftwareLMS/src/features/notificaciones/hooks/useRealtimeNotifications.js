import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuth } from '../../../contexts/auth-context'
import { createNotificationsSocket } from '../../../shared/api/wsClient'
import { queryKeys } from '../../../shared/lib/queryKeys'
import { useNotificationStore } from '../store/useNotificationStore'

export function useRealtimeNotifications() {
  const { isAuthenticated } = useAuth()
  const queryClient = useQueryClient()
  const setWsStatus = useNotificationStore((state) => state.setWsStatus)
  const registerIncomingNotification = useNotificationStore(
    (state) => state.registerIncomingNotification,
  )
  const resetNotificationsState = useNotificationStore(
    (state) => state.resetNotificationsState,
  )

  useEffect(() => {
    if (!isAuthenticated) {
      resetNotificationsState()
      return undefined
    }

    const client = createNotificationsSocket({
      onStatusChange: (status) => {
        setWsStatus(status)
      },
      onNotification: (notification) => {
        const isNew = registerIncomingNotification(notification)
        if (!isNew) return

        toast.info(notification.titulo || 'Nueva notificación', {
          description:
            notification.mensaje ||
            `Categoría: ${notification.tipo || 'general'}`,
        })

        queryClient.invalidateQueries({
          queryKey: queryKeys.notificaciones.all,
        })
      },
    })

    return () => {
      client.disconnect()
    }
  }, [
    isAuthenticated,
    queryClient,
    registerIncomingNotification,
    resetNotificationsState,
    setWsStatus,
  ])
}
