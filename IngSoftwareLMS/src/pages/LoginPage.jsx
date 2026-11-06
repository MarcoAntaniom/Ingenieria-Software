import LoginForm from '../components/LoginForm'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col justify-between bg-surface font-sans text-ink antialiased">
      <header className="sticky top-0 z-20 w-full border-b border-line bg-card/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-4 sm:px-6">
          <span className="text-base font-bold leading-tight tracking-tight text-primary sm:text-lg">
            Campus Virtual LMS
          </span>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="grid min-h-[580px] w-full max-w-5xl grid-cols-1 overflow-hidden rounded-2xl border border-line bg-card shadow-xl lg:grid-cols-12">
          <aside className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-primary via-primary-container to-primary-dark p-6 text-white sm:p-8 lg:col-span-5 lg:p-10">
            <div className="relative z-10">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent-gold/40 bg-accent-gold/20 px-3.5 py-1.5 text-xs font-semibold text-accent-gold-light shadow-sm backdrop-blur-md">
                <span aria-hidden="true" className="material-symbols-outlined text-sm text-accent-gold">
                  calendar_month
                </span>
                <span>Campus Digital</span>
              </div>
              <h2 className="mb-3 text-2xl leading-snug font-bold tracking-tight text-white sm:text-3xl">
                Tu espacio de aprendizaje
              </h2>
              <p className="mb-6 text-sm leading-relaxed font-normal text-white/85 sm:text-base">
                Accede a tus asignaturas, entregas, clases virtuales y material
                de estudio desde un solo lugar.
              </p>
              <div className="space-y-3 pt-1">
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.07] p-3">
                  <span aria-hidden="true" className="material-symbols-outlined text-secondary-fixed">
                    menu_book
                  </span>
                  <span className="text-xs font-semibold">
                    Clases, foros y anuncios
                  </span>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.07] p-3">
                  <span aria-hidden="true" className="material-symbols-outlined text-accent-gold-light">
                    assignment_turned_in
                  </span>
                  <span className="text-xs font-semibold">
                    Entregas y evaluaciones
                  </span>
                </div>
              </div>
            </div>
          </aside>
          <LoginForm />
        </div>
      </main>

      <footer className="w-full border-t border-line bg-card/70 py-4">
        <div className="mx-auto max-w-6xl px-4 text-center text-xs text-muted sm:px-6">
          © 2026 Campus Virtual LMS
        </div>
      </footer>
    </div>
  )
}
