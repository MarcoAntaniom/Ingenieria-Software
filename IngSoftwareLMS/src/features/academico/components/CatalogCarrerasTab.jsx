import { useState } from 'react'
import { LoadingState } from '../../../shared/components/ui/StateViews'

export default function CatalogCarrerasTab({
  carreras,
  isLoading,
  onCreateCarrera,
  isPending,
}) {
  const [codigo, setCodigo] = useState('')
  const [nombreCarrera, setNombreCarrera] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    onCreateCarrera(
      {
        codigo: codigo.trim(),
        nombre_carrera: nombreCarrera.trim(),
      },
      () => {
        setCodigo('')
        setNombreCarrera('')
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
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Nombre de Carrera</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {carreras.map((c) => (
                  <tr key={c.id}>
                    <td className="px-4 py-3 font-mono">#{c.id}</td>
                    <td className="px-4 py-3 font-bold text-primary">{c.codigo}</td>
                    <td className="px-4 py-3 font-semibold">{c.nombre_carrera}</td>
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
        <h3 className="text-sm font-extrabold text-ink">Nueva Carrera</h3>
        <input
          className="w-full rounded-lg border border-line bg-subtle px-3 py-2 text-xs"
          onChange={(e) => setCodigo(e.target.value)}
          placeholder="Código (ej. INF-01)"
          required
          value={codigo}
        />
        <input
          className="w-full rounded-lg border border-line bg-subtle px-3 py-2 text-xs"
          onChange={(e) => setNombreCarrera(e.target.value)}
          placeholder="Nombre de la carrera"
          required
          value={nombreCarrera}
        />
        <button
          className="w-full rounded-xl bg-primary py-2.5 text-xs font-bold text-white"
          disabled={isPending}
          type="submit"
        >
          Guardar carrera
        </button>
      </form>
    </div>
  )
}
