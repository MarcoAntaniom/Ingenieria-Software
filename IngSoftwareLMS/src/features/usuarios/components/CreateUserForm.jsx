import { useState } from 'react'

export default function CreateUserForm({ roles, onCreateUser, isPending }) {
  const [rut, setRut] = useState('')
  const [nombres, setNombres] = useState('')
  const [apellidos, setApellidos] = useState('')
  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [rolId, setRolId] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    onCreateUser(
      {
        rut: rut.trim(),
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        correo_institucional: correo.trim(),
        password_hash: password,
        rol_id: Number(rolId),
        activo: true,
      },
      () => {
        setRut('')
        setNombres('')
        setApellidos('')
        setCorreo('')
        setPassword('')
      },
    )
  }

  return (
    <form
      className="h-max space-y-3 rounded-xl border border-line bg-card p-5 shadow-xs"
      onSubmit={handleSubmit}
    >
      <h3 className="text-sm font-extrabold text-ink">Registrar Usuario</h3>
      <input
        className="w-full rounded-lg border border-line bg-subtle px-3 py-2 text-xs"
        onChange={(e) => setRut(e.target.value)}
        placeholder="RUT (ej. 12345678-9)"
        required
        value={rut}
      />
      <input
        className="w-full rounded-lg border border-line bg-subtle px-3 py-2 text-xs"
        onChange={(e) => setNombres(e.target.value)}
        placeholder="Nombres"
        required
        value={nombres}
      />
      <input
        className="w-full rounded-lg border border-line bg-subtle px-3 py-2 text-xs"
        onChange={(e) => setApellidos(e.target.value)}
        placeholder="Apellidos"
        required
        value={apellidos}
      />
      <input
        className="w-full rounded-lg border border-line bg-subtle px-3 py-2 text-xs"
        onChange={(e) => setCorreo(e.target.value)}
        placeholder="correo@instituto.edu"
        required
        type="email"
        value={correo}
      />
      <input
        className="w-full rounded-lg border border-line bg-subtle px-3 py-2 text-xs"
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Contraseña inicial"
        required
        type="password"
        value={password}
      />
      <div>
        <label className="mb-1 block text-[11px] font-semibold text-muted">
          Rol institucional
        </label>
        {roles.length > 0 ? (
          <select
            className="w-full rounded-lg border border-line bg-subtle px-3 py-2 text-xs"
            onChange={(e) => setRolId(e.target.value)}
            required
            value={rolId}
          >
            <option value="">Selecciona un rol...</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                #{r.id} — {r.nombre} ({r.codigo})
              </option>
            ))}
          </select>
        ) : (
          <input
            className="w-full rounded-lg border border-line bg-subtle px-3 py-2 text-xs"
            min="1"
            onChange={(e) => setRolId(e.target.value)}
            placeholder="ID de Rol (1=Admin, 2=Docente, 3=Estudiante)"
            required
            type="number"
            value={rolId}
          />
        )}
      </div>
      <button
        className="w-full rounded-xl bg-primary py-2.5 text-xs font-bold text-white"
        disabled={isPending}
        type="submit"
      >
        {isPending ? 'Creando...' : 'Crear usuario'}
      </button>
    </form>
  )
}
