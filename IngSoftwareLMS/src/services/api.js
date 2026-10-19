import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000/api/v1'

// Envía las credenciales al endpoint de autenticación del backend.
export async function loginUsuario(email, password) {
  try {
    const response = await axios.post(`${API_BASE_URL}/usuarios/login/`, {
      email,
      password,
    })

    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const responseData = error.response?.data
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

      if (typeof responseMessage === 'string') {
        throw new Error(responseMessage, { cause: error })
      }

      if (!error.response) {
        throw new Error(
          'No se pudo conectar con el servidor. Verifica que el backend esté activo.',
          { cause: error },
        )
      }
    }

    throw new Error(
      error instanceof Error
        ? error.message
        : 'No se pudo iniciar sesión. Inténtalo de nuevo.',
      { cause: error },
    )
  }
}
