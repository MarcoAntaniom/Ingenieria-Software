import { useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import AppShell from '../components/layout/AppShell'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Modal from '../components/ui/Modal'
import {
  useConfirmTaskSubmission,
  useMyDelivery,
  useSaveTaskDraft,
  useTask,
} from '../features/academico/useTasks'
import { downloadSubmissionFile } from '../services/tasks'

const MAX_FILE_SIZE = 50 * 1024 * 1024
const ALLOWED_EXTENSIONS = new Set(['pdf', 'docx', 'zip'])
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

export default function StudentTaskPage() {
  const { taskId: rawTaskId } = useParams()
  const taskId = Number(rawTaskId)
  const isValidTaskId = Number.isInteger(taskId) && taskId > 0
  const navigate = useNavigate()
  const task = useTask(isValidTaskId ? taskId : null)
  const delivery = useMyDelivery(isValidTaskId ? taskId : null)
  const saveDraft = useSaveTaskDraft(taskId)
  const confirmSubmission = useConfirmTaskSubmission(taskId)
  const fileInputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [commentDraft, setCommentDraft] = useState(null)
  const comment = commentDraft ?? delivery.data?.comentario_estudiante ?? ''
  const [fileError, setFileError] = useState('')
  const [actionError, setActionError] = useState('')
  const [progress, setProgress] = useState(0)
  const [confirmOpen, setConfirmOpen] = useState(false)

  function chooseFile(event) {
    const selectedFile = event.target.files?.[0] || null
    setFileError('')
    if (!selectedFile) {
      setFile(null)
      return
    }

    const extension = selectedFile.name.split('.').pop()?.toLowerCase()
    if (!ALLOWED_EXTENSIONS.has(extension) || selectedFile.size > MAX_FILE_SIZE) {
      setFile(null)
      setFileError('Selecciona un archivo PDF, DOCX o ZIP de hasta 50 MB.')
      event.target.value = ''
      return
    }
    setFile(selectedFile)
  }

  function save() {
    setActionError('')
    setProgress(0)
    saveDraft.mutate(
      {
        file,
        comment,
        onProgress: setProgress,
      },
      {
        onSuccess: () => {
          setFile(null)
          setCommentDraft(null)
          if (fileInputRef.current) fileInputRef.current.value = ''
        },
        onError: (error) => setActionError(error.message),
      },
    )
  }

  function confirm() {
    if (!delivery.data?.id) return
    setActionError('')
    confirmSubmission.mutate(delivery.data.id, {
      onSuccess: (receipt) => {
        setConfirmOpen(false)
        navigate(`/receipts/${receipt.id_entrega}`)
      },
      onError: (error) => setActionError(error.message),
    })
  }

  async function downloadFile() {
    if (!delivery.data?.id || !delivery.data.archivo_nombre) return
    setActionError('')
    try {
      await downloadSubmissionFile(
        delivery.data.id,
        delivery.data.archivo_nombre,
      )
    } catch (error) {
      setActionError(error.message)
    }
  }

  if (!isValidTaskId) {
    return (
      <AppShell>
        <section className="mx-auto max-w-3xl px-6 py-8 lg:px-10">
          <Card className="p-6" role="alert">
            La dirección de la tarea no es válida.
          </Card>
        </section>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <section className="mx-auto max-w-3xl space-y-6 px-6 py-8 lg:px-10">
        <Link
          className="text-sm font-bold text-primary underline-offset-4 hover:underline"
          to="/student/pending"
        >
          Volver a mis pendientes
        </Link>

        {(task.isPending || delivery.isPending) && (
          <p className="py-12 text-center text-sm text-muted" role="status">
            Cargando tarea...
          </p>
        )}

        {(task.isError || delivery.isError) && (
          <Card className="space-y-3 p-6" role="alert">
            <p className="font-semibold text-danger-strong">
              {task.error?.message || delivery.error?.message}
            </p>
            <Button
              onClick={() => {
                task.refetch()
                delivery.refetch()
              }}
              variant="secondary"
            >
              Reintentar
            </Button>
          </Card>
        )}

        {task.isSuccess && delivery.isSuccess && (
          <>
            <header>
              <p className="text-sm font-semibold text-muted">
                {task.data.seccion?.asignatura?.nombre || 'Curso'}
                {task.data.seccion?.numero_seccion
                  ? ` · Sección ${task.data.seccion.numero_seccion}`
                  : ''}
              </p>
              <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-primary">
                {task.data.titulo}
              </h1>
              <p className="mt-3 text-sm text-muted">
                Fecha límite: <strong className="text-ink">{formatDeadline(task.data.fecha_cierre)}</strong>
              </p>
            </header>

            <Card className="space-y-6 p-6">
              <section>
                <h2 className="font-bold text-ink">Instrucciones</h2>
                <p className="mt-2 whitespace-pre-wrap text-sm text-muted">
                  {task.data.descripcion || 'El docente no agregó instrucciones.'}
                </p>
                {task.data.permite_atrasados && (
                  <p className="mt-3 text-xs font-semibold text-secondary">
                    Se permiten entregas fuera de plazo.
                  </p>
                )}
              </section>

              {['ENVIADO', 'EN_REVISION'].includes(delivery.data?.estado) ? (
                <section className="space-y-3 rounded-lg border border-line bg-surface p-4">
                  <p className="font-bold text-ink">
                    Entrega registrada: {delivery.data.estado === 'EN_REVISION' ? 'En revisión' : 'Enviada'}
                  </p>
                  {delivery.data.archivo_nombre && (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="break-all text-sm text-muted">{delivery.data.archivo_nombre}</p>
                      <Button onClick={downloadFile} variant="secondary">
                        Descargar archivo
                      </Button>
                    </div>
                  )}
                  {delivery.data.fecha_envio_definitivo && (
                    <Button
                      onClick={() => navigate(`/receipts/${delivery.data.id}`)}
                      variant="secondary"
                    >
                      Ver comprobante
                    </Button>
                  )}
                </section>
              ) : (
                <form
                  className="space-y-5"
                  onSubmit={(event) => {
                    event.preventDefault()
                    save()
                  }}
                >
                  <label className="block space-y-1.5 text-sm font-semibold text-ink" htmlFor="task-file">
                    Archivo de entrega
                    <input
                      accept=".pdf,.docx,.zip"
                      className="block min-h-12 w-full rounded-xl border border-line bg-subtle px-4 py-3 text-sm text-ink file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:font-bold file:text-white"
                      id="task-file"
                      onChange={chooseFile}
                      ref={fileInputRef}
                      type="file"
                    />
                    <span className="block text-xs font-normal text-muted">
                      PDF, DOCX o ZIP · máximo 50 MB. El servidor volverá a validar el archivo.
                    </span>
                  </label>
                  {fileError && <p className="text-sm text-danger-strong" role="alert">{fileError}</p>}
                  {(file || delivery.data?.archivo_nombre) && (
                    <p className="break-all text-sm text-muted">
                      Seleccionado: {file?.name || delivery.data?.archivo_nombre}
                    </p>
                  )}

                  <label className="block space-y-1.5 text-sm font-semibold text-ink" htmlFor="task-comment">
                    Comentario (opcional)
                    <textarea
                      className="min-h-28 w-full rounded-xl border border-line bg-subtle px-4 py-3 text-sm text-ink focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                      id="task-comment"
                      onChange={(event) => setCommentDraft(event.target.value)}
                      value={comment}
                    />
                  </label>

                  {saveDraft.isPending && (
                    <div aria-live="polite" className="space-y-2">
                      <progress aria-label="Progreso de guardado" className="w-full" max="100" value={progress} />
                      <p className="text-xs text-muted">Guardando borrador...</p>
                    </div>
                  )}
                  {(actionError || saveDraft.isError) && (
                    <p className="text-sm text-danger-strong" role="alert">
                      {actionError || saveDraft.error.message}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-3">
                    <Button disabled={saveDraft.isPending || Boolean(fileError)} type="submit">
                      Guardar borrador
                    </Button>
                    <Button
                      disabled={!delivery.data?.id || !delivery.data?.archivo_nombre || saveDraft.isPending}
                      onClick={() => setConfirmOpen(true)}
                      type="button"
                      variant="secondary"
                    >
                      Confirmar entrega
                    </Button>
                  </div>
                  <p className="text-xs text-muted">
                    Confirmar registra el envío definitivo. Después no podrás modificarlo salvo que el docente lo reabra.
                  </p>
                </form>
              )}
            </Card>
          </>
        )}
      </section>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Confirmar entrega definitiva"
      >
        <p className="text-sm text-muted">
          Esta acción registra la fecha oficial de envío y bloquea la edición del archivo.
        </p>
        {actionError && <p className="mt-3 text-sm text-danger-strong" role="alert">{actionError}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <Button onClick={() => setConfirmOpen(false)} variant="secondary">
            Cancelar
          </Button>
          <Button disabled={confirmSubmission.isPending} onClick={confirm}>
            {confirmSubmission.isPending ? 'Enviando...' : 'Confirmar envío'}
          </Button>
        </div>
      </Modal>
    </AppShell>
  )
}
