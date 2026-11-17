import { useState } from 'react'
import { EmptyState, LoadingState } from '../../../shared/components/ui/StateViews'

export default function ForosExplorer({
  foros,
  sections = [],
  isLoadingForos,
  selectedForoId,
  onSelectForo,
  onCreateForo,
  isCreatingForo = false,
  temas,
  selectedTemaId,
  onToggleTema,
  mensajesTema,
  onCreateTema,
  isCreatingTema,
  onReplyTema,
  isReplyingTema,
}) {
  const [nuevoForoSeccion, setNuevoForoSeccion] = useState('')
  const [nuevoForoTitulo, setNuevoForoTitulo] = useState('')
  const [nuevoForoDescripcion, setNuevoForoDescripcion] = useState('')
  const [showNewForoForm, setShowNewForoForm] = useState(false)

  const [nuevoTemaTitulo, setNuevoTemaTitulo] = useState('')
  const [nuevoTemaContenido, setNuevoTemaContenido] = useState('')
  const [nuevoMensajeForo, setNuevoMensajeForo] = useState('')

  const activeForoSeccion =
    nuevoForoSeccion || (sections.length > 0 ? String(sections[0].id) : '')

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <div className="space-y-3 lg:col-span-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-muted">
            1. Foros de Secciones
          </h2>
          {onCreateForo && (
            <button
              className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1 text-[11px] font-bold text-white hover:bg-primary/90"
              onClick={() => setShowNewForoForm((prev) => !prev)}
              type="button"
            >
              <span className="material-symbols-outlined text-sm">
                {showNewForoForm ? 'close' : 'add_comment'}
              </span>
              {showNewForoForm ? 'Cerrar' : 'Crear foro'}
            </button>
          )}
        </div>

        {showNewForoForm && onCreateForo && (
          <form
            className="space-y-2.5 rounded-xl border border-primary/30 bg-card p-4 shadow-xs"
            onSubmit={(e) => {
              e.preventDefault()
              if (!activeForoSeccion) return
              onCreateForo(
                {
                  seccion: Number(activeForoSeccion),
                  titulo: nuevoForoTitulo.trim(),
                  descripcion: nuevoForoDescripcion.trim(),
                  activo: true,
                },
                () => {
                  setNuevoForoTitulo('')
                  setNuevoForoDescripcion('')
                  setShowNewForoForm(false)
                },
              )
            }}
          >
            <p className="text-xs font-extrabold text-ink">
              Nuevo foro en una sección (Estudiantes y Docentes)
            </p>
            <select
              className="w-full rounded-lg border border-line bg-subtle px-3 py-1.5 text-xs font-semibold text-ink"
              onChange={(e) => setNuevoForoSeccion(e.target.value)}
              required
              value={activeForoSeccion}
            >
              {sections.length === 0 ? (
                <option value="">Sin secciones disponibles</option>
              ) : (
                sections.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.code} · {sec.title} (Sec. {sec.section})
                  </option>
                ))
              )}
            </select>
            <input
              className="w-full rounded-lg border border-line bg-subtle px-3 py-1.5 text-xs"
              onChange={(e) => setNuevoForoTitulo(e.target.value)}
              placeholder="Título del foro..."
              required
              value={nuevoForoTitulo}
            />
            <textarea
              className="w-full rounded-lg border border-line bg-subtle px-3 py-1.5 text-xs"
              onChange={(e) => setNuevoForoDescripcion(e.target.value)}
              placeholder="Descripción del tema u objetivo..."
              required
              rows={2}
              value={nuevoForoDescripcion}
            />
            <button
              className="w-full rounded-lg bg-primary py-2 text-xs font-bold text-white disabled:opacity-50"
              disabled={isCreatingForo || !activeForoSeccion}
              type="submit"
            >
              {isCreatingForo ? 'Creando foro...' : 'Publicar foro en la sección'}
            </button>
          </form>
        )}

        {isLoadingForos ? (
          <LoadingState label="Cargando foros..." />
        ) : foros.length === 0 ? (
          <EmptyState
            icon="forum"
            title="Sin foros creados"
            description="Cualquier estudiante, docente o administrador puede crear un nuevo foro en una sección."
          />
        ) : (
          foros.map((foro) => (
            <button
              className={`w-full rounded-xl border p-4 text-left transition ${
                selectedForoId === foro.id
                  ? 'border-primary bg-primary/5'
                  : 'border-line bg-card hover:bg-subtle/60'
              }`}
              key={foro.id}
              onClick={() => onSelectForo(foro.id)}
              type="button"
            >
              <div className="flex items-center justify-between">
                <span className="rounded bg-subtle px-2 py-0.5 text-[10px] font-bold text-primary">
                  Sección #{foro.seccion}
                </span>
                <span className="text-[11px] font-semibold text-secondary">
                  {foro.temas_count ?? 0} temas
                </span>
              </div>
              <h3 className="mt-2 text-sm font-bold text-ink">{foro.titulo}</h3>
              <p className="mt-1 line-clamp-2 text-xs text-muted">
                {foro.descripcion}
              </p>
              {foro.creado_por_nombre && (
                <p className="mt-1.5 text-[10px] text-muted">
                  Creado por: <strong>{foro.creado_por_nombre}</strong>
                </p>
              )}
            </button>
          ))
        )}
      </div>

      <div className="space-y-4 lg:col-span-8">
        {!selectedForoId ? (
          <EmptyState
            icon="touch_app"
            title="Selecciona un foro a la izquierda"
            description="Podrás ver los temas abiertos, crear nuevas consultas y responder a tus compañeros."
          />
        ) : (
          <>
            <form
              className="space-y-3 rounded-xl border border-line bg-card p-4 shadow-xs"
              onSubmit={(e) => {
                e.preventDefault()
                onCreateTema(
                  {
                    foro: selectedForoId,
                    titulo: nuevoTemaTitulo.trim(),
                    contenido: nuevoTemaContenido.trim(),
                  },
                  () => {
                    setNuevoTemaTitulo('')
                    setNuevoTemaContenido('')
                  },
                )
              }}
            >
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-primary">
                Abrir nuevo tema de debate
              </h3>
              <input
                className="w-full rounded-lg border border-line bg-subtle px-3 py-2 text-xs"
                onChange={(e) => setNuevoTemaTitulo(e.target.value)}
                placeholder="Título de tu consulta o debate..."
                required
                value={nuevoTemaTitulo}
              />
              <textarea
                className="w-full rounded-lg border border-line bg-subtle px-3 py-2 text-xs"
                onChange={(e) => setNuevoTemaContenido(e.target.value)}
                placeholder="Explica tu pregunta o aporte..."
                required
                rows={2}
                value={nuevoTemaContenido}
              />
              <button
                className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white"
                disabled={isCreatingTema}
                type="submit"
              >
                Publicar tema
              </button>
            </form>

            <div className="space-y-3">
              {temas.map((tema) => (
                <div
                  className="rounded-xl border border-line bg-card p-4 shadow-xs"
                  key={tema.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-ink">{tema.titulo}</h4>
                      <p className="mt-1 text-xs text-muted">{tema.contenido}</p>
                      <p className="mt-2 text-[11px] text-muted">
                        Por <strong>{tema.autor_nombre || 'Usuario'}</strong> ·{' '}
                        {tema.mensajes_count ?? 0} respuestas
                      </p>
                    </div>
                    <button
                      className="rounded-lg border border-line px-3 py-1.5 text-xs font-bold text-primary hover:bg-subtle"
                      onClick={() => onToggleTema(tema.id)}
                      type="button"
                    >
                      {selectedTemaId === tema.id ? 'Ocultar hilo' : 'Ver respuestas'}
                    </button>
                  </div>

                  {selectedTemaId === tema.id && (
                    <div className="mt-4 space-y-3 border-t border-line pt-4">
                      {mensajesTema.length === 0 ? (
                        <p className="text-xs text-muted">
                          Aún no hay respuestas en este tema.
                        </p>
                      ) : (
                        mensajesTema.map((msg) => (
                          <div
                            className="rounded-lg bg-subtle p-3 text-xs"
                            key={msg.id}
                          >
                            <p className="font-bold text-ink">
                              {msg.autor_nombre || `Usuario #${msg.autor}`}
                            </p>
                            <p className="mt-1 text-muted">{msg.contenido}</p>
                          </div>
                        ))
                      )}

                      {!tema.cerrado && (
                        <form
                          className="flex gap-2 pt-1"
                          onSubmit={(e) => {
                            e.preventDefault()
                            onReplyTema(
                              {
                                tema: tema.id,
                                contenido: nuevoMensajeForo.trim(),
                              },
                              () => setNuevoMensajeForo(''),
                            )
                          }}
                        >
                          <input
                            className="flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-xs"
                            onChange={(e) => setNuevoMensajeForo(e.target.value)}
                            placeholder="Escribe una respuesta..."
                            required
                            value={nuevoMensajeForo}
                          />
                          <button
                            className="rounded-lg bg-secondary px-4 py-2 text-xs font-bold text-white"
                            disabled={isReplyingTema}
                            type="submit"
                          >
                            Responder
                          </button>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
