import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/auth-context'
import Button from './ui/Button'
import Input from './ui/Input'
import { canAccessPath, getLandingPath } from '../utils/roles'

const loginSchema = z.object({
  email: z.string().email('Ingresa un correo institucional válido.'),
  password: z.string().min(1, 'Ingresa tu contraseña.'),
})

const MAX_ATTEMPTS = 5
const LOCKOUT_SECONDS = 60

function getInitialNotice(location) {
  return typeof location.state?.notice === 'string'
    ? { type: 'info', text: location.state.notice }
    : null
}

export default function LoginForm() {
  const navigate = useNavigate()
  const location = useLocation()
  const { authNotice, clearAuthNotice, login } = useAuth()
  const [status, setStatus] = useState(() => getInitialNotice(location))
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const [showPassword, setShowPassword] = useState(false)
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm({
    defaultValues: { email: '', password: '' },
    resolver: zodResolver(loginSchema),
  })
  const visibleStatus =
    status ||
    (authNotice ? { type: 'info', text: authNotice } : null)

  useEffect(() => {
    if (remainingSeconds <= 0) return undefined
    const timeoutId = window.setTimeout(
      () => setRemainingSeconds((seconds) => Math.max(0, seconds - 1)),
      1000,
    )
    return () => window.clearTimeout(timeoutId)
  }, [remainingSeconds])

  async function onSubmit(credentials) {
    if (remainingSeconds > 0) return
    setStatus(null)
    clearAuthNotice()

    try {
      const user = await login(credentials.email, credentials.password)
      const requestedPath = location.state?.from?.pathname
      const destination =
        typeof requestedPath === 'string' &&
        requestedPath.startsWith('/') &&
        !requestedPath.startsWith('//') &&
        canAccessPath(user, requestedPath)
          ? requestedPath
          : getLandingPath(user)
      setFailedAttempts(0)
      navigate(destination, { replace: true })
    } catch (error) {
      if (error?.status === 403) {
        setStatus({
          type: 'error',
          text: 'No se pudo iniciar sesión. Verifica tus credenciales.',
        })
        return
      }

      const isCredentialFailure =
        error?.status === 400 || error?.status === 401
      if (isCredentialFailure) {
        const nextAttempt =
          failedAttempts >= MAX_ATTEMPTS ? 1 : failedAttempts + 1
        setFailedAttempts(nextAttempt)
        if (nextAttempt >= MAX_ATTEMPTS) {
          setRemainingSeconds(LOCKOUT_SECONDS)
        }
      }
      setStatus({
        type: 'error',
        text: isCredentialFailure
          ? 'No se pudo iniciar sesión. Verifica tus credenciales.'
          : error?.message ||
            'No se pudo iniciar sesión. Inténtalo nuevamente.',
      })
    }
  }

  const isLocked = remainingSeconds > 0

  return (
    <section className="flex flex-col justify-center p-6 sm:p-8 lg:col-span-7 lg:p-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          Iniciar sesión
        </h1>
        <p className="mt-1 text-sm font-normal text-muted">
          Ingresa con tu cuenta institucional para comenzar
        </p>
      </div>

      {visibleStatus && (
        <div
          aria-live="polite"
          className={`mb-5 flex items-center gap-2 rounded-xl border p-3.5 text-sm ${
            visibleStatus.type === 'error'
              ? 'border-danger-strong/30 bg-danger-soft text-danger-strong'
              : 'border-secondary/30 bg-secondary-container/40 text-on-secondary-container'
          }`}
          role={visibleStatus.type === 'error' ? 'alert' : 'status'}
        >
          <span aria-hidden="true" className="material-symbols-outlined text-xl">
            {visibleStatus.type === 'error' ? 'error' : 'info'}
          </span>
          <span className="font-medium">{visibleStatus.text}</span>
        </div>
      )}

      {isLocked && (
        <p aria-live="polite" className="mb-4 text-sm font-semibold text-danger-strong" role="status">
          Se alcanzó el límite visual de intentos. Espera {remainingSeconds} segundos.
        </p>
      )}

      <form className="space-y-4" noValidate onSubmit={handleSubmit(onSubmit)}>
        <Input
          autoComplete="username"
          error={errors.email?.message}
          id="email"
          label="Correo institucional"
          placeholder="nombre@instituto.edu"
          type="email"
          {...register('email')}
        />

        <div>
          <Input
            autoComplete="current-password"
            className="relative"
            error={errors.password?.message}
            id="password"
            label="Contraseña"
            placeholder="Contraseña"
            type={showPassword ? 'text' : 'password'}
            {...register('password')}
          />
          <button
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            aria-pressed={showPassword}
            className="mt-2 rounded text-xs font-semibold text-secondary-dark hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            onClick={() => setShowPassword((visible) => !visible)}
            type="button"
          >
            {showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          </button>
        </div>

        <div className="pt-2">
          <Button
            className="min-h-12 w-full rounded-xl px-6 py-3 shadow-sm sm:text-base"
            disabled={isSubmitting || isLocked}
            type="submit"
          >
            {isSubmitting
              ? 'Verificando credenciales...'
              : 'Ingresar a mis clases'}
            {!isSubmitting && (
              <span aria-hidden="true" className="material-symbols-outlined text-lg">
                arrow_forward
              </span>
            )}
          </Button>
        </div>
      </form>

      <p className="mt-5 text-xs leading-relaxed text-muted">
        El tipo de cuenta y sus permisos se determinan en el servidor. El límite
        visual de intentos es solo una medida de interfaz; el servidor debe aplicar
        rate limiting.
      </p>
    </section>
  )
}
