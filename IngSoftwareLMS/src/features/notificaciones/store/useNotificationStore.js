import { create } from 'zustand'

/**
 * Estado global de notificaciones en tiempo real.
 * Implementa deduplicación idempotente por `notification.id` porque la entrega
 * del backend por WebSocket es "al menos una vez" (at-least-once).
 */
export const useNotificationStore = create((set, get) => ({
  wsStatus: 'disconnected',
  seenIds: {},
  lastEvent: null,

  setWsStatus: (wsStatus) => set({ wsStatus }),

  /**
   * Registra una notificación entrante por WebSocket si su ID no ha sido procesado aún.
   * Retorna `true` si es nueva, `false` si es un duplicado re-entregado.
   */
  registerIncomingNotification: (notification) => {
    const id = notification?.id
    if (id == null) return false

    const currentSeen = get().seenIds
    if (currentSeen[id]) {
      return false
    }

    set({
      seenIds: { ...currentSeen, [id]: true },
      lastEvent: notification,
    })
    return true
  },

  resetNotificationsState: () =>
    set({
      wsStatus: 'disconnected',
      seenIds: {},
      lastEvent: null,
    }),
}))
