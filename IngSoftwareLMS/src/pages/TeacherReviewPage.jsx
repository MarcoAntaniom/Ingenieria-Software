import { useState } from 'react'
import AppShell from '../components/layout/AppShell'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import EmptyState from '../components/ui/EmptyState'
import {
  useMarkSubmissionInReview,
  useReopenSubmission,
  useTeacherSubmissions,
} from '../features/academico/useTasks'
import { downloadSubmissionFile } from '../services/tasks'

const dateFormatter = new Intl.DateTimeFormat('es-CL', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export default function TeacherReviewPage() {
  const [page, setPage] = useState(1)
  const [actionError, setActionError] = useState('')
  const submissions = useTeacherSubmissions(page)
  const markInReview = useMarkSubmissionInReview()
  const reopen = useReopenSubmission()

  async function downloadFile(submission) {
    setActionError('')
    try {
      await downloadSubmissionFile(submission.id, submission.archivo_nombre)
    } catch (error) {
      setActionError(error.message)
    }
  }

  function runAction(mutation, submissionId) {
    setActionError('')
    mutation.mutate(submissionId, {
      onError: (error) => setActionError(error.message),
    })
  }

  return (
    <AppShell>
      <section className="mx-auto max-w-[1360px] space-y-6 px-6 py-8 lg:px-10">
        <header>
          <h1 className="text-2xl font-extrabold tracking-tight text-primary">
            Bandeja de corrección
          </h1>
          <p className="mt-1 text-sm text-muted">
            Entregas enviadas en las secciones que tienes asignadas.
          </p>
        </header>

        {actionError && <p className="text-sm text-danger-strong" role="alert">{actionError}</p>}
        {submissions.isPending && (
          <p className="py-12 text-center text-sm text-muted" role="status">
            Cargando entregas...
          </p>
        )}
        {submissions.isError && (
          <Card className="space-y-4 p-6" role="alert">
            <p className="font-semibold text-danger-strong">{submissions.error.message}</p>
            <Button onClick={() => submissions.refetch()} variant="secondary">
              Reintentar
            </Button>
          </Card>
        )}
        {submissions.isSuccess && submissions.data.results.length === 0 && (
          <EmptyState
            description="Las entregas enviadas aparecerán aquí para su revisión."
            icon="fact_check"
            title="No hay entregas para revisar"
          />
        )}
        {submissions.isSuccess && submissions.data.results.length > 0 && (
          <>
            <div className="space-y-4">
              {submissions.data.results.map((submission) => {
                const task = submission.tarea_detalles
                const section = task?.seccion
                const subject = section?.asignatura
                return (
                  <Card className="space-y-4 p-5" key={submission.id}>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h2 className="text-lg font-bold text-ink">
                          {task?.titulo || 'Tarea'}
                        </h2>
                        <p className="mt-1 text-sm text-muted">
                          {subject?.nombre || 'Asignatura'}
                          {section?.numero_seccion
                            ? ` · Sección ${section.numero_seccion}`
                            : ''}
                          {section?.periodo_academico?.codigo
                            ? ` · ${section.periodo_academico.codigo}`
                            : ''}
                        </p>
                      </div>
                      <span className="rounded-full bg-secondary-container px-3 py-1 text-xs font-bold text-on-secondary-container">
                        {submission.estado}
                      </span>
                    </div>
                    <dl className="grid gap-3 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="text-xs font-semibold text-muted">Estudiante</dt>
                        <dd className="mt-1 font-semibold text-ink">
                          {submission.estudiante_nombre}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold text-muted">Fecha de envío</dt>
                        <dd className="mt-1 font-semibold text-ink">
                          {submission.fecha_envio_definitivo
                            ? dateFormatter.format(new Date(submission.fecha_envio_definitivo))
                            : 'No disponible'}
                        </dd>
                      </div>
                      <div className="sm:col-span-2">
                        <dt className="text-xs font-semibold text-muted">Archivo</dt>
                        <dd className="mt-1 break-all font-semibold text-ink">
                          {submission.archivo_nombre || 'Sin archivo'}
                        </dd>
                      </div>
                    </dl>
                    {submission.comentario_estudiante && (
                      <p className="whitespace-pre-wrap rounded-lg bg-surface p-3 text-sm text-muted">
                        {submission.comentario_estudiante}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-3 border-t border-line pt-4">
                      {submission.archivo_nombre && (
                        <Button
                          onClick={() => downloadFile(submission)}
                          variant="secondary"
                        >
                          Descargar entrega
                        </Button>
                      )}
                      {submission.estado === 'ENVIADO' && (
                        <Button
                          disabled={markInReview.isPending}
                          onClick={() => runAction(markInReview, submission.id)}
                        >
                          Marcar en revisión
                        </Button>
                      )}
                      {submission.estado === 'EN_REVISION' && (
                        <Button
                          disabled={reopen.isPending}
                          onClick={() => runAction(reopen, submission.id)}
                          variant="secondary"
                        >
                          Reabrir entrega
                        </Button>
                      )}
                    </div>
                  </Card>
                )
              })}
            </div>
            {(submissions.data.hasPrevious || submissions.data.hasNext) && (
              <div className="flex items-center justify-between gap-4">
                <Button
                  disabled={!submissions.data.hasPrevious}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  variant="secondary"
                >
                  Anterior
                </Button>
                <p className="text-xs text-muted">
                  {submissions.data.count} entregas
                </p>
                <Button
                  disabled={!submissions.data.hasNext}
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
