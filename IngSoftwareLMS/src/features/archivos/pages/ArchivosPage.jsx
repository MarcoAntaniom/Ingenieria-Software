import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuth } from '../../../contexts/auth-context'
import { queryKeys } from '../../../shared/lib/queryKeys'
import { extractApiError } from '../../../shared/lib/pagination'
import { getUserRoleCode, ROLES } from '../../../shared/lib/roles'
import {
  EmptyState,
  ErrorState,
  PageHeader,
} from '../../../shared/components/ui/StateViews'
import FileDropzoneUploader from '../../../shared/components/ui/FileDropzoneUploader'
import { fetchSecciones } from '../../academico/api/academicoApi'
import {
  deleteArchivo,
  fetchArchivos,
  fetchMaterialesEstudio,
} from '../api/archivosApi'
import ArchivosListTable from '../components/ArchivosListTable'
import UploadMaterialForm from '../components/UploadMaterialForm'

export default function ArchivosPage() {
  const { user } = useAuth()
  const roleCode = getUserRoleCode(user)
  const canManageMaterials =
    roleCode === ROLES.DOCENTE || roleCode === ROLES.ADMIN
  const canDeleteFiles =
    roleCode === ROLES.DOCENTE || roleCode === ROLES.ADMIN

  const [activeTab, setActiveTab] = useState('materiales')
  const [soloMios, setSoloMios] = useState(false)
  const [selectedSeccion, setSelectedSeccion] = useState('')
  const queryClient = useQueryClient()

  const seccionesQuery = useQuery({
    queryKey: queryKeys.academico.secciones(),
    queryFn: fetchSecciones,
  })

  const sections = seccionesQuery.data?.items || []
  const activeSeccionId =
    selectedSeccion || (sections.length > 0 ? String(sections[0].id) : '')

  const materialesQuery = useQuery({
    queryKey: queryKeys.archivos.materiales({
      seccion: activeSeccionId ? Number(activeSeccionId) : undefined,
    }),
    queryFn: () =>
      fetchMaterialesEstudio({
        seccion: activeSeccionId ? Number(activeSeccionId) : undefined,
      }),
    enabled: Boolean(activeSeccionId),
  })

  const effectiveSoloMios = !canManageMaterials ? true : soloMios

  const archivosQuery = useQuery({
    queryKey: queryKeys.archivos.list({ mios: effectiveSoloMios }),
    queryFn: () => fetchArchivos({ mios: effectiveSoloMios }),
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

  const materiales = (materialesQuery.data || []).filter(
    (m) => Number(m.seccion_id) === Number(activeSeccionId),
  )
  const archivos = archivosQuery.data || []

  return (
    <div className="flex flex-col">
      <PageHeader
        eyebrow="Almacenamiento y Recursos Académicos"
        title="Materiales de Estudio por Sección y Repositorio (Drag & Drop)"
        badge={`${materiales.length} materiales en sección · ${archivos.length} archivos`}
        description="Los materiales de estudio se asignan y consultan exclusivamente por sección académica. Solo docentes y administradores pueden publicar nuevos materiales."
      />

      <div className="mx-auto flex w-full max-w-[1360px] flex-col gap-6 px-6 py-6 lg:px-10">
        {!canDeleteFiles && (
          <div className="flex items-center gap-3 rounded-xl border border-amber-300 bg-amber-50/90 px-4 py-3 text-xs text-amber-950">
            <span className="material-symbols-outlined text-lg text-amber-700">
              info
            </span>
            <div>
              <p className="font-bold">
                Permisos de Estudiante en Archivos y Materiales
              </p>
              <p className="text-[11px] text-amber-900">
                Puedes <strong>ver y descargar</strong> todos los archivos que hayas subido en tus entregas y los materiales de estudio de tus secciones. Solo docentes y administradores pueden publicar nuevos materiales o eliminar archivos.
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2 rounded-xl border border-line bg-card p-1.5 shadow-xs">
            <button
              className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition ${
                activeTab === 'materiales'
                  ? 'bg-primary text-white'
                  : 'text-muted hover:bg-subtle'
              }`}
              onClick={() => setActiveTab('materiales')}
              type="button"
            >
              <span className="material-symbols-outlined text-base">
                menu_book
              </span>
              Materiales de la Sección ({materiales.length})
            </button>
            <button
              className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition ${
                activeTab === 'repositorio'
                  ? 'bg-primary text-white'
                  : 'text-muted hover:bg-subtle'
              }`}
              onClick={() => setActiveTab('repositorio')}
              type="button"
            >
              <span className="material-symbols-outlined text-base">
                folder_open
              </span>
              {canManageMaterials
                ? `Repositorio de Entregas (${archivos.length})`
                : `Mis Archivos Subidos (${archivos.length})`}
            </button>
          </div>

          {activeTab === 'materiales' ? (
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-ink">
                Sección académica:
              </label>
              <select
                className="min-w-[240px] rounded-xl border border-line bg-card px-3 py-1.5 text-xs font-bold text-ink"
                onChange={(e) => setSelectedSeccion(e.target.value)}
                value={activeSeccionId}
              >
                {sections.length === 0 ? (
                  <option value="">Sin secciones disponibles</option>
                ) : (
                  sections.map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      {sec.code} · {sec.title} (Sec. {sec.section})
                    </option>
                  ))
                )}
              </select>
            </div>
          ) : (
            canManageMaterials && (
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
            )
          )}
        </div>

        {activeTab === 'materiales' ? (
          !activeSeccionId ? (
            <EmptyState
              icon="school"
              title="Selecciona una sección académica"
              description="Los materiales de estudio se asignan obligatoriamente a una sección específica."
            />
          ) : (
            <>
              {canManageMaterials && (
                <UploadMaterialForm
                  defaultSeccionId={Number(activeSeccionId)}
                  onUploaded={() => {
                    queryClient.invalidateQueries({
                      queryKey: queryKeys.archivos.all,
                    })
                  }}
                  sections={sections}
                />
              )}

              {materialesQuery.isError ? (
                <ErrorState
                  message={extractApiError(materialesQuery.error)}
                  onRetry={() => materialesQuery.refetch()}
                />
              ) : (
                <ArchivosListTable
                  archivos={materiales}
                  canDelete={canDeleteFiles}
                  emptyDescription={
                    canManageMaterials
                      ? 'Arrastra y suelta documentos en el formulario superior para publicar el primer material de estudio de esta sección.'
                      : 'Aún no se han publicado materiales de estudio en esta sección.'
                  }
                  emptyTitle="Sin materiales de estudio en esta sección"
                  isDeleting={deleteMutation.isPending}
                  isLoading={materialesQuery.isLoading}
                  onDelete={(id) => deleteMutation.mutate(id)}
                />
              )}
            </>
          )
        ) : (
          <>
            {canManageMaterials && (
              <div className="rounded-2xl border border-line bg-card p-6 shadow-xs">
                <h2 className="mb-3 text-sm font-extrabold text-ink">
                  Subir archivos al repositorio arrastrando y soltando
                </h2>
                <FileDropzoneUploader
                  onUploadComplete={() => {
                    queryClient.invalidateQueries({
                      queryKey: queryKeys.archivos.all,
                    })
                  }}
                />
              </div>
            )}

            {archivosQuery.isError ? (
              <ErrorState
                message={extractApiError(archivosQuery.error)}
                onRetry={() => archivosQuery.refetch()}
              />
            ) : (
              <ArchivosListTable
                archivos={archivos}
                canDelete={canDeleteFiles}
                emptyDescription={
                  canManageMaterials
                    ? 'Aquí aparecerán los archivos subidos al repositorio y las entregas de tus secciones para ver o descargar.'
                    : 'Cuando subas archivos en tus entregas de tareas, aparecerán aquí para que puedas verlos y descargarlos en cualquier momento.'
                }
                emptyTitle={
                  canManageMaterials
                    ? 'Aún no hay archivos en el repositorio'
                    : 'Aún no has subido archivos'
                }
                isDeleting={deleteMutation.isPending}
                isLoading={archivosQuery.isLoading}
                onDelete={(id) => deleteMutation.mutate(id)}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}
