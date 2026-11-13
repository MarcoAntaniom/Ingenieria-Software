import api from './api'

function validateNotification(row) {
  if (
    !row ||
    typeof row !== 'object' ||
    Array.isArray(row) ||
    !Number.isInteger(row.id) ||
    typeof row.titulo !== 'string' ||
    typeof row.mensaje !== 'string' ||
    typeof row.leida !== 'boolean' ||
    typeof row.creada_en !== 'string' ||
    !row.datos ||
    typeof row.datos !== 'object' ||
    Array.isArray(row.datos)
  ) {
    throw new Error('El servidor devolvió una notificación no válida.')
  }

  return {
    ...row,
    tipo: typeof row.tipo === 'string' ? row.tipo : '',
    leida: row.leida,
    datos: row.datos,
  }
}

function getResults(data, resourceName) {
  if (!Array.isArray(data?.results)) {
    throw new Error(`El servidor devolvió una lista de ${resourceName} no válida.`)
  }
  return data.results
}

export async function fetchNotifications({ page = 1, leida = '', tipo = '' }, signal) {
  const params = { page }
  if (leida) params.leida = leida
  if (tipo) params.tipo = tipo

  const { data } = await api.get('notificaciones/', { params, signal })
  const results = getResults(data, 'notificaciones')
  if (
    !Number.isInteger(data.count) ||
    (data.next !== null && typeof data.next !== 'string') ||
    (data.previous !== null && typeof data.previous !== 'string')
  ) {
    throw new Error('El servidor devolvió una paginación de notificaciones no válida.')
  }

  return {
    notifications: results.map(validateNotification),
    count: data.count,
    hasNext: Boolean(data.next),
    hasPrevious: Boolean(data.previous),
  }
}

export async function fetchNotificationTypes(signal) {
  const { data } = await api.get('notificaciones/tipos/', { signal })
  return getResults(data, 'tipos de notificación').map((item) => {
    if (!item || typeof item.codigo !== 'string' || typeof item.nombre !== 'string') {
      throw new Error('El servidor devolvió un tipo de notificación no válido.')
    }
    return { codigo: item.codigo, nombre: item.nombre }
  })
}

export async function fetchUnreadNotificationCount(signal) {
  const { data } = await api.get('notificaciones/no-leidas/contador/', { signal })
  if (!Number.isInteger(data?.no_leidas) || data.no_leidas < 0) {
    throw new Error('El servidor devolvió un contador de notificaciones no válido.')
  }
  return data.no_leidas
}

export async function markNotificationRead(notificationId) {
  const { data } = await api.post(`notificaciones/${notificationId}/leer/`)
  return validateNotification(data)
}

export async function markAllNotificationsRead() {
  await api.post('notificaciones/leer-todas/')
}
