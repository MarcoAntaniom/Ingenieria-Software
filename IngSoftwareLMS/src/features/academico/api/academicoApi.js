import api from '../../../services/api'
import {
  unwrapEntityResponse,
  unwrapListResponse,
} from '../../../shared/lib/pagination'

const COURSE_COLORS = [
  'from-primary via-[#104c64] to-[#104c64]',
  'from-secondary via-teal-800 to-primary',
  'from-amber-900 via-amber-800 to-stone-900',
  'from-slate-800 via-slate-800 to-slate-900',
  'from-emerald-900 via-secondary to-primary',
  'from-slate-700 via-primary to-slate-800',
]

/**
 * Adapta una sección del backend (`SeccionSerializer`) o una inscripción (`InscripcionSerializer`)
 * a un modelo uniforme para tarjetas y vistas de detalle.
 */
export function normalizeSeccionItem(raw, index = 0) {
  const seccion = raw?.seccion || raw || {}
  const asignatura = seccion?.asignatura || {}
  const periodo = seccion?.periodo_academico || {}
  const carrera = asignatura?.carrera || {}

  const id = seccion?.id ?? raw?.id ?? index + 1
  const code = asignatura?.codigo || seccion?.code || `SEC-${id}`
  const title =
    asignatura?.nombre ||
    seccion?.title ||
    `Sección #${seccion?.numero_seccion || id}`
  const sectionNumber = seccion?.numero_seccion ?? seccion?.section ?? 1
  const careerName = carrera?.nombre_carrera || seccion?.career || 'Formación General'
  const periodCode =
    periodo?.codigo || seccion?.period || 'Período Académico Activo'
  const isActivePeriod =
    typeof periodo?.activo === 'boolean'
      ? periodo.activo
      : seccion?.status !== 'completed'

  return {
    id,
    inscripcionId: raw?.seccion ? raw.id : null,
    code,
    title,
    section: sectionNumber,
    careerName,
    period: periodCode,
    isActive: isActivePeriod,
    status: isActivePeriod ? 'progress' : 'completed',
    badge: raw?.estado?.codigo || (isActivePeriod ? 'Activo' : 'Finalizado'),
    teacher: seccion?.teacher || 'Equipo Docente Asignado',
    colors: COURSE_COLORS[index % COURSE_COLORS.length],
    raw: seccion,
  }
}

export async function fetchSecciones() {
  const { data } = await api.get('academico/secciones/')
  const list = unwrapListResponse(data)
  return {
    ...list,
    items: list.items.map((item, idx) => normalizeSeccionItem(item, idx)),
  }
}

export async function fetchSeccionById(id) {
  const { data } = await api.get(`academico/secciones/${id}/`)
  return normalizeSeccionItem(unwrapEntityResponse(data), 0)
}

export async function createSeccion(payload) {
  const { data } = await api.post('academico/secciones/', payload)
  return unwrapEntityResponse(data)
}

export async function fetchInscripciones() {
  const { data } = await api.get('academico/inscripciones/')
  return unwrapListResponse(data)
}

export async function createInscripcion(payload) {
  const { data } = await api.post('academico/inscripciones/', payload)
  return unwrapEntityResponse(data)
}

export async function deleteInscripcion(id) {
  await api.delete(`academico/inscripciones/${id}/`)
}

export async function fetchCarreras() {
  const { data } = await api.get('academico/carreras/')
  return unwrapListResponse(data).items
}

export async function createCarrera(payload) {
  const { data } = await api.post('academico/carreras/', payload)
  return unwrapEntityResponse(data)
}

export async function fetchDepartamentos() {
  const { data } = await api.get('academico/departamentos/')
  return unwrapListResponse(data).items
}

export async function createDepartamento(payload) {
  const { data } = await api.post('academico/departamentos/', payload)
  return unwrapEntityResponse(data)
}

export async function fetchPeriodosAcademicos() {
  const { data } = await api.get('academico/periodos-academicos/')
  return unwrapListResponse(data).items
}

export async function createPeriodoAcademico(payload) {
  const { data } = await api.post('academico/periodos-academicos/', payload)
  return unwrapEntityResponse(data)
}

export async function fetchAsignaturas() {
  const { data } = await api.get('academico/asignaturas/')
  return unwrapListResponse(data).items
}

export async function createAsignatura(payload) {
  const { data } = await api.post('academico/asignaturas/', payload)
  return unwrapEntityResponse(data)
}

export async function fetchEstadosInscripcion() {
  const { data } = await api.get('academico/estados-inscripcion/')
  return unwrapListResponse(data).items
}

export async function createEstadoInscripcion(payload) {
  const { data } = await api.post('academico/estados-inscripcion/', payload)
  return unwrapEntityResponse(data)
}

export async function fetchSeccionesDocentes() {
  const { data } = await api.get('academico/secciones-docentes/')
  return unwrapListResponse(data).items
}

export async function createSeccionDocente(payload) {
  const { data } = await api.post('academico/secciones-docentes/', payload)
  return unwrapEntityResponse(data)
}
