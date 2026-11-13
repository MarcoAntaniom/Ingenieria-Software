import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import AppShell from '../components/layout/AppShell'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import { useSubmissionReceipt } from '../features/academico/useTasks'
import { downloadSubmissionFile } from '../services/tasks'

const dateFormatter = new Intl.DateTimeFormat('es-CL', {
  dateStyle: 'full',
  timeStyle: 'medium',
})

export default function SubmissionReceiptPage() {
  const { receiptId: rawReceiptId } = useParams()
  const receiptId = Number(rawReceiptId)
  const navigate = useNavigate()
  const [downloadError, setDownloadError] = useState('')
  const receipt = useSubmissionReceipt(
    Number.isInteger(receiptId) && receiptId > 0 ? receiptId : null,
  )

  async function downloadFile() {
    if (!receipt.data?.archivo) return
    setDownloadError('')
    try {
      await downloadSubmissionFile(receiptId, receipt.data.archivo)
    } catch (error) {
      setDownloadError(error.message)
    }
  }

  if (!Number.isInteger(receiptId) || receiptId < 1) {
    return (
      <AppShell>
        <section className="mx-auto max-w-2xl px-6 py-8 lg:px-10">
          <Card className="p-6" role="alert">La dirección del comprobante no es válida.</Card>
        </section>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <section className="mx-auto max-w-2xl space-y-5 px-6 py-8 lg:px-10">
        <Link
          className="text-sm font-bold text-primary underline-offset-4 hover:underline"
          to="/student/pending"
        >
          Volver a mis pendientes
        </Link>
        {receipt.isPending && (
          <p className="py-12 text-center text-sm text-muted" role="status">
            Cargando comprobante...
          </p>
        )}
        {receipt.isError && (
          <Card className="space-y-4 p-6" role="alert">
            <p className="font-semibold text-danger-strong">{receipt.error.message}</p>
            <Button onClick={() => receipt.refetch()} variant="secondary">
              Reintentar
            </Button>
          </Card>
        )}
        {receipt.isSuccess && (
          <Card className="space-y-5 p-6">
            <div className="text-center">
              <span aria-hidden="true" className="material-symbols-outlined text-5xl text-success">
                task_alt
              </span>
              <h1 className="mt-2 text-2xl font-extrabold text-primary">
                Comprobante de entrega
              </h1>
              <p className="mt-1 text-sm text-muted">
                El servidor confirmó el envío definitivo.
              </p>
            </div>
            <dl className="grid gap-4 border-y border-line py-5 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold text-muted">Tarea</dt>
                <dd className="mt-1 font-bold text-ink">{receipt.data.tarea}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-muted">Estudiante</dt>
                <dd className="mt-1 font-bold text-ink">{receipt.data.estudiante}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-muted">Estado</dt>
                <dd className="mt-1 font-bold text-ink">{receipt.data.estado}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-muted">Enviado oficialmente</dt>
                <dd className="mt-1 font-bold text-ink">
                  {dateFormatter.format(new Date(receipt.data.timestamp_oficial))}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold text-muted">Archivo</dt>
                <dd className="mt-1 break-all font-bold text-ink">
                  {receipt.data.archivo || 'No disponible'}
                </dd>
              </div>
            </dl>
            {receipt.data.es_fuera_de_plazo && (
              <p className="rounded-lg bg-secondary-container p-3 text-sm font-semibold text-on-secondary-container">
                El servidor registró esta entrega como fuera de plazo.
              </p>
            )}
            {downloadError && (
              <p className="text-sm text-danger-strong" role="alert">{downloadError}</p>
            )}
            <div className="flex flex-wrap justify-center gap-3">
              {receipt.data.archivo && (
                <Button onClick={downloadFile} variant="secondary">
                  Descargar archivo
                </Button>
              )}
              <Button onClick={() => window.print()} variant="secondary">
                Imprimir
              </Button>
              <Button onClick={() => navigate('/student/pending')}>
                Ir a mis pendientes
              </Button>
            </div>
          </Card>
        )}
      </section>
    </AppShell>
  )
}
