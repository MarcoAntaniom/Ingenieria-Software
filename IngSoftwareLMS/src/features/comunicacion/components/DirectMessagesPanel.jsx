import { useState } from 'react'
import { EmptyState, LoadingState } from '../../../shared/components/ui/StateViews'

export default function DirectMessagesPanel({
  conversaciones,
  selectedConversacionId,
  onSelectConversacion,
  usuarios,
  onCreateConversacion,
  isCreatingConversacion,
  mensajesDirectos,
  isLoadingMensajes,
  onSendMessage,
  isSendingMessage,
}) {
  const [tituloConv, setTituloConv] = useState('')
  const [destinatarioId, setDestinatarioId] = useState('')
  const [contenido, setContenido] = useState('')

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Columna izquierda: Conversaciones y creación */}
      <div className="space-y-4 lg:col-span-4">
        <form
          className="space-y-3 rounded-xl border border-line bg-card p-4 shadow-xs"
          onSubmit={(e) => {
            e.preventDefault()
            onCreateConversacion(
              {
                titulo: tituloConv.trim() || 'Conversación directa',
                es_grupal: false,
                participantes_ids: destinatarioId ? [Number(destinatarioId)] : [],
              },
              (created) => {
                setTituloConv('')
                setDestinatarioId('')
                if (created?.id) onSelectConversacion(created.id)
              },
            )
          }}
        >
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-primary">
            Nueva conversación privada
          </h3>
          <input
            className="w-full rounded-lg border border-line bg-subtle px-3 py-2 text-xs"
            onChange={(e) => setTituloConv(e.target.value)}
            placeholder="Asunto o título (opcional)"
            value={tituloConv}
          />
          <select
            className="w-full rounded-lg border border-line bg-subtle px-3 py-2 text-xs"
            onChange={(e) => setDestinatarioId(e.target.value)}
            required
            value={destinatarioId}
          >
            <option value="">Selecciona destinatario...</option>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nombres} {u.apellidos} ({u.correo_institucional})
              </option>
            ))}
          </select>
          <button
            className="w-full rounded-xl bg-primary py-2 text-xs font-bold text-white disabled:opacity-50"
            disabled={isCreatingConversacion}
            type="submit"
          >
            {isCreatingConversacion ? 'Creando...' : 'Iniciar conversación'}
          </button>
        </form>

        <div className="space-y-2">
          <p className="text-xs font-extrabold uppercase tracking-wider text-muted">
            Mis conversaciones ({conversaciones.length})
          </p>
          {conversaciones.map((conv) => (
            <button
              className={`w-full rounded-xl border p-3.5 text-left transition ${
                Number(selectedConversacionId) === conv.id
                  ? 'border-primary bg-primary/5'
                  : 'border-line bg-card hover:bg-subtle/60'
              }`}
              key={conv.id}
              onClick={() => onSelectConversacion(conv.id)}
              type="button"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-ink">
                  {conv.titulo || `Conversación #${conv.id}`}
                </span>
                <span className="rounded bg-subtle px-2 py-0.5 text-[10px] font-bold text-primary">
                  #{conv.id}
                </span>
              </div>
              {conv.participantes_info?.length > 0 && (
                <p className="mt-1 truncate text-[11px] text-muted">
                  Participantes:{' '}
                  {conv.participantes_info.map((p) => p.nombre).join(', ')}
                </p>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Columna derecha: Mensajes cifrados */}
      <div className="space-y-4 lg:col-span-8">
        {isLoadingMensajes ? (
          <LoadingState label="Descifrando mensajes directos..." />
        ) : mensajesDirectos.length === 0 ? (
          <EmptyState
            icon="mail_lock"
            title="Sin mensajes en esta conversación"
            description="Los mensajes privados se almacenan cifrados en el servidor y solo son visibles para los participantes."
          />
        ) : (
          <div className="space-y-3">
            {mensajesDirectos.map((msg) => (
              <article
                className="rounded-xl border border-line bg-card p-4 shadow-xs"
                key={msg.id}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-ink">
                    {msg.remitente_nombre || `Remitente #${msg.remitente}`}
                  </span>
                  <span className="rounded bg-subtle px-2 py-0.5 text-[10px] font-semibold text-muted">
                    Conversación #{msg.conversacion}
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted">{msg.contenido}</p>
                {msg.enviado_en && (
                  <p className="mt-2 text-[10px] text-muted/70">
                    {new Date(msg.enviado_en).toLocaleString('es-CL')}
                  </p>
                )}
              </article>
            ))}
          </div>
        )}

        <form
          className="space-y-3 rounded-xl border border-line bg-card p-5 shadow-xs"
          onSubmit={(e) => {
            e.preventDefault()
            onSendMessage(
              {
                conversacion: Number(selectedConversacionId),
                contenido: contenido.trim(),
              },
              () => setContenido(''),
            )
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">
                encrypted
              </span>
              <h3 className="text-sm font-extrabold text-ink">
                Enviar mensaje directo cifrado
              </h3>
            </div>
            {selectedConversacionId && (
              <span className="rounded bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                Conversación #{selectedConversacionId}
              </span>
            )}
          </div>

          <textarea
            className="w-full rounded-lg border border-line bg-subtle px-3 py-2 text-xs"
            disabled={!selectedConversacionId}
            onChange={(e) => setContenido(e.target.value)}
            placeholder={
              selectedConversacionId
                ? 'Escribe tu mensaje privado...'
                : 'Selecciona o crea una conversación a la izquierda primero...'
            }
            required
            rows={3}
            value={contenido}
          />
          <button
            className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white disabled:opacity-50"
            disabled={!selectedConversacionId || isSendingMessage}
            type="submit"
          >
            {isSendingMessage ? 'Enviando...' : 'Enviar mensaje cifrado'}
          </button>
        </form>
      </div>
    </div>
  )
}
