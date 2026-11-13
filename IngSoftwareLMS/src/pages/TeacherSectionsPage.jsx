import { useState } from 'react'
import { Link } from 'react-router-dom'
import AppShell from '../components/layout/AppShell'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import EmptyState from '../components/ui/EmptyState'
import { useTeacherSections } from '../features/academico/useTasks'

export default function TeacherSectionsPage() {
  const [page, setPage] = useState(1)
  const sections = useTeacherSections(page)

  return (
    <AppShell>
      <section className="mx-auto max-w-[1360px] space-y-6 px-6 py-8 lg:px-10">
        <header>
          <h1 className="text-2xl font-extrabold tracking-tight text-primary">
            Mis secciones
          </h1>
          <p className="mt-1 text-sm text-muted">
            Secciones asignadas a tu cuenta docente.
          </p>
        </header>

        {sections.isPending && (
          <p className="py-12 text-center text-sm text-muted" role="status">
            Cargando secciones...
          </p>
        )}
        {sections.isError && (
          <Card className="space-y-4 p-6" role="alert">
            <p className="font-semibold text-danger-strong">{sections.error.message}</p>
            <Button onClick={() => sections.refetch()} variant="secondary">
              Reintentar
            </Button>
          </Card>
        )}
        {sections.isSuccess && sections.data.results.length === 0 && (
          <EmptyState
            description="Cuando te asignen una sección, aparecerá en esta página."
            icon="groups"
            title="No tienes secciones asignadas"
          />
        )}
        {sections.isSuccess && sections.data.results.length > 0 && (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {sections.data.results.map((section) => (
                <Card className="space-y-4 p-5" key={section.id}>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-secondary">
                      {section.periodo_academico?.codigo || 'Período no disponible'}
                    </p>
                    <h2 className="mt-1 text-lg font-bold text-ink">
                      {section.asignatura?.nombre || 'Asignatura no disponible'}
                    </h2>
                    <p className="mt-1 text-sm text-muted">
                      {section.asignatura?.codigo || 'Sin código'}
                      {section.numero_seccion
                        ? ` · Sección ${section.numero_seccion}`
                        : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Link
                      className="inline-flex min-h-10 items-center justify-center rounded-lg border border-line bg-card px-4 py-2 text-sm font-bold text-primary hover:bg-subtle"
                      to={`/teacher/sections/${section.id}/tasks`}
                    >
                      Ver tareas
                    </Link>
                    <Link
                      className="inline-flex min-h-10 items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white transition hover:bg-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                      to={`/teacher/tasks/new?seccion=${section.id}`}
                    >
                      Crear tarea
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
            {(sections.data.hasPrevious || sections.data.hasNext) && (
              <div className="flex items-center justify-between gap-4">
                <Button
                  disabled={!sections.data.hasPrevious}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  variant="secondary"
                >
                  Anterior
                </Button>
                <p className="text-xs text-muted">{sections.data.count} secciones</p>
                <Button
                  disabled={!sections.data.hasNext}
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
