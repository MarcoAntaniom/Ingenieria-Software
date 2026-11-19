import { useState } from 'react'

export default function TeacherProfileForm({
  users,
  departamentos,
  teacherProfiles,
  onCreateTeacherProfile,
  isPending,
}) {
  const [userId, setUserId] = useState('')
  const [deptoId, setDeptoId] = useState('')
  const [especialidad, setEspecialidad] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    onCreateTeacherProfile(
      {
        usuario: Number(userId),
        departamento: Number(deptoId),
        especialidad: especialidad.trim(),
      },
      () => {
        setUserId('')
        setDeptoId('')
        setEspecialidad('')
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
          Crear Perfil Docente
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
          onChange={(e) => setDeptoId(e.target.value)}
          required
          value={deptoId}
        >
          <option value="">Selecciona departamento...</option>
          {departamentos.map((d) => (
            <option key={d.id} value={d.id}>
              {d.codigo} — {d.nombre}
            </option>
          ))}
        </select>
        <input
          className="w-full rounded-lg border border-line bg-subtle px-3 py-2 text-xs"
          onChange={(e) => setEspecialidad(e.target.value)}
          placeholder="Especialidad académica"
          required
          value={especialidad}
        />
        <button
          className="w-full rounded-xl bg-primary py-2.5 text-xs font-bold text-white"
          disabled={isPending}
          type="submit"
        >
          Vincular perfil docente
        </button>
      </form>

      {teacherProfiles.length > 0 && (
        <div className="rounded-xl border border-line bg-card p-4 shadow-xs">
          <h4 className="mb-2 text-xs font-bold uppercase text-muted">
            Perfiles Docentes Registrados ({teacherProfiles.length})
          </h4>
          <div className="space-y-1.5 text-xs">
            {teacherProfiles.map((tp) => (
              <div
                className="flex justify-between rounded bg-subtle px-3 py-1.5"
                key={tp.id}
              >
                <span className="font-bold text-ink">
                  #{tp.id} · {tp.usuario_nombre || `Usuario #${tp.usuario}`}
                </span>
                <span className="text-muted">
                  {tp.departamento_nombre} · {tp.especialidad || 'General'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
