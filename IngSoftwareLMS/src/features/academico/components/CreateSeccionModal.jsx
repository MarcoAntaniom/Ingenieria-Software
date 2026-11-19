import { useState } from 'react'
import { Modal } from '../../../shared/components/ui/StateViews'

export default function CreateSeccionModal({
  open,
  onClose,
  asignaturas,
  periodos,
  onSubmit,
  isPending,
}) {
  const [asignaturaId, setAsignaturaId] = useState('')
  const [periodoId, setPeriodoId] = useState('')
  const [numeroSeccion, setNumeroSeccion] = useState('1')

  function handleSubmit(event) {
    event.preventDefault()
    onSubmit(
      {
        asignatura_id: Number(asignaturaId),
        periodo_academico_id: Number(periodoId),
        numero_seccion: Number(numeroSeccion),
      },
      () => {
        setAsignaturaId('')
        setPeriodoId('')
        setNumeroSeccion('1')
      },
    )
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Crear nueva sección académica"
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="mb-1 block text-xs font-bold text-ink" htmlFor="asig-select">
            Asignatura
          </label>
          <select
            className="w-full rounded-xl border border-line bg-subtle px-3 py-2 text-xs font-semibold text-ink"
            id="asig-select"
            onChange={(e) => setAsignaturaId(e.target.value)}
            required
            value={asignaturaId}
          >
            <option value="">Selecciona una asignatura...</option>
            {asignaturas.map((asig) => (
              <option key={asig.id} value={asig.id}>
                {asig.codigo} — {asig.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold text-ink" htmlFor="per-select">
            Período Académico
          </label>
          <select
            className="w-full rounded-xl border border-line bg-subtle px-3 py-2 text-xs font-semibold text-ink"
            id="per-select"
            onChange={(e) => setPeriodoId(e.target.value)}
            required
            value={periodoId}
          >
            <option value="">Selecciona un período...</option>
            {periodos.map((per) => (
              <option key={per.id} value={per.id}>
                {per.codigo} ({per.activo ? 'Activo' : 'Inactivo'})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold text-ink" htmlFor="num-sec">
            Número de sección
          </label>
          <input
            className="w-full rounded-xl border border-line bg-subtle px-3 py-2 text-xs font-semibold text-ink"
            id="num-sec"
            min="1"
            onChange={(e) => setNumeroSeccion(e.target.value)}
            required
            type="number"
            value={numeroSeccion}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            className="rounded-xl border border-line px-4 py-2 text-xs font-bold text-muted"
            onClick={onClose}
            type="button"
          >
            Cancelar
          </button>
          <button
            className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
            disabled={isPending}
            type="submit"
          >
            {isPending ? 'Guardando...' : 'Crear sección'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
