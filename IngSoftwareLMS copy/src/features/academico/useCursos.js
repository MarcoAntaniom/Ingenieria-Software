import { useQuery } from '@tanstack/react-query'
import api from '../../services/api'

function mapInscription(row) {
  if (
    !row ||
    typeof row !== 'object' ||
    Array.isArray(row) ||
    !Number.isInteger(row.id)
  ) {
    throw new Error('El servidor devolvió una inscripción no válida.')
  }

  const section = row?.seccion
  const subject = section?.asignatura
  const period = section?.periodo_academico

  return {
    id: row?.id,
    title: subject?.nombre || null,
    code: subject?.codigo || null,
    section: section?.numero_seccion ?? null,
    period: period?.codigo || null,
    status: row?.estado?.codigo || null,
  }
}

async function fetchCursos(page) {
  const { data } = await api.get('academico/inscripciones/', {
    params: { page },
  })
  if (
    !Array.isArray(data?.results) ||
    !Number.isInteger(data.count) ||
    (data.next !== null && typeof data.next !== 'string') ||
    (data.previous !== null && typeof data.previous !== 'string')
  ) {
    throw new Error('No se recibió una lista válida de inscripciones.')
  }
  return {
    courses: data.results.map(mapInscription),
    count: data.count,
    hasNext: Boolean(data.next),
    hasPrevious: Boolean(data.previous),
  }
}

export function useCursos(page = 1) {
  return useQuery({
    queryKey: ['cursos', page],
    queryFn: () => fetchCursos(page),
    placeholderData: (previousData) => previousData,
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error) =>
      error?.status !== 401 && error?.status !== 403 && failureCount < 1,
  })
}
