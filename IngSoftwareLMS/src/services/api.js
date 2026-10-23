import axios from 'axios'

// 1. Crear la instancia base
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1/',
});

// 2. Interceptor de Petición: Inyectar Access Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// 3. Interceptor de Respuesta: Rotación de Refresh Token
api.interceptors.response.use((response) => response, async (error) => {
  const originalRequest = error.config;

  // Si da error 401 (Unauthorized) y no es un reintento previo
  if (error.response?.status === 401 && !originalRequest._retry) {
    originalRequest._retry = true;
    
    try {
      const refreshToken = localStorage.getItem('refresh');
      // Hacer petición al endpoint de refresco
      const { data } = await axios.post('http://localhost:8000/api/v1/usuarios/refresh/', {
        refresh: refreshToken
      });
      
      // Guardar el nuevo access token y actualizar la cabecera
      localStorage.setItem('access', data.access);
      originalRequest.headers.Authorization = `Bearer ${data.access}`;
      
      // Disparar nuevamente la petición original que había fallado
      return api(originalRequest);
    } catch (refreshError) {
      // Si el refresh token también expiró, limpiar sesión y redirigir al login
      localStorage.removeItem('access');
      localStorage.removeItem('refresh');
      window.location.href = '/login';
      return Promise.reject(refreshError);
    }
  }
  
  return Promise.reject(error);
});

export default api;
