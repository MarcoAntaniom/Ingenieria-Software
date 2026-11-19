export default function DashboardStatsGrid({
  coursesCount,
  announcementsCount,
  unreadCount,
  roleLabel,
}) {
  const stats = [
    {
      icon: 'school',
      iconClass: 'bg-primary/10 text-primary',
      label: 'Secciones disponibles',
      value: coursesCount,
    },
    {
      icon: 'campaign',
      iconClass: 'bg-secondary/15 text-secondary',
      label: 'Anuncios publicados',
      value: announcementsCount,
    },
    {
      icon: 'notifications',
      iconClass: 'bg-amber-500/15 text-amber-700',
      label: 'Avisos sin leer',
      value: unreadCount,
    },
    {
      icon: 'verified_user',
      iconClass: 'bg-emerald-500/15 text-emerald-700',
      label: 'Rol activo',
      value: roleLabel,
      isText: true,
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          className="flex items-center gap-3.5 rounded-xl border border-line bg-card p-4 shadow-xs"
          key={stat.label}
        >
          <span className={`grid size-11 place-items-center rounded-xl ${stat.iconClass}`}>
            <span className="material-symbols-outlined">{stat.icon}</span>
          </span>
          <div>
            <p className="text-xs font-semibold text-muted">{stat.label}</p>
            <p
              className={`font-extrabold text-ink ${
                stat.isText ? 'text-base' : 'text-xl'
              }`}
            >
              {stat.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
