import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { queryKeys } from '../../../shared/lib/queryKeys'
import { extractApiError } from '../../../shared/lib/pagination'
import {
  ErrorState,
  PageHeader,
} from '../../../shared/components/ui/StateViews'
import FileDropzoneUploader from '../../../shared/components/ui/FileDropzoneUploader'
import { deleteArchivo, fetchArchivos } from '../api/archivosApi'
import ArchivosListTable from '../components/ArchivosListTable'

export default function ArchivosPage() {
  const [soloMios, setSoloMios] = useState(false)
  const queryClient = useQueryClient()

  const archivosQuery = useQuery({
    queryKey: queryKeys.archivos.list({ mios: soloMios }),
    queryFn: () => fetchArchivos({ mios: soloMios }),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteArchivo,
    onSuccess: () => {
      toast.success('Archivo eliminado correctamente.')
      queryClient.invalidateQueries({ queryKey: queryKeys.archivos.all })
    },
    onError: (err) => {
      toast.error(extractApiError(err, 'No se pudo eliminar el archivo.'))
    },
  })

  const archivos = archivosQuery.data || []

  return (
    <div className="flex flex-col">
      <PageHeader
        eyebrow="Almacenamiento Académico"
        title="Repositorio de Archivos (Drag & Drop)"
        badge={`${archivos.length} archivos`}
        description="Arrastra y suelta tus documentos en cualquier parte del recuadro para subirlos al servidor o reutilizarlos en entregas y anuncios."
      />

      <div className="mx-auto flex w-full max-w-[1360px] flex-col gap-6 px-6 py-6 lg:px-10">
        <div className="rounded-2xl border border-line bg-card p-6 shadow-xs">
          <h2 className="mb-3 text-sm font-extrabold text-ink">
            Subir nuevos archivos arrastrando y soltando
          </h2>
          <FileDropzoneUploader
            onUploadComplete={() => {
              queryClient.invalidateQueries({ queryKey: queryKeys.archivos.all })
            }}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-2 rounded-xl border border-line bg-card p-1.5 shadow-xs">
            <button
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
                !soloMios
                  ? 'bg-primary text-white'
                  : 'text-muted hover:bg-subtle'
              }`}
              onClick={() => setSoloMios(false)}
              type="button"
            >
              Todos los archivos
            </button>
            <button
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
                soloMios
                  ? 'bg-primary text-white'
                  : 'text-muted hover:bg-subtle'
              }`}
              onClick={() => setSoloMios(true)}
              type="button"
            >
              Subidos por mí
            </button>
          </div>
        </div>

        {archivosQuery.isError ? (
          <ErrorState
            message={extractApiError(archivosQuery.error)}
            onRetry={() => archivosQuery.refetch()}
          />
        ) : (
          <ArchivosListTable
            archivos={archivos}
            isDeleting={deleteMutation.isPending}
            isLoading={archivosQuery.isLoading}
            onDelete={(id) => deleteMutation.mutate(id)}
          />
        )}
      </div>
    </div>
  )
}
