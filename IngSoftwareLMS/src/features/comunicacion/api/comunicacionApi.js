import api from '../../../services/api'
import {
  unwrapEntityResponse,
  unwrapListResponse,
} from '../../../shared/lib/pagination'

export async function fetchAnuncios(filters = {}) {
  const params = {}
  if (filters.seccion) params.seccion = filters.seccion
  const { data } = await api.get('comunicacion/anuncios/', { params })
  return unwrapListResponse(data).items
}

export async function createAnuncio(payload) {
  const { data } = await api.post('comunicacion/anuncios/', payload)
  return unwrapEntityResponse(data)
}

export async function deleteAnuncio(id) {
  await api.delete(`comunicacion/anuncios/${id}/`)
}

export async function fetchForos(filters = {}) {
  const params = {}
  if (filters.seccion) params.seccion = filters.seccion
  const { data } = await api.get('comunicacion/foros/', { params })
  return unwrapListResponse(data).items
}

export async function createForo(payload) {
  const { data } = await api.post('comunicacion/foros/', payload)
  return unwrapEntityResponse(data)
}

export async function fetchForoTemas(foroId) {
  const { data } = await api.get(`comunicacion/foros/${foroId}/temas/`)
  return unwrapListResponse(data).items
}

export async function createTemaForo(payload) {
  const { data } = await api.post('comunicacion/temas/', payload)
  return unwrapEntityResponse(data)
}

export async function fetchTemaMensajes(temaId) {
  const { data } = await api.get(`comunicacion/temas/${temaId}/mensajes/`)
  return unwrapListResponse(data).items
}

export async function createMensajeForo(payload) {
  const { data } = await api.post('comunicacion/mensajes-foro/', payload)
  return unwrapEntityResponse(data)
}

export async function fetchConversaciones() {
  const { data } = await api.get('comunicacion/conversaciones/')
  return unwrapListResponse(data).items
}

export async function createConversacion(payload) {
  const { data } = await api.post('comunicacion/conversaciones/', payload)
  return unwrapEntityResponse(data)
}

export async function fetchMensajesDirectos(filters = {}) {
  const params = {}
  if (filters.conversacion) params.conversacion = filters.conversacion
  const { data } = await api.get('comunicacion/mensajes-directos/', { params })
  return unwrapListResponse(data).items
}

export async function sendMensajeDirecto(payload) {
  const { data } = await api.post('comunicacion/mensajes-directos/', payload)
  return unwrapEntityResponse(data)
}
