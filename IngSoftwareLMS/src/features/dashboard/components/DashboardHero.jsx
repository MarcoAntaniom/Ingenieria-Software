import { Link } from 'react-router-dom'
import { ROLES } from '../../../shared/lib/roles'

export default function DashboardHero({
  displayName,
  roleCode,
  roleLabel,
  activeCount,
  unreadCount,
}) {
  return (
    <section className="bg-gradient-to-r from-primary via-[#104c64] to-secondary px-6 py-8 text-white lg:px-10">
      <div className="mx-auto flex max-w-[1360px] flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-secondary-fixed">
            Campus Digital · {roleLabel}
          </span>
          <div className="flex flex-wrap items-baseline gap-3">
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              Hola, {displayName}
            </h1>
            <span className="rounded-full border border-secondary/50 bg-secondary/40 px-2.5 py-0.5 text-xs font-semibold">
              {activeCount} secciones activas
            </span>
          </div>
          <p className="max-w-2xl text-sm text-white/90">
            {roleCode === ROLES.ADMIN
              ? 'Panel de supervisión institucional: gestiona catálogos académicos, usuarios, secciones y comunicaciones.'
              : roleCode === ROLES.DOCENTE
                ? 'Espacio docente: administra tus secciones, publica anuncios, abre foros y configura evaluaciones.'
                : 'Revisa tus asignaturas inscritas, anuncios docentes, foros de discusión y notificaciones en tiempo real.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-center">
          {(roleCode === ROLES.DOCENTE || roleCode === ROLES.ADMIN) && (
            <Link
              className="flex items-center gap-1.5 rounded-xl bg-white/15 px-4 py-2.5 text-xs font-bold text-white backdrop-blur-xs transition hover:bg-white/25"
              to="/evaluaciones"
            >
              <span className="material-symbols-outlined text-base" aria-hidden="true">
                add_task
              </span>
              Crear tarea
            </Link>
          )}
          <Link
            className="flex items-center gap-2 rounded-xl bg-card px-4 py-2.5 text-xs font-bold text-primary transition hover:bg-secondary-container"
            to="/notificaciones"
          >
            <span className="material-symbols-outlined text-base" aria-hidden="true">
              notifications_active
            </span>
            Notificaciones
            <span className="grid size-5 place-items-center rounded-full bg-danger text-[11px] text-white">
              {unreadCount}
            </span>
          </Link>
        </div>
      </div>
    </section>
  )
}
