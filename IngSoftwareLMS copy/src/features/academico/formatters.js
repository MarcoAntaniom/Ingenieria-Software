export function formatDateTimeCL(isoString) {
  if (!isoString) return 'Sin fecha definida'
  const date = new Date(isoString)
  if (Number.isNaN(date.getTime())) return 'Fecha inválida'

  return new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export function toDatetimeLocalValue(isoString) {
  if (!isoString) return ''
  const date = new Date(isoString)
  if (Number.isNaN(date.getTime())) return ''

  const pad = (value) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export const ESTADO_ENTREGA_META = {
  BORRADOR: { label: 'Borrador guardado', tone: 'warning' },
  ENVIADO: { label: 'Enviado definitivo', tone: 'success' },
  EN_REVISION: { label: 'En revisión', tone: 'info' },
  REABIERTA: { label: 'Reabierta para edición', tone: 'warning' },
}

export function getFileNameFromUrl(fileUrl) {
  if (!fileUrl || typeof fileUrl !== 'string') return null

  const clean = fileUrl.split('?')[0]
  const fileName = clean.split('/').pop() || clean
  try {
    return decodeURIComponent(fileName)
  } catch {
    return fileName
  }
}
