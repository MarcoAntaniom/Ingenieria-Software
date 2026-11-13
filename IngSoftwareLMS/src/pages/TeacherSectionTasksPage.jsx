import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AppShell from '../components/layout/AppShell'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import EmptyState from '../components/ui/EmptyState'
import { useTeacherTasks } from '../features/academico/useTasks'

const deadlineFormatter = new Intl.DateTimeFormat('es-CL', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export default function TeacherSectionTasksPage() {
  const { sectionId: rawSectionId } = useParams()
  const sectionId = Number(rawSectionId)
  const validSectionId = Number.isInteger(sectionId) && sectionId > 0
  const [page, setPage] = useState(1)
  const tasks = useTeacherTasks(validSectionId ? sectionId : null, page)

  return (
    <AppShell>
      <section className="mx-auto max-w-[1360px] space-y-6 px-6 py-8 lg:px-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link
              className="text-sm font-bold text-primary underline-offset-4 hover:underline"
              to="/teacher/sections"
            >
              Volver a mis secciones
            </Link>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-primary">
              Tareas de la sección
            </h1>
          </div>
          {validSectionId && (
            <Link
              className="inline-flex min-h-10 items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white transition hover:bg-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              to={`/teacher/tasks/new?seccion=${sectionId}`}
            >
              Crear tarea
            </Link>
          )}
        </div>

        {!validSectionId && (
          <Card className="p-6" role="alert">La dirección de la sección no es válida.</Card>
        )}
        {validSectionId && tasks.isPending && (
          <p className="py-12 text-center text-sm text-muted" role="status">
            Cargando tareas...
          </p>
        )}
        {validSectionId && tasks.isError && (
          <Card className="space-y-4 p-6" role="alert">
            <p className="font-semibold text-danger-strong">{tasks.error.message}</p>
            <Button onClick={() => tasks.refetch()} variant="secondary">
              Reintentar
            </Button>
          </Card>
        )}
        {validSectionId && tasks.isSuccess && tasks.data.results.length === 0 && (
          <EmptyState
            action={(
              <Link
                className="inline-flex min-h-10 items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white"
                to={`/teacher/tasks/new?seccion=${sectionId}`}
              >
                Crear primera tarea
              </Link>
            )}
            description="Las tareas que publiques para esta sección aparecerán aquí."
            icon="assignment"
            title="Aún no hay tareas"
          />
        )}
        {validSectionId && tasks.isSuccess && tasks.data.results.length > 0 && (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              {tasks.data.results.map((task) => (
                <Card className="flex flex-col gap-4 p-5" key={task.id}>
                  <div>
                    <h2 className="text-lg font-bold text-ink">{task.titulo}</h2>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-muted">
                      {task.descripcion || 'Sin instrucciones adicionales.'}
                    </p>
                  </div>
                  <p className="mt-auto text-sm text-muted">
                    Fecha límite:{' '}
                    <strong className="text-ink">
                      {deadlineFormatter.format(new Date(task.fecha_cierre))}
                    </strong>
                  </p>
                  <Link
                    className="inline-flex min-h-10 items-center justify-center rounded-lg border border-line bg-card px-4 py-2 text-sm font-bold text-primary hover:bg-subtle"
                    to={`/teacher/tasks/${task.id}/edit`}
                  >
                    Editar tarea
                  </Link>
                </Card>
              ))}
            </div>
            {(tasks.data.hasPrevious || tasks.data.hasNext) && (
              <div className="flex items-center justify-between gap-4">
                <Button
                  disabled={!tasks.data.hasPrevious}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  variant="secondary"
                >
                  Anterior
                </Button>
                <p className="text-xs text-muted">{tasks.data.count} tareas</p>
                <Button
                  disabled={!tasks.data.hasNext}
                  onClick={() => setPage((current) => current + 1)}
                  variant="secondary"
                >
                  Siguiente
                </Button>
              </div>
            )}
          </>
        )}
      </section>
    </AppShell>
  )
}
