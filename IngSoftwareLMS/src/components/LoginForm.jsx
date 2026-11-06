import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '../contexts/auth-context'

const loginSchema = z.object({
  email: z
    .string({ required_error: 'El correo institucional es obligatorio.' })
    .trim()
    .toLowerCase()
    .min(1, 'El correo institucional es obligatorio.')
    .email('Ingresa un formato de correo electrónico válido.')
    .max(150, 'El correo institucional no puede exceder 150 caracteres.'),
  password: z
    .string({ required_error: 'La contraseña es obligatoria.' })
    .min(1, 'La contraseña es obligatoria.')
    .min(6, 'La contraseña debe contener al menos 6 caracteres.')
    .max(128, 'La contraseña no puede exceder 128 caracteres.'),
})

export function LoginForm() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [authError, setAuthError] = useState(null)
  const [showResetHelp, setShowResetHelp] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
    defaultValues: {
      email: 'estudiante@universidad.cl',
      password: 'estudiante123',
    },
  })

  function handleFieldChange() {
    // Directriz: Limpieza reactiva de mensajes de error al modificar cualquier campo
    if (authError) {
      setAuthError(null)
    }
  }

  async function onSubmit(data) {
    if (isSubmitting) return
    setAuthError(null)

    const sanitizedEmail = (data.email || '').trim().toLowerCase()
    const rawPassword = data.password || ''

    try {
      await login(sanitizedEmail, rawPassword)
      const destination = location.state?.from?.pathname
      navigate(
        typeof destination === 'string' &&
          destination.startsWith('/') &&
          !destination.startsWith('//')
          ? destination
          : '/dashboard',
        { replace: true },
      )
    } catch (err) {
      // Directriz de Seguridad: Limpieza del campo de contraseña manteniendo intacto el correo para reintento seguro
      setValue('password', '', { shouldValidate: false })

      // Directriz 4.3: Manejo de errores con estructura Título y Mensaje claro
      let title = 'No pudimos iniciar sesión.'
      let message = 'Verifica tu correo institucional y contraseña e inténtalo nuevamente.'

      if (
        err?.status === 403 ||
        err?.message?.toLowerCase().includes('inactiv') ||
        err?.message?.toLowerCase().includes('bloqueada')
      ) {
        title = 'Cuenta institucional inactiva'
        message = 'Esta cuenta se encuentra inactiva o bloqueada. Contacta al soporte de TI.'
      } else if (err?.status === 429 || err?.message?.toLowerCase().includes('demasiados')) {
        title = 'Demasiados intentos'
        message = 'Por motivos de seguridad, espera un minuto antes de volver a intentar.'
      } else if (err?.status >= 500) {
        title = 'Servicio no disponible'
        message = 'El servidor universitario de autenticación tuvo un problema. Inténtalo más tarde.'
      } else if (
        err?.status === 0 ||
        err?.code === 'ECONNABORTED' ||
        err?.code === 'ERR_NETWORK' ||
        err?.message?.toLowerCase().includes('red') ||
        err?.message?.toLowerCase().includes('conectar')
      ) {
        title = 'Error de conexión'
        message = 'No fue posible conectar con el servidor. Revisa tu conexión a internet.'
      }

      setAuthError({ title, message })
    }
  }

  function handleFillCredentials(testEmail, testPass) {
    setValue('email', testEmail, { shouldValidate: true })
    setValue('password', testPass, { shouldValidate: true })
    setAuthError(null)
  }

  return (
    <div className="flex flex-col justify-center p-6 sm:p-8 md:p-8 lg:p-9 w-full">
      {/* Logotipo visible en dispositivos móviles (< 768px) para cumplir orden visual prioritario */}
      <div className="flex md:hidden items-center gap-2.5 mb-4">
        <div className="grid size-9 place-items-center rounded-xl bg-[#0B4F6C] text-white">
          <span aria-hidden="true" className="material-symbols-outlined text-xl">
            school
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold tracking-tight text-[#0B4F6C] leading-tight">
            Campus Virtual LMS
          </span>
          <span className="text-[11px] font-medium text-[#64748B]">Universidad</span>
        </div>
      </div>

      {/* Directriz 3.1: Cabecera del Formulario */}
      <div className="mb-5">
        <h1 className="text-2xl sm:text-[26px] font-bold tracking-tight text-[#1F2937]">
          Iniciar sesión
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-[#475569] leading-relaxed">
          Accede con tu cuenta institucional para continuar con tus clases y actividades.
        </p>
      </div>

      {/* Directriz 4.3: Banner de error accesible desplegado entre subtítulo y primer campo de entrada */}
      {authError && (
        <div
          aria-live="assertive"
          className="mb-5 rounded-xl border border-[#EF4444] bg-[#FEF2F2] p-3.5 text-[#991B1B] shadow-xs flex items-start gap-3 animate-in fade-in"
          role="alert"
        >
          <span
            aria-hidden="true"
            className="material-symbols-outlined text-xl text-[#EF4444] shrink-0 mt-0.5"
          >
            error
          </span>
          <div className="space-y-0.5 text-xs sm:text-sm">
            <p className="font-bold text-[#7F1D1D] leading-tight">
              {authError.title}
            </p>
            <p className="text-[#991B1B] leading-relaxed">
              {authError.message}
            </p>
          </div>
        </div>
      )}

      {/* Formulario de Acceso */}
      <form className="space-y-4 sm:space-y-4.5" noValidate onSubmit={handleSubmit(onSubmit)}>
        {/* Directriz 3.2: Campo Correo Institucional */}
        <div>
          <label
            className="mb-1.5 block text-xs sm:text-sm font-semibold text-[#1F2937]"
            htmlFor="email"
          >
            Correo institucional <span className="text-[#EF4444]">*</span>
          </label>
          <div className="relative flex items-center">
            <span
              aria-hidden="true"
              className="material-symbols-outlined pointer-events-none absolute left-3.5 text-xl text-[#64748B]"
            >
              alternate_email
            </span>
            <input
              autoComplete="username"
              className={`h-11 sm:h-12 w-full rounded-lg border bg-white pl-10 pr-3.5 text-xs sm:text-sm text-[#1F2937] placeholder:text-[#94A3B8] transition-colors focus:outline-none focus:ring-2 disabled:bg-[#F8FAFC] disabled:cursor-not-allowed ${
                errors.email
                  ? 'border-[#EF4444] focus:border-[#EF4444] focus:ring-[#EF4444]/20'
                  : 'border-[#CBD5E1] hover:border-[#94A3B8] focus:border-[#0B4F6C] focus:ring-[#0B4F6C]/20'
              }`}
              disabled={isSubmitting}
              id="email"
              placeholder="nombre@universidad.cl"
              type="email"
              {...register('email', { onChange: handleFieldChange })}
            />
          </div>
          {errors.email && (
            <p
              className="mt-1.5 flex items-center gap-1 text-xs font-medium text-[#DC2626]"
              role="alert"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-sm">
                error
              </span>
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Directriz 3.2: Campo Contraseña */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label
              className="text-xs sm:text-sm font-semibold text-[#1F2937]"
              htmlFor="password"
            >
              Contraseña <span className="text-[#EF4444]">*</span>
            </label>
          </div>
          <div className="relative flex items-center">
            <span
              aria-hidden="true"
              className="material-symbols-outlined pointer-events-none absolute left-3.5 text-xl text-[#64748B]"
            >
              lock
            </span>
            <input
              autoComplete="current-password"
              className={`h-11 sm:h-12 w-full rounded-lg border bg-white pl-10 pr-12 text-xs sm:text-sm text-[#1F2937] placeholder:text-[#94A3B8] transition-colors focus:outline-none focus:ring-2 disabled:bg-[#F8FAFC] disabled:cursor-not-allowed ${
                errors.password
                  ? 'border-[#EF4444] focus:border-[#EF4444] focus:ring-[#EF4444]/20'
                  : 'border-[#CBD5E1] hover:border-[#94A3B8] focus:border-[#0B4F6C] focus:ring-[#0B4F6C]/20'
              }`}
              disabled={isSubmitting}
              id="password"
              placeholder="Ingresa tu contraseña"
              type={showPassword ? 'text' : 'password'}
              {...register('password', { onChange: handleFieldChange })}
            />
            {/* Directriz 3.3: Control de visibilidad con touch target >= 40x40px sin layout shift */}
            <button
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              className="absolute right-1 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-md text-[#64748B] hover:text-[#1F2937] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0B4F6C] transition-colors"
              onClick={() => setShowPassword((prev) => !prev)}
              type="button"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-xl">
                {showPassword ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>

          {/* Directriz 4.1: Enlace de recuperación de credenciales alineado a la derecha */}
          <div className="mt-1.5 flex items-center justify-between">
            {errors.password ? (
              <p
                className="flex items-center gap-1 text-xs font-medium text-[#DC2626]"
                role="alert"
              >
                <span aria-hidden="true" className="material-symbols-outlined text-sm">
                  error
                </span>
                {errors.password.message}
              </p>
            ) : (
              <span />
            )}

            <button
              className="text-xs sm:text-[13px] font-medium text-[#0B4F6C] hover:text-[#07364A] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0B4F6C] rounded py-1 transition-colors ml-auto"
              onClick={() => setShowResetHelp((prev) => !prev)}
              type="button"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        </div>

        {/* Directriz 4.2: Botón Principal de Acción (CTA Dominante) */}
        <div className="pt-2 sm:pt-3">
          <button
            className="w-full h-11 sm:h-12 rounded-lg bg-[#0B4F6C] px-4 text-sm sm:text-base font-semibold text-white shadow-xs transition duration-150 hover:bg-[#07364A] active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0B4F6C] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-[#94A3B8] disabled:active:scale-100 flex items-center justify-center gap-2 select-none"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? (
              <>
                <span
                  aria-hidden="true"
                  className="size-4 sm:size-5 animate-spin rounded-full border-2 border-white/30 border-t-white shrink-0"
                />
                <span>Ingresando...</span>
              </>
            ) : (
              <span>Ingresar a mis clases</span>
            )}
          </button>
        </div>
      </form>

      {/* Directriz 4.4: Enlace discreto de ayuda contextual */}
      <div className="mt-4 flex flex-col items-center justify-center text-center">
        <button
          className="text-xs sm:text-[13px] text-[#0B4F6C] font-medium hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0B4F6C] rounded py-1"
          onClick={() => setShowResetHelp((prev) => !prev)}
          type="button"
        >
          ¿Necesitas ayuda para acceder?
        </button>
      </div>

      {/* Panel Informativo de Soporte y Recuperación */}
      {showResetHelp && (
        <div
          aria-live="polite"
          className="mt-3 rounded-xl border border-[#BAE6FD] bg-[#F0F9FF] p-3.5 text-xs text-[#075477] animate-in fade-in"
          role="status"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1">
              <p className="font-bold text-[#075477] flex items-center gap-1.5">
                <span aria-hidden="true" className="material-symbols-outlined text-base">
                  support_agent
                </span>
                Mesa de Ayuda y Soporte Institucional
              </p>
              <p className="text-[#0369A1] leading-relaxed">
                Para recuperar tu contraseña o solicitar soporte con tu cuenta, escribe indicando tu RUT y carrera a{' '}
                <a
                  className="font-semibold underline hover:text-[#0B4F6C]"
                  href="mailto:soporte@universidad.cl"
                >
                  soporte@universidad.cl
                </a>{' '}
                o llama al anexo institucional <strong>8000</strong>.
              </p>
            </div>
            <button
              aria-label="Cerrar ayuda"
              className="text-[#0284C7] hover:text-[#0369A1] p-1 rounded hover:bg-white/50 transition-colors"
              onClick={() => setShowResetHelp(false)}
              type="button"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-base">
                close
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Cuentas de Demostración para Evaluación Rápida */}
      <div className="mt-3.5 pt-3 border-t border-[#F1F5F9]">
        <details className="group">
          <summary className="flex items-center justify-center gap-1.5 cursor-pointer text-[11px] font-medium text-[#64748B] hover:text-[#0B4F6C] transition-colors select-none py-1">
            <span aria-hidden="true" className="material-symbols-outlined text-xs group-open:rotate-180 transition-transform">
              tune
            </span>
            <span>Cuentas de demostración (evaluación rápida)</span>
          </summary>
          <div className="mt-2 flex flex-wrap justify-center gap-1.5">
            <button
              className="rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-2 py-1 text-[11px] font-medium text-[#475569] hover:border-[#0B4F6C] hover:text-[#0B4F6C] transition disabled:opacity-50"
              disabled={isSubmitting}
              onClick={() =>
                handleFillCredentials('estudiante@universidad.cl', 'estudiante123')
              }
              type="button"
            >
              Estudiante
            </button>
            <button
              className="rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-2 py-1 text-[11px] font-medium text-[#475569] hover:border-[#0B4F6C] hover:text-[#0B4F6C] transition disabled:opacity-50"
              disabled={isSubmitting}
              onClick={() =>
                handleFillCredentials('m.hernandez@universidad.cl', 'docente123')
              }
              type="button"
            >
              Docente
            </button>
            <button
              className="rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-2 py-1 text-[11px] font-medium text-[#475569] hover:border-[#0B4F6C] hover:text-[#0B4F6C] transition disabled:opacity-50"
              disabled={isSubmitting}
              onClick={() =>
                handleFillCredentials('admin@universidad.cl', 'admin123')
              }
              type="button"
            >
              Administrador
            </button>
          </div>
        </details>
      </div>
    </div>
  )
}

export default LoginForm