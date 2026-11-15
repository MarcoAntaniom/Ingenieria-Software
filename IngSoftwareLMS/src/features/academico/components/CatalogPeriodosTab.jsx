import { useState } from 'react'
import { LoadingState } from '../../../shared/components/ui/StateViews'

export default function CatalogPeriodosTab({
  periodos,
  isLoading,
  onCreatePeriodo,
  isPending,
}) {
  const [codigo, setCodigo] = useState('')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    onCreatePeriodo(
      {
        codigo: codigo.trim(),
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        activo: true,
      },
      () => {
        setCodigo('')
        setFechaInicio('')
        setFechaFin('')
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
                  <th className="px-4 py-3">Inicio</th>
                  <th className="px-4 py-3">Término</th>
                  <th className="px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {periodos.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3 font-bold text-primary">{p.codigo}</td>
                    <td className="px-4 py-3">{p.fecha_inicio}</td>
                    <td className="px-4 py-3">{p.fecha_fin}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          p.activo
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {p.activo ? 'Activo' : 'Cerrado'}
                      </span>
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
        <h3 className="text-sm font-extrabold text-ink">Nuevo Período</h3>
        <input
          className="w-full rounded-lg border border-line bg-subtle px-3 py-2 text-xs"
          onChange={(e) => setCodigo(e.target.value)}
          placeholder="Código (ej. 2026-2)"
          required
          value={codigo}
        />
        <div>
          <label className="mb-1 block text-[11px] font-semibold text-muted">
            Fecha inicio
          </label>
          <input
            className="w-full rounded-lg border border-line bg-subtle px-3 py-2 text-xs"
            onChange={(e) => setFechaInicio(e.target.value)}
            required
            type="date"
            value={fechaInicio}
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-semibold text-muted">
            Fecha término
          </label>
          <input
            className="w-full rounded-lg border border-line bg-subtle px-3 py-2 text-xs"
            onChange={(e) => setFechaFin(e.target.value)}
            required
            type="date"
            value={fechaFin}
          />
        </div>
        <button
          className="w-full rounded-xl bg-primary py-2.5 text-xs font-bold text-white"
          disabled={isPending}
          type="submit"
        >
          Crear período
        </button>
      </form>
    </div>
  )
}
