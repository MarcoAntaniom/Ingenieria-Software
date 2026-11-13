import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppShell from '../components/layout/AppShell'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import EmptyState from '../components/ui/EmptyState'
import Skeleton from '../components/ui/Skeleton'
import StatusBadge from '../components/ui/StatusBadge'
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationRealtime,
  useNotificationTypes,
  useNotifications,
  useUnreadNotificationCount,
} from '../features/notificaciones/useNotifications'
import { useAuth } from '../contexts/auth-context'

function formatCreatedAt(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Fecha no disponible'
  return new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function getInternalTarget(data) {
  const target = data?.url
  if (
    typeof target !== 'string' ||
    !target.startsWith('/') ||
    target.startsWith('//') ||
    target.includes('\\')
  ) {
    return null
  }
  return target
}

function NotificationSkeletons() {
  return (
    <div aria-label="Cargando notificaciones" className="space-y-3" role="status">
      {Array.from({ length: 3 }, (_, index) => (
        <Card className="space-y-3 p-5" key={index}>
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-3 w-1/4" />
        </Card>
      ))}
    </div>
  )
}

export default function NotificationsPage() {
  const [page, setPage] = useState(1)
  const [leida, setLeida] = useState('')
  const [tipo, setTipo] = useState('')
  const navigate = useNavigate()
  const { user } = useAuth()
  const filters = { page, leida, tipo }
  const notificationsQuery = useNotifications(filters)
  const typesQuery = useNotificationTypes()
  const unreadQuery = useUnreadNotificationCount()
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()
  useNotificationRealtime(user?.id)

  const notifications = notificationsQuery.data?.notifications || []
  const mutationError = markRead.error || markAllRead.error

  return (
    <AppShell>
      <section className="mx-auto flex max-w-[1000px] flex-col gap-5 px-4 py-8 sm:px-6 lg:px-10">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-secondary-dark">
              Centro de actividad
            </p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-primary">
              Notificaciones
            </h1>
            <p className="mt-1 text-sm text-muted">
              {unreadQuery.data ?? 0} sin leer
            </p>
          </div>
          <Button
            disabled={!unreadQuery.data || markAllRead.isPending}
            onClick={() => markAllRead.mutate()}
            variant="secondary"
          >
            {markAllRead.isPending ? 'Actualizando…' : 'Marcar todas como leídas'}
          </Button>
        </header>

        <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-xs font-semibold" htmlFor="notification-read-filter">
              Estado
            </label>
            <select
              className="min-h-10 rounded-lg border border-line bg-card px-3 text-sm"
              id="notification-read-filter"
              onChange={(event) => {
                setLeida(event.target.value)
                setPage(1)
              }}
              value={leida}
            >
              <option value="">Todas</option>
              <option value="false">Sin leer</option>
              <option value="true">Leídas</option>
            </select>
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-xs font-semibold" htmlFor="notification-type-filter">
              Tipo
            </label>
            <select
              className="min-h-10 rounded-lg border border-line bg-card px-3 text-sm"
              id="notification-type-filter"
              onChange={(event) => {
                setTipo(event.target.value)
                setPage(1)
              }}
              value={tipo}
            >
              <option value="">Todos los tipos</option>
              {(typesQuery.data || []).map((item) => (
                <option key={item.codigo} value={item.codigo}>
                  {item.nombre}
                </option>
              ))}
            </select>
          </div>
        </Card>

        {mutationError && (
          <Card className="p-4 text-sm text-danger" role="alert">
            {mutationError.message || 'No se pudo actualizar la notificación.'}
          </Card>
        )}
        {unreadQuery.error && (
          <Card className="p-4 text-sm text-danger" role="alert">
            No se pudo actualizar el contador de notificaciones.
          </Card>
        )}
        {typesQuery.error && (
          <Card className="p-4 text-sm text-danger" role="alert">
            No se pudieron cargar los tipos de notificación.
          </Card>
        )}

        {notificationsQuery.isPending ? (
          <NotificationSkeletons />
        ) : notificationsQuery.error ? (
          <Card className="p-6 text-center" role="alert">
            <p className="text-sm font-semibold text-danger">
              {notificationsQuery.error.message || 'No se pudieron cargar las notificaciones.'}
            </p>
            <Button className="mt-4" onClick={() => notificationsQuery.refetch()}>
              Reintentar
            </Button>
          </Card>
        ) : notifications.length === 0 ? (
          <EmptyState
            description="Cuando recibas una notificación, aparecerá aquí."
            icon="notifications_off"
            title="No hay notificaciones"
          />
        ) : (
          <div aria-live="polite" className="space-y-3">
            {notifications.map((notification) => {
              const target = getInternalTarget(notification.datos)
              return (
                <Card
                  className={`flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5 ${
                    notification.leida ? '' : 'border-l-4 border-l-secondary'
                  }`}
                  key={notification.id}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="break-words font-bold text-ink">
                        {notification.titulo}
                      </h2>
                      <StatusBadge tone={notification.leida ? 'neutral' : 'info'}>
                        {notification.leida ? 'Leída' : 'Sin leer'}
                      </StatusBadge>
                      {notification.tipo && (
                        <StatusBadge tone="neutral">{notification.tipo}</StatusBadge>
                      )}
                    </div>
                    <p className="mt-2 whitespace-pre-wrap break-words text-sm text-muted">
                      {notification.mensaje}
                    </p>
                    <time
                      className="mt-3 block text-xs text-muted"
                      dateTime={notification.creada_en || undefined}
                    >
                      {formatCreatedAt(notification.creada_en)} · hora local
                    </time>
                    {target && (
                      <Button
                        className="mt-3"
                        onClick={() => navigate(target)}
                        variant="secondary"
                      >
                        Abrir
                      </Button>
                    )}
                  </div>
                  {!notification.leida && (
                    <Button
                      className="shrink-0"
                      disabled={markRead.isPending}
                      onClick={() => markRead.mutate(notification.id)}
                      variant="secondary"
                    >
                      {markRead.isPending &&
                      markRead.variables === notification.id
                        ? 'Actualizando…'
                        : 'Marcar como leída'}
                    </Button>
                  )}
                </Card>
              )
            })}
          </div>
        )}

        {!notificationsQuery.isPending &&
          !notificationsQuery.error &&
          (notificationsQuery.data?.hasNext || notificationsQuery.data?.hasPrevious) && (
            <nav aria-label="Paginación de notificaciones" className="flex items-center justify-center gap-4">
              <Button
                disabled={!notificationsQuery.data.hasPrevious || notificationsQuery.isFetching}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                variant="secondary"
              >
                Anterior
              </Button>
              <span aria-live="polite" className="text-xs text-muted">
                Página {page} · {notificationsQuery.data.count} notificaciones
              </span>
              <Button
                disabled={!notificationsQuery.data.hasNext || notificationsQuery.isFetching}
                onClick={() => setPage((current) => current + 1)}
                variant="secondary"
              >
                Siguiente
              </Button>
            </nav>
          )}
      </section>
    </AppShell>
  )
}
