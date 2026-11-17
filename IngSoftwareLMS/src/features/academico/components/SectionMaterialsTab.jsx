import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../../../shared/lib/queryKeys'
import ArchivosListTable from '../../archivos/components/ArchivosListTable'
import UploadMaterialForm from '../../archivos/components/UploadMaterialForm'

export default function SectionMaterialsTab({
  seccionId,
  materials = [],
  isLoading,
  canManageSection,
  onDeleteMaterial,
  isDeleting,
}) {
  const queryClient = useQueryClient()

  return (
    <div className="space-y-6">
      {canManageSection && (
        <UploadMaterialForm
          defaultSeccionId={seccionId}
          onUploaded={() => {
            queryClient.invalidateQueries({
              queryKey: queryKeys.archivos.all,
            })
          }}
        />
      )}

      <ArchivosListTable
        archivos={materials}
        canDelete={canManageSection}
        emptyDescription={
          canManageSection
            ? 'Arrastra y suelta documentos en el recuadro superior para compartir materiales de estudio con los estudiantes de esta sección.'
            : 'El docente aún no ha publicado materiales de estudio en esta sección.'
        }
        emptyTitle="Sin materiales de estudio en la sección"
        isDeleting={isDeleting}
        isLoading={isLoading}
        onDelete={onDeleteMaterial}
      />
    </div>
  )
}
