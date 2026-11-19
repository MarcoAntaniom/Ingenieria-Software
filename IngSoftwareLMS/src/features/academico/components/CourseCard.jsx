import { Link } from 'react-router-dom'

export default function CourseCard({ course }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-line bg-card shadow-xs transition-transform motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-md">
      <div
        className={`flex min-h-36 flex-col justify-between bg-gradient-to-br p-4 text-white ${course.colors}`}
      >
        <div>
          <span className="rounded bg-white/15 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-secondary-fixed">
            {course.code} · Sec. {course.section}
          </span>
          <h2
            className="mt-2 truncate text-base font-bold leading-tight"
            title={course.title}
          >
            {course.title}
          </h2>
          <p className="mt-0.5 truncate text-xs text-white/80">
            {course.careerName}
          </p>
        </div>
        <span className="mt-3 inline-flex w-max items-center gap-1 rounded-full bg-secondary-fixed px-2.5 py-0.5 text-[11px] font-bold text-primary">
          <span className="material-symbols-outlined text-sm" aria-hidden="true">
            {course.status === 'completed' ? 'verified' : 'school'}
          </span>
          {course.badge}
        </span>
      </div>

      <div className="flex flex-1 flex-col justify-between gap-4 p-4">
        <div className="flex items-start gap-2.5 rounded-lg bg-subtle p-3">
          <span
            className="material-symbols-outlined shrink-0 text-secondary"
            aria-hidden="true"
          >
            calendar_month
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-secondary">
              Período Académico
            </p>
            <p className="truncate text-xs font-bold text-ink">{course.period}</p>
            <p className="text-[11px] text-muted">{course.teacher}</p>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-line pt-3">
          <span className="text-[11px] text-muted">ID Sección #{course.id}</span>
          <Link
            className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary transition hover:bg-primary hover:text-white"
            to={`/cursos/${course.id}`}
          >
            Abrir aula
            <span className="material-symbols-outlined text-sm" aria-hidden="true">
              arrow_forward
            </span>
          </Link>
        </div>
      </div>
    </article>
  )
}
