import { useState } from 'react'
import { LoadingState } from '../../../shared/components/ui/StateViews'

export default function CatalogAsignaturasTab({
  asignaturas,
  carreras,
  isLoading,
  onCreateAsignatura,
  isPending,
}) {
  const [codigo, setCodigo] = useState('')
  const [nombre, setNombre] = useState('')
  const [carreraId, setCarreraId] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    onCreateAsignatura(
      {
        codigo: codigo.trim(),
        nombre: nombre.trim(),
        carrera_id: Number(carreraId),
      },
      () => {
        setCodigo('')
        setNombre('')
        setCarreraId('')
      },
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <div className="lg:col-span-8">
        {isLoading ? (
          <LoadingState />
        ) : (
          <div className="overflow-hidden rounded-xl border border-line bg-card shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-line bg-subtle text-[11px] font-bold uppercase text-muted">
                <tr>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Asignatura</th>
                  <th className="px-4 py-3">Carrera</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {asignaturas.map((a) => (
                  <tr key={a.id}>
                    <td className="px-4 py-3 font-bold text-primary">{a.codigo}</td>
                    <td className="px-4 py-3 font-semibold">{a.nombre}</td>
                    <td className="px-4 py-3 text-muted">
                      {a.carrera?.nombre_carrera || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <form
        className="h-max space-y-3 rounded-xl border border-line bg-card p-5 shadow-xs lg:col-span-4"
        onSubmit={handleSubmit}
      >
        <h3 className="text-sm font-extrabold text-ink">Nueva Asignatura</h3>
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
        <input
          className="w-full rounded-lg border border-line bg-subtle px-3 py-2 text-xs"
          onChange={(e) => setCodigo(e.target.value)}
          placeholder="Código (ej. ISW-401)"
          required
          value={codigo}
        />
        <input
          className="w-full rounded-lg border border-line bg-subtle px-3 py-2 text-xs"
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre de la asignatura"
          required
          value={nombre}
        />
        <button
          className="w-full rounded-xl bg-primary py-2.5 text-xs font-bold text-white"
          disabled={isPending}
          type="submit"
        >
          Guardar asignatura
        </button>
      </form>
    </div>
  )
}
