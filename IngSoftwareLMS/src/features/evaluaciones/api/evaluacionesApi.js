import api from '../../../services/api'
import {
  unwrapEntityResponse,
  unwrapListResponse,
} from '../../../shared/lib/pagination'

export const LATE_SUBMISSION_MAX_WAIT_MS = 60 * 60 * 1000 // Máximo 1 hora de espera para entregas tardías

/**
 * Determina si una tarea ya superó su fecha límite permitida:
 * - Si el docente reabrió la entrega al estudiante (`REABIERTA`), no está bloqueada.
 * - Si no tiene `fecha_limite`, nunca se cierra por plazo.
 * - Si no admite entregas tardías, se cierra inmediatamente al pasar `fecha_limite`.
 * - Si admite entregas tardías, tiene como máximo 1 hora de espera después de `fecha_limite`
 *   y luego se bloquea definitivamente.
 */
export function isTaskClosedForSubmission(task, existingDelivery = null) {
  if (existingDelivery?.estado_codigo === 'REABIERTA') return false
  if (!task?.fecha_limite) return false
  const deadlineMs = new Date(task.fecha_limite).getTime()
  if (!Number.isFinite(deadlineMs)) return false
  const nowMs = Date.now()
  if (nowMs <= deadlineMs) return false
  if (!task.permitir_entregas_tardias) return true
  return nowMs > deadlineMs + LATE_SUBMISSION_MAX_WAIT_MS
}

export function isTaskPastDeadlineWithLateAllowed(task) {
  if (!task?.fecha_limite || !task?.permitir_entregas_tardias) return false
  const deadlineMs = new Date(task.fecha_limite).getTime()
  if (!Number.isFinite(deadlineMs)) return false
  const nowMs = Date.now()
  return nowMs > deadlineMs && nowMs <= deadlineMs + LATE_SUBMISSION_MAX_WAIT_MS
}

export function isTaskLateWindowExpired(task) {
  if (!task?.fecha_limite || !task?.permitir_entregas_tardias) return false
  const deadlineMs = new Date(task.fecha_limite).getTime()
  if (!Number.isFinite(deadlineMs)) return false
  return Date.now() > deadlineMs + LATE_SUBMISSION_MAX_WAIT_MS
}

export async function fetchEvaluacionTareas(filters = {}) {
  const params = {}
  if (filters.seccion) params.seccion = filters.seccion
  const { data } = await api.get('evaluaciones/tareas/', { params })
  const items = unwrapListResponse(data).items
  if (filters.seccion) {
    return items.filter(
      (task) => Number(task.seccion) === Number(filters.seccion),
    )
  }
  return items
}

export async function createEvaluacionTarea(payload) {
  const { data } = await api.post('evaluaciones/create/', payload)
  return data?.tarea || unwrapEntityResponse(data)
}

export async function fetchRubricas() {
  const { data } = await api.get('evaluaciones/rubricas/')
  return unwrapListResponse(data).items
}

export async function createRubrica(payload) {
  const { data } = await api.post('evaluaciones/rubricas/', payload)
  return unwrapEntityResponse(data)
}

export async function fetchEntregasEvaluacion(filters = {}) {
  const params = {}
  if (filters.tarea) params.tarea = filters.tarea
  if (filters.seccion) params.seccion = filters.seccion
  const { data } = await api.get('evaluaciones/entregas/', { params })
  const items = unwrapListResponse(data).items
  if (filters.seccion) {
    return items.filter(
      (entrega) =>
        entrega.tarea_seccion == null ||
        Number(entrega.tarea_seccion) === Number(filters.seccion),
    )
  }
  return items
}

/**
 * Crea o actualiza una entrega de tarea.
 * `payload.es_borrador` controla si se guarda como `'BORRADOR'` (`true`) o se envía definitivamente como `'ENVIADA'` (`false`).
 */
export async function submitEntregaEvaluacion(payload) {
  const { data } = await api.post('evaluaciones/entregas/', payload)
  return unwrapEntityResponse(data)
}

/**
 * Confirma el envío definitivo de una entrega que estaba en estado `'BORRADOR'` o `'REABIERTA'`,
 * bloqueándola frente a cualquier cambio posterior.
 */
export async function confirmarEntregaEvaluacion(entregaId) {
  const { data } = await api.post(
    `evaluaciones/entregas/${entregaId}/confirmar-envio/`,
  )
  return unwrapEntityResponse(data)
}

export async function marcarEnRevisionEvaluacion(entregaId) {
  const { data } = await api.post(
    `evaluaciones/entregas/${entregaId}/en-revision/`,
  )
  return unwrapEntityResponse(data)
}

export async function reabrirEntregaEvaluacion(entregaId) {
  const { data } = await api.post(
    `evaluaciones/entregas/${entregaId}/reabrir/`,
  )
  return unwrapEntityResponse(data)
}

export async function calificarEntregaEvaluacion({
  entregaId,
  nota_final,
  observaciones_generales,
  eximir_penalizacion = false,
  archivos_retroalimentacion_ids = [],
  evaluaciones_criterios = [],
}) {
  const { data } = await api.post(
    `evaluaciones/entregas/${entregaId}/calificar/`,
    {
      nota_final,
      observaciones_generales,
      eximir_penalizacion,
      archivos_retroalimentacion_ids,
      evaluaciones_criterios,
    },
  )
  return unwrapEntityResponse(data)
}
