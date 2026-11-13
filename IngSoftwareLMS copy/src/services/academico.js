import api from './api'

function parsePaginated(data, label) {
  if (Array.isArray(data)) {
    return {
      results: data,
      count: data.length,
      hasNext: false,
      hasPrevious: false,
    }
  }

  if (!Array.isArray(data?.results)) {
    throw new Error(`No se recibió una lista válida de ${label}.`)
  }

  return {
    results: data.results,
    count: Number.isInteger(data.count) ? data.count : data.results.length,
    hasNext: Boolean(data.next),
    hasPrevious: Boolean(data.previous),
  }
}

export async function fetchTareas(page = 1, { signal } = {}) {
  const { data } = await api.get('academico/tareas/', {
    params: { page },
    signal,
  })
  return parsePaginated(data, 'tareas')
}

export async function fetchTareaById(tareaId, { signal } = {}) {
  const { data } = await api.get(`academico/tareas/${tareaId}/`, { signal })
  return data
}

async function fetchEntregasTareas(page = 1, { signal } = {}) {
  const { data } = await api.get('academico/entregas-tareas/', {
    params: { page },
    signal,
  })
  return parsePaginated(data, 'entregas de tareas')
}

export async function fetchTodasLasEntregasTareas({ signal } = {}) {
  const firstPage = await fetchEntregasTareas(1, { signal })
  const results = [...firstPage.results]
  let page = 2
  let hasNext = firstPage.hasNext

  while (hasNext) {
    const nextPage = await fetchEntregasTareas(page, { signal })
    results.push(...nextPage.results)
    hasNext = nextPage.hasNext
    page += 1
  }

  return results
}

export async function confirmarEnvioEntrega(entregaId) {
  const { data } = await api.post(
    `academico/entregas-tareas/${entregaId}/confirmar-envio/`,
  )
  return data
}
