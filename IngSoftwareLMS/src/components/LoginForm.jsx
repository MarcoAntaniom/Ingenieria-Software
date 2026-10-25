import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/auth-context'

function LoginForm() {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState(() =>
    location.state?.notice
      ? { type: 'info', text: location.state.notice }
      : null,
  )
  const { login } = useAuth()

  async function handleSubmit(event) {
    event.preventDefault()
    setIsLoading(true)
    setStatus(null)

    try {
      await login(email, password)
      const destination = location.state?.from?.pathname
      navigate(
        typeof destination === 'string' &&
          destination.startsWith('/') &&
          !destination.startsWith('//')
          ? destination
          : '/dashboard',
        { replace: true },
      )
    } catch (error) {
      setStatus({
        type: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'No se pudo iniciar sesión. Inténtalo de nuevo.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="flex flex-col justify-center p-6 sm:p-8 lg:col-span-7 lg:p-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Iniciar sesión
        </h1>
        <p className="mt-1 text-sm font-normal text-slate-500">
          Ingresa con tu cuenta institucional para comenzar
        </p>
      </div>

      {status && (
        <div
          aria-live="polite"
          className={`mb-5 flex items-center gap-2 rounded-xl border p-3.5 text-sm ${
            status.type === 'error'
              ? 'border-rose-200 bg-rose-50 text-rose-800'
              : 'border-sky-200 bg-sky-50 text-sky-800'
          }`}
          role={status.type === 'error' ? 'alert' : 'status'}
        >
          <span className="material-symbols-outlined text-xl" aria-hidden="true">
            {status.type === 'error' ? 'error' : 'info'}
          </span>
          <span className="font-medium">{status.text}</span>
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label
            className="mb-1.5 block text-xs font-semibold text-slate-700 sm:text-sm"
            htmlFor="email"
          >
            Correo institucional
          </label>
          <div className="relative">
            <span
              className="material-symbols-outlined pointer-events-none absolute left-3.5 top-1/2 z-10 flex -translate-y-1/2 items-center text-lg leading-none text-slate-400"
              aria-hidden="true"
            >
              alternate_email
            </span>
            <input
              autoComplete="username"
              className="min-h-12 w-full rounded-xl border border-slate-300 bg-slate-50/70 pr-4 pl-11 text-sm text-slate-800 transition-all placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 focus:outline-none sm:text-base"
              id="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nombre@instituto.edu"
              required
              type="email"
              value={email}
            />
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label
              className="text-xs font-semibold text-slate-700 sm:text-sm"
              htmlFor="password"
            >
              Contraseña
            </label>
            <button
              className="text-xs font-semibold text-secondary transition-colors hover:text-primary"
              onClick={() =>
                setStatus({
                  type: 'info',
                  text: 'Contacta al administrador para recuperar tu contraseña.',
                })
              }
              type="button"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
          <div className="relative">
            <span
              className="material-symbols-outlined pointer-events-none absolute left-3.5 top-1/2 z-10 flex -translate-y-1/2 items-center text-lg leading-none text-slate-400"
              aria-hidden="true"
            >
              lock
            </span>
            <input
              autoComplete="current-password"
              className="min-h-12 w-full rounded-xl border border-slate-300 bg-slate-50/70 pr-12 pl-11 font-mono text-sm text-slate-800 transition-all placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 focus:outline-none sm:text-base"
              id="password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Contraseña"
              required
              type={showPassword ? 'text' : 'password'}
              value={password}
            />
            <button
              aria-label={
                showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
              }
              className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-700 focus:outline-none"
              onClick={() => setShowPassword((visible) => !visible)}
              type="button"
            >
              <span className="material-symbols-outlined text-xl">
                {showPassword ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>
        </div>

        <div className="pt-2">
          <button
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-[#083853] focus:outline-none disabled:cursor-wait disabled:opacity-80 sm:text-base"
            disabled={isLoading}
            type="submit"
          >
            {isLoading ? 'Verificando credenciales...' : 'Ingresar a mis clases →'}
          </button>
        </div>
      </form>
      <p className="mt-5 text-xs leading-relaxed text-slate-500">
        El tipo de cuenta y sus permisos se determinan en el servidor, no desde
        este formulario.
      </p>
    </section>
  )
}

export default LoginForm
