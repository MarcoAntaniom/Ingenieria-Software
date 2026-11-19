export default function LoginBrandingPanel() {
  return (
    <aside className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-primary via-[#083853] to-[#042436] p-6 text-white sm:p-8 lg:col-span-5 lg:p-10">
      <div className="relative z-10">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent-gold/40 bg-accent-gold/20 px-3.5 py-1.5 text-xs font-semibold text-[#f8d893] shadow-sm backdrop-blur-md">
          <span className="material-symbols-outlined text-sm text-accent-gold">
            calendar_month
          </span>
          <span>Campus Digital</span>
        </div>
        <h2 className="mb-3 text-2xl leading-snug font-bold tracking-tight text-white sm:text-3xl">
          Tu espacio de aprendizaje
        </h2>
        <p className="mb-6 text-sm leading-relaxed font-normal text-slate-200/90 sm:text-base">
          Accede a tus asignaturas, entregas, clases virtuales y material
          de estudio desde un solo lugar.
        </p>
        <div className="space-y-3 pt-1">
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.07] p-3">
            <span className="material-symbols-outlined text-[#4ad7d7]">
              menu_book
            </span>
            <span className="text-xs font-semibold">
              Clases, foros y anuncios
            </span>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.07] p-3">
            <span className="material-symbols-outlined text-[#ffd27e]">
              assignment_turned_in
            </span>
            <span className="text-xs font-semibold">
              Entregas y evaluaciones
            </span>
          </div>
        </div>
      </div>
    </aside>
  )
}
