import { useState } from 'react'
import { Link } from 'react-router-dom'
import AppShell from '../components/layout/AppShell'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import EmptyState from '../components/ui/EmptyState'
import { useStudentPending } from '../features/academico/useTasks'

const deadlineFormatter = new Intl.DateTimeFormat('es-CL', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

function formatDeadline(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Fecha no disponible'
    : deadlineFormatter.format(date)
}

export default function StudentPendingPage() {
  const [page, setPage] = useState(1)
  const pending = useStudentPending(page)

  return (
    <AppShell>
      <section className="mx-auto max-w-[1360px] space-y-6 px-6 py-8 lg:px-10">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-primary">
            Mis pendientes
          </h1>
          <p className="mt-1 text-sm text-muted">
            Tareas de las secciones en las que estás inscrito.
          </p>
        </div>

        {pending.isPending && (
          <p className="py-12 text-center text-sm text-muted" role="status">
            Cargando tareas pendientes...
          </p>
        )}

        {pending.isError && (
          <Card className="space-y-4 p-6" role="alert">
            <p className="font-semibold text-danger-strong">
              {pending.error.message}
            </p>
            <Button onClick={() => pending.refetch()} variant="secondary">
              Reintentar
            </Button>
          </Card>
        )}

        {pending.isSuccess && pending.data.results.length === 0 && (
          <EmptyState
            description="Cuando haya tareas pendientes en tus secciones, aparecerán aquí."
            icon="task_alt"
            title="No tienes tareas pendientes"
          />
        )}

        {pending.isSuccess && pending.data.results.length > 0 && (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              {pending.data.results.map((task) => {
                const subject = task.seccion?.asignatura
                const period = task.seccion?.periodo_academico?.codigo
                const draft = task.entrega
                return (
                  <Card className="flex flex-col gap-4 p-5" key={task.id}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-bold text-ink">
                          {task.titulo}
                        </h2>
                        <p className="mt-1 text-sm text-muted">
                          {[subject?.nombre, subject?.codigo && `(${subject.codigo})`]
                            .filter(Boolean)
                            .join(' ')}
                          {task.seccion?.numero_seccion
                            ? ` · Sección ${task.seccion.numero_seccion}`
                            : ''}
                          {period ? ` · ${period}` : ''}
                        </p>
                      </div>
                      {draft && (
                        <span className="rounded-full bg-secondary-container px-3 py-1 text-xs font-bold text-on-secondary-container">
                          {draft.estado === 'REABIERTA' ? 'Reabierta' : 'Borrador'}
                        </span>
                      )}
                    </div>
                    <p className="line-clamp-3 whitespace-pre-wrap text-sm text-muted">
                      {task.descripcion || 'La tarea no tiene instrucciones adicionales.'}
                    </p>
                    <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                      <div>
                        <p className="text-xs font-semibold text-muted">Fecha límite</p>
                        <p className="mt-1 text-sm font-bold text-ink">
                          {formatDeadline(task.fecha_cierre)}
                        </p>
                      </div>
                      <Link
                        className="inline-flex min-h-10 items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white transition hover:bg-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                        to={`/tasks/${task.id}`}
                      >
                        {draft ? 'Continuar entrega' : 'Ver tarea'}
                      </Link>
                    </div>
                  </Card>
                )
              })}
            </div>
            <div className="flex items-center justify-between gap-4">
              <Button
                disabled={!pending.data.hasPrevious}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                variant="secondary"
              >
                Anterior
              </Button>
              <p className="text-xs text-muted">
                {pending.data.count} tareas pendientes
              </p>
              <Button
                disabled={!pending.data.hasNext}
                onClick={() => setPage((current) => current + 1)}
                variant="secondary"
              >
                Siguiente
              </Button>
            </div>
          </>
        )}
      </section>
    </AppShell>
  )
}
