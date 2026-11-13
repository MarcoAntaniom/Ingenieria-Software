import AppShell from '../components/layout/AppShell'
import Card from '../components/ui/Card'
import { useAuth } from '../contexts/auth-context'
import { getUserRole } from '../utils/roles'

const ROLE_LABELS = {
  student: 'Estudiante',
  teacher: 'Docente',
  admin: 'Administración',
  unknown: 'No disponible',
}

function maskRut(value) {
  if (typeof value !== 'string' || value.length < 2) return null
  return `${'•'.repeat(Math.max(0, value.length - 4))}${value.slice(-4)}`
}

function ProfileField({ label, value }) {
  if (value === null || value === undefined || value === '') return null
  return (
    <div className="border-b border-line py-3 last:border-0">
      <dt className="text-xs font-semibold text-muted">{label}</dt>
      <dd className="mt-1 break-words text-sm font-medium text-ink">{value}</dd>
    </div>
  )
}

export default function ProfilePage() {
  const { user } = useAuth()
  const displayName = [user?.nombres, user?.apellidos].filter(Boolean).join(' ')
  const role = getUserRole(user)
  const rut = maskRut(user?.rut)

  return (
    <AppShell>
      <section className="mx-auto max-w-[900px] px-4 py-8 sm:px-6 lg:px-10">
        <p className="text-xs font-bold uppercase tracking-wider text-secondary-dark">
          Cuenta
        </p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-primary">
          Perfil
        </h1>
        <Card className="mt-5 p-5 sm:p-7">
          <dl>
            <ProfileField label="Nombre" value={displayName} />
            <ProfileField label="Correo institucional" value={user?.correo_institucional} />
            <ProfileField label="Rol" value={ROLE_LABELS[role]} />
            <ProfileField label="RUT" value={rut} />
            <ProfileField
              label="Estado de la cuenta"
              value={
                typeof user?.activo === 'boolean'
                  ? user.activo
                    ? 'Activa'
                    : 'Inactiva'
                  : null
              }
            />
          </dl>
        </Card>
        <p className="mt-4 text-sm text-muted">
          Esta vista es de solo lectura. El backend aún no ofrece una consulta
          completa de perfiles ni un contrato seguro para editarlos.
        </p>
      </section>
    </AppShell>
  )
}
