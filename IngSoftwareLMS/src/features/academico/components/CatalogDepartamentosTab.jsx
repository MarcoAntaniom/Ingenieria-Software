import { useState } from 'react'
import { LoadingState } from '../../../shared/components/ui/StateViews'

export default function CatalogDepartamentosTab({
  departamentos,
  isLoading,
  onCreateDepartamento,
  isPending,
}) {
  const [codigo, setCodigo] = useState('')
  const [nombre, setNombre] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    onCreateDepartamento(
      {
        codigo: codigo.trim(),
        nombre: nombre.trim(),
      },
      () => {
        setCodigo('')
        setNombre('')
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
                  <th className="px-4 py-3">Departamento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {departamentos.map((d) => (
                  <tr key={d.id}>
                    <td className="px-4 py-3 font-mono">#{d.id}</td>
                    <td className="px-4 py-3 font-bold text-primary">{d.codigo}</td>
                    <td className="px-4 py-3 font-semibold">{d.nombre}</td>
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
        <h3 className="text-sm font-extrabold text-ink">Nuevo Departamento</h3>
        <input
          className="w-full rounded-lg border border-line bg-subtle px-3 py-2 text-xs"
          onChange={(e) => setCodigo(e.target.value)}
          placeholder="Código (ej. DEP-SIS)"
          required
          value={codigo}
        />
        <input
          className="w-full rounded-lg border border-line bg-subtle px-3 py-2 text-xs"
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre del departamento"
          required
          value={nombre}
        />
        <button
          className="w-full rounded-xl bg-primary py-2.5 text-xs font-bold text-white"
          disabled={isPending}
          type="submit"
        >
          Guardar departamento
        </button>
      </form>
    </div>
  )
}
