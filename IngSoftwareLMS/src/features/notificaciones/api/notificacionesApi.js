import api from '../../../services/api'
import { unwrapListResponse } from '../../../shared/lib/pagination'

export async function fetchNotifications(filters = {}) {
  const params = {}
  if (typeof filters.leida === 'boolean') {
    params.leida = String(filters.leida)
  }
  if (filters.tipo) {
    params.tipo = filters.tipo
  }
  const { data } = await api.get('notificaciones/', { params })
  return unwrapListResponse(data)
}

export async function fetchNotificationTypes() {
  const { data } = await api.get('notificaciones/tipos/')
  return unwrapListResponse(data).items
}

export async function fetchUnreadCount() {
  const { data } = await api.get('notificaciones/no-leidas/contador/')
  return typeof data?.no_leidas === 'number' ? data.no_leidas : 0
}

export async function markNotificationAsRead(id) {
  const { data } = await api.post(`notificaciones/${id}/leer/`)
  return data
}

export async function markAllNotificationsAsRead() {
  await api.post('notificaciones/leer-todas/')
}
