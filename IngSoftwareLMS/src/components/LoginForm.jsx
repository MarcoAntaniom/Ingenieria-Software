import { useState } from 'react'
import api from './api';

// Envía las credenciales al endpoint de autenticación del backend.
async function loginUsuario(email, password) {
  try {
    // Axios serializa las credenciales como JSON y devuelve el cuerpo en response.data.
    const response = await api.post('usuarios/login/', {
      correo_institucional: email,
      password: password,
    })

    return response.data
  } catch (error) {
    // Convierte los errores de Axios en mensajes que el formulario pueda mostrar.
    if (axios.isAxiosError(error)) {
      const responseData = error.response?.data
      // Admite los formatos habituales de error que pueden responder distintas APIs.
      const responseMessage =
        typeof responseData === 'string'
          ? responseData
          : responseData && typeof responseData === 'object'
            ? responseData.detail ||
              responseData.message ||
              responseData.non_field_errors?.[0] ||
              Object.values(responseData)
                .flat()
                .find((value) => typeof value === 'string')
            : null

      // Prioriza el mensaje enviado por el backend cuando está disponible.
      if (typeof responseMessage === 'string') {
        throw new Error(responseMessage, { cause: error })
      }

      // Distingue los fallos de conexión de las respuestas HTTP de error.
      if (!error.response) {
        throw new Error(
          'No se pudo conectar con el servidor. Verifica que el backend esté activo.',
          { cause: error },
        )
      }
    }

    // Conserva el mensaje original para errores que no sean respuestas de Axios.
    throw new Error(
      error instanceof Error
        ? error.message
        : 'No se pudo iniciar sesión. Inténtalo de nuevo.',
      { cause: error },
    )
  }
}

