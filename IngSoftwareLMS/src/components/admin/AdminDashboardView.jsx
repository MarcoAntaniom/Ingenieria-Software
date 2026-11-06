import { useState, useMemo } from 'react'
import { ADMIN_DATA } from '../../data/mockData'
import { Badge } from '../ui/Badge'
import { ProgressBar } from '../ui/ProgressBar'

export function AdminDashboardView({ activeSubView, onNavigate }) {
  const [currentTab, setCurrentTab] = useState(activeSubView || 'admin-overview')

  // Datos locales con estado reactivo
  const [users, setUsers] = useState(ADMIN_DATA.users)
  const [periods, setPeriods] = useState(ADMIN_DATA.periods)
  const [catalog, setCatalog] = useState(ADMIN_DATA.courseCatalog)
  const [auditLogs, setAuditLogs] = useState(ADMIN_DATA.auditLogs)

  // Filtros de usuarios
  const [userQuery, setUserQuery] = useState('')
  const [userRoleFilter, setUserRoleFilter] = useState('Todos')

  // Modales
  const [createUserModalOpen, setCreateUserModalOpen] = useState(false)
  const [newUser, setNewUser] = useState({
    rut: '',
    name: '',
    email: '',
    role: 'Estudiante',
    program: 'Ing. Civil Informática',
  })

  const [createPeriodModalOpen, setCreatePeriodModalOpen] = useState(false)
  const [newPeriod, setNewPeriod] = useState({
    code: '2026-2',
    name: 'Semestre Primavera 2026',
    startDate: '2026-08-01',
    endDate: '2026-12-15',
    enrollmentOpen: true,
  })

  const [createCourseModalOpen, setCreateCourseModalOpen] = useState(false)
  const [newCourse, setNewCourse] = useState({
    code: '',
    name: '',
    career: 'Ing. Civil Informática',
    credits: 6,
    teacherAssigned: '',
  })

  const [createSectionModalOpen, setCreateSectionModalOpen] = useState(false)
  const [newSection, setNewSection] = useState({
    courseCode: 'INF-321',
    sectionNumber: 2,
    teacher: 'Prof. Marcelo Hernández',
    capacity: 40,
    classroom: 'Laboratorio Alfa-202',
  })

  const [assignModalSuccess, setAssignModalSuccess] = useState(null)
  const [assignForm, setAssignForm] = useState({
    type: 'student', // 'student' | 'teacher'
    selectedUser: 'Esteban Morales Sepúlveda',
    selectedCourse: 'INF-321 Sec. 1',
  })

  const [archiveModalOpen, setArchiveModalOpen] = useState(false)
  const [archiveSuccess, setArchiveSuccess] = useState(false)

  // Políticas de seguridad
  const [securityConfig, setSecurityConfig] = useState({
    force2FA: true,
    jwtExpiryMinutes: 60,
    sessionIdleTimeout: 15,
    allowGuestAccess: false,
  })
  const [savedSecurityFeedback, setSavedSecurityFeedback] = useState(false)
  const [adminNotice, setAdminNotice] = useState(null)
  const [selectedCourseSyllabus, setSelectedCourseSyllabus] = useState(null)
  const [bulkUploadStatus, setBulkUploadStatus] = useState(null)

  const activeTab = activeSubView || currentTab

  function handleSelectTab(tabId) {
    setCurrentTab(tabId)
    onNavigate?.(tabId)
  }

  // Filtrado de usuarios
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchRole = userRoleFilter === 'Todos' || u.role === userRoleFilter
      const matchQuery =
        u.name.toLowerCase().includes(userQuery.toLowerCase()) ||
        u.rut.toLowerCase().includes(userQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(userQuery.toLowerCase())
      return matchRole && matchQuery
    })
  }, [users, userQuery, userRoleFilter])

  // --- Handlers de Usuarios ---
  function handleToggleUserStatus(userId) {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, active: !u.active } : u)),
    )
  }

  function handleCreateUser(e) {
    e.preventDefault()
    if (!newUser.name || !newUser.rut || !newUser.email) return

    const created = {
      id: Date.now(),
      rut: newUser.rut,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      program: newUser.program,
      active: true,
      lastLogin: 'Nunca',
    }

    setUsers([created, ...users])
    setCreateUserModalOpen(false)
    setNewUser({
      rut: '',
      name: '',
      email: '',
      role: 'Estudiante',
      program: 'Ing. Civil Informática',
    })

    // Log de auditoría
    const newLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      user: 'admin@universidad.cl',
      role: 'Administrador',
      action: `Creación de nuevo usuario ${created.email} (${created.role})`,
      ip: '190.161.42.10',
      severity: 'info',
    }
    setAuditLogs([newLog, ...auditLogs])
  }

  // --- Handlers de Periodos ---
  function handleCreatePeriod(e) {
    e.preventDefault()
    const p = {
      id: `per-${newPeriod.code}`,
      code: newPeriod.code,
      name: newPeriod.name,
      startDate: newPeriod.startDate,
      endDate: newPeriod.endDate,
      status: 'Activo',
      enrollmentOpen: newPeriod.enrollmentOpen,
    }
    setPeriods([p, ...periods])
    setCreatePeriodModalOpen(false)
  }

  // --- Handlers de Catálogo ---
  function handleCreateCourse(e) {
    e.preventDefault()
    const item = {
      code: newCourse.code,
      name: newCourse.name,
      career: newCourse.career,
      credits: parseInt(newCourse.credits, 10) || 6,
      activeSections: 1,
      teacherAssigned: newCourse.teacherAssigned || 'Por designar',
    }
    setCatalog([item, ...catalog])
    setCreateCourseModalOpen(false)
    setNewCourse({
      code: '',
      name: '',
      career: 'Ing. Civil Informática',
      credits: 6,
      teacherAssigned: '',
    })
  }

  function handleCreateSection(e) {
    e.preventDefault()
    setCatalog((prev) =>
      prev.map((c) =>
        c.code === newSection.courseCode
          ? { ...c, activeSections: c.activeSections + 1 }
          : c,
      ),
    )
    setAdminNotice(
      `Sección ${newSection.sectionNumber} habilitada con éxito para ${newSection.courseCode} (Docente: ${newSection.teacher}, Capacidad: ${newSection.capacity} alumnos).`,
    )
    setCreateSectionModalOpen(false)
    setTimeout(() => setAdminNotice(null), 5000)
  }

  // --- Handlers de Matrícula ---
  function handleExecuteAssignment(e) {
    e.preventDefault()
    setAssignModalSuccess(
      `Asignación ejecutada: "${assignForm.selectedUser}" asignado/a exitosamente a "${assignForm.selectedCourse}".`,
    )
    setTimeout(() => setAssignModalSuccess(null), 3500)
  }

  function handleBulkUploadTest() {
    setBulkUploadStatus('loading')
    setTimeout(() => {
      setBulkUploadStatus('success')
      setAdminNotice(
        'Nómina masiva de prueba procesada: 48 alumnos inscritos con éxito en INF-321 e INF-412.',
      )
      setTimeout(() => setAdminNotice(null), 5000)
    }, 700)
  }

  // --- Handlers de Archivo Masivo ---
  function handleConfirmArchive() {
    setArchiveSuccess(true)
    setTimeout(() => {
      setArchiveModalOpen(false)
      setArchiveSuccess(false)
      setAdminNotice(
        'Proceso de archivado completado. Se generó el paquete "Respaldo_Historico_2026-1.tar.gz" y las inscripciones se congelaron en modo solo lectura.',
      )
      setTimeout(() => setAdminNotice(null), 6000)
    }, 1500)
  }

  // --- Handlers de Auditoría y Exportación CSV Real ---
  function handleExportAuditLogs() {
    const headers = 'ID,Usuario,Acción,Recurso,IP,Fecha\n'
    const rows = auditLogs
      .map(
        (l) =>
          `${l.id},"${l.user}","${l.action}","${l.target}","${l.ip}","${l.timestamp}"`,
      )
      .join('\n')
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `auditoria_lms_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    setAdminNotice('Registro oficial de auditoría exportado exitosamente a archivo .CSV.')
    setTimeout(() => setAdminNotice(null), 4000)
  }

  // --- Handlers de Parámetros de Seguridad ---
  function handleSaveSecurity(e) {
    e.preventDefault()
    setSavedSecurityFeedback(true)
    setTimeout(() => setSavedSecurityFeedback(false), 3000)
  }

  return (
    <div className="space-y-6">
      {/* 1. Header Global de Administración */}
      <div className="flex flex-col gap-4 rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-6 shadow-xs lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[#0B4F6C]">
            <span className="material-symbols-outlined text-lg">admin_panel_settings</span>
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Consola de Administración y Gobierno Académico
            </span>
            <Badge size="sm" variant="danger">
              Superadmin TI
            </Badge>
          </div>
          <h1 className="mt-1 text-2xl sm:text-[26px] font-extrabold tracking-tight text-[#1F2937]">
            Panel Central de Control y Auditoría
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#4B5563]">
            Universidad Tecnológica · Semestre Activo: <strong>Otoño 2026</strong> · Estado de
            Servicios: <strong className="text-[#16856A]">Operacional (99.98% SLA)</strong>
          </p>
        </div>

        {/* Botón rápido para nuevo usuario o periodo */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#E2E8F0] bg-white px-3.5 py-2 text-xs font-bold text-[#4B5563] hover:bg-[#F8FAFC]"
            onClick={() => setCreatePeriodModalOpen(true)}
            type="button"
          >
            <span className="material-symbols-outlined text-base">date_range</span>
            Nuevo Periodo
          </button>
          <button
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B4F6C] px-4 py-2 text-xs font-bold text-white hover:bg-[#083C53]"
            onClick={() => setCreateUserModalOpen(true)}
            type="button"
          >
            <span className="material-symbols-outlined text-base">person_add</span>
            Crear Usuario
          </button>
        </div>
      </div>

      {/* Banner de Notificación / Feedback para Administrador */}
      {adminNotice && (
        <div
          className="flex items-center justify-between rounded-2xl border border-[#BAE6FD] bg-[#F0F9FF] p-4 text-xs font-semibold text-[#075477] shadow-xs animate-in fade-in"
          role="status"
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lg text-[#0284C7]">info</span>
            <span>{adminNotice}</span>
          </div>
          <button
            aria-label="Cerrar notificación"
            className="rounded-lg p-1 text-[#0369A1] hover:bg-[#E0F2FE]"
            onClick={() => setAdminNotice(null)}
            type="button"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      )}

      {/* 2. Pestañas de Navegación del Rol Administrador */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-[#E2E8F0] pb-2">
        {[
          { id: 'admin-overview', label: 'Panel Global y Métricas', icon: 'speed' },
          { id: 'admin-users', label: 'Gestión de Usuarios', icon: 'group' },
          { id: 'admin-periods', label: 'Estructura y Periodos', icon: 'calendar_month' },
          { id: 'admin-catalog', label: 'Catálogo y Secciones', icon: 'menu_book' },
          { id: 'admin-enrollment', label: 'Matrícula y Asignación', icon: 'how_to_reg' },
          { id: 'admin-archive', label: 'Archivo y Cierre', icon: 'archive' },
          { id: 'admin-audit', label: 'Auditoría y Logs', icon: 'policy' },
          { id: 'admin-settings', label: 'Parámetros del Sistema', icon: 'settings_suggest' },
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
            </button>
          )
        })}
      </div>

      {/* 3. SUB-VISTA 1: Panel Global y KPIs */}
      {activeTab === 'admin-overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                Total Alumnos
              </span>
              <p className="mt-1 text-2xl font-black text-[#0B4F6C]">
                {ADMIN_DATA.kpis.totalStudents.toLocaleString()}
              </p>
              <span className="text-[10px] text-[#16856A] font-bold">↑ 4.2% vs 2025</span>
            </div>

            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                Total Docentes
              </span>
              <p className="mt-1 text-2xl font-black text-[#1F2937]">{ADMIN_DATA.kpis.totalTeachers}</p>
              <span className="text-[10px] text-[#64748B]">86 cátedras activas</span>
            </div>

            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                Cursos Activos
              </span>
              <p className="mt-1 text-2xl font-black text-[#1F2937]">{ADMIN_DATA.kpis.activeCourses}</p>
              <span className="text-[10px] text-[#16856A] font-bold">100% habilitados</span>
            </div>

            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                Tasa Retención
              </span>
              <p className="mt-1 text-2xl font-black text-[#16856A]">{ADMIN_DATA.kpis.retentionRate}</p>
              <span className="text-[10px] text-[#16856A] font-bold">Meta cumplida</span>
            </div>

            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                Aprobación Global
              </span>
              <p className="mt-1 text-2xl font-black text-[#0B4F6C]">{ADMIN_DATA.kpis.approvalRate}</p>
              <span className="text-[10px] text-[#64748B]">Promedio institucional</span>
            </div>

            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                Sesiones Hoy
              </span>
              <p className="mt-1 text-2xl font-black text-[#B7791F]">
                {ADMIN_DATA.kpis.activeSessionsToday}
              </p>
              <span className="text-[10px] text-[#16856A] font-bold">Pico: 15:45 hrs</span>
            </div>
          </div>

          {/* Gráfico de actividad y resumen de servicios */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs">
              <h2 className="text-base font-bold text-[#1F2937] mb-2">
                Rendimiento y Retención por Facultad
              </h2>
              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-semibold text-[#1F2937]">Ingeniería y Ciencias</span>
                    <span className="font-bold text-[#16856A]">94.2% retención · 88.5% aprobación</span>
                  </div>
                  <ProgressBar value={94.2} variant="success" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-semibold text-[#1F2937]">Economía y Negocios</span>
                    <span className="font-bold text-[#0B4F6C]">91.8% retención · 85.0% aprobación</span>
                  </div>
                  <ProgressBar value={91.8} variant="primary" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-semibold text-[#1F2937]">Medicina y Salud</span>
                    <span className="font-bold text-[#16856A]">96.5% retención · 92.1% aprobación</span>
                  </div>
                  <ProgressBar value={96.5} variant="success" />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs">
              <h2 className="text-base font-bold text-[#1F2937] mb-2">
                Estado de la Infraestructura en Tiempo Real
              </h2>
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-[#16856A]" />
                    <span className="font-bold text-[#1F2937]">PostgreSQL 16 Cluster</span>
                  </div>
                  <span className="text-[#16856A] font-bold">Activo (4ms latencia)</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-[#16856A]" />
                    <span className="font-bold text-[#1F2937]">Autenticación JWT / LDAP</span>
                  </div>
                  <span className="text-[#16856A] font-bold">100% Sincronizado</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-[#16856A]" />
                    <span className="font-bold text-[#1F2937]">Almacenamiento R2 / S3</span>
                  </div>
                  <span className="text-[#4B5563]">48.2 GB / 500 GB (9.6%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. SUB-VISTA 2: Gestión de Usuarios y Perfiles */}
      {activeTab === 'admin-users' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4 mb-4">
              <div>
                <h2 className="text-xl font-bold text-[#1F2937]">Directorio de Usuarios</h2>
                <p className="mt-1 text-xs text-[#4B5563]">
                  Creación, edición, baja y asignación de roles (Estudiante, Docente, Coordinador,
                  Administrador).
                </p>
              </div>

              <button
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B4F6C] px-4 py-2 text-xs font-bold text-white hover:bg-[#083C53]"
                onClick={() => setCreateUserModalOpen(true)}
                type="button"
              >
                <span className="material-symbols-outlined text-base">person_add</span>
                <span>Registrar Nuevo Usuario</span>
              </button>
            </div>

            {/* Filtros de Búsqueda de Usuarios */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] text-base">
                  search
                </span>
                <input
                  className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] py-2 pl-9 pr-3 text-xs"
                  onChange={(e) => setUserQuery(e.target.value)}
                  placeholder="Buscar por nombre, RUT o correo institucional..."
                  type="search"
                  value={userQuery}
                />
              </div>

              <div className="flex items-center gap-1.5">
                {['Todos', 'Estudiante', 'Docente', 'Coordinador', 'Administrador'].map((role) => (
                  <button
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${
                      userRoleFilter === role
                        ? 'bg-[#0B4F6C] text-white'
                        : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#4B5563]'
                    }`}
                    key={role}
                    onClick={() => setUserRoleFilter(role)}
                    type="button"
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            {/* Tabla de Usuarios */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E2E8F0] text-[#64748B] uppercase text-[10px] tracking-wider">
                    <th className="pb-3 font-bold">RUT</th>
                    <th className="pb-3 font-bold">Nombre Completo</th>
                    <th className="pb-3 font-bold">Correo Institucional</th>
                    <th className="pb-3 font-bold text-center">Rol Asignado</th>
                    <th className="pb-3 font-bold">Programa / Depto</th>
                    <th className="pb-3 font-bold text-center">Estado</th>
                    <th className="pb-3 font-bold text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {filteredUsers.map((u) => (
                    <tr className="hover:bg-[#F8FAFC]" key={u.id}>
                      <td className="py-3 font-mono font-bold text-[#4B5563]">{u.rut}</td>
                      <td className="py-3 font-bold text-[#1F2937]">{u.name}</td>
                      <td className="py-3 text-[#4B5563]">{u.email}</td>
                      <td className="py-3 text-center">
                        <Badge
                          size="sm"
                          variant={
                            u.role === 'Administrador'
                              ? 'danger'
                              : u.role === 'Docente'
                              ? 'primary'
                              : u.role === 'Coordinador'
                              ? 'warning'
                              : 'neutral'
                          }
                        >
                          {u.role}
                        </Badge>
                      </td>
                      <td className="py-3 text-[#64748B]">{u.program}</td>
                      <td className="py-3 text-center">
                        <Badge size="sm" variant={u.active ? 'success' : 'danger'}>
                          {u.active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                            u.active
                              ? 'border border-[#FECACA] bg-[#FEF2F2] text-[#C53030] hover:bg-[#FEE2E2]'
                              : 'border border-[#BBF7D0] bg-[#F0FDF4] text-[#16856A] hover:bg-[#DCFCE7]'
                          }`}
                          onClick={() => handleToggleUserStatus(u.id)}
                          type="button"
                        >
                          {u.active ? 'Dar de baja' : 'Activar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. SUB-VISTA 3: Estructura Académica y Periodos */}
      {activeTab === 'admin-periods' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4 mb-4">
              <div>
                <h2 className="text-xl font-bold text-[#1F2937]">Periodos Académicos</h2>
                <p className="mt-1 text-xs text-[#4B5563]">
                  Configura fechas oficiales de inicio, término del ciclo lectivo y aperturas de
                  matrícula.
                </p>
              </div>

              <button
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B4F6C] px-4 py-2 text-xs font-bold text-white hover:bg-[#083C53]"
                onClick={() => setCreatePeriodModalOpen(true)}
                type="button"
              >
                <span className="material-symbols-outlined text-base">add</span>
                <span>Crear Nuevo Periodo</span>
              </button>
            </div>

            <div className="space-y-3">
              {periods.map((p) => (
                <div
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-[#E2E8F0] p-4 transition hover:bg-[#F8FAFC]"
                  key={p.id}
                >
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-xl bg-[#E8F3F8] text-[#0B4F6C] font-mono font-bold text-sm">
                      {p.code}
                    </span>
                    <div>
                      <h3 className="font-bold text-[#1F2937] text-sm">{p.name}</h3>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-[#64748B]">
                        <span>Inicio: {p.startDate}</span>
                        <span>·</span>
                        <span>Término: {p.endDate}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        p.status === 'Activo'
                          ? 'success'
                          : p.status === 'Cerrado'
                          ? 'warning'
                          : 'neutral'
                      }
                    >
                      {p.status}
                    </Badge>
                    <span className="text-xs font-semibold text-[#4B5563]">
                      Matrícula: {p.enrollmentOpen ? 'Abierta' : 'Cerrada'}
                    </span>
                    <button
                      className="rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-bold text-[#4B5563] hover:bg-[#F1F5F9]"
                      onClick={() =>
                        setPeriods((prev) =>
                          prev.map((item) =>
                            item.id === p.id
                              ? { ...item, enrollmentOpen: !item.enrollmentOpen }
                              : item,
                          ),
                        )
                      }
                      type="button"
                    >
                      {p.enrollmentOpen ? 'Cerrar matrícula' : 'Abrir matrícula'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 6. SUB-VISTA 4: Catálogo de Asignaturas y Secciones */}
      {activeTab === 'admin-catalog' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4 mb-4">
              <div>
                <h2 className="text-xl font-bold text-[#1F2937]">
                  Malla Curricular y Catálogo de Ramos
                </h2>
                <p className="mt-1 text-xs text-[#4B5563]">
                  Alta de mallas curriculares, creación de códigos de ramo y habilitación de
                  secciones.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#E2E8F0] bg-white px-3.5 py-2 text-xs font-bold text-[#4B5563] hover:bg-[#F8FAFC]"
                  onClick={() => setCreateSectionModalOpen(true)}
                  type="button"
                >
                  <span className="material-symbols-outlined text-base">domain_add</span>
                  <span>Habilitar Sección</span>
                </button>
                <button
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B4F6C] px-4 py-2 text-xs font-bold text-white hover:bg-[#083C53]"
                  onClick={() => setCreateCourseModalOpen(true)}
                  type="button"
                >
                  <span className="material-symbols-outlined text-base">add</span>
                  <span>Nueva Asignatura</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E2E8F0] text-[#64748B] uppercase text-[10px] tracking-wider">
                    <th className="pb-3 font-bold">Código</th>
                    <th className="pb-3 font-bold">Nombre Asignatura</th>
                    <th className="pb-3 font-bold">Carrera</th>
                    <th className="pb-3 font-bold text-center">Créditos</th>
                    <th className="pb-3 font-bold text-center">Secciones</th>
                    <th className="pb-3 font-bold">Docente Responsable</th>
                    <th className="pb-3 font-bold text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {catalog.map((c) => (
                    <tr className="hover:bg-[#F8FAFC]" key={c.code}>
                      <td className="py-3 font-mono font-bold text-[#0B4F6C]">{c.code}</td>
                      <td className="py-3 font-bold text-[#1F2937]">{c.name}</td>
                      <td className="py-3 text-[#64748B]">{c.career}</td>
                      <td className="py-3 text-center text-[#4B5563]">{c.credits} SCT</td>
                      <td className="py-3 text-center">
                        <Badge size="sm" variant="primary">
                          {c.activeSections} act.
                        </Badge>
                      </td>
                      <td className="py-3 font-medium text-[#1F2937]">{c.teacherAssigned}</td>
                      <td className="py-3 text-right">
                        <button
                          className="rounded-lg border border-[#E2E8F0] px-2.5 py-1 text-xs font-bold text-[#4B5563] hover:bg-[#F1F5F9]"
                          onClick={() => setSelectedCourseSyllabus(c)}
                          type="button"
                        >
                          Editar Malla
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 7. SUB-VISTA 5: Matrícula y Asignación Masiva */}
      {activeTab === 'admin-enrollment' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-6 shadow-xs">
            <h2 className="text-lg font-bold text-[#1F2937]">Asignación Manual a Sección</h2>
            <p className="text-xs text-[#4B5563] mt-0.5 mb-4">
              Inscribe estudiantes o imputa docentes a una sección específica del periodo en curso.
            </p>

            {assignModalSuccess && (
              <div className="mb-4 rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] p-3 text-xs text-[#166534] font-semibold">
                {assignModalSuccess}
              </div>
            )}

            <form className="space-y-3" onSubmit={handleExecuteAssignment}>
              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                  Tipo de Asignación
                </label>
                <div className="flex gap-2">
                  <button
                    className={`flex-1 rounded-xl py-2 text-xs font-bold border transition ${
                      assignForm.type === 'student'
                        ? 'bg-[#0B4F6C] text-white border-[#0B4F6C]'
                        : 'bg-[#F8FAFC] text-[#4B5563] border-[#E2E8F0]'
                    }`}
                    onClick={() => setAssignForm({ ...assignForm, type: 'student' })}
                    type="button"
                  >
                    Inscribir Estudiante
                  </button>
                  <button
                    className={`flex-1 rounded-xl py-2 text-xs font-bold border transition ${
                      assignForm.type === 'teacher'
                        ? 'bg-[#0B4F6C] text-white border-[#0B4F6C]'
                        : 'bg-[#F8FAFC] text-[#4B5563] border-[#E2E8F0]'
                    }`}
                    onClick={() => setAssignForm({ ...assignForm, type: 'teacher' })}
                    type="button"
                  >
                    Imputar Docente
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                  Seleccionar {assignForm.type === 'student' ? 'Estudiante' : 'Docente'}
                </label>
                <select
                  className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2 text-xs"
                  onChange={(e) => setAssignForm({ ...assignForm, selectedUser: e.target.value })}
                  value={assignForm.selectedUser}
                >
                  {users
                    .filter((u) =>
                      assignForm.type === 'student'
                        ? u.role === 'Estudiante'
                        : u.role === 'Docente',
                    )
                    .map((u) => (
                      <option key={u.id} value={u.name}>
                        {u.name} ({u.rut})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                  Asignatura y Sección Destino
                </label>
                <select
                  className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2 text-xs"
                  onChange={(e) =>
                    setAssignForm({ ...assignForm, selectedCourse: e.target.value })
                  }
                  value={assignForm.selectedCourse}
                >
                  <option value="INF-321 Sec. 1">INF-321 Sec. 1 - Ing. de Software</option>
                  <option value="INF-412 Sec. 2">INF-412 Sec. 2 - Bases de Datos</option>
                  <option value="INF-204 Sec. 1">INF-204 Sec. 1 - Estructuras de Datos</option>
                  <option value="INF-510 Sec. 1">INF-510 Sec. 1 - Capstone</option>
                </select>
              </div>

              <button
                className="w-full rounded-xl bg-[#0B4F6C] py-2 text-xs font-bold text-white hover:bg-[#083C53]"
                type="submit"
              >
                Ejecutar Asignación
              </button>
            </form>
          </div>

          {/* Carga Masiva CSV */}
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-6 shadow-xs">
            <h2 className="text-lg font-bold text-[#1F2937]">Matrícula Masiva por Lote (CSV)</h2>
            <p className="text-xs text-[#4B5563] mt-0.5 mb-4">
              Carga masiva de nóminas oficiales provenientes de admisión y registro curricular.
            </p>

            <div className="rounded-2xl border-2 border-dashed border-[#CBD5E1] p-6 text-center">
              <span className="material-symbols-outlined text-4xl text-[#64748B]">upload_file</span>
              <p className="text-xs font-bold text-[#1F2937] mt-2">
                Arrastra tu archivo .CSV o plantilla Excel aquí
              </p>
              <p className="text-[11px] text-[#64748B] mt-1">
                Formato admitido: RUT, Código_Ramo, Sección, Semestre
              </p>
              <button
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-4 py-2 text-xs font-bold text-[#0B4F6C] hover:bg-[#E8F3F8]"
                disabled={bulkUploadStatus === 'loading'}
                onClick={handleBulkUploadTest}
                type="button"
              >
                <span className="material-symbols-outlined text-base">upload_file</span>
                <span>
                  {bulkUploadStatus === 'loading'
                    ? 'Procesando nómina...'
                    : 'Cargar Archivo de Prueba'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. SUB-VISTA 6: Archivo y Cierre de Cursos */}
      {activeTab === 'admin-archive' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-6 shadow-xs">
            <h2 className="text-xl font-bold text-[#1F2937]">
              Cierre de Semestre y Archivado Masivo
            </h2>
            <p className="mt-1 text-xs text-[#4B5563]">
              Procedimiento institucional para sellar periodos lectivos, convalidar actas finales y
              preservar históricos.
            </p>

            <div className="my-5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 text-xs space-y-3">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
                <span className="font-semibold text-[#1F2937]">Periodo a Archivar:</span>
                <span className="font-bold text-[#0B4F6C]">Semestre Otoño 2026 (2026-1)</span>
              </div>
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
                <span className="font-semibold text-[#1F2937]">Estado de las Actas Docentes:</span>
                <span className="font-bold text-[#16856A]">52 de 54 actas timbradas (96.3%)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#1F2937]">Respaldo en Almacenamiento Frío:</span>
                <span className="font-bold text-[#1F2937]">Listo para empaquetar</span>
              </div>
            </div>

            <button
              className="inline-flex items-center gap-2 rounded-xl bg-[#C53030] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#9B2C2C]"
              onClick={() => setArchiveModalOpen(true)}
              type="button"
            >
              <span className="material-symbols-outlined text-base">archive</span>
              <span>Iniciar Protocolo de Archivado Oficial</span>
            </button>
          </div>
        </div>
      )}

      {/* 9. SUB-VISTA 7: Auditoría y Reportería */}
      {activeTab === 'admin-audit' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4 mb-4">
              <div>
                <h2 className="text-xl font-bold text-[#1F2937]">Registro Oficial de Auditoría</h2>
                <p className="mt-1 text-xs text-[#4B5563]">
                  Trazabilidad en tiempo real de accesos, modificaciones de calificaciones y cambios
                  de seguridad.
                </p>
              </div>

              <button
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#E2E8F0] bg-white px-3.5 py-2 text-xs font-bold text-[#4B5563] hover:bg-[#F8FAFC]"
                onClick={handleExportAuditLogs}
                type="button"
              >
                <span className="material-symbols-outlined text-base">download</span>
                <span>Exportar Logs (.CSV)</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E2E8F0] text-[#64748B] uppercase text-[10px] tracking-wider">
                    <th className="pb-3 font-bold">Fecha / Hora</th>
                    <th className="pb-3 font-bold">Usuario</th>
                    <th className="pb-3 font-bold">Rol</th>
                    <th className="pb-3 font-bold">Acción Registrada</th>
                    <th className="pb-3 font-bold">Dirección IP</th>
                    <th className="pb-3 font-bold text-right">Severidad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {auditLogs.map((log) => (
                    <tr className="hover:bg-[#F8FAFC]" key={log.id}>
                      <td className="py-3 font-mono text-[#64748B] whitespace-nowrap">
                        {log.timestamp}
                      </td>
                      <td className="py-3 font-bold text-[#1F2937]">{log.user}</td>
                      <td className="py-3 text-[#4B5563]">{log.role}</td>
                      <td className="py-3 text-[#1F2937] font-medium">{log.action}</td>
                      <td className="py-3 font-mono text-[#64748B]">{log.ip}</td>
                      <td className="py-3 text-right">
                        <Badge
                          size="sm"
                          variant={
                            log.severity === 'warning'
                              ? 'warning'
                              : log.severity === 'danger'
                              ? 'danger'
                              : 'primary'
                          }
                        >
                          {log.severity}
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

      {/* 10. SUB-VISTA 8: Parámetros del Sistema e Integraciones */}
      {activeTab === 'admin-settings' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-6 shadow-xs">
            <h2 className="text-xl font-bold text-[#1F2937]">Políticas de Seguridad y Sesión</h2>
            <p className="mt-1 text-xs text-[#4B5563] mb-4">
              Configura los umbrales de tokens JWT, requerimientos de 2FA y timeouts globales.
            </p>

            {savedSecurityFeedback && (
              <div className="mb-4 rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] p-3 text-xs text-[#166534] font-semibold">
                Políticas de seguridad guardadas exitosamente y propagadas a todos los nodos.
              </div>
            )}

            <form className="space-y-4 max-w-xl text-xs" onSubmit={handleSaveSecurity}>
              <div className="flex items-center justify-between p-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
                <div>
                  <span className="font-bold text-[#1F2937] block">
                    Exigir Autenticación de Dos Factores (2FA)
                  </span>
                  <span className="text-[#64748B]">
                    Obligatorio para docentes y personal administrativo
                  </span>
                </div>
                <input
                  checked={securityConfig.force2FA}
                  className="size-4 accent-[#0B4F6C]"
                  onChange={(e) =>
                    setSecurityConfig({ ...securityConfig, force2FA: e.target.checked })
                  }
                  type="checkbox"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1F2937] mb-1">
                  Expiración de Tokens JWT (minutos)
                </label>
                <input
                  className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2 text-xs"
                  onChange={(e) =>
                    setSecurityConfig({
                      ...securityConfig,
                      jwtExpiryMinutes: parseInt(e.target.value, 10),
                    })
                  }
                  type="number"
                  value={securityConfig.jwtExpiryMinutes}
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1F2937] mb-1">
                  Timeout de Inactividad de Sesión (minutos)
                </label>
                <input
                  className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2 text-xs"
                  onChange={(e) =>
                    setSecurityConfig({
                      ...securityConfig,
                      sessionIdleTimeout: parseInt(e.target.value, 10),
                    })
                  }
                  type="number"
                  value={securityConfig.sessionIdleTimeout}
                />
              </div>

              <button
                className="rounded-xl bg-[#0B4F6C] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#083C53]"
                type="submit"
              >
                Guardar Políticas de Seguridad
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Crear Usuario */}
      {createUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-2xl">
            <button
              aria-label="Cerrar modal"
              className="absolute right-4 top-4 rounded-full p-1 text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#1F2937]"
              onClick={() => setCreateUserModalOpen(false)}
              type="button"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <h3 className="text-lg font-bold text-[#1F2937]">Registrar Nuevo Usuario</h3>
            <p className="text-xs text-[#4B5563] mt-0.5 mb-3">
              Ingresa los datos del nuevo integrante y asigna su rol en la plataforma.
            </p>

            <form className="space-y-3" onSubmit={handleCreateUser}>
              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">RUT</label>
                <input
                  className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2 text-xs"
                  onChange={(e) => setNewUser({ ...newUser, rut: e.target.value })}
                  placeholder="Ej. 20.987.654-3"
                  required
                  type="text"
                  value={newUser.rut}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                  Nombre Completo
                </label>
                <input
                  className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2 text-xs"
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="Ej. Andrés Soto Martínez"
                  required
                  type="text"
                  value={newUser.name}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                  Correo Institucional
                </label>
                <input
                  className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2 text-xs"
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="Ej. a.soto@universidad.cl"
                  required
                  type="email"
                  value={newUser.email}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1">Rol</label>
                  <select
                    className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2 text-xs"
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    value={newUser.role}
                  >
                    <option value="Estudiante">Estudiante</option>
                    <option value="Docente">Docente</option>
                    <option value="Coordinador">Coordinador</option>
                    <option value="Administrador">Administrador</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                    Carrera o Depto
                  </label>
                  <input
                    className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2 text-xs"
                    onChange={(e) => setNewUser({ ...newUser, program: e.target.value })}
                    placeholder="Ing. Civil Informática"
                    type="text"
                    value={newUser.program}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  className="rounded-xl border border-[#E2E8F0] px-4 py-2 text-xs font-bold text-[#4B5563]"
                  onClick={() => setCreateUserModalOpen(false)}
                  type="button"
                >
                  Cancelar
                </button>
                <button
                  className="rounded-xl bg-[#0B4F6C] px-4 py-2 text-xs font-bold text-white hover:bg-[#083C53]"
                  type="submit"
                >
                  Crear Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Crear Periodo */}
      {createPeriodModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-2xl">
            <button
              aria-label="Cerrar modal"
              className="absolute right-4 top-4 rounded-full p-1 text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#1F2937]"
              onClick={() => setCreatePeriodModalOpen(false)}
              type="button"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <h3 className="text-lg font-bold text-[#1F2937]">Crear Periodo Académico</h3>

            <form className="space-y-3 mt-3" onSubmit={handleCreatePeriod}>
              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">Código</label>
                <input
                  className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2 text-xs font-bold"
                  onChange={(e) => setNewPeriod({ ...newPeriod, code: e.target.value })}
                  placeholder="2026-2"
                  required
                  type="text"
                  value={newPeriod.code}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">Nombre</label>
                <input
                  className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2 text-xs"
                  onChange={(e) => setNewPeriod({ ...newPeriod, name: e.target.value })}
                  placeholder="Semestre Primavera 2026"
                  required
                  type="text"
                  value={newPeriod.name}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                    Fecha Inicio
                  </label>
                  <input
                    className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2 text-xs"
                    onChange={(e) => setNewPeriod({ ...newPeriod, startDate: e.target.value })}
                    required
                    type="date"
                    value={newPeriod.startDate}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                    Fecha Término
                  </label>
                  <input
                    className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2 text-xs"
                    onChange={(e) => setNewPeriod({ ...newPeriod, endDate: e.target.value })}
                    required
                    type="date"
                    value={newPeriod.endDate}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  className="rounded-xl border border-[#E2E8F0] px-4 py-2 text-xs font-bold text-[#4B5563]"
                  onClick={() => setCreatePeriodModalOpen(false)}
                  type="button"
                >
                  Cancelar
                </button>
                <button
                  className="rounded-xl bg-[#0B4F6C] px-4 py-2 text-xs font-bold text-white hover:bg-[#083C53]"
                  type="submit"
                >
                  Crear Periodo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Nueva Asignatura en Catálogo */}
      {createCourseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-2xl">
            <button
              aria-label="Cerrar modal"
              className="absolute right-4 top-4 rounded-full p-1 text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#1F2937]"
              onClick={() => setCreateCourseModalOpen(false)}
              type="button"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <h3 className="text-lg font-bold text-[#1F2937]">Nueva Asignatura en Malla</h3>

            <form className="space-y-3 mt-3" onSubmit={handleCreateCourse}>
              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                  Código de Asignatura
                </label>
                <input
                  className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2 text-xs font-mono font-bold"
                  onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value })}
                  placeholder="INF-490"
                  required
                  type="text"
                  value={newCourse.code}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                  Nombre de la Asignatura
                </label>
                <input
                  className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2 text-xs"
                  onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                  placeholder="Inteligencia Artificial y Machine Learning"
                  required
                  type="text"
                  value={newCourse.name}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1">Créditos SCT</label>
                  <input
                    className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2 text-xs"
                    onChange={(e) => setNewCourse({ ...newCourse, credits: e.target.value })}
                    required
                    type="number"
                    value={newCourse.credits}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1">Carrera</label>
                  <input
                    className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2 text-xs"
                    onChange={(e) => setNewCourse({ ...newCourse, career: e.target.value })}
                    type="text"
                    value={newCourse.career}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                  Docente Responsable
                </label>
                <input
                  className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2 text-xs"
                  onChange={(e) => setNewCourse({ ...newCourse, teacherAssigned: e.target.value })}
                  placeholder="Prof. Claudia Valenzuela"
                  type="text"
                  value={newCourse.teacherAssigned}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  className="rounded-xl border border-[#E2E8F0] px-4 py-2 text-xs font-bold text-[#4B5563]"
                  onClick={() => setCreateCourseModalOpen(false)}
                  type="button"
                >
                  Cancelar
                </button>
                <button
                  className="rounded-xl bg-[#0B4F6C] px-4 py-2 text-xs font-bold text-white hover:bg-[#083C53]"
                  type="submit"
                >
                  Registrar Asignatura
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Habilitar Sección */}
      {createSectionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-2xl">
            <button
              aria-label="Cerrar modal"
              className="absolute right-4 top-4 rounded-full p-1 text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#1F2937]"
              onClick={() => setCreateSectionModalOpen(false)}
              type="button"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <h3 className="text-lg font-bold text-[#1F2937]">Habilitar Sección Específica</h3>

            <form className="space-y-3 mt-3" onSubmit={handleCreateSection}>
              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                  Asignatura Base
                </label>
                <select
                  className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2 text-xs"
                  onChange={(e) => setNewSection({ ...newSection, courseCode: e.target.value })}
                  value={newSection.courseCode}
                >
                  {catalog.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} - {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                    Número de Sección
                  </label>
                  <input
                    className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2 text-xs"
                    onChange={(e) =>
                      setNewSection({ ...newSection, sectionNumber: e.target.value })
                    }
                    required
                    type="number"
                    value={newSection.sectionNumber}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                    Cupos Máximos
                  </label>
                  <input
                    className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2 text-xs"
                    onChange={(e) => setNewSection({ ...newSection, capacity: e.target.value })}
                    required
                    type="number"
                    value={newSection.capacity}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                  Docente Asignado
                </label>
                <input
                  className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2 text-xs"
                  onChange={(e) => setNewSection({ ...newSection, teacher: e.target.value })}
                  type="text"
                  value={newSection.teacher}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  className="rounded-xl border border-[#E2E8F0] px-4 py-2 text-xs font-bold text-[#4B5563]"
                  onClick={() => setCreateSectionModalOpen(false)}
                  type="button"
                >
                  Cancelar
                </button>
                <button
                  className="rounded-xl bg-[#0B4F6C] px-4 py-2 text-xs font-bold text-white hover:bg-[#083C53]"
                  type="submit"
                >
                  Habilitar Sección
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Confirmar Archivado Masivo */}
      {archiveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-2xl">
            {archiveSuccess ? (
              <div className="text-center py-4">
                <span className="grid size-12 mx-auto place-items-center rounded-2xl bg-[#F0FDF4] text-[#16856A]">
                  <span className="material-symbols-outlined text-3xl">verified</span>
                </span>
                <h3 className="mt-3 text-lg font-bold text-[#1F2937]">Periodo 2026-1 Archivado</h3>
                <p className="mt-1 text-xs text-[#4B5563]">
                  Se congelaron los accesos de edición y se generó la copia histórica comprimida.
                </p>
              </div>
            ) : (
              <div>
                <span className="grid size-12 mx-auto place-items-center rounded-2xl bg-[#FEF2F2] text-[#C53030]">
                  <span className="material-symbols-outlined text-2xl">warning</span>
                </span>
                <h3 className="mt-3 text-center text-lg font-bold text-[#1F2937]">
                  ¿Confirmar Archivado del Semestre 2026-1?
                </h3>
                <p className="mt-1 text-center text-xs text-[#4B5563]">
                  Esta acción bloqueará las modificaciones de notas en todas las secciones y
                  trasladará las asignaturas al repositorio histórico.
                </p>

                <div className="flex justify-end gap-2 mt-5">
                  <button
                    className="rounded-xl border border-[#E2E8F0] px-4 py-2 text-xs font-bold text-[#4B5563]"
                    onClick={() => setArchiveModalOpen(false)}
                    type="button"
                  >
                    Cancelar
                  </button>
                  <button
                    className="rounded-xl bg-[#C53030] px-4 py-2 text-xs font-bold text-white hover:bg-[#9B2C2C]"
                    onClick={handleConfirmArchive}
                    type="button"
                  >
                    Confirmar Archivado Definitivo
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Modal de Configuración de Malla / Syllabus para Administrador */}
      {selectedCourseSyllabus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-2xl">
            <button
              aria-label="Cerrar modal de malla"
              className="absolute right-4 top-4 rounded-full p-1.5 text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#1F2937]"
              onClick={() => setSelectedCourseSyllabus(null)}
              type="button"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>

            <div className="border-b border-[#E2E8F0] pb-3">
              <span className="font-mono text-xs font-bold text-[#0B4F6C]">
                {selectedCourseSyllabus.code} · Malla Curricular Oficial
              </span>
              <h3 className="text-lg font-extrabold text-[#1F2937] mt-0.5">
                {selectedCourseSyllabus.name}
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Carrera: {selectedCourseSyllabus.career} · Créditos: {selectedCourseSyllabus.credits} SCT
              </p>
            </div>

            <div className="my-4 space-y-3 text-xs">
              <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Docente a cargo:</span>
                  <span className="font-bold text-[#1F2937]">
                    {selectedCourseSyllabus.teacherAssigned}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Secciones activas:</span>
                  <span className="font-bold text-[#0B4F6C]">
                    {selectedCourseSyllabus.activeSections} secciones
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Estado en malla:</span>
                  <span className="font-bold text-[#16856A]">Habilitado para inscripción</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="font-bold text-[#1F2937]">Unidades de Aprendizaje definidas:</p>
                <div className="space-y-1 rounded-xl border border-[#E2E8F0] p-2.5 bg-white">
                  <p className="text-[11px] text-[#4B5563]">1. Fundamentos y Especificación de Requisitos</p>
                  <p className="text-[11px] text-[#4B5563]">2. Arquitectura de Software y Modelado C4</p>
                  <p className="text-[11px] text-[#4B5563]">3. Patrones de Diseño y Calidad de Código</p>
                  <p className="text-[11px] text-[#4B5563]">4. Integración Continua, Pruebas y Despliegue</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-[#E2E8F0] pt-3">
              <button
                className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-2 text-xs font-bold text-[#4B5563] hover:bg-[#F8FAFC]"
                onClick={() => setSelectedCourseSyllabus(null)}
                type="button"
              >
                Cerrar
              </button>
              <button
                className="rounded-xl bg-[#0B4F6C] px-4 py-2 text-xs font-bold text-white hover:bg-[#083C53]"
                onClick={() => {
                  setAdminNotice(`Malla y syllabus de ${selectedCourseSyllabus.code} actualizados en el catálogo.`)
                  setSelectedCourseSyllabus(null)
                  setTimeout(() => setAdminNotice(null), 4000)
                }}
                type="button"
              >
                Guardar Configuración
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
