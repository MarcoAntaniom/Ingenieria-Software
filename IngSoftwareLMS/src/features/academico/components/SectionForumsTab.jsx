import { useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState } from '../../../shared/components/ui/StateViews'

/**
 * Pestaña de Foros de Debate de una Sección.
 * Cualquier usuario autenticado (estudiantes, docentes y administradores)
 * puede crear nuevos foros en la sección y participar en los debates.
 */
export default function SectionForumsTab({
  forums,
  onCreateForum,
  isPending,
}) {
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    onCreateForum(
      {
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        activo: true,
      },
      () => {
        setTitulo('')
        setDescripcion('')
      },
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <div className="space-y-4 lg:col-span-8">
        {forums.length === 0 ? (
          <EmptyState
            icon="forum"
            title="No hay foros activos en esta sección"
            description="Tanto estudiantes como docentes pueden crear el primer foro de consulta o debate usando el formulario de la derecha."
          />
        ) : (
          forums.map((foro) => (
            <article
              className="flex flex-col justify-between gap-4 rounded-xl border border-line bg-card p-5 shadow-xs sm:flex-row sm:items-center"
              key={foro.id}
            >
              <div>
                <h3 className="text-sm font-bold text-ink">{foro.titulo}</h3>
                <p className="mt-1 text-xs text-muted">{foro.descripcion}</p>
                <p className="mt-2 text-[11px] font-semibold text-secondary">
                  {foro.temas_count ?? 0} temas de debate · Creado por{' '}
                  {foro.creado_por_nombre || 'Participante de la sección'}
                </p>
              </div>
              <Link
                className="self-start rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white sm:self-center"
                to={`/comunicacion?foro=${foro.id}&seccion=${foro.seccion}`}
              >
                Participar en foro
              </Link>
            </article>
          ))
        )}
      </div>

      <form
        className="h-max space-y-3 rounded-xl border border-line bg-card p-5 shadow-xs lg:col-span-4"
        onSubmit={handleSubmit}
      >
        <div>
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
            <span className="material-symbols-outlined text-xs">groups</span>
            Abierto a Estudiantes y Docentes
          </span>
          <h3 className="mt-1 text-sm font-extrabold text-ink">
            Crear foro en esta sección
          </h3>
          <p className="text-[11px] text-muted">
            Inicia un nuevo espacio de discusión o estudio colaborativo para la sección.
          </p>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted">
            Título del foro
          </label>
          <input
            className="w-full rounded-lg border border-line bg-subtle px-3 py-2 text-xs"
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ej. Consultas Unidad 1 / Grupo de estudio"
            required
            value={titulo}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted">
            Descripción
          </label>
          <textarea
            className="w-full rounded-lg border border-line bg-subtle px-3 py-2 text-xs"
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Objetivo del espacio de discusión..."
            required
            rows={3}
            value={descripcion}
          />
        </div>
        <button
          className="w-full rounded-xl bg-primary py-2.5 text-xs font-bold text-white transition hover:bg-primary-dark disabled:opacity-50"
          disabled={isPending}
          type="submit"
        >
          {isPending ? 'Creando...' : 'Abrir foro en la sección'}
        </button>
      </form>
    </div>
  )
}
