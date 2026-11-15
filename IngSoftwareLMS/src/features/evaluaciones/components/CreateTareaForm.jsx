import { useState } from 'react'

export default function CreateTareaForm({
  sections,
  onCreateTask,
  isPending,
}) {
  const [seccionId, setSeccionId] = useState('')
  const [titulo, setTitulo] = useState('')
  const [instrucciones, setInstrucciones] = useState('')
  const [fechaApertura, setFechaApertura] = useState('')
  const [fechaLimite, setFechaLimite] = useState('')
  const [puntajeMaximo, setPuntajeMaximo] = useState('100')
  const [permitirTardias, setPermitirTardias] = useState(false)
  const [esVisible, setEsVisible] = useState(true)

  function handleSubmit(event) {
    event.preventDefault()
    onCreateTask(
      {
        seccion: Number(seccionId),
        titulo: titulo.trim(),
        instrucciones: instrucciones.trim(),
        fecha_apertura: new Date(fechaApertura).toISOString(),
        fecha_limite: new Date(fechaLimite).toISOString(),
        puntaje_maximo: Number(puntajeMaximo),
        permitir_entregas_tardias: permitirTardias,
        es_visible: esVisible,
      },
      () => {
        setTitulo('')
        setInstrucciones('')
        setFechaApertura('')
        setFechaLimite('')
      },
    )
  }

  return (
    <form
      className="space-y-4 rounded-xl border border-line bg-card p-6 shadow-xs"
      onSubmit={handleSubmit}
    >
      <div className="border-b border-line pb-3">
        <h2 className="text-base font-extrabold text-ink">
          Publicar nueva tarea evaluada
        </h2>
        <p className="text-xs text-muted">
          Conectado con <code className="font-mono">POST /api/v1/evaluaciones/create/</code>
        </p>
      </div>

      <div>
        <label className="mb-1 block text-xs font-bold text-ink">
          Sección académica
        </label>
        <select
          className="w-full rounded-xl border border-line bg-subtle px-3 py-2 text-xs font-semibold"
          onChange={(e) => setSeccionId(e.target.value)}
          required
          value={seccionId}
        >
          <option value="">Selecciona una sección...</option>
          {sections.map((sec) => (
            <option key={sec.id} value={sec.id}>
              {sec.code} · {sec.title} (Sec. {sec.section})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-bold text-ink">
          Título de la actividad
        </label>
        <input
          className="w-full rounded-xl border border-line bg-subtle px-3 py-2 text-xs"
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Ej. Entrega 1: Arquitectura y Modelo de Dominio"
          required
          value={titulo}
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-bold text-ink">
          Instrucciones detalladas
        </label>
        <textarea
          className="w-full rounded-xl border border-line bg-subtle px-3 py-2 text-xs"
          onChange={(e) => setInstrucciones(e.target.value)}
          placeholder="Describe los criterios de entrega, formato de archivo y rúbrica..."
          required
          rows={3}
          value={instrucciones}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-bold text-ink">
            Fecha y hora de apertura
          </label>
          <input
            className="w-full rounded-xl border border-line bg-subtle px-3 py-2 text-xs"
            onChange={(e) => setFechaApertura(e.target.value)}
            required
            type="datetime-local"
            value={fechaApertura}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold text-ink">
            Fecha y hora límite
          </label>
          <input
            className="w-full rounded-xl border border-line bg-subtle px-3 py-2 text-xs"
            onChange={(e) => setFechaLimite(e.target.value)}
            required
            type="datetime-local"
            value={fechaLimite}
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-bold text-ink">
          Puntaje máximo
        </label>
        <input
          className="w-full rounded-xl border border-line bg-subtle px-3 py-2 text-xs"
          min="1"
          onChange={(e) => setPuntajeMaximo(e.target.value)}
          required
          type="number"
          value={puntajeMaximo}
        />
      </div>

      <div className="space-y-2 pt-1">
        <label className="flex items-center gap-2 text-xs font-semibold text-ink">
          <input
            checked={permitirTardias}
            className="rounded border-line text-primary"
            onChange={(e) => setPermitirTardias(e.target.checked)}
            type="checkbox"
          />
          Permitir entregas fuera de plazo
        </label>

        <label className="flex items-center gap-2 text-xs font-semibold text-ink">
          <input
            checked={esVisible}
            className="rounded border-line text-primary"
            onChange={(e) => setEsVisible(e.target.checked)}
            type="checkbox"
          />
          Publicar como visible inmediatamente (emite notificación a la sección)
        </label>
      </div>

      <button
        className="w-full rounded-xl bg-primary py-3 text-xs font-bold text-white transition hover:bg-primary-dark disabled:opacity-50"
        disabled={isPending}
        type="submit"
      >
        {isPending ? 'Creando tarea...' : 'Publicar tarea evaluada'}
      </button>
    </form>
  )
}
