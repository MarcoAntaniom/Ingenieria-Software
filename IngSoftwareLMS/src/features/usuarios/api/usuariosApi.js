import api from '../../../services/api'
import {
  unwrapEntityResponse,
  unwrapListResponse,
} from '../../../shared/lib/pagination'

export async function fetchCurrentUserProfile() {
  const { data } = await api.get('usuarios/me/')
  return unwrapEntityResponse(data)
}

export async function fetchRoles() {
  const { data } = await api.get('usuarios/roles/')
  return unwrapListResponse(data).items
}

export async function fetchUsuarios() {
  const { data } = await api.get('usuarios/read/')
  return unwrapListResponse(data).items
}

export async function createUsuario(payload) {
  const { data } = await api.post('usuarios/create/', payload)
  return data?.usuario || unwrapEntityResponse(data)
}

export async function updateUsuario(id, payload) {
  const { data } = await api.put(`usuarios/update/${id}/`, payload)
  return unwrapEntityResponse(data)
}

export async function fetchStudentProfiles() {
  const { data } = await api.get('usuarios/student-profile/')
  return unwrapListResponse(data).items
}

export async function createStudentProfile(payload) {
  const { data } = await api.post('usuarios/student-profile/', payload)
  return data?.perfil_estudiante || unwrapEntityResponse(data)
}

export async function fetchTeacherProfiles() {
  const { data } = await api.get('usuarios/teacher-profile/')
  return unwrapListResponse(data).items
}

export async function createTeacherProfile(payload) {
  const { data } = await api.post('usuarios/teacher-profile/', payload)
  return data?.perfil_docente || unwrapEntityResponse(data)
}
