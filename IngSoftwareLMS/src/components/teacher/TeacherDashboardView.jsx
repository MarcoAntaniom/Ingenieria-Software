import { useState } from 'react'
import { TEACHER_DATA } from '../../data/mockData'
import { Badge } from '../ui/Badge'
import { ProgressBar } from '../ui/ProgressBar'

export function TeacherDashboardView({ activeSubView, onNavigate }) {
  // Pestaña interna si no viene de la navegación principal
  const [currentTab, setCurrentTab] = useState(activeSubView || 'teacher-overview')

  // Datos locales con estado reactivo para mutaciones
  const [sections, setSections] = useState(TEACHER_DATA.sections)
  const [submissions, setSubmissions] = useState(TEACHER_DATA.submissions)
  const [gradebook, setGradebook] = useState(TEACHER_DATA.gradebook)
  const [modules, setModules] = useState(TEACHER_DATA.modules)
  const [announcements, setAnnouncements] = useState([
    {
      id: 'doc-anc-1',
      title: 'Pauta de corrección y rúbrica Hito 2 disponible',
      section: 'INF-321 Sec. 1',
      date: 'Hoy 10:15',
      content: 'Estimados estudiantes: se ha subido la rúbrica detallada para la entrega de arquitectura C4.',
    },
  ])

  const [teacherNotice, setTeacherNotice] = useState(null)
  const [editingModule, setEditingModule] = useState(null)
  const [evaluationsList, setEvaluationsList] = useState([
    {
      id: 'eval-1',
      title: 'Hito 1: Especificación de Requisitos SRS',
      type: 'Sumativa (20%)',
      badgeVariant: 'primary',
      status: 'Completada',
      statusColor: 'text-[#16856A]',
      subtitle: 'Modalidad Grupal (máx 4) · Venció el 28 Oct 2026',
      reqs: 'SRS IEEE 830, Casos de Uso.',
    },
    {
      id: 'eval-2',
      title: 'Hito 2: Arquitectura y Modelado C4',
      type: 'Sumativa (30%)',
      badgeVariant: 'danger',
      status: 'Vence en 6 días',
      statusColor: 'text-[#C53030]',
      subtitle: 'Modalidad Grupal (máx 4) · Vencimiento: 12 Nov 2026, 23:59 hrs',
      reqs: 'Software: VS Code, Git, PlantUML. Pauta oficial cargada.',
    },
  ])

  // Modales
  const [gradingModalOpen, setGradingModalOpen] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState(null)
  const [inputGrade, setInputGrade] = useState('')
  const [inputFeedback, setInputFeedback] = useState('')

  const [createEvalModalOpen, setCreateEvalModalOpen] = useState(false)
  const [newEval, setNewEval] = useState({
    title: '',
    section: 'INF-321',
    type: 'Sumativa',
    weight: '25%',
    dueDate: '',
    dueTime: '23:59',
    mode: 'Grupal (máx 4)',
    softwareReqs: 'Docker, PostgreSQL 16, VS Code',
  })

  const [publishModuleModalOpen, setPublishModuleModalOpen] = useState(false)
  const [newModule, setNewModule] = useState({
    title: '',
    unitNumber: modules.length + 1,
    resourceType: 'Guía PDF',
    status: 'Publicado',
  })

  const [closeActaModalOpen, setCloseActaModalOpen] = useState(false)
  const [actaClosedSuccess, setActaClosedSuccess] = useState(false)

  const [newNoticeTitle, setNewNoticeTitle] = useState('')
  const [newNoticeContent, setNewNoticeContent] = useState('')
  const [newNoticeSection, setNewNoticeSection] = useState('INF-321 Sec. 1')

  const [forumInquiries, setForumInquiries] = useState([
    {
      id: 'inq-1',
      student: 'Camila Rojas',
      course: 'INF-321 Sec. 1',
      topic: 'Duda con sharding horizontal en Docker Compose',
      date: 'Hoy 11:20',
      status: 'pending', // 'pending' | 'resolved'
      reply: '',
    },
    {
      id: 'inq-2',
      student: 'Joaquín Navarrete',
      course: 'INF-321 Sec. 1',
      topic: 'Consulta sobre formato de entrega PlantUML',
      date: 'Ayer 16:45',
      status: 'resolved',
      reply: 'Pueden adjuntar tanto los archivos .puml fuente como el render en PDF.',
    },
  ])
  const [replyText, setReplyText] = useState('')
  const [activeInquiryId, setActiveInquiryId] = useState(null)

  // Submissions pendientes
  const pendingGradingCount = submissions.filter((s) => s.status === 'pendiente').length

  // Sincronizar pestaña si el prop cambia
  const activeTab = activeSubView || currentTab

  function handleSelectTab(tabId) {
    setCurrentTab(tabId)
    onNavigate?.(tabId)
  }

  // --- Handlers de Calificación ---
  function openGrading(sub) {
    setSelectedSubmission(sub)
    setInputGrade(sub.grade || '')
    setInputFeedback(sub.feedback || '')
    setGradingModalOpen(true)
  }

  function handleSaveGrade(e) {
    e.preventDefault()
    if (!inputGrade) return

    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === selectedSubmission.id
          ? {
              ...s,
              grade: inputGrade,
              feedback: inputFeedback,
              status: 'calificado',
            }
          : s,
      ),
    )

    // Actualizar también en el libro de calificaciones si coincide el nombre
    setGradebook((prev) =>
      prev.map((g) => {
        if (g.name === selectedSubmission.studentName) {
          return {
            ...g,
            hito2: inputGrade,
            promedio: (
              (parseFloat(g.hito1 || '6.0') * 0.3 +
                parseFloat(g.taller || '6.0') * 0.3 +
                parseFloat(inputGrade) * 0.4)
            ).toFixed(1),
          }
        }
        return g
      }),
    )

    setGradingModalOpen(false)
  }

  // --- Handlers de Nueva Evaluación ---
  function handleCreateEvaluation(e) {
    e.preventDefault()
    const newEvalItem = {
      id: `eval-${Date.now()}`,
      title: newEval.title || 'Nueva Evaluación',
      type: `${newEval.type} (${newEval.weight})`,
      badgeVariant: newEval.type === 'Sumativa' ? 'danger' : 'primary',
      status: 'Activa',
      statusColor: 'text-[#0B4F6C]',
      subtitle: `Modalidad ${newEval.mode} · Vencimiento: ${newEval.dueDate || '15 Nov 2026'}, ${newEval.dueTime} hrs`,
      reqs: `Software: ${newEval.softwareReqs}. Sección: ${newEval.section}`,
    }
    setEvaluationsList((prev) => [newEvalItem, ...prev])
    setTeacherNotice(
      `Evaluación creada exitosamente: "${newEval.title}" (${newEval.weight}) para ${newEval.section}. Se ha publicado en el calendario y centro de tareas.`,
    )
    setCreateEvalModalOpen(false)
    setNewEval({
      title: '',
      section: 'INF-321',
      type: 'Sumativa',
      weight: '25%',
      dueDate: '',
      dueTime: '23:59',
      mode: 'Grupal (máx 4)',
      softwareReqs: 'Docker, PostgreSQL 16, VS Code',
    })
    setTimeout(() => setTeacherNotice(null), 5000)
  }

  // --- Handlers de Descarga de Archivo de Entrega ---
  function handleDownloadSubmissionFile(sub) {
    const file = sub || selectedSubmission
    if (!file) return
    const text = `Campus Virtual LMS - Entrega Académica\nEstudiante: ${file.studentName}\nRUT: ${file.rut}\nAsignatura: ${file.courseCode}\nActividad: ${file.taskTitle}\nFecha de Entrega: ${file.submittedAt}\nNombre Archivo: ${file.fileName}\nTamaño: ${file.fileSize}\n`
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', file.fileName || 'entrega_estudiante.txt')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    setTeacherNotice(`Archivo "${file.fileName}" descargado exitosamente.`)
    setTimeout(() => setTeacherNotice(null), 4000)
  }

  // --- Handlers de Nueva Unidad / Material ---
  function handlePublishModule(e) {
    e.preventDefault()
    const newEntry = {
      id: `mod-${Date.now()}`,
      unitNumber: parseInt(newModule.unitNumber, 10) || modules.length + 1,
      title: newModule.title,
      resourcesCount: 1,
      publishedAt: 'Hoy',
      status: newModule.status,
    }
    setModules([...modules, newEntry])
    setPublishModuleModalOpen(false)
    setNewModule({
      title: '',
      unitNumber: modules.length + 2,
      resourceType: 'Guía PDF',
      status: 'Publicado',
    })
  }

  // --- Handlers de Cierre de Acta ---
  function handleConfirmCloseActa() {
    setSections((prev) =>
      prev.map((s) => (s.code === 'INF-321' ? { ...s, actaClosed: true } : s)),
    )
    setActaClosedSuccess(true)
    setTimeout(() => {
      setCloseActaModalOpen(false)
      setActaClosedSuccess(false)
    }, 1800)
  }

  // --- Handlers de Aviso ---
  function handlePublishNotice(e) {
    e.preventDefault()
    if (!newNoticeTitle.trim() || !newNoticeContent.trim()) return

    const notice = {
      id: `doc-anc-${Date.now()}`,
      title: newNoticeTitle,
      section: newNoticeSection,
      date: 'Hoy',
      content: newNoticeContent,
    }
    setAnnouncements([notice, ...announcements])
    setNewNoticeTitle('')
    setNewNoticeContent('')
    setTeacherNotice('Aviso publicado con éxito en el panel central de los estudiantes.')
    setTimeout(() => setTeacherNotice(null), 4000)
  }

  // --- Handlers de Consulta ---
  function handleSendReply(inquiryId) {
    if (!replyText.trim()) return
    setForumInquiries((prev) =>
      prev.map((inq) =>
        inq.id === inquiryId ? { ...inq, status: 'resolved', reply: replyText } : inq,
      ),
    )
    setReplyText('')
    setActiveInquiryId(null)
  }

  return (
    <div className="space-y-6">
      {/* 1. Header del Docente con Contexto y Rol Verificado */}
      <div className="flex flex-col gap-4 rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-6 shadow-xs lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[#0B4F6C]">
            <span className="material-symbols-outlined text-lg">supervisor_account</span>
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Portal de Gestión Docente y Cátedras
            </span>
            <Badge size="sm" variant="primary">Docente Titular</Badge>
          </div>
          <h1 className="mt-1 text-2xl sm:text-[26px] font-extrabold tracking-tight text-[#1F2937]">
            {TEACHER_DATA.teacherName}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#4B5563]">
            {TEACHER_DATA.email} · {TEACHER_DATA.department}
          </p>
        </div>

        {/* Resumen rápido de carga docente */}
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2 text-center">
            <span className="block text-xl font-black text-[#0B4F6C]">{sections.length}</span>
            <span className="text-[10px] font-bold uppercase text-[#64748B]">Secciones</span>
          </div>

          <div className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-3.5 py-2 text-center">
            <span className="block text-xl font-black text-[#C53030]">
              {pendingGradingCount}
            </span>
            <span className="text-[10px] font-bold uppercase text-[#C53030]">Por Corregir</span>
          </div>

          <div className="rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] px-3.5 py-2 text-center">
            <span className="block text-xl font-black text-[#16856A]">60</span>
            <span className="text-[10px] font-bold uppercase text-[#16856A]">Alumnos</span>
          </div>
        </div>
      </div>

      {/* Banner de Notificación / Feedback para Docente */}
      {teacherNotice && (
        <div
          className="flex items-center justify-between rounded-2xl border border-[#BAE6FD] bg-[#F0F9FF] p-4 text-xs font-semibold text-[#075477] shadow-xs animate-in fade-in"
          role="status"
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lg text-[#0284C7]">check_circle</span>
            <span>{teacherNotice}</span>
          </div>
          <button
            aria-label="Cerrar notificación"
            className="rounded-lg p-1 text-[#0369A1] hover:bg-[#E0F2FE]"
            onClick={() => setTeacherNotice(null)}
            type="button"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      )}

      {/* 2. Pestañas de Navegación del Rol Docente */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-[#E2E8F0] pb-2">
        {[
          { id: 'teacher-overview', label: 'Mis Secciones y Avance', icon: 'dashboard' },
          {
            id: 'teacher-grading',
            label: 'Calificación y Entregas',
            icon: 'rate_review',
            badge: pendingGradingCount > 0 ? pendingGradingCount : null,
          },
          { id: 'teacher-gradebook', label: 'Libro de Calificaciones y Actas', icon: 'menu_book' },
          { id: 'teacher-contents', label: 'Gestión de Contenidos', icon: 'folder_open' },
          { id: 'teacher-evaluations', label: 'Configurar Evaluaciones', icon: 'tune' },
          { id: 'teacher-announcements', label: 'Avisos y Foros', icon: 'campaign' },
        ].map((tab) => {
          const isSelected = activeTab === tab.id
          return (
            <button
              className={`inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                isSelected
                  ? 'bg-[#0B4F6C] text-white shadow-xs'
                  : 'text-[#4B5563] hover:bg-[#F1F5F9] hover:text-[#1F2937]'
              }`}
              key={tab.id}
              onClick={() => handleSelectTab(tab.id)}
              type="button"
            >
              <span className="material-symbols-outlined text-base">{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="grid size-4.5 place-items-center rounded-full bg-[#C53030] text-[10px] font-bold text-white">
                  {tab.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* 3. SUB-VISTA 1: Mis Secciones y Avance Colectivo */}
      {activeTab === 'teacher-overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {sections.map((sec) => (
              <div
                className="rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between"
                key={sec.id}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#0B4F6C] bg-[#E8F3F8] px-2.5 py-1 rounded-md">
                      {sec.code} · Sección {sec.section}
                    </span>
                    <Badge variant={sec.actaClosed ? 'success' : 'primary'}>
                      {sec.actaClosed ? 'Acta Oficial Cerrada' : 'Semestre en Curso'}
                    </Badge>
                  </div>

                  <h3 className="mt-3 text-lg font-bold text-[#1F2937]">{sec.title}</h3>

                  <div className="mt-3 space-y-1.5 text-xs text-[#4B5563]">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base text-[#64748B]">schedule</span>
                      <span>{sec.classSchedule}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base text-[#64748B]">room</span>
                      <span>{sec.classroom}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base text-[#64748B]">group</span>
                      <span>
                        <strong className="text-[#1F2937]">{sec.enrolledStudents}</strong> estudiantes inscritos
                      </span>
                    </div>
                  </div>

                  {/* Avance modular colectivo */}
                  <div className="mt-5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3.5">
                    <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                      <span className="text-[#4B5563]">Avance Modular Colectivo</span>
                      <span className="text-[#0B4F6C] font-bold">{sec.collectiveProgress}%</span>
                    </div>
                    <ProgressBar value={sec.collectiveProgress} variant="primary" />
                    <span className="mt-1.5 block text-[11px] text-[#64748B]">
                      3 de 4 unidades curriculares completadas
                    </span>
                  </div>
                </div>

                {/* Acciones directas por sección */}
                <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-[#E2E8F0] pt-4">
                  <button
                    className="flex-1 rounded-xl bg-[#0B4F6C] py-2 px-3 text-center text-xs font-bold text-white hover:bg-[#083C53]"
                    onClick={() => handleSelectTab('teacher-gradebook')}
                    type="button"
                  >
                    Ver Libro de Notas
                  </button>
                  <button
                    className="rounded-xl border border-[#E2E8F0] bg-white py-2 px-3 text-xs font-bold text-[#4B5563] hover:bg-[#F8FAFC]"
                    onClick={() => handleSelectTab('teacher-grading')}
                    type="button"
                  >
                    Entregas ({sec.pendingGradingCount})
                  </button>
                  <button
                    className="rounded-xl border border-[#E2E8F0] bg-white py-2 px-3 text-xs font-bold text-[#4B5563] hover:bg-[#F8FAFC]"
                    onClick={() => handleSelectTab('teacher-contents')}
                    type="button"
                  >
                    Contenidos
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. SUB-VISTA 2: Calificación y Retroalimentación Pedagógica */}
      {activeTab === 'teacher-grading' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4 mb-4">
              <div>
                <h2 className="text-xl font-bold text-[#1F2937]">
                  Recepción de Entregas y Calificación
                </h2>
                <p className="mt-1 text-xs text-[#4B5563]">
                  Revisa las evaluaciones sumativas, formativas y grupales enviadas por los estudiantes.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-[#FEF2F2] border border-[#FECACA] px-3 py-1 text-xs font-bold text-[#C53030]">
                  {pendingGradingCount} entregas pendientes de corrección
                </span>
              </div>
            </div>

            {/* Tabla de Entregas */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E2E8F0] text-[#64748B] uppercase text-[10px] tracking-wider">
                    <th className="pb-3 font-bold">Estudiante</th>
                    <th className="pb-3 font-bold">Ramo</th>
                    <th className="pb-3 font-bold">Actividad / Hito</th>
                    <th className="pb-3 font-bold">Fecha Envío</th>
                    <th className="pb-3 font-bold">Archivo</th>
                    <th className="pb-3 font-bold text-center">Estado</th>
                    <th className="pb-3 font-bold text-center">Nota</th>
                    <th className="pb-3 font-bold text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {submissions.map((sub) => {
                    const isPending = sub.status === 'pendiente'
                    return (
                      <tr className="hover:bg-[#F8FAFC]" key={sub.id}>
                        <td className="py-3 font-medium text-[#1F2937]">
                          <span className="block font-bold">{sub.studentName}</span>
                          <span className="font-mono text-[11px] text-[#64748B]">{sub.rut}</span>
                        </td>
                        <td className="py-3 font-mono font-semibold text-[#0B4F6C]">
                          {sub.courseCode}
                        </td>
                        <td className="py-3 text-[#1F2937] font-medium max-w-xs truncate">
                          {sub.taskTitle}
                        </td>
                        <td className="py-3 text-[#64748B] whitespace-nowrap">{sub.submittedAt}</td>
                        <td className="py-3">
                          <button
                            className="inline-flex items-center gap-1 rounded-md bg-[#F1F5F9] px-2 py-1 text-[11px] font-mono text-[#0B4F6C] hover:bg-[#E2E8F0]"
                            onClick={() => handleDownloadSubmissionFile(sub)}
                            title="Descargar archivo"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-xs">attachment</span>
                            <span className="truncate max-w-[120px]">{sub.fileName}</span>
                          </button>
                        </td>
                        <td className="py-3 text-center">
                          {isPending ? (
                            <Badge size="sm" variant="danger">
                              Pendiente
                            </Badge>
                          ) : (
                            <Badge size="sm" variant="success">
                              Calificado
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 text-center font-extrabold text-sm text-[#1F2937]">
                          {sub.grade || '—'}
                        </td>
                        <td className="py-3 text-right">
                          <button
                            className="rounded-lg bg-[#0B4F6C] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#083C53]"
                            onClick={() => openGrading(sub)}
                            type="button"
                          >
                            {isPending ? 'Calificar' : 'Editar nota'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. SUB-VISTA 3: Libro de Calificaciones y Cierre de Acta */}
      {activeTab === 'teacher-gradebook' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4 mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0B4F6C]">
                  INF-321 · Sección 1 · Semestre Otoño 2026
                </span>
                <h2 className="mt-0.5 text-xl font-bold text-[#1F2937]">
                  Libro de Calificaciones y Acta Final
                </h2>
                <p className="mt-1 text-xs text-[#4B5563]">
                  Registro oficial de notas parciales, asistencia y promedios para convalidación institucional.
                </p>
              </div>

              {/* Botón de Cierre de Acta */}
              <div>
                <button
                  className="inline-flex items-center gap-2 rounded-xl bg-[#16856A] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#126b55] transition"
                  onClick={() => setCloseActaModalOpen(true)}
                  type="button"
                >
                  <span className="material-symbols-outlined text-base">verified</span>
                  <span>Cerrar y Timbrar Acta de Notas</span>
                </button>
              </div>
            </div>

            {/* Tabla Nómina y Calificaciones */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E2E8F0] text-[#64748B] uppercase text-[10px] tracking-wider">
                    <th className="pb-3 font-bold">#</th>
                    <th className="pb-3 font-bold">RUT</th>
                    <th className="pb-3 font-bold">Estudiante</th>
                    <th className="pb-3 font-bold text-center">Hito 1 (20%)</th>
                    <th className="pb-3 font-bold text-center">Taller (15%)</th>
                    <th className="pb-3 font-bold text-center">Hito 2 (30%)</th>
                    <th className="pb-3 font-bold text-center">Asistencia</th>
                    <th className="pb-3 font-bold text-center">Promedio</th>
                    <th className="pb-3 font-bold text-right">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {gradebook.map((row) => (
                    <tr className="hover:bg-[#F8FAFC]" key={row.id}>
                      <td className="py-3 font-mono text-[#64748B]">{row.id}</td>
                      <td className="py-3 font-mono text-[#4B5563]">{row.rut}</td>
                      <td className="py-3 font-bold text-[#1F2937]">{row.name}</td>
                      <td className="py-3 text-center font-semibold text-[#1F2937]">{row.hito1}</td>
                      <td className="py-3 text-center font-semibold text-[#1F2937]">{row.taller}</td>
                      <td className="py-3 text-center font-semibold text-[#0B4F6C]">{row.hito2}</td>
                      <td className="py-3 text-center font-semibold text-[#16856A]">
                        {row.asistencia}
                      </td>
                      <td className="py-3 text-center font-extrabold text-sm text-[#0B4F6C]">
                        {row.promedio}
                      </td>
                      <td className="py-3 text-right">
                        <Badge size="sm" variant={parseFloat(row.promedio) >= 4.0 ? 'success' : 'danger'}>
                          {parseFloat(row.promedio) >= 4.0 ? 'Aprobando' : 'Reprobando'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 6. SUB-VISTA 4: Gestión de Contenidos y Módulos */}
      {activeTab === 'teacher-contents' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4 mb-4">
              <div>
                <h2 className="text-xl font-bold text-[#1F2937]">
                  Unidades Didácticas y Material de Estudio
                </h2>
                <p className="mt-1 text-xs text-[#4B5563]">
                  Organiza las unidades de aprendizaje, publica guías de laboratorio y documentos de cátedra.
                </p>
              </div>

              <button
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B4F6C] px-4 py-2 text-xs font-bold text-white hover:bg-[#083C53]"
                onClick={() => setPublishModuleModalOpen(true)}
                type="button"
              >
                <span className="material-symbols-outlined text-base">add</span>
                <span>Publicar Nueva Unidad / Material</span>
              </button>
            </div>

            <div className="space-y-3">
              {modules.map((m) => (
                <div
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-[#E2E8F0] p-4 transition hover:bg-[#F8FAFC]"
                  key={m.id}
                >
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-xl bg-[#E8F3F8] text-[#0B4F6C] font-black text-sm">
                      {m.unitNumber}
                    </span>
                    <div>
                      <h3 className="font-bold text-[#1F2937] text-sm">{m.title}</h3>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-[#64748B]">
                        <span>{m.resourcesCount} archivos y guías subidas</span>
                        <span>·</span>
                        <span>Publicado: {m.publishedAt}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={m.status === 'Publicado' ? 'success' : 'warning'}>
                      {m.status}
                    </Badge>
                    <button
                      className="rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-bold text-[#4B5563] hover:bg-[#F1F5F9]"
                      onClick={() => setEditingModule(m)}
                      type="button"
                    >
                      Editar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 7. SUB-VISTA 5: Configuración de Evaluaciones */}
      {activeTab === 'teacher-evaluations' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4 mb-4">
              <div>
                <h2 className="text-xl font-bold text-[#1F2937]">
                  Configuración de Evaluaciones y Pautas
                </h2>
                <p className="mt-1 text-xs text-[#4B5563]">
                  Define rúbricas, ponderaciones porcentuales, plazos de entrega y requisitos técnicos.
                </p>
              </div>

              <button
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B4F6C] px-4 py-2 text-xs font-bold text-white hover:bg-[#083C53]"
                onClick={() => setCreateEvalModalOpen(true)}
                type="button"
              >
                <span className="material-symbols-outlined text-base">add_task</span>
                <span>Configurar Nueva Evaluación</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {evaluationsList.map((ev) => (
                <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4" key={ev.id}>
                  <div className="flex justify-between items-start">
                    <Badge variant={ev.badgeVariant || 'primary'}>{ev.type}</Badge>
                    <span className={`text-xs font-bold ${ev.statusColor}`}>{ev.status}</span>
                  </div>
                  <h3 className="font-bold text-[#1F2937] mt-2">{ev.title}</h3>
                  <p className="text-xs text-[#64748B] mt-1">{ev.subtitle}</p>
                  {ev.reqs && <p className="text-[11px] text-[#4B5563] mt-2">{ev.reqs}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 8. SUB-VISTA 6: Avisos y Foros de Interacción */}
      {activeTab === 'teacher-announcements' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Publicador de Avisos Directos */}
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-6 shadow-xs">
            <h2 className="text-lg font-bold text-[#1F2937]">Publicar Aviso a Estudiantes</h2>
            <p className="text-xs text-[#4B5563] mt-0.5 mb-4">
              Este comunicado se proyectará directamente en el panel principal de los alumnos.
            </p>

            <form className="space-y-3" onSubmit={handlePublishNotice}>
              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                  Sección Destino
                </label>
                <select
                  className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2 text-xs"
                  onChange={(e) => setNewNoticeSection(e.target.value)}
                  value={newNoticeSection}
                >
                  <option value="INF-321 Sec. 1">INF-321 Sec. 1 - Ing. de Software</option>
                  <option value="INF-510 Sec. 1">INF-510 Sec. 1 - Capstone</option>
                  <option value="Todas">Todas mis secciones activas</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                  Título del Comunicado
                </label>
                <input
                  className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2 text-xs"
                  onChange={(e) => setNewNoticeTitle(e.target.value)}
                  placeholder="Ej. Recordatorio de entrega Hito 2"
                  required
                  type="text"
                  value={newNoticeTitle}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                  Mensaje Detallado
                </label>
                <textarea
                  className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2 text-xs"
                  onChange={(e) => setNewNoticeContent(e.target.value)}
                  placeholder="Escribe el recordatorio o instrucción para los alumnos..."
                  required
                  rows={4}
                  value={newNoticeContent}
                />
              </div>

              <button
                className="w-full rounded-xl bg-[#0B4F6C] py-2 text-xs font-bold text-white hover:bg-[#083C53]"
                type="submit"
              >
                Emitir Comunicado
              </button>
            </form>
          </div>

          {/* Moderación de Foros y Consultas */}
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-6 shadow-xs">
            <h2 className="text-lg font-bold text-[#1F2937]">Consultas Recibidas en Foro</h2>
            <p className="text-xs text-[#4B5563] mt-0.5 mb-4">
              Preguntas formuladas por los alumnos en los canales de la clase.
            </p>

            <div className="space-y-3">
              {forumInquiries.map((inq) => (
                <div
                  className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3.5 text-xs"
                  key={inq.id}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-[#1F2937]">{inq.student}</span>
                    <Badge size="sm" variant={inq.status === 'resolved' ? 'success' : 'warning'}>
                      {inq.status === 'resolved' ? 'Respondida' : 'Pendiente'}
                    </Badge>
                  </div>
                  <p className="text-[#4B5563] mt-1 font-medium">{inq.topic}</p>
                  <span className="text-[10px] text-[#64748B] mt-1 block">
                    {inq.course} · {inq.date}
                  </span>

                  {inq.reply ? (
                    <div className="mt-2.5 rounded-lg border border-[#BBF7D0] bg-[#F0FDF4] p-2 text-[11px] text-[#166534]">
                      <strong>Tu respuesta:</strong> {inq.reply}
                    </div>
                  ) : activeInquiryId === inq.id ? (
                    <div className="mt-2.5 space-y-2">
                      <textarea
                        className="w-full rounded-lg border border-[#E2E8F0] bg-white p-2 text-xs"
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Escribe la respuesta docente..."
                        rows={2}
                        value={replyText}
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          className="rounded-lg border border-[#E2E8F0] px-2.5 py-1 text-[11px] text-[#4B5563]"
                          onClick={() => setActiveInquiryId(null)}
                          type="button"
                        >
                          Cancelar
                        </button>
                        <button
                          className="rounded-lg bg-[#0B4F6C] px-3 py-1 text-[11px] font-bold text-white"
                          onClick={() => handleSendReply(inq.id)}
                          type="button"
                        >
                          Publicar Respuesta
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      className="mt-2 text-[11px] font-bold text-[#0B4F6C] hover:underline"
                      onClick={() => {
                        setActiveInquiryId(inq.id)
                        setReplyText('')
                      }}
                      type="button"
                    >
                      Responder a {inq.student} &rarr;
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Calificación y Retroalimentación */}
      {gradingModalOpen && selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-2xl">
            <button
              aria-label="Cerrar modal"
              className="absolute right-4 top-4 rounded-full p-1 text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#1F2937]"
              onClick={() => setGradingModalOpen(false)}
              type="button"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <span className="font-mono text-xs font-bold text-[#0B4F6C]">
              {selectedSubmission.courseCode} · Entrega #{selectedSubmission.id}
            </span>
            <h3 className="mt-1 text-lg font-bold text-[#1F2937]">
              Calificar Entrega: {selectedSubmission.studentName}
            </h3>
            <p className="text-xs text-[#4B5563] mt-0.5">
              {selectedSubmission.taskTitle} (RUT: {selectedSubmission.rut})
            </p>

            <div className="my-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3 text-xs flex items-center justify-between">
              <div>
                <span className="font-bold text-[#1F2937] block">Archivo adjunto por el estudiante</span>
                <span className="text-[#64748B]">
                  {selectedSubmission.fileName} ({selectedSubmission.fileSize})
                </span>
              </div>
              <button
                className="rounded-lg bg-white border border-[#E2E8F0] px-3 py-1 text-xs font-bold text-[#0B4F6C] hover:bg-[#F1F5F9]"
                onClick={() => handleDownloadSubmissionFile(selectedSubmission)}
                type="button"
              >
                Descargar
              </button>
            </div>

            <form className="space-y-3" onSubmit={handleSaveGrade}>
              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                  Nota Asignada (Escala 1.0 a 7.0)
                </label>
                <input
                  className="w-full rounded-xl border border-[#E2E8F0] bg-white p-2.5 text-xs font-bold text-[#1F2937]"
                  max="7.0"
                  min="1.0"
                  onChange={(e) => setInputGrade(e.target.value)}
                  placeholder="Ej. 6.5"
                  required
                  step="0.1"
                  type="number"
                  value={inputGrade}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                  Observaciones Pedagógicas y Retroalimentación
                </label>
                <textarea
                  className="w-full rounded-xl border border-[#E2E8F0] bg-white p-2.5 text-xs"
                  onChange={(e) => setInputFeedback(e.target.value)}
                  placeholder="Detalla fortalezas, aspectos a corregir según la rúbrica institucional..."
                  rows={4}
                  value={inputFeedback}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  className="rounded-xl border border-[#E2E8F0] px-4 py-2 text-xs font-bold text-[#4B5563]"
                  onClick={() => setGradingModalOpen(false)}
                  type="button"
                >
                  Cancelar
                </button>
                <button
                  className="rounded-xl bg-[#0B4F6C] px-4 py-2 text-xs font-bold text-white hover:bg-[#083C53]"
                  type="submit"
                >
                  Guardar y Notificar al Estudiante
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Configurar Nueva Evaluación */}
      {createEvalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-2xl">
            <button
              aria-label="Cerrar modal"
              className="absolute right-4 top-4 rounded-full p-1 text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#1F2937]"
              onClick={() => setCreateEvalModalOpen(false)}
              type="button"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <h3 className="text-lg font-bold text-[#1F2937]">Configurar Nueva Evaluación</h3>
            <p className="text-xs text-[#4B5563] mt-0.5 mb-4">
              Define los parámetros, ponderación y pauta para tu sección.
            </p>

            <form className="space-y-3" onSubmit={handleCreateEvaluation}>
              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                  Título de la Evaluación
                </label>
                <input
                  className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2 text-xs"
                  onChange={(e) => setNewEval({ ...newEval, title: e.target.value })}
                  placeholder="Ej. Control 2: Árboles y Grafos"
                  required
                  type="text"
                  value={newEval.title}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                    Tipo de Evaluación
                  </label>
                  <select
                    className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2 text-xs"
                    onChange={(e) => setNewEval({ ...newEval, type: e.target.value })}
                    value={newEval.type}
                  >
                    <option value="Sumativa">Sumativa</option>
                    <option value="Formativa">Formativa</option>
                    <option value="Diagnóstica">Diagnóstica</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                    Ponderación (%)
                  </label>
                  <input
                    className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2 text-xs"
                    onChange={(e) => setNewEval({ ...newEval, weight: e.target.value })}
                    placeholder="25%"
                    required
                    type="text"
                    value={newEval.weight}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                    Fecha de Vencimiento
                  </label>
                  <input
                    className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2 text-xs"
                    onChange={(e) => setNewEval({ ...newEval, dueDate: e.target.value })}
                    required
                    type="date"
                    value={newEval.dueDate}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                    Hora Límite
                  </label>
                  <input
                    className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2 text-xs"
                    onChange={(e) => setNewEval({ ...newEval, dueTime: e.target.value })}
                    required
                    type="time"
                    value={newEval.dueTime}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                  Modalidad y Requisitos de Software
                </label>
                <input
                  className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2 text-xs"
                  onChange={(e) => setNewEval({ ...newEval, softwareReqs: e.target.value })}
                  placeholder="Ej. Individual o Grupal · Requisitos: Python 3.12, Docker"
                  type="text"
                  value={newEval.softwareReqs}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  className="rounded-xl border border-[#E2E8F0] px-4 py-2 text-xs font-bold text-[#4B5563]"
                  onClick={() => setCreateEvalModalOpen(false)}
                  type="button"
                >
                  Cancelar
                </button>
                <button
                  className="rounded-xl bg-[#0B4F6C] px-4 py-2 text-xs font-bold text-white hover:bg-[#083C53]"
                  type="submit"
                >
                  Publicar Evaluación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Publicar Nueva Unidad o Material */}
      {publishModuleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-2xl">
            <button
              aria-label="Cerrar modal"
              className="absolute right-4 top-4 rounded-full p-1 text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#1F2937]"
              onClick={() => setPublishModuleModalOpen(false)}
              type="button"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <h3 className="text-lg font-bold text-[#1F2937]">Publicar Unidad / Material</h3>
            <p className="text-xs text-[#4B5563] mt-0.5 mb-3">
              Agrega una nueva unidad o sube recursos didácticos a tu curso.
            </p>

            <form className="space-y-3" onSubmit={handlePublishModule}>
              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                  Número de Unidad
                </label>
                <input
                  className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2 text-xs font-bold"
                  onChange={(e) => setNewModule({ ...newModule, unitNumber: e.target.value })}
                  required
                  type="number"
                  value={newModule.unitNumber}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                  Título de la Unidad / Contenido
                </label>
                <input
                  className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2 text-xs"
                  onChange={(e) => setNewModule({ ...newModule, title: e.target.value })}
                  placeholder="Ej. Unidad 4: Microservicios y API Gateways"
                  required
                  type="text"
                  value={newModule.title}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                  Estado de Publicación
                </label>
                <select
                  className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2 text-xs"
                  onChange={(e) => setNewModule({ ...newModule, status: e.target.value })}
                  value={newModule.status}
                >
                  <option value="Publicado">Publicado (Visible a alumnos)</option>
                  <option value="Borrador">Borrador (Solo visible para docente)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  className="rounded-xl border border-[#E2E8F0] px-4 py-2 text-xs font-bold text-[#4B5563]"
                  onClick={() => setPublishModuleModalOpen(false)}
                  type="button"
                >
                  Cancelar
                </button>
                <button
                  className="rounded-xl bg-[#0B4F6C] px-4 py-2 text-xs font-bold text-white hover:bg-[#083C53]"
                  type="submit"
                >
                  Guardar y Publicar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Cierre y Timbraje de Acta Oficial */}
      {closeActaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-2xl">
            {actaClosedSuccess ? (
              <div className="text-center py-4">
                <span className="grid size-12 mx-auto place-items-center rounded-2xl bg-[#F0FDF4] text-[#16856A]">
                  <span className="material-symbols-outlined text-3xl">verified</span>
                </span>
                <h3 className="mt-3 text-lg font-bold text-[#1F2937]">Acta Timbrada y Acreditada</h3>
                <p className="mt-1 text-xs text-[#4B5563]">
                  El acta de notas ha sido firmada digitalmente con tu token de docente y remitida a Secretaría de Estudios.
                </p>
              </div>
            ) : (
              <div>
                <span className="grid size-12 mx-auto place-items-center rounded-2xl bg-[#FEFCE8] text-[#B7791F]">
                  <span className="material-symbols-outlined text-2xl">lock</span>
                </span>
                <h3 className="mt-3 text-center text-lg font-bold text-[#1F2937]">
                  ¿Confirmar Cierre de Acta de Notas?
                </h3>
                <p className="mt-1 text-center text-xs text-[#4B5563]">
                  Al cerrar el acta de la sección <strong>INF-321 Sec. 1</strong>, las notas pasarán al expediente oficial y se bloquearán para edición directa.
                </p>

                <div className="my-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Total Estudiantes:</span>
                    <span className="font-bold text-[#1F2937]">38</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Tasa de Aprobación Provisoria:</span>
                    <span className="font-bold text-[#16856A]">94.7%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Firma Digital del Docente:</span>
                    <span className="font-mono text-[10px] text-[#0B4F6C]">Prof. Marcelo Hernández (OK)</span>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    className="rounded-xl border border-[#E2E8F0] px-4 py-2 text-xs font-bold text-[#4B5563]"
                    onClick={() => setCloseActaModalOpen(false)}
                    type="button"
                  >
                    Cancelar
                  </button>
                  <button
                    className="rounded-xl bg-[#16856A] px-4 py-2 text-xs font-bold text-white hover:bg-[#126b55]"
                    onClick={handleConfirmCloseActa}
                    type="button"
                  >
                    Confirmar y Firmar Acta
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Modal de Edición de Módulo / Contenido */}
      {editingModule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-2xl">
            <button
              aria-label="Cerrar modal de edición"
              className="absolute right-4 top-4 rounded-full p-1.5 text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#1F2937]"
              onClick={() => setEditingModule(null)}
              type="button"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>

            <div className="border-b border-[#E2E8F0] pb-3">
              <span className="font-mono text-xs font-bold text-[#0B4F6C]">
                Unidad {editingModule.unitNumber}
              </span>
              <h3 className="text-lg font-extrabold text-[#1F2937] mt-0.5">
                Editar Contenidos de Aprendizaje
              </h3>
            </div>

            <form
              className="my-4 space-y-3 text-xs"
              onSubmit={(e) => {
                e.preventDefault()
                setModules((prev) =>
                  prev.map((mod) =>
                    mod.id === editingModule.id ? { ...mod, ...editingModule } : mod,
                  ),
                )
                setTeacherNotice(`Contenidos de la Unidad ${editingModule.unitNumber} actualizados exitosamente.`)
                setEditingModule(null)
                setTimeout(() => setTeacherNotice(null), 4000)
              }}
            >
              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                  Título de la Unidad
                </label>
                <input
                  className="w-full rounded-xl border border-[#E2E8F0] p-2.5 text-xs text-[#1F2937] focus:border-[#0B4F6C] focus:outline-none"
                  onChange={(e) =>
                    setEditingModule({ ...editingModule, title: e.target.value })
                  }
                  required
                  type="text"
                  value={editingModule.title}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                  Estado de Publicación
                </label>
                <select
                  className="w-full rounded-xl border border-[#E2E8F0] p-2.5 text-xs text-[#1F2937] focus:border-[#0B4F6C] focus:outline-none"
                  onChange={(e) =>
                    setEditingModule({ ...editingModule, status: e.target.value })
                  }
                  value={editingModule.status}
                >
                  <option value="Publicado">Publicado (Visible para estudiantes)</option>
                  <option value="Borrador">Borrador (Oculto)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 border-t border-[#E2E8F0] pt-3">
                <button
                  className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-2 text-xs font-bold text-[#4B5563] hover:bg-[#F8FAFC]"
                  onClick={() => setEditingModule(null)}
                  type="button"
                >
                  Cancelar
                </button>
                <button
                  className="rounded-xl bg-[#0B4F6C] px-4 py-2 text-xs font-bold text-white hover:bg-[#083C53]"
                  type="submit"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
