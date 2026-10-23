import LoginForm from './components/LoginForm.jsx'

function App() {
  return (
    <div className="flex min-h-screen flex-col justify-between bg-canvas-bg font-sans text-text-primary antialiased">
      {/* Barra superior con la identidad del campus virtual. */}
      <header className="sticky top-0 z-20 w-full border-b border-border-light bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <span className="block text-base font-bold leading-tight tracking-tight text-primary sm:text-lg">
            Campus Virtual LMS
          </span>
        </div>
      </header>

      {/* Contenedor principal que organiza el panel informativo y el acceso. */}
      <main className="flex flex-1 items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="grid min-h-[580px] w-full max-w-5xl grid-cols-1 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xl lg:grid-cols-12">
          {/* Panel lateral con información del semestre y servicios académicos. */}
          <aside className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-primary via-[#083853] to-[#042436] p-6 text-white sm:p-8 lg:col-span-5 lg:p-10">
            <div className="relative z-10">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent-gold/40 bg-accent-gold/20 px-3.5 py-1.5 text-xs font-semibold text-[#f8d893] shadow-sm backdrop-blur-md">
                <span className="material-symbols-outlined text-sm text-accent-gold">
                  calendar_month
                </span>
                <span>Semestre 2026</span>
              </div>
              <h2 className="mb-3 text-2xl leading-snug font-bold tracking-tight text-white sm:text-3xl">
                Tu espacio de aprendizaje
              </h2>
              <p className="mb-6 text-sm leading-relaxed font-normal text-slate-200/90 sm:text-base">
                Accede a tus asignaturas, entregas pendientes, clases virtuales
                y material de estudio en un solo lugar.
              </p>

              <div className="space-y-3 pt-1">
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.07] p-3 backdrop-blur-xs">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-secondary/25 text-[#4ad7d7]">
                    <span className="material-symbols-outlined text-lg">
                      menu_book
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">
                      Clases y foros activos
                    </p>
                    <p className="text-[11px] text-slate-300">
                      Revisa anuncios y comentarios de hoy
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.07] p-3 backdrop-blur-xs">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-accent-gold/25 text-[#ffd27e]">
                    <span className="material-symbols-outlined text-lg">
                      assignment_turned_in
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">
                      Entregas y evaluaciones
                    </p>
                    <p className="text-[11px] text-slate-300">
                      Sube tus tareas antes del plazo fijado
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Formulario de inicio de sesión separado para mantenerlo reutilizable. */}
          <LoginForm />
        </div>
      </main>

      {/* Pie de página con el aviso de derechos. */}
      <footer className="w-full border-t border-slate-200/80 bg-white/70 py-4">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between px-4 text-xs text-slate-500 sm:flex-row sm:px-6">
          <p>© 2026 Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  )
}

export default App
