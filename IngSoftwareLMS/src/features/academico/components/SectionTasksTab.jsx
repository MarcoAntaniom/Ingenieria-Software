import { Link } from 'react-router-dom'
import { EmptyState } from '../../../shared/components/ui/StateViews'

export default function SectionTasksTab({ tasks }) {
  if (tasks.length === 0) {
    return (
      <EmptyState
        icon="assignment"
        title="Sin tareas publicadas en esta sección"
        description="Las tareas y evaluaciones asignadas a la sección se mostrarán aquí."
        action={
          <Link
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white"
            to="/evaluaciones"
          >
            Ir al módulo de Evaluaciones
          </Link>
        }
      />
    )
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <article
          className="flex flex-col justify-between gap-4 rounded-xl border border-line bg-card p-5 shadow-xs sm:flex-row sm:items-center"
          key={task.id}
        >
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold text-ink">{task.titulo}</h3>
              <span className="rounded-full bg-secondary-container px-2.5 py-0.5 text-[10px] font-bold text-on-secondary-container">
                {task.puntaje_maximo} pts
              </span>
            </div>
            <p className="text-xs text-muted">{task.instrucciones}</p>
            <p className="text-[11px] text-muted/80">
              Cierre:{' '}
              {task.fecha_limite
                ? new Date(task.fecha_limite).toLocaleString('es-CL')
                : 'No definido'}
            </p>
          </div>
          <Link
            className="self-start rounded-xl bg-primary/10 px-4 py-2 text-xs font-bold text-primary transition hover:bg-primary hover:text-white sm:self-center"
            to="/evaluaciones"
          >
            Gestionar entregas
          </Link>
        </article>
      ))}
    </div>
  )
}
