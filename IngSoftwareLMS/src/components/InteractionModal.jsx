import { useState } from 'react'
import { Dialog } from './ui/Dialog'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'

export function InteractionModal({ course, isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('forum') // 'forum' | 'direct'

  // Estados para Foro
  const [forumMessage, setForumMessage] = useState('')
  const [forumTitle, setForumTitle] = useState('')
  const [forumPublishing, setForumPublishing] = useState(false)
  const [forumSuccess, setForumSuccess] = useState(false)
  const [threads, setThreads] = useState([
    {
      id: 'th-1',
      title: 'Duda con sharding horizontal en Docker Compose',
      author: 'Camila Rojas Vega',
      date: 'Hoy 11:20',
      replies: 3,
      status: 'Participando',
    },
    {
      id: 'th-2',
      title: 'Pauta de arquitectura C4: ¿incluir diagramas de código?',
      author: 'Joaquín Navarrete Alarcón',
      date: 'Ayer 16:45',
      replies: 5,
      status: 'Respondido por docente',
    },
  ])

  // Estados para Consulta Privada al Docente
  const [directSubject, setDirectSubject] = useState('')
  const [directMessage, setDirectMessage] = useState('')
  const [sendingDirect, setSendingDirect] = useState(false)
  const [directSuccess, setDirectSuccess] = useState(false)
  const [privateInquiries, setPrivateInquiries] = useState([
    {
      id: 'inq-p1',
      subject: 'Solicitud de justificación de inasistencia a cátedra',
      date: '02 Nov 2026',
      status: 'Respondida',
      response: 'Estimado Esteban, justificativo médico recepcionado correctamente.',
    },
    {
      id: 'inq-p2',
      subject: 'Consulta sobre ponderación de entrega extraordinaria',
      date: '25 Oct 2026',
      status: 'Leída',
      response: '',
    },
  ])

  if (!course) return null

  const MAX_CHARS = 500

  // Publicar en foro
  function handlePostForum(e) {
    e.preventDefault()
    if (!forumTitle.trim() || !forumMessage.trim()) return

    setForumPublishing(true)
    setTimeout(() => {
      const newEntry = {
        id: `th-${Date.now()}`,
        title: forumTitle,
        author: 'Esteban Morales (Tú)',
        date: 'Hace un momento',
        replies: 0,
        status: 'Iniciado por ti',
      }
      setThreads([newEntry, ...threads])
      setForumTitle('')
      setForumMessage('')
      setForumPublishing(false)
      setForumSuccess(true)
      setTimeout(() => setForumSuccess(false), 3000)
    }, 800)
  }

  // Enviar consulta privada
  function handleSendDirect(e) {
    e.preventDefault()
    if (!directSubject.trim() || !directMessage.trim()) return

    setSendingDirect(true)
    setTimeout(() => {
      const newInquiry = {
        id: `inq-${Date.now()}`,
        subject: directSubject,
        date: 'Hoy',
        status: 'Enviada',
        response: '',
      }
      setPrivateInquiries([newInquiry, ...privateInquiries])
      setDirectSubject('')
      setDirectMessage('')
      setSendingDirect(false)
      setDirectSuccess(true)
      setTimeout(() => setDirectSuccess(false), 3500)
    }, 900)
  }

  return (
    <Dialog
      description={`Profesor: ${course.teacher} · ${course.title}`}
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-xs text-[#64748b]">
            {activeTab === 'forum'
              ? 'Los aportes en el foro enriquecen el aprendizaje colectivo.'
              : 'Las consultas privadas son canalizadas con estricta confidencialidad.'}
          </span>
          <Button onClick={onClose} size="sm" variant="tertiary">
            Cerrar
          </Button>
        </div>
      }
      onClose={onClose}
      open={isOpen}
      size="lg"
      subtitle={`${course.code} · Canales de Comunicación`}
      title="Interacción Académica y Consultas"
    >
      <div className="space-y-4">
        {/* Selector de Pestañas */}
        <div className="flex rounded-[10px] bg-[#f1f5f9] p-1 border border-[#dbe3ec]">
          <button
            className={`flex-1 flex items-center justify-center gap-2 rounded-[8px] py-2 text-xs font-bold transition ${
              activeTab === 'forum'
                ? 'bg-white text-[#075477] shadow-xs'
                : 'text-[#64748b] hover:text-[#172033]'
            }`}
            onClick={() => setActiveTab('forum')}
            type="button"
          >
            <span className="material-symbols-outlined text-base">forum</span>
            <span>Foro del Curso (Público)</span>
          </button>
          <button
            className={`flex-1 flex items-center justify-center gap-2 rounded-[8px] py-2 text-xs font-bold transition ${
              activeTab === 'direct'
                ? 'bg-white text-[#075477] shadow-xs'
                : 'text-[#64748b] hover:text-[#172033]'
            }`}
            onClick={() => setActiveTab('direct')}
            type="button"
          >
            <span className="material-symbols-outlined text-base">lock</span>
            <span>Consulta Directa al Docente (Privada)</span>
          </button>
        </div>

        {/* 1. SECCIÓN: FORO DEL CURSO */}
        {activeTab === 'forum' && (
          <div className="space-y-5">
            {/* Aviso explícito de visibilidad pública (Recomendación 8) */}
            <div className="rounded-[10px] border border-[#BAE6FD] bg-[#F0F9FF] p-3 text-xs text-[#0369A1] flex items-start gap-2.5">
              <span className="material-symbols-outlined text-lg shrink-0 mt-0.5">info</span>
              <div>
                <strong className="block text-[#075477]">Publica una pregunta o inicia un debate con tu curso</strong>
                <p className="mt-0.5 text-[#0369A1]">
                  Tu mensaje será visible para todos los estudiantes y docentes de esta asignatura.
                </p>
              </div>
            </div>

            {/* Formulario de Nueva Publicación */}
            <form className="rounded-[10px] border border-[#dbe3ec] bg-white p-4 space-y-3" onSubmit={handlePostForum}>
              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">
                  Título del Debate o Pregunta
                </label>
                <input
                  className="w-full rounded-[8px] border border-[#dbe3ec] bg-[#f8fafc] p-2 text-xs focus:border-[#075477] focus:bg-white focus:outline-none"
                  onChange={(e) => setForumTitle(e.target.value)}
                  placeholder="Ej. Duda con configuración de réplicas en PostgreSQL"
                  required
                  type="text"
                  value={forumTitle}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-[#172033]">
                    Mensaje Detallado
                  </label>
                  <span className={`text-[11px] font-semibold ${
                    forumMessage.length > MAX_CHARS ? 'text-[#c53030]' : 'text-[#64748b]'
                  }`}>
                    {forumMessage.length} / {MAX_CHARS}
                  </span>
                </div>
                <textarea
                  className="w-full rounded-[8px] border border-[#dbe3ec] bg-[#f8fafc] p-2.5 text-xs focus:border-[#075477] focus:bg-white focus:outline-none"
                  maxLength={MAX_CHARS}
                  onChange={(e) => setForumMessage(e.target.value)}
                  placeholder="Describe tu consulta con claridad..."
                  required
                  rows={3}
                  value={forumMessage}
                />
              </div>

              {forumSuccess && (
                <div className="rounded-[8px] border border-[#BBF7D0] bg-[#F0FDF4] p-2 text-xs font-bold text-[#16856a] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  Pregunta publicada con éxito en el foro de la sección.
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                {(forumTitle || forumMessage) && (
                  <Button
                    onClick={() => {
                      setForumTitle('')
                      setForumMessage('')
                    }}
                    size="sm"
                    variant="tertiary"
                  >
                    Cancelar borrador
                  </Button>
                )}
                <Button
                  disabled={forumPublishing || !forumTitle.trim() || !forumMessage.trim()}
                  isLoading={forumPublishing}
                  loadingText="Publicando..."
                  size="sm"
                  type="submit"
                  variant="primary"
                >
                  Publicar en el foro
                </Button>
              </div>
            </form>

            {/* Listado de debates con metadatos requeridos */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748b]">
                Debates y Consultas Activas ({threads.length})
              </h4>

              <div className="space-y-2">
                {threads.map((t) => (
                  <div
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-[10px] border border-[#dbe3ec] bg-white p-3 hover:bg-[#f8fafc] transition"
                    key={t.id}
                  >
                    <div>
                      <h5 className="text-xs font-bold text-[#172033]">{t.title}</h5>
                      <p className="text-[11px] text-[#64748b] mt-0.5">
                        Por <strong className="text-[#172033]">{t.author}</strong> · {t.date}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge size="sm" variant={t.status.includes('docente') ? 'success' : 'primary'}>
                        {t.status}
                      </Badge>
                      <span className="inline-flex items-center gap-1 rounded-md bg-[#f1f5f9] px-2 py-0.5 text-[11px] font-bold text-[#64748b]">
                        <span className="material-symbols-outlined text-xs">reply</span>
                        {t.replies} respuestas
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 2. SECCIÓN: CONSULTA DIRECTA AL DOCENTE */}
        {activeTab === 'direct' && (
          <div className="space-y-5">
            {/* Aviso explícito de privacidad (Recomendación 8) */}
            <div className="rounded-[10px] border border-[#BBF7D0] bg-[#F0FDF4] p-3 text-xs text-[#166534] flex items-start gap-2.5">
              <span className="material-symbols-outlined text-lg shrink-0 mt-0.5">lock</span>
              <div>
                <strong className="block text-[#166534]">Canal Privado y Confidencial</strong>
                <p className="mt-0.5 text-[#166534]">
                  Esta consulta será visible únicamente para ti y el docente responsable ({course.teacher}).
                </p>
              </div>
            </div>

            {/* Formulario de Consulta Privada */}
            <form className="rounded-[10px] border border-[#dbe3ec] bg-white p-4 space-y-3" onSubmit={handleSendDirect}>
              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">
                  Asunto de la Consulta
                </label>
                <input
                  className="w-full rounded-[8px] border border-[#dbe3ec] bg-[#f8fafc] p-2 text-xs focus:border-[#075477] focus:bg-white focus:outline-none"
                  onChange={(e) => setDirectSubject(e.target.value)}
                  placeholder="Ej. Consulta sobre pauta de evaluación o situación académica personal"
                  required
                  type="text"
                  value={directSubject}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-[#172033]">
                    Mensaje Privado
                  </label>
                  <span className="text-[11px] font-semibold text-[#64748b]">
                    {directMessage.length} / {MAX_CHARS}
                  </span>
                </div>
                <textarea
                  className="w-full rounded-[8px] border border-[#dbe3ec] bg-[#f8fafc] p-2.5 text-xs focus:border-[#075477] focus:bg-white focus:outline-none"
                  maxLength={MAX_CHARS}
                  onChange={(e) => setDirectMessage(e.target.value)}
                  placeholder="Escribe tu mensaje con detalles para el profesor..."
                  required
                  rows={4}
                  value={directMessage}
                />
              </div>

              {directSuccess && (
                <div className="rounded-[8px] border border-[#BBF7D0] bg-[#F0FDF4] p-2 text-xs font-bold text-[#16856a] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  Consulta enviada correctamente al docente.
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <Button
                  disabled={sendingDirect || !directSubject.trim() || !directMessage.trim()}
                  isLoading={sendingDirect}
                  loadingText="Enviando..."
                  size="sm"
                  type="submit"
                  variant="primary"
                >
                  Enviar consulta privada
                </Button>
              </div>
            </form>

            {/* Historial de consultas privadas con estado: Enviada, Leída, Respondida */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748b]">
                Historial de Consultas Privadas ({privateInquiries.length})
              </h4>

              <div className="space-y-2">
                {privateInquiries.map((inq) => (
                  <div
                    className="rounded-[10px] border border-[#dbe3ec] bg-white p-3 text-xs space-y-1.5"
                    key={inq.id}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#172033]">{inq.subject}</span>
                      <Badge
                        size="sm"
                        variant={
                          inq.status === 'Respondida'
                            ? 'success'
                            : inq.status === 'Leída'
                            ? 'primary'
                            : 'warning'
                        }
                      >
                        {inq.status}
                      </Badge>
                    </div>
                    <span className="text-[11px] text-[#64748b] block">Enviada el {inq.date}</span>

                    {inq.response && (
                      <div className="mt-2 rounded-[8px] border border-[#BBF7D0] bg-[#F0FDF4] p-2 text-[11px] text-[#166534]">
                        <strong>Respuesta docente:</strong> {inq.response}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  )
}
