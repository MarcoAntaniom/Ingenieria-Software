import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { queryKeys } from '../../../shared/lib/queryKeys'
import { extractApiError } from '../../../shared/lib/pagination'
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
} from '../../../shared/components/ui/StateViews'
import {
  fetchNotifications,
  fetchNotificationTypes,
  fetchUnreadCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '../api/notificacionesApi'
import { useNotificationStore } from '../store/useNotificationStore'
import NotificationFiltersBar from '../components/NotificationFiltersBar'
import NotificationItemCard from '../components/NotificationItemCard'

export default function NotificacionesPage() {
  const [readFilter, setReadFilter] = useState('all')
  const [selectedType, setSelectedType] = useState('')
  const queryClient = useQueryClient()
  const wsStatus = useNotificationStore((state) => state.wsStatus)

  const currentReadBoolean =
    readFilter === 'unread' ? false : readFilter === 'read' ? true : undefined

  const notificationsQuery = useQuery({
    queryKey: queryKeys.notificaciones.list({
      leida: currentReadBoolean,
      tipo: selectedType || undefined,
    }),
    queryFn: () =>
      fetchNotifications({
        leida: currentReadBoolean,
        tipo: selectedType || undefined,
      }),
  })

  const typesQuery = useQuery({
    queryKey: queryKeys.notificaciones.tipos,
    queryFn: fetchNotificationTypes,
  })

  const unreadCountQuery = useQuery({
    queryKey: queryKeys.notificaciones.unreadCount,
    queryFn: fetchUnreadCount,
  })

  const markOneMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notificaciones.all })
    },
    onError: (err) => {
      toast.error(extractApiError(err, 'No se pudo marcar la notificación.'))
    },
  })

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      toast.success('Todas las notificaciones fueron marcadas como leídas.')
      queryClient.invalidateQueries({ queryKey: queryKeys.notificaciones.all })
    },
    onError: (err) => {
      toast.error(extractApiError(err, 'No se pudieron marcar las notificaciones.'))
    },
  })

  const items = notificationsQuery.data?.items || []
  const unreadCount = unreadCountQuery.data ?? 0
  const types = typesQuery.data || []

  const wsBadge = {
    connected: { text: 'Tiempo real activo', color: 'bg-emerald-100 text-emerald-800' },
    connecting: { text: 'Conectando WS...', color: 'bg-amber-100 text-amber-800' },
    error: { text: 'Reconectando WS', color: 'bg-rose-100 text-rose-800' },
    disconnected: { text: 'Modo REST', color: 'bg-slate-200 text-slate-700' },
  }[wsStatus] || { text: 'Modo REST', color: 'bg-slate-200 text-slate-700' }

  return (
    <div className="flex flex-col">
      <PageHeader
        eyebrow="Centro de Eventos"
        title="Notificaciones"
        badge={`${unreadCount} sin leer`}
        description="Avisos de anuncios, tareas, evaluaciones, foros y mensajes directos en tiempo real."
        actions={
          <>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${wsBadge.color}`}
            >
              <span className="size-2 rounded-full bg-current" />
              {wsBadge.text}
            </span>
            <button
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white transition hover:bg-primary-dark disabled:opacity-50"
              disabled={unreadCount === 0 || markAllMutation.isPending}
              onClick={() => markAllMutation.mutate()}
              type="button"
            >
              <span className="material-symbols-outlined text-base" aria-hidden="true">
                done_all
              </span>
              Marcar todas como leídas
            </button>
          </>
        }
      />

      <div className="mx-auto flex w-full max-w-[1360px] flex-col gap-6 px-6 py-6 lg:px-10">
        <NotificationFiltersBar
          onSelectReadFilter={setReadFilter}
          onSelectType={setSelectedType}
          readFilter={readFilter}
          selectedType={selectedType}
          types={types}
        />

        {notificationsQuery.isLoading ? (
          <LoadingState label="Consultando tu historial de notificaciones..." />
        ) : notificationsQuery.isError ? (
          <ErrorState
            message={extractApiError(
              notificationsQuery.error,
              'No se pudieron cargar las notificaciones.',
            )}
            onRetry={() => notificationsQuery.refetch()}
          />
        ) : items.length === 0 ? (
          <EmptyState
            icon="notifications_none"
            title="No tienes notificaciones en esta vista"
            description="Cuando se publiquen anuncios, tareas, calificaciones o mensajes nuevos, aparecerán aquí automáticamente."
          />
        ) : (
          <div className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-card shadow-xs">
            {items.map((item) => (
              <NotificationItemCard
                isPending={markOneMutation.isPending}
                item={item}
                key={item.id}
                onMarkAsRead={(id) => markOneMutation.mutate(id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
