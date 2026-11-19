/**
 * Fábrica centralizada de Query Keys para TanStack React Query.
 * Garantiza invalidación predecible y escalabilidad entre módulos.
 */
export const queryKeys = {
  auth: {
    me: ['auth', 'me'],
  },
  usuarios: {
    all: ['usuarios'],
    list: (filters = {}) => ['usuarios', 'list', filters],
    roles: ['usuarios', 'roles'],
    studentProfiles: ['usuarios', 'student-profiles'],
    teacherProfiles: ['usuarios', 'teacher-profiles'],
  },
  academico: {
    carreras: ['academico', 'carreras'],
    departamentos: ['academico', 'departamentos'],
    periodos: ['academico', 'periodos'],
    estadosInscripcion: ['academico', 'estados-inscripcion'],
    asignaturas: (filters = {}) => ['academico', 'asignaturas', filters],
    secciones: (filters = {}) => ['academico', 'secciones', filters],
    seccionDetail: (id) => ['academico', 'secciones', String(id)],
    seccionesDocentes: (filters = {}) => ['academico', 'secciones-docentes', filters],
    inscripciones: (filters = {}) => ['academico', 'inscripciones', filters],
  },
  comunicacion: {
    anuncios: (filters = {}) => ['comunicacion', 'anuncios', filters],
    foros: (filters = {}) => ['comunicacion', 'foros', filters],
    foroTemas: (foroId) => ['comunicacion', 'foros', String(foroId), 'temas'],
    temas: (filters = {}) => ['comunicacion', 'temas', filters],
    temaMensajes: (temaId) => ['comunicacion', 'temas', String(temaId), 'mensajes'],
    conversaciones: ['comunicacion', 'conversaciones'],
    mensajesDirectos: (filters = {}) => ['comunicacion', 'mensajes-directos', filters],
  },
  evaluaciones: {
    tareas: (filters = {}) => ['evaluaciones', 'tareas', filters],
    entregas: (filters = {}) => ['evaluaciones', 'entregas', filters],
  },
  archivos: {
    all: ['archivos'],
    list: (filters = {}) => ['archivos', 'list', filters],
    materiales: (filters = {}) => ['archivos', 'materiales', filters],
    tipos: ['archivos', 'tipos'],
  },
  notificaciones: {
    all: ['notificaciones'],
    list: (filters = {}) => ['notificaciones', 'list', filters],
    unreadCount: ['notificaciones', 'unread-count'],
    tipos: ['notificaciones', 'tipos'],
  },
}
