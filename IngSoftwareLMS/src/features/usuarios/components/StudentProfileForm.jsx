import { useState } from 'react'

export default function StudentProfileForm({
  users,
  carreras,
  studentProfiles,
  onCreateStudentProfile,
  isPending,
}) {
  const [userId, setUserId] = useState('')
  const [carreraId, setCarreraId] = useState('')
  const [nivel, setNivel] = useState('1')
  const [anio, setAnio] = useState('2026')

  function handleSubmit(event) {
    event.preventDefault()
    onCreateStudentProfile(
      {
        usuario: Number(userId),
        carrera: Number(carreraId),
        nivel: Number(nivel),
        anio_ingreso: Number(anio),
      },
      () => {
        setUserId('')
        setCarreraId('')
      },
    )
  }

  return (
    <div className="space-y-4">
      <form
        className="space-y-3 rounded-xl border border-line bg-card p-6 shadow-xs"
        onSubmit={handleSubmit}
      >
        <h3 className="text-sm font-extrabold text-ink">
          Crear Perfil de Estudiante
        </h3>
        <select
          className="w-full rounded-lg border border-line bg-subtle px-3 py-2 text-xs"
          onChange={(e) => setUserId(e.target.value)}
          required
          value={userId}
        >
          <option value="">Selecciona usuario...</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              #{u.id} — {u.nombres} {u.apellidos} ({u.rut})
            </option>
          ))}
        </select>
        <select
          className="w-full rounded-lg border border-line bg-subtle px-3 py-2 text-xs"
          onChange={(e) => setCarreraId(e.target.value)}
          required
          value={carreraId}
        >
          <option value="">Selecciona carrera...</option>
          {carreras.map((c) => (
            <option key={c.id} value={c.id}>
              {c.codigo} — {c.nombre_carrera}
            </option>
          ))}
        </select>
        <div className="grid grid-cols-2 gap-3">
          <input
            className="w-full rounded-lg border border-line bg-subtle px-3 py-2 text-xs"
            min="1"
            onChange={(e) => setNivel(e.target.value)}
            placeholder="Nivel / Semestre"
            required
            type="number"
            value={nivel}
          />
          <input
            className="w-full rounded-lg border border-line bg-subtle px-3 py-2 text-xs"
            min="2000"
            onChange={(e) => setAnio(e.target.value)}
            placeholder="Año ingreso"
            required
            type="number"
            value={anio}
          />
        </div>
        <button
          className="w-full rounded-xl bg-primary py-2.5 text-xs font-bold text-white"
          disabled={isPending}
          type="submit"
        >
          Vincular perfil estudiante
        </button>
      </form>

      {studentProfiles.length > 0 && (
        <div className="rounded-xl border border-line bg-card p-4 shadow-xs">
          <h4 className="mb-2 text-xs font-bold uppercase text-muted">
            Perfiles de Estudiante Registrados ({studentProfiles.length})
          </h4>
          <div className="space-y-1.5 text-xs">
            {studentProfiles.map((sp) => (
              <div
                className="flex justify-between rounded bg-subtle px-3 py-1.5"
                key={sp.id}
              >
                <span className="font-bold text-ink">
                  #{sp.id} · {sp.usuario_nombre || `Usuario #${sp.usuario}`}
                </span>
                <span className="text-muted">
                  {sp.carrera_nombre} · Nivel {sp.nivel} ({sp.anio_ingreso})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
