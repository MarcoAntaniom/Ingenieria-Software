import { getRoleLabel, getUserDisplayName } from '../../../shared/lib/roles'

export default function ProfileDetailsCard({ user }) {
  return (
    <div className="rounded-xl border border-line bg-card p-6 shadow-xs">
      <h2 className="text-sm font-extrabold text-ink">Datos Personales</h2>
      <dl className="mt-4 divide-y divide-line text-xs">
        <div className="flex justify-between py-3">
          <dt className="font-semibold text-muted">Nombre completo</dt>
          <dd className="font-bold text-ink">{getUserDisplayName(user)}</dd>
        </div>
        <div className="flex justify-between py-3">
          <dt className="font-semibold text-muted">RUT</dt>
          <dd className="font-mono font-bold text-ink">
            {user?.rut || 'No informado'}
          </dd>
        </div>
        <div className="flex justify-between py-3">
          <dt className="font-semibold text-muted">Correo institucional</dt>
          <dd className="font-bold text-primary">
            {user?.correo_institucional || '—'}
          </dd>
        </div>
        <div className="flex justify-between py-3">
          <dt className="font-semibold text-muted">Rol asignado</dt>
          <dd className="font-bold text-secondary">
            {getRoleLabel(user)} ({user?.rol?.codigo || 'estándar'})
          </dd>
        </div>
        <div className="flex justify-between py-3">
          <dt className="font-semibold text-muted">Estado de cuenta</dt>
          <dd>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
              {user?.activo === false ? 'Inactiva' : 'Activa'}
            </span>
          </dd>
        </div>
      </dl>
    </div>
  )
}
