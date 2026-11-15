import { LoadingState } from '../../../shared/components/ui/StateViews'

export default function UsersTable({ users, isLoading, onToggleActive }) {
  if (isLoading) {
    return <LoadingState label="Cargando directorio de usuarios..." />
  }

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-card shadow-xs">
      <table className="w-full text-left text-xs">
        <thead className="border-b border-line bg-subtle text-[11px] font-bold uppercase text-muted">
          <tr>
            <th className="px-4 py-3">ID / RUT</th>
            <th className="px-4 py-3">Nombre</th>
            <th className="px-4 py-3">Correo</th>
            <th className="px-4 py-3">Rol</th>
            <th className="px-4 py-3">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {users.map((u) => (
            <tr key={u.id}>
              <td className="px-4 py-3 font-mono">
                #{u.id} · {u.rut}
              </td>
              <td className="px-4 py-3 font-bold text-ink">
                {u.nombres} {u.apellidos}
              </td>
              <td className="px-4 py-3 text-muted">
                {u.correo_institucional}
              </td>
              <td className="px-4 py-3">
                <span className="rounded bg-subtle px-2 py-0.5 text-[10px] font-bold text-primary">
                  {u.rol?.nombre || `Rol #${u.rol?.id || ''}`}
                </span>
              </td>
              <td className="px-4 py-3">
                <button
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                    u.activo
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                  onClick={() => onToggleActive({ id: u.id, activo: !u.activo })}
                  type="button"
                >
                  {u.activo ? 'Activo (clic para cambiar)' : 'Inactivo'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
