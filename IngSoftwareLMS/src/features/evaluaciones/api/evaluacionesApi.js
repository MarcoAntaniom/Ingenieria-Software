import api from '../../../services/api'
import {
  unwrapEntityResponse,
  unwrapListResponse,
} from '../../../shared/lib/pagination'

export async function fetchEvaluacionTareas(filters = {}) {
  const params = {}
  if (filters.seccion) params.seccion = filters.seccion
  const { data } = await api.get('evaluaciones/tareas/', { params })
  return unwrapListResponse(data).items
}

export async function createEvaluacionTarea(payload) {
  const { data } = await api.post('evaluaciones/create/', payload)
  return data?.tarea || unwrapEntityResponse(data)
}

export async function fetchEntregasEvaluacion(filters = {}) {
  const params = {}
  if (filters.tarea) params.tarea = filters.tarea
  const { data } = await api.get('evaluaciones/entregas/', { params })
  return unwrapListResponse(data).items
}

export async function submitEntregaEvaluacion(payload) {
  const { data } = await api.post('evaluaciones/entregas/', payload)
  return unwrapEntityResponse(data)
}

export async function calificarEntregaEvaluacion({ entregaId, nota_final, observaciones_generales }) {
  const { data } = await api.post(`evaluaciones/entregas/${entregaId}/calificar/`, {
    nota_final,
    observaciones_generales,
  })
  return unwrapEntityResponse(data)
}
