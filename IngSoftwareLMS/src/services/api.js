import axios from 'axios'

// Dirección base de la API usada por los servicios del frontend.
const API_BASE_URL = 'http://localhost:8000/api/v1'

// Envía las credenciales al endpoint de autenticación del backend.
export async function loginUsuario(email, password) {
  try {
    // Axios serializa las credenciales como JSON y devuelve el cuerpo en response.data.
    const response = await axios.post(`${API_BASE_URL}/usuarios/login/`, {
      email,
      password,
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
