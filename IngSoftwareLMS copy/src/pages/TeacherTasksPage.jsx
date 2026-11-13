import { useState } from 'react'
import AppShell from '../components/layout/AppShell'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import EmptyState from '../components/ui/EmptyState'
import Skeleton from '../components/ui/Skeleton'
import StatusBadge from '../components/ui/StatusBadge'
import { useTareas } from '../features/academico/useTareas'
import { formatDateTimeCL } from '../features/academico/formatters'

export default function TeacherTasksPage() {
  const [page, setPage] = useState(1)
  const tareasQuery = useTareas(page)
  const tareas = tareasQuery.data?.results || []

  return (
    <AppShell>
      <section className="mx-auto flex max-w-[1150px] flex-col gap-6 px-4 py-8 sm:px-6 lg:px-10">
        <header>
          <p className="text-xs font-bold uppercase tracking-wider text-secondary-dark">
            Gestión Docente
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-primary">
            Tareas y entregas
          </h1>
          <p className="mt-1 text-sm text-muted">
            Consulta las tareas registradas en el módulo académico.
          </p>
        </header>

        <Card className="border border-warning/40 bg-warning-soft p-4 text-sm text-ink" role="status">
          La creación, edición, eliminación y revisión están deshabilitadas. La
          API local no verifica el rol docente ni la propiedad de las secciones,
          por lo que la interfaz no debe enviar esas operaciones.
        </Card>

        {tareasQuery.isPending ? (
          <Card className="space-y-3 p-5" role="status">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
          </Card>
        ) : tareasQuery.error ? (
          <Card className="p-6 text-center" role="alert">
            <p className="text-sm font-semibold text-danger-strong">
              {tareasQuery.error.message}
            </p>
            <Button className="mt-4" onClick={() => tareasQuery.refetch()}>
              Reintentar
            </Button>
          </Card>
        ) : tareas.length === 0 ? (
          <EmptyState
            description="Las tareas existentes aparecerán aquí."
            icon="assignment"
            title="Sin tareas registradas"
          />
        ) : (
          <div className="space-y-3">
            {tareas.map((tarea) => (
              <Card
                className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center"
                key={tarea.id}
              >
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-bold text-ink">{tarea.titulo}</h2>
                    <StatusBadge tone={tarea.permite_atrasados ? 'info' : 'neutral'}>
                      {tarea.permite_atrasados ? 'Permite atraso' : 'Cierre estricto'}
                    </StatusBadge>
                    {tarea.aplica_penalizacion_atraso && (
                      <StatusBadge tone="warning">Penalización 1%/h</StatusBadge>
                    )}
                  </div>
                  {tarea.descripcion && (
                    <p className="line-clamp-2 text-sm text-muted">{tarea.descripcion}</p>
                  )}
                  <p className="text-xs text-muted">
                    Fecha límite: {formatDateTimeCL(tarea.fecha_cierre)}
                  </p>
                </div>
                <Button disabled variant="secondary">
                  Gestión pendiente de permisos backend
                </Button>
              </Card>
            ))}
          </div>
        )}

        {(tareasQuery.data?.hasNext || tareasQuery.data?.hasPrevious) && (
          <nav
            aria-label="Paginación de tareas"
            className="flex items-center justify-center gap-4"
          >
            <Button
              disabled={!tareasQuery.data.hasPrevious || tareasQuery.isFetching}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              variant="secondary"
            >
              Anterior
            </Button>
            <span aria-live="polite" className="text-xs text-muted">
              Página {page}
            </span>
            <Button
              disabled={!tareasQuery.data.hasNext || tareasQuery.isFetching}
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
