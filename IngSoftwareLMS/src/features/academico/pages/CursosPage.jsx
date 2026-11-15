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
  LoadingState,
  PageHeader,
} from '../../../shared/components/ui/StateViews'
import CourseCard from '../components/CourseCard'
import CreateSeccionModal from '../components/CreateSeccionModal'
import CreateInscripcionModal from '../components/CreateInscripcionModal'
import InscripcionesTable from '../components/InscripcionesTable'
import {
  createInscripcion,
  createSeccion,
  fetchAsignaturas,
  fetchEstadosInscripcion,
  fetchInscripciones,
  fetchPeriodosAcademicos,
  fetchSecciones,
} from '../api/academicoApi'
import { fetchStudentProfiles } from '../../usuarios/api/usuariosApi'

export default function CursosPage() {
  const [viewMode, setViewMode] = useState('secciones')
  const [seccionModalOpen, setSeccionModalOpen] = useState(false)
  const [inscripcionModalOpen, setInscripcionModalOpen] = useState(false)

  const { user } = useAuth()
  const roleCode = getUserRoleCode(user)
  const canManage = roleCode === ROLES.ADMIN || roleCode === ROLES.DOCENTE
  const queryClient = useQueryClient()

  const seccionesQuery = useQuery({
    queryKey: queryKeys.academico.secciones(),
    queryFn: fetchSecciones,
  })

  const inscripcionesQuery = useQuery({
    queryKey: queryKeys.academico.inscripciones(),
    queryFn: fetchInscripciones,
  })

  const asignaturasQuery = useQuery({
    queryKey: queryKeys.academico.asignaturas(),
    queryFn: fetchAsignaturas,
    enabled: canManage && seccionModalOpen,
  })

  const periodosQuery = useQuery({
    queryKey: queryKeys.academico.periodos,
    queryFn: fetchPeriodosAcademicos,
    enabled: canManage && seccionModalOpen,
  })

  const studentProfilesQuery = useQuery({
    queryKey: queryKeys.usuarios.studentProfiles,
    queryFn: fetchStudentProfiles,
    enabled: canManage && inscripcionModalOpen,
  })

  const estadosInscripcionQuery = useQuery({
    queryKey: queryKeys.academico.estadosInscripcion,
    queryFn: fetchEstadosInscripcion,
    enabled: canManage && inscripcionModalOpen,
  })

  const createSeccionMutation = useMutation({
    mutationFn: createSeccion,
    onSuccess: () => {
      toast.success('Sección creada correctamente.')
      setSeccionModalOpen(false)
      queryClient.invalidateQueries({ queryKey: ['academico'] })
    },
    onError: (err) => {
      toast.error(extractApiError(err, 'No se pudo crear la sección.'))
    },
  })

  const createInscripcionMutation = useMutation({
    mutationFn: createInscripcion,
    onSuccess: () => {
      toast.success('Estudiante inscrito correctamente en la sección.')
      setInscripcionModalOpen(false)
      queryClient.invalidateQueries({ queryKey: ['academico', 'inscripciones'] })
    },
    onError: (err) => {
      toast.error(extractApiError(err, 'No se pudo registrar la inscripción.'))
    },
  })

  const courses = seccionesQuery.data?.items || []
  const enrollments = inscripcionesQuery.data?.items || []

  return (
    <div className="flex flex-col">
      <PageHeader
        eyebrow="Módulo Académico"
        title="Cursos, Secciones e Inscripciones"
        badge={`${courses.length} secciones`}
        description="Explora las secciones ofertadas, ingresa al aula virtual de cada ramo o revisa las inscripciones activas."
        actions={
          canManage && (
            <>
              <button
                className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-card px-4 py-2 text-xs font-bold text-ink transition hover:bg-subtle"
                onClick={() => setInscripcionModalOpen(true)}
                type="button"
              >
                <span className="material-symbols-outlined text-base" aria-hidden="true">
                  person_add
                </span>
                Inscribir estudiante
              </button>
              <button
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white transition hover:bg-primary-dark"
                onClick={() => setSeccionModalOpen(true)}
                type="button"
              >
                <span className="material-symbols-outlined text-base" aria-hidden="true">
                  add
                </span>
                Nueva sección
              </button>
            </>
          )
        }
      />

      <div className="mx-auto flex w-full max-w-[1360px] flex-col gap-6 px-6 py-6 lg:px-10">
        <div className="flex w-max gap-2 rounded-xl border border-line bg-card p-2 shadow-xs">
          <button
            className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
              viewMode === 'secciones'
                ? 'bg-primary text-white'
                : 'text-muted hover:bg-subtle'
            }`}
            onClick={() => setViewMode('secciones')}
            type="button"
          >
            Secciones Académicas ({courses.length})
          </button>
          <button
            className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
              viewMode === 'inscripciones'
                ? 'bg-primary text-white'
                : 'text-muted hover:bg-subtle'
            }`}
            onClick={() => setViewMode('inscripciones')}
            type="button"
          >
            Inscripciones ({enrollments.length})
          </button>
        </div>

        {viewMode === 'secciones' ? (
          seccionesQuery.isLoading ? (
            <LoadingState label="Cargando secciones académicas..." />
          ) : seccionesQuery.isError ? (
            <ErrorState
              message={extractApiError(seccionesQuery.error)}
              onRetry={() => seccionesQuery.refetch()}
            />
          ) : courses.length === 0 ? (
            <EmptyState
              icon="school"
              title="No hay secciones registradas"
              description="Crea una sección desde el botón superior o desde el Catálogo Académico."
            />
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {courses.map((course) => (
                <CourseCard course={course} key={course.id} />
              ))}
            </div>
          )
        ) : inscripcionesQuery.isLoading ? (
          <LoadingState label="Consultando inscripciones..." />
        ) : inscripcionesQuery.isError ? (
          <ErrorState
            message={extractApiError(inscripcionesQuery.error)}
            onRetry={() => inscripcionesQuery.refetch()}
          />
        ) : enrollments.length === 0 ? (
          <EmptyState
            icon="how_to_reg"
            title="Sin registros de inscripción"
            description="No se encontraron inscripciones asociadas en este período."
          />
        ) : (
          <InscripcionesTable enrollments={enrollments} />
        )}
      </div>

      <CreateSeccionModal
        asignaturas={asignaturasQuery.data || []}
        isPending={createSeccionMutation.isPending}
        onClose={() => setSeccionModalOpen(false)}
        onSubmit={(payload, resetForm) =>
          createSeccionMutation.mutate(payload, { onSuccess: resetForm })
        }
        open={seccionModalOpen}
        periodos={periodosQuery.data || []}
      />

      <CreateInscripcionModal
        estadosInscripcion={estadosInscripcionQuery.data || []}
        isPending={createInscripcionMutation.isPending}
        onClose={() => setInscripcionModalOpen(false)}
        onSubmit={(payload, resetForm) =>
          createInscripcionMutation.mutate(payload, { onSuccess: resetForm })
        }
        open={inscripcionModalOpen}
        secciones={courses}
        studentProfiles={studentProfilesQuery.data || []}
      />
    </div>
  )
}