function LoginForm() {
  // Mantiene los valores del formulario y sus estados de interacción.
  const [role, setRole] = useState('student')
  const [email, setEmail] = useState('estudiante.riquelme@instituto.edu')
  const [password, setPassword] = useState('demo123456')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState(null)

  // Actualiza el perfil, su correo de ejemplo y el mensaje informativo.
  function handleRoleChange(selectedRole) {
    setRole(selectedRole)
    setEmail(
      selectedRole === 'student'
        ? 'estudiante.riquelme@instituto.edu'
        : 'docente.rodriguez@instituto.edu',
    )
    setStatus({
      type: 'info',
      text: `Perfil seleccionado: ${selectedRole === 'student' ? 'Estudiante' : 'Docente'}`,
    })
  }

  // Valida los campos y muestra el resultado de la petición al backend.
  async function handleSubmit(event) {
    event.preventDefault()
    // Evita enviar la solicitud si falta alguna credencial.
    if (!email || !password) {
      setStatus({
        type: 'error',
        text: 'Por favor ingresa tu correo y contraseña.',
      })
      return
    }

    // Activa el indicador de carga y limpia mensajes anteriores.
    setIsLoading(true)
    setStatus(null)

    try {
      // El servicio responde solo si el backend acepta las credenciales.
      await loginUsuario(email, password)
      const firstName = email.split('.')[0] || 'Usuario'
      const formattedName =
        firstName.charAt(0).toUpperCase() + firstName.slice(1)
      setStatus({
        type: 'success',
        text: `¡Acceso concedido, ${formattedName}! Abriendo tus cursos...`,
      })
    } catch (error) {
      // Presenta el mensaje de error devuelto por el servicio.
      setStatus({
        type: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'Error de conexión. Inténtalo de nuevo.',
      })
    } finally {
      // Restablece el botón tanto si la autenticación resulta exitosa como si falla.
      setIsLoading(false)
    }
  }

  return (
    <section className="flex flex-col justify-center p-6 sm:p-8 lg:col-span-7 lg:p-10">
      {/* Presenta el título y la explicación del formulario. */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Iniciar sesión
        </h1>
        <p className="mt-1 text-sm font-normal text-slate-500">
          Ingresa con tu cuenta institucional para comenzar
        </p>
      </div>

      {/* Muestra mensajes de estado y permite cerrarlos. */}
      {status && (
        <div
          aria-live="polite"
          className={`mb-5 flex items-center justify-between rounded-xl border p-3.5 text-sm ${
            status.type === 'error'
              ? 'border-rose-200 bg-rose-50 text-rose-800'
              : status.type === 'info'
                ? 'border-sky-200 bg-sky-50 text-sky-800'
                : 'border-teal-200 bg-teal-50 text-primary'
          }`}
          role="status"
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-xl">
              {status.type === 'error'
                ? 'error'
                : status.type === 'info'
                  ? 'info'
                  : 'check_circle'}
            </span>
            <span className="font-medium">{status.text}</span>
          </div>
          <button
            aria-label="Cerrar notificación"
            className="rounded p-1 hover:opacity-75"
            onClick={() => setStatus(null)}
            type="button"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      )}

      {/* Permite seleccionar el tipo de cuenta y actualiza sus datos iniciales. */}
      <div className="mb-4">
        <div className="grid grid-cols-2 rounded-xl border border-slate-200/60 bg-slate-100/90 p-1">
          <button
            aria-pressed={role === 'student'}
            className={`flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs transition-all sm:text-sm ${
              role === 'student'
                ? 'bg-white font-semibold text-primary shadow-sm'
                : 'font-medium text-slate-500 hover:text-primary'
            }`}
            onClick={() => handleRoleChange('student')}
            type="button"
          >
            <span className="material-symbols-outlined text-lg">school</span>
            <span>Estudiante</span>
          </button>
          <button
            aria-pressed={role === 'faculty'}
            className={`flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs transition-all sm:text-sm ${
              role === 'faculty'
                ? 'bg-white font-semibold text-primary shadow-sm'
                : 'font-medium text-slate-500 hover:text-primary'
            }`}
            onClick={() => handleRoleChange('faculty')}
            type="button"
          >
            <span className="material-symbols-outlined text-lg">
              co_present
            </span>
            <span>Docente</span>
          </button>
        </div>
      </div>

      {/* Recoge las credenciales, preferencias y envía el formulario. */}
      <form className="space-y-4" onSubmit={handleSubmit}>
        {/* Campo de correo asociado al perfil seleccionado. */}
        <div>
          <label
            className="mb-1.5 block text-xs font-semibold text-slate-700 sm:text-sm"
            htmlFor="email"
          >
            Correo
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <span className="material-symbols-outlined text-lg">
                alternate_email
              </span>
            </div>
            <input
              autoComplete="username"
              className="min-h-12 w-full rounded-xl border border-slate-300 bg-slate-50/70 pr-4 pl-11 text-sm text-slate-800 transition-all placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 focus:outline-none sm:text-base"
              id="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder={
                role === 'student'
                  ? 'nombre.apellido@instituto.edu'
                  : 'docente.apellido@instituto.edu'
              }
              required
              type="email"
              value={email}
            />
          </div>
        </div>

        {/* Campo de contraseña, recuperación informativa y control de visibilidad. */}
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
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <span className="material-symbols-outlined text-lg">lock</span>
            </div>
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

        {/* Preferencia para mantener la sesión iniciada. */}
        <div className="flex items-center pt-0.5">
          <label className="flex cursor-pointer select-none items-center gap-2.5">
            <input
              className="size-4 cursor-pointer rounded border-slate-300 accent-primary focus:ring-primary/30"
              defaultChecked
              type="checkbox"
            />
            <span className="text-xs font-medium text-slate-600 sm:text-sm">
              Mantener sesión iniciada
            </span>
          </label>
        </div>

        {/* Envía las credenciales y refleja el estado de carga. */}
        <div className="pt-2">
          <button
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-[#083853] focus:outline-none disabled:opacity-80 sm:text-base"
            disabled={isLoading}
            type="submit"
          >
            {isLoading ? 'Entrando a tus clases...' : 'Ingresar a mis clases →'}
          </button>
        </div>
      </form>
    </section>
  )
}

export default LoginForm
