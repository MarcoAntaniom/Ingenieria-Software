import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { queryKeys } from '../../../shared/lib/queryKeys'
import { extractApiError } from '../../../shared/lib/pagination'
import { PageHeader } from '../../../shared/components/ui/StateViews'
import {
  createAsignatura,
  createCarrera,
  createDepartamento,
  createPeriodoAcademico,
  fetchAsignaturas,
  fetchCarreras,
  fetchDepartamentos,
  fetchPeriodosAcademicos,
} from '../api/academicoApi'
import CatalogCarrerasTab from '../components/CatalogCarrerasTab'
import CatalogDepartamentosTab from '../components/CatalogDepartamentosTab'
import CatalogPeriodosTab from '../components/CatalogPeriodosTab'
import CatalogAsignaturasTab from '../components/CatalogAsignaturasTab'

export default function GestionAcademicaPage() {
  const [tab, setTab] = useState('carreras')
  const queryClient = useQueryClient()

  const carrerasQuery = useQuery({
    queryKey: queryKeys.academico.carreras,
    queryFn: fetchCarreras,
  })

  const departamentosQuery = useQuery({
    queryKey: queryKeys.academico.departamentos,
    queryFn: fetchDepartamentos,
  })

  const periodosQuery = useQuery({
    queryKey: queryKeys.academico.periodos,
    queryFn: fetchPeriodosAcademicos,
  })

  const asignaturasQuery = useQuery({
    queryKey: queryKeys.academico.asignaturas(),
    queryFn: fetchAsignaturas,
  })

  const createCarreraMut = useMutation({
    mutationFn: createCarrera,
    onSuccess: () => {
      toast.success('Carrera registrada.')
      queryClient.invalidateQueries({ queryKey: queryKeys.academico.carreras })
    },
    onError: (err) => toast.error(extractApiError(err)),
  })

  const createDeptoMut = useMutation({
    mutationFn: createDepartamento,
    onSuccess: () => {
      toast.success('Departamento registrado.')
      queryClient.invalidateQueries({ queryKey: queryKeys.academico.departamentos })
    },
    onError: (err) => toast.error(extractApiError(err)),
  })

  const createPeriodoMut = useMutation({
    mutationFn: createPeriodoAcademico,
    onSuccess: () => {
      toast.success('Período académico creado.')
      queryClient.invalidateQueries({ queryKey: queryKeys.academico.periodos })
    },
    onError: (err) => toast.error(extractApiError(err)),
  })

  const createAsignaturaMut = useMutation({
    mutationFn: createAsignatura,
    onSuccess: () => {
      toast.success('Asignatura registrada.')
      queryClient.invalidateQueries({ queryKey: ['academico', 'asignaturas'] })
    },
    onError: (err) => toast.error(extractApiError(err)),
  })

  return (
    <div className="flex flex-col">
      <PageHeader
        eyebrow="Administración Académica"
        title="Catálogo Institucional"
        description="Administra carreras, departamentos, períodos lectivos y asignaturas conectadas con la API REST."
      />

      <div className="mx-auto flex w-full max-w-[1360px] flex-col gap-6 px-6 py-6 lg:px-10">
        <div className="flex flex-wrap gap-2 rounded-xl border border-line bg-card p-2 shadow-xs">
          {[
            { id: 'carreras', label: 'Carreras' },
            { id: 'departamentos', label: 'Departamentos' },
            { id: 'periodos', label: 'Períodos Académicos' },
            { id: 'asignaturas', label: 'Asignaturas' },
          ].map((item) => (
            <button
              className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
                tab === item.id
                  ? 'bg-primary text-white'
                  : 'text-muted hover:bg-subtle'
              }`}
              key={item.id}
              onClick={() => setTab(item.id)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>

        {tab === 'carreras' && (
          <CatalogCarrerasTab
            carreras={carrerasQuery.data || []}
            isLoading={carrerasQuery.isLoading}
            isPending={createCarreraMut.isPending}
            onCreateCarrera={(payload, reset) =>
              createCarreraMut.mutate(payload, { onSuccess: reset })
            }
          />
        )}

        {tab === 'departamentos' && (
          <CatalogDepartamentosTab
            departamentos={departamentosQuery.data || []}
            isLoading={departamentosQuery.isLoading}
            isPending={createDeptoMut.isPending}
            onCreateDepartamento={(payload, reset) =>
              createDeptoMut.mutate(payload, { onSuccess: reset })
            }
          />
        )}

        {tab === 'periodos' && (
          <CatalogPeriodosTab
            isLoading={periodosQuery.isLoading}
            isPending={createPeriodoMut.isPending}
            onCreatePeriodo={(payload, reset) =>
              createPeriodoMut.mutate(payload, { onSuccess: reset })
            }
            periodos={periodosQuery.data || []}
          />
        )}

        {tab === 'asignaturas' && (
          <CatalogAsignaturasTab
            asignaturas={asignaturasQuery.data || []}
            carreras={carrerasQuery.data || []}
            isLoading={asignaturasQuery.isLoading}
            isPending={createAsignaturaMut.isPending}
            onCreateAsignatura={(payload, reset) =>
              createAsignaturaMut.mutate(payload, { onSuccess: reset })
            }
          />
        )}
      </div>
    </div>
  )
}
