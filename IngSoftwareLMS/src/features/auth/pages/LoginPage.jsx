import LoginForm from '../../../components/LoginForm'
import LoginBrandingPanel from '../components/LoginBrandingPanel'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col justify-between bg-canvas-bg font-sans text-text-primary antialiased">
      <header className="sticky top-0 z-20 w-full border-b border-border-light bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-4 sm:px-6">
          <span className="block text-base font-bold leading-tight tracking-tight text-primary sm:text-lg">
            Campus Virtual LMS
          </span>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="grid min-h-[580px] w-full max-w-5xl grid-cols-1 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xl lg:grid-cols-12">
          <LoginBrandingPanel />
          <LoginForm />
        </div>
      </main>

      <footer className="w-full border-t border-slate-200/80 bg-white/70 py-4">
        <div className="mx-auto max-w-6xl px-4 text-center text-xs text-slate-500 sm:px-6">
          © 2026 Campus Virtual LMS
        </div>
      </footer>
    </div>
  )
}
