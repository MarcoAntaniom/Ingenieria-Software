import { useState } from 'react'
import { toast } from 'sonner'

function toLocalDateTimeInputValue(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0')
  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  const hours = pad(date.getHours())
  const minutes = pad(date.getMinutes())
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

export default function CreateTareaForm({
  sections = [],
  rubricas = [],
  defaultSeccionId = '',
  onCreateTask,
  onCreateRubrica,
  isPending,
}) {
  const [minDateTime, setMinDateTime] = useState(() =>
    toLocalDateTimeInputValue(),
  )
  const [seccionId, setSeccionId] = useState(
    defaultSeccionId ? String(defaultSeccionId) : '',
  )
  const [rubricaId, setRubricaId] = useState('')
  const [showNewRubrica, setShowNewRubrica] = useState(false)
  const [nuevaRubricaTitulo, setNuevaRubricaTitulo] = useState('')
  const [nuevaRubricaCriterios, setNuevaRubricaCriterios] = useState(
    'Dominio conceptual, Calidad técnica, Presentación y formato',
  )
  const [titulo, setTitulo] = useState('')
  const [instrucciones, setInstrucciones] = useState('')
  const [fechaApertura, setFechaApertura] = useState(() =>
    toLocalDateTimeInputValue(),
  )
  const [fechaLimite, setFechaLimite] = useState('')
  const [puntajeMaximo, setPuntajeMaximo] = useState('7.0')
  const [permitirTardias, setPermitirTardias] = useState(false)
  const [esVisible, setEsVisible] = useState(true)
  const [dateError, setDateError] = useState('')

  const targetSeccionId = defaultSeccionId || seccionId
  const minFechaLimite =
    fechaApertura && fechaApertura > minDateTime ? fechaApertura : minDateTime

  function validateDates(aperturaVal, limiteVal) {
    if (!aperturaVal) {
      return 'Debes seleccionar una fecha y hora de apertura.'
    }
    const aperturaMs = new Date(aperturaVal).getTime()
    const minMs = new Date(minDateTime).getTime()
    if (!Number.isFinite(aperturaMs) || aperturaMs < minMs) {
      return 'La fecha de apertura no puede ser anterior a la fecha y hora actual.'
    }
    if (limiteVal) {
      const limiteMs = new Date(limiteVal).getTime()
      if (!Number.isFinite(limiteMs)) {
        return 'La fecha de término ingresada no es válida.'
      }
      if (limiteMs <= Date.now()) {
        return 'La fecha de término no puede ser anterior a la fecha y hora actual.'
      }
      if (limiteMs <= aperturaMs) {
        return 'La fecha de término debe ser posterior a la fecha de apertura.'
      }
    }
    return ''
  }

  function handleChangeFechaApertura(nextApertura) {
    setFechaApertura(nextApertura)
    if (fechaLimite && nextApertura && fechaLimite <= nextApertura) {
      setDateError(
        'La fecha de término debe ser posterior a la fecha de apertura.',
      )
    } else {
      setDateError(validateDates(nextApertura, fechaLimite))
    }
  }

  function handleChangeFechaLimite(nextLimite) {
    setFechaLimite(nextLimite)
    setDateError(validateDates(fechaApertura, nextLimite))
  }

  function handleSubmit(event) {
    event.preventDefault()
    const validationMsg = validateDates(fechaApertura, fechaLimite)
    if (validationMsg) {
      setDateError(validationMsg)
      toast.error(validationMsg)
      return
    }
    setDateError('')

    onCreateTask(
      {
        seccion: Number(targetSeccionId),
        rubrica: rubricaId ? Number(rubricaId) : null,
        titulo: titulo.trim(),
        instrucciones: instrucciones.trim(),
        fecha_apertura: new Date(fechaApertura).toISOString(),
        fecha_limite: fechaLimite ? new Date(fechaLimite).toISOString() : null,
        puntaje_maximo: Number(puntajeMaximo),
        permitir_entregas_tardias: fechaLimite ? permitirTardias : false,
        es_visible: esVisible,
      },
      () => {
        const freshNow = toLocalDateTimeInputValue()
        setMinDateTime(freshNow)
        setTitulo('')
        setInstrucciones('')
        setRubricaId('')
        setFechaApertura(freshNow)
        setFechaLimite('')
        setDateError('')
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
          Define la fecha de apertura y, opcionalmente, una fecha de término.
        </p>
      </div>

      {!defaultSeccionId && (
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
      )}

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
            min={minDateTime}
            onChange={(e) => handleChangeFechaApertura(e.target.value)}
            required
            type="datetime-local"
            value={fechaApertura}
          />
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between gap-2">
            <label className="block text-xs font-bold text-ink">
              Fecha y hora de término{' '}
              <span className="font-normal text-muted">(opcional)</span>
            </label>
            {fechaLimite && (
              <button
                className="text-[11px] font-semibold text-primary hover:underline"
                onClick={() => handleChangeFechaLimite('')}
                type="button"
              >
                Quitar fecha
              </button>
            )}
          </div>
          <input
            className="w-full rounded-xl border border-line bg-subtle px-3 py-2 text-xs"
            min={minFechaLimite}
            onChange={(e) => handleChangeFechaLimite(e.target.value)}
            type="datetime-local"
            value={fechaLimite}
          />
          <p className="mt-1 text-[11px] text-muted">
            Si lo dejas en blanco, la tarea no tendrá fecha límite de cierre.
          </p>
        </div>
      </div>

      {dateError && (
        <div className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-900">
          {dateError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-bold text-ink">
            Nota / Puntaje máximo (Escala 1.0 - 7.0)
          </label>
          <input
            className="w-full rounded-xl border border-line bg-subtle px-3 py-2 text-xs"
            max="100"
            min="1"
            onChange={(e) => setPuntajeMaximo(e.target.value)}
            required
            step="0.1"
            type="number"
            value={puntajeMaximo}
          />
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between gap-2">
            <label className="block text-xs font-bold text-ink">
              Rúbrica de evaluación{' '}
              <span className="font-normal text-muted">(opcional)</span>
            </label>
            {onCreateRubrica && (
              <button
                className="text-[11px] font-semibold text-primary hover:underline"
                onClick={() => setShowNewRubrica((prev) => !prev)}
                type="button"
              >
                {showNewRubrica ? 'Cancelar' : '+ Crear rúbrica'}
              </button>
            )}
          </div>
          <select
            className="w-full rounded-xl border border-line bg-subtle px-3 py-2 text-xs"
            onChange={(e) => setRubricaId(e.target.value)}
            value={rubricaId}
          >
            <option value="">Evaluación directa (sin rúbrica)</option>
            {rubricas.map((rub) => (
              <option key={rub.id} value={rub.id}>
                {rub.titulo} ({rub.criterios?.length || 0} criterios)
              </option>
            ))}
          </select>
        </div>
      </div>

      {showNewRubrica && onCreateRubrica && (
        <div className="space-y-2 rounded-xl border border-line bg-subtle p-3">
          <p className="text-xs font-bold text-ink">
            Nueva rúbrica dinámica (niveles 7.0 / 4.0 / 1.0)
          </p>
          <input
            className="w-full rounded-lg border border-line bg-card px-3 py-1.5 text-xs"
            onChange={(e) => setNuevaRubricaTitulo(e.target.value)}
            placeholder="Título de la rúbrica (ej. Rúbrica Informe Técnico)"
            value={nuevaRubricaTitulo}
          />
          <input
            className="w-full rounded-lg border border-line bg-card px-3 py-1.5 text-xs"
            onChange={(e) => setNuevaRubricaCriterios(e.target.value)}
            placeholder="Criterios separados por coma..."
            value={nuevaRubricaCriterios}
          />
          <button
            className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-bold text-white"
            onClick={() => {
              if (!nuevaRubricaTitulo.trim()) {
                toast.error('Ingresa un título para la rúbrica.')
                return
              }
              const list = nuevaRubricaCriterios
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)
              const peso =
                list.length > 0 ? Number((100 / list.length).toFixed(2)) : 100
              onCreateRubrica(
                {
                  titulo: nuevaRubricaTitulo.trim(),
                  criterios: list.map((c, idx) => ({
                    titulo: c,
                    ponderacion_porcentaje: peso,
                    orden: idx + 1,
                  })),
                },
                (created) => {
                  if (created?.id) setRubricaId(String(created.id))
                  setNuevaRubricaTitulo('')
                  setShowNewRubrica(false)
                },
              )
            }}
            type="button"
          >
            Guardar rúbrica
          </button>
        </div>
      )}

      <div className="space-y-2 pt-1">
        <label
          className={`flex items-center gap-2 text-xs font-semibold ${
            fechaLimite ? 'text-ink' : 'text-muted'
          }`}
        >
          <input
            checked={fechaLimite ? permitirTardias : false}
            className="rounded border-line text-primary disabled:opacity-50"
            disabled={!fechaLimite}
            onChange={(e) => setPermitirTardias(e.target.checked)}
            type="checkbox"
          />
          Permitir entregas tardías (máx. 1 hora de espera tras el cierre, luego se bloquea; -1% nota)
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
        disabled={isPending || Boolean(dateError)}
        type="submit"
      >
        {isPending ? 'Creando tarea...' : 'Publicar tarea evaluada'}
      </button>
    </form>
  )
}
