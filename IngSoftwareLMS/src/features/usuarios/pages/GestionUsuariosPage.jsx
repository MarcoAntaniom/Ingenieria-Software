import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { queryKeys } from '../../../shared/lib/queryKeys'
import { extractApiError } from '../../../shared/lib/pagination'
import { PageHeader } from '../../../shared/components/ui/StateViews'
import {
  createStudentProfile,
  createTeacherProfile,
  createUsuario,
  fetchRoles,
  fetchStudentProfiles,
  fetchTeacherProfiles,
  fetchUsuarios,
  updateUsuario,
} from '../api/usuariosApi'
import {
  fetchCarreras,
  fetchDepartamentos,
} from '../../academico/api/academicoApi'
import UsersTable from '../components/UsersTable'
import CreateUserForm from '../components/CreateUserForm'
import StudentProfileForm from '../components/StudentProfileForm'
import TeacherProfileForm from '../components/TeacherProfileForm'

export default function GestionUsuariosPage() {
  const [tab, setTab] = useState('usuarios')
  const queryClient = useQueryClient()

  const usuariosQuery = useQuery({
    queryKey: queryKeys.usuarios.all,
    queryFn: fetchUsuarios,
  })

  const rolesQuery = useQuery({
    queryKey: queryKeys.usuarios.roles,
    queryFn: fetchRoles,
  })

  const studentProfilesQuery = useQuery({
    queryKey: queryKeys.usuarios.studentProfiles,
    queryFn: fetchStudentProfiles,
  })

  const teacherProfilesQuery = useQuery({
    queryKey: queryKeys.usuarios.teacherProfiles,
    queryFn: fetchTeacherProfiles,
  })

  const carrerasQuery = useQuery({
    queryKey: queryKeys.academico.carreras,
    queryFn: fetchCarreras,
  })

  const departamentosQuery = useQuery({
    queryKey: queryKeys.academico.departamentos,
    queryFn: fetchDepartamentos,
  })

  const createUserMut = useMutation({
    mutationFn: createUsuario,
    onSuccess: () => {
      toast.success('Usuario creado exitosamente.')
      queryClient.invalidateQueries({ queryKey: queryKeys.usuarios.all })
    },
    onError: (err) => toast.error(extractApiError(err)),
  })

  const toggleActiveMut = useMutation({
    mutationFn: ({ id, activo }) => updateUsuario(id, { activo }),
    onSuccess: () => {
      toast.success('Estado del usuario actualizado.')
      queryClient.invalidateQueries({ queryKey: queryKeys.usuarios.all })
    },
    onError: (err) => toast.error(extractApiError(err)),
  })

  const createEstProfileMut = useMutation({
    mutationFn: createStudentProfile,
    onSuccess: () => {
      toast.success('Perfil de estudiante vinculado.')
      queryClient.invalidateQueries({
        queryKey: queryKeys.usuarios.studentProfiles,
      })
    },
    onError: (err) => toast.error(extractApiError(err)),
  })

  const createDocProfileMut = useMutation({
    mutationFn: createTeacherProfile,
    onSuccess: () => {
      toast.success('Perfil docente vinculado.')
      queryClient.invalidateQueries({
        queryKey: queryKeys.usuarios.teacherProfiles,
      })
    },
    onError: (err) => toast.error(extractApiError(err)),
  })

  const users = usuariosQuery.data || []

  return (
    <div className="flex flex-col">
      <PageHeader
        eyebrow="Administración de Plataforma"
        title="Gestión de Usuarios y Perfiles"
        badge={`${users.length} cuentas`}
        description="Creación de cuentas institucionales, activación/desactivación y asignación de perfiles de Estudiante y Docente."
      />

      <div className="mx-auto flex w-full max-w-[1360px] flex-col gap-6 px-6 py-6 lg:px-10">
        <div className="flex w-max flex-wrap gap-2 rounded-xl border border-line bg-card p-2 shadow-xs">
          {[
            { id: 'usuarios', label: 'Directorio y Creación de Usuarios' },
            { id: 'perfiles', label: 'Vincular Perfiles (Estudiante / Docente)' },
          ].map((t) => (
            <button
              className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
                tab === t.id
                  ? 'bg-primary text-white'
                  : 'text-muted hover:bg-subtle'
              }`}
              key={t.id}
              onClick={() => setTab(t.id)}
              type="button"
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'usuarios' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <UsersTable
                isLoading={usuariosQuery.isLoading}
                onToggleActive={(payload) => toggleActiveMut.mutate(payload)}
                users={users}
              />
            </div>

            <div className="lg:col-span-4">
              <CreateUserForm
                isPending={createUserMut.isPending}
                onCreateUser={(payload, resetForm) =>
                  createUserMut.mutate(payload, { onSuccess: resetForm })
                }
                roles={rolesQuery.data || []}
              />
            </div>
          </div>
        )}

        {tab === 'perfiles' && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <StudentProfileForm
              carreras={carrerasQuery.data || []}
              isPending={createEstProfileMut.isPending}
              onCreateStudentProfile={(payload, resetForm) =>
                createEstProfileMut.mutate(payload, { onSuccess: resetForm })
              }
              studentProfiles={studentProfilesQuery.data || []}
              users={users}
            />

            <TeacherProfileForm
              departamentos={departamentosQuery.data || []}
              isPending={createDocProfileMut.isPending}
              onCreateTeacherProfile={(payload, resetForm) =>
                createDocProfileMut.mutate(payload, { onSuccess: resetForm })
              }
              teacherProfiles={teacherProfilesQuery.data || []}
              users={users}
            />
          </div>
        )}
      </div>
    </div>
  )
}
