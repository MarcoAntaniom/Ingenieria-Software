import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import AppShell from '../components/layout/AppShell'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import { useCreateTask, useTask, useTeacherSections, useUpdateTask } from '../features/academico/useTasks'

function toLocalDateTime(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16)
}

function FieldError({ children }) {
  if (!children) return null
  return <p className="text-xs font-medium text-danger-strong" role="alert">{children}</p>
}

export default function TeacherTaskFormPage() {
  const { taskId: rawTaskId } = useParams()
  const taskId = Number(rawTaskId)
  const isEditing = Boolean(rawTaskId)
  const isValidTaskId = !isEditing || (Number.isInteger(taskId) && taskId > 0)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const task = useTask(isEditing && isValidTaskId ? taskId : null)
  const [sectionPage, setSectionPage] = useState(1)
  const sections = useTeacherSections(sectionPage)
  const create = useCreateTask()
  const update = useUpdateTask(taskId)
  const mutation = isEditing ? update : create
  const initialValues = {
    seccion_id: isEditing ? String(task.data?.seccion?.id || '') : searchParams.get('seccion') || '',
    titulo: task.data?.titulo || '',
    descripcion: task.data?.descripcion || '',
    fecha_cierre: task.data ? toLocalDateTime(task.data.fecha_cierre) : '',
    permite_atrasados: task.data?.permite_atrasados || false,
  }
  const [values, setValues] = useState(null)
  const formValues = values || initialValues
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedSectionDetails, setSelectedSectionDetails] = useState(null)

  const sectionOptions = [...(sections.data?.results || [])]
  const currentSection = selectedSectionDetails || task.data?.seccion
  if (
    currentSection &&
    !sectionOptions.some((section) => section.id === currentSection.id)
  ) {
    sectionOptions.unshift(currentSection)
  }
  const fieldErrors = mutation.error?.fieldErrors || {}

  function changeValue(event) {
    const { checked, name, type, value } = event.target
    if (name === 'seccion_id') {
      setSelectedSectionDetails(
        sectionOptions.find((section) => section.id === Number(value)) || null,
      )
    }
    setValues((current) => ({
      ...(current || initialValues),
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  function submit(event) {
    event.preventDefault()
    setFormError('')
    setSuccess('')
    const payload = {
      seccion_id: Number(formValues.seccion_id),
      titulo: formValues.titulo.trim(),
      descripcion: formValues.descripcion.trim(),
      fecha_cierre: formValues.fecha_cierre,
      permite_atrasados: formValues.permite_atrasados,
      aplica_penalizacion_atraso: false,
    }

    mutation.mutate(payload, {
      onSuccess: (savedTask) => {
        if (!isEditing) {
          navigate(`/teacher/tasks/${savedTask.id}/edit`, { replace: true })
          return
        }
        setSuccess('Los cambios de la tarea se guardaron.')
      },
      onError: (error) => setFormError(error.message),
    })
  }

  if (!isValidTaskId) {
    return (
      <AppShell>
        <section className="mx-auto max-w-3xl px-6 py-8 lg:px-10">
          <Card className="p-6" role="alert">La dirección de la tarea no es válida.</Card>
        </section>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <section className="mx-auto max-w-3xl space-y-5 px-6 py-8 lg:px-10">
        <Link
          className="text-sm font-bold text-primary underline-offset-4 hover:underline"
          to="/teacher/sections"
        >
          Volver a mis secciones
        </Link>
        <header>
          <h1 className="text-2xl font-extrabold tracking-tight text-primary">
            {isEditing ? 'Editar tarea' : 'Crear tarea'}
          </h1>
          <p className="mt-1 text-sm text-muted">
            La tarea quedará asociada a una sección que tienes asignada.
          </p>
        </header>

        {(sections.isPending || (isEditing && task.isPending)) && (
          <p className="py-8 text-center text-sm text-muted" role="status">
            Cargando información...
          </p>
        )}
        {(sections.isError || (isEditing && task.isError)) && (
          <Card className="space-y-4 p-6" role="alert">
            <p className="font-semibold text-danger-strong">
              {sections.error?.message || task.error?.message}
            </p>
            <Button
              onClick={() => {
                sections.refetch()
                if (isEditing) task.refetch()
              }}
              variant="secondary"
            >
              Reintentar
            </Button>
          </Card>
        )}

        {sections.isSuccess && (!isEditing || task.isSuccess) && (
          <Card className="p-6">
            {sections.data.results.length === 0 && !currentSection ? (
              <p className="text-sm text-muted">
                No hay secciones disponibles para tu cuenta docente.
              </p>
            ) : (
              <form className="space-y-5" onSubmit={submit}>
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-ink" htmlFor="task-section">
                    Sección asignada
                  </label>
                  <select
                    className="min-h-12 w-full rounded-xl border border-line bg-subtle px-4 text-sm text-ink focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                    id="task-section"
                    name="seccion_id"
                    onChange={changeValue}
                    required
                    value={formValues.seccion_id}
                  >
                    <option value="" disabled>Selecciona una sección</option>
                    {sectionOptions.map((section) => (
                      <option key={section.id} value={section.id}>
                        {section.asignatura?.nombre || 'Asignatura'} · {section.periodo_academico?.codigo || 'Período'} · Sección {section.numero_seccion}
                      </option>
                    ))}
                  </select>
                  <FieldError>{fieldErrors.seccion_id}</FieldError>
                  {(sections.data.hasPrevious || sections.data.hasNext) && (
                    <div className="flex items-center justify-between gap-3 pt-2">
                      <Button
                        disabled={!sections.data.hasPrevious}
                        onClick={() => setSectionPage((current) => Math.max(1, current - 1))}
                        type="button"
                        variant="secondary"
                      >
                        Secciones anteriores
                      </Button>
                      <Button
                        disabled={!sections.data.hasNext}
                        onClick={() => setSectionPage((current) => current + 1)}
                        type="button"
                        variant="secondary"
                      >
                        Más secciones
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-ink" htmlFor="task-title">
                    Título
                  </label>
                  <input
                    className="min-h-12 w-full rounded-xl border border-line bg-subtle px-4 text-sm text-ink focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                    id="task-title"
                    maxLength={200}
                    name="titulo"
                    onChange={changeValue}
                    required
                    value={formValues.titulo}
                  />
                  <FieldError>{fieldErrors.titulo}</FieldError>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-ink" htmlFor="task-description">
                    Instrucciones
                  </label>
                  <textarea
                    className="min-h-32 w-full rounded-xl border border-line bg-subtle px-4 py-3 text-sm text-ink focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                    id="task-description"
                    name="descripcion"
                    onChange={changeValue}
                    value={formValues.descripcion}
                  />
                  <FieldError>{fieldErrors.descripcion}</FieldError>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-ink" htmlFor="task-deadline">
                    Fecha límite
                  </label>
                  <input
                    className="min-h-12 w-full rounded-xl border border-line bg-subtle px-4 text-sm text-ink focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                    id="task-deadline"
                    name="fecha_cierre"
                    onChange={changeValue}
                    required
                    type="datetime-local"
                    value={formValues.fecha_cierre}
                  />
                  <FieldError>{fieldErrors.fecha_cierre}</FieldError>
                  <p className="text-xs text-muted">
                    La hora se interpreta según la zona horaria institucional de Chile.
                  </p>
                </div>

                <label className="flex items-start gap-3 text-sm text-ink" htmlFor="late-submissions">
                  <input
                    checked={formValues.permite_atrasados}
                    className="mt-0.5 size-4 rounded border-line text-primary focus:ring-primary"
                    id="late-submissions"
                    name="permite_atrasados"
                    onChange={changeValue}
                    type="checkbox"
                  />
                  Permitir entregas fuera de plazo
                </label>

                {(formError || mutation.isError) && (
                  <p className="text-sm text-danger-strong" role="alert">
                    {formError || mutation.error.message}
                  </p>
                )}
                {success && <p className="text-sm text-success" role="status">{success}</p>}
                <Button
                  disabled={mutation.isPending || sections.isPending}
                  type="submit"
                >
                  {mutation.isPending ? 'Guardando...' : 'Guardar tarea'}
                </Button>
              </form>
            )}
          </Card>
        )}
      </section>
    </AppShell>
  )
}
