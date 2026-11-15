import { useState } from 'react'
import { Modal } from '../../../shared/components/ui/StateViews'

export default function CreateInscripcionModal({
  open,
  onClose,
  secciones,
  studentProfiles,
  estadosInscripcion,
  onSubmit,
  isPending,
}) {
  const [seccionId, setSeccionId] = useState('')
  const [estudianteId, setEstudianteId] = useState('')
  const [estadoId, setEstadoId] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    onSubmit(
      {
        seccion_id: Number(seccionId),
        estudiante_id: Number(estudianteId),
        estado_id: Number(estadoId),
      },
      () => {
        setSeccionId('')
        setEstudianteId('')
        setEstadoId('')
      },
    )
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Inscribir estudiante en sección"
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="mb-1 block text-xs font-bold text-ink">
            Sección académica
          </label>
          <select
            className="w-full rounded-xl border border-line bg-subtle px-3 py-2 text-xs font-semibold text-ink"
            onChange={(e) => setSeccionId(e.target.value)}
            required
            value={seccionId}
          >
            <option value="">Selecciona una sección...</option>
            {secciones.map((sec) => (
              <option key={sec.id} value={sec.id}>
                {sec.code} — {sec.title} (Sec. {sec.section})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold text-ink">
            Perfil de Estudiante
          </label>
          <select
            className="w-full rounded-xl border border-line bg-subtle px-3 py-2 text-xs font-semibold text-ink"
            onChange={(e) => setEstudianteId(e.target.value)}
            required
            value={estudianteId}
          >
            <option value="">Selecciona un estudiante...</option>
            {studentProfiles.map((sp) => (
              <option key={sp.id} value={sp.id}>
                Perfil #{sp.id} — {sp.usuario_nombre || `Usuario #${sp.usuario}`} ({sp.carrera_nombre || 'Carrera'})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold text-ink">
            Estado de inscripción
          </label>
          <select
            className="w-full rounded-xl border border-line bg-subtle px-3 py-2 text-xs font-semibold text-ink"
            onChange={(e) => setEstadoId(e.target.value)}
            required
            value={estadoId}
          >
            <option value="">Selecciona un estado...</option>
            {estadosInscripcion.map((est) => (
              <option key={est.id} value={est.id}>
                {est.codigo}
              </option>
            ))}
          </select>
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
            {isPending ? 'Inscribiendo...' : 'Registrar inscripción'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
