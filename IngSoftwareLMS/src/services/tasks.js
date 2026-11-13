import api from './api'

function getPage(data, resourceName) {
  if (
    !Array.isArray(data?.results) ||
    !Number.isInteger(data.count) ||
    (data.next !== null && typeof data.next !== 'string') ||
    (data.previous !== null && typeof data.previous !== 'string')
  ) {
    throw new Error(`El servidor devolvió una paginación de ${resourceName} no válida.`)
  }

  return {
    results: data.results,
    count: data.count,
    hasNext: Boolean(data.next),
    hasPrevious: Boolean(data.previous),
  }
}

function validateTask(task) {
  if (
    !task ||
    typeof task !== 'object' ||
    !Number.isInteger(task.id) ||
    typeof task.titulo !== 'string' ||
    typeof task.fecha_cierre !== 'string' ||
    Number.isNaN(Date.parse(task.fecha_cierre)) ||
    !task.seccion ||
    typeof task.seccion !== 'object'
  ) {
    throw new Error('El servidor devolvió una tarea no válida.')
  }

  return task
}

function validateReceipt(receipt, submissionId) {
  if (
    !receipt ||
    typeof receipt !== 'object' ||
    receipt.id_entrega !== submissionId ||
    typeof receipt.tarea !== 'string' ||
    typeof receipt.estudiante !== 'string' ||
    typeof receipt.estado !== 'string' ||
    typeof receipt.timestamp_oficial !== 'string' ||
    Number.isNaN(Date.parse(receipt.timestamp_oficial)) ||
    typeof receipt.es_fuera_de_plazo !== 'boolean'
  ) {
    throw new Error('El servidor devolvió un comprobante no válido.')
  }
  return receipt
}

export async function fetchStudentPending(page = 1, signal) {
  const { data } = await api.get('academico/entregas-tareas/mis-pendientes/', {
    params: { page },
    signal,
  })
  const result = getPage(data, 'tareas pendientes')

  return {
    ...result,
    results: result.results.map(validateTask),
  }
}

export async function fetchTask(taskId, signal) {
  const { data } = await api.get(`academico/tareas/${taskId}/`, { signal })
  return validateTask(data)
}

export async function fetchTeacherTasks(sectionId, page = 1, signal) {
  const { data } = await api.get('academico/tareas/', {
    params: { seccion: sectionId, page },
    signal,
  })
  const result = getPage(data, 'tareas de la sección')
  return {
    ...result,
    results: result.results.map(validateTask),
  }
}

export async function fetchMyDelivery(taskId, signal) {
  const response = await api.get('academico/entregas-tareas/mi-entrega/', {
    params: { tarea: taskId },
    signal,
    validateStatus: (status) => status === 200 || status === 204,
  })
  return response.status === 204 ? null : response.data
}

export async function saveTaskDraft({ taskId, file, comment }, onProgress) {
  const body = new FormData()
  body.append('tarea', String(taskId))
  body.append('comentario_estudiante', comment)
  if (file) body.append('archivo', file)

  const { data } = await api.post(
    'academico/entregas-tareas/guardar-borrador/',
    body,
    {
      onUploadProgress: ({ loaded, total }) => {
        if (total) onProgress?.((loaded / total) * 100)
      },
    },
  )
  return data
}

export async function confirmTaskSubmission(submissionId) {
  const { data } = await api.post(
    `academico/entregas-tareas/${submissionId}/confirmar-envio/`,
  )
  return validateReceipt(data.comprobante, submissionId)
}

export async function fetchSubmissionReceipt(submissionId, signal) {
  const { data } = await api.get(
    `academico/entregas-tareas/${submissionId}/comprobante/`,
    { signal },
  )
  return validateReceipt(data, submissionId)
}

export async function downloadSubmissionFile(submissionId, fileName) {
  const { data } = await api.get(
    `academico/entregas-tareas/${submissionId}/archivo/`,
    { responseType: 'blob' },
  )
  const objectUrl = window.URL.createObjectURL(data)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = fileName || 'entrega'
  document.body.append(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(objectUrl)
}

export async function fetchTeacherSections(page = 1, signal) {
  const { data } = await api.get('academico/secciones/', {
    params: { page },
    signal,
  })
  return getPage(data, 'secciones docentes')
}

export async function createTask(values) {
  const { data } = await api.post('academico/tareas/', values)
  return validateTask(data)
}

export async function updateTask(taskId, values) {
  const { data } = await api.patch(`academico/tareas/${taskId}/`, values)
  return validateTask(data)
}

export async function fetchTeacherSubmissions(page = 1, signal) {
  const { data } = await api.get('academico/entregas-tareas/', {
    params: { page },
    signal,
  })
  return getPage(data, 'entregas para revisión')
}

export async function markSubmissionInReview(submissionId) {
  const { data } = await api.post(
    `academico/entregas-tareas/${submissionId}/poner-en-revision/`,
  )
  return data.data
}

export async function reopenSubmission(submissionId) {
  const { data } = await api.post(
    `academico/entregas-tareas/${submissionId}/reabrir-entrega/`,
  )
  return data.data
}
