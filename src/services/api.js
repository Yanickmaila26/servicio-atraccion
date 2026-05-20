import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

// En producción usa la URL completa del env. En local dev puede ser un path relativo
// para que el proxy de Vite intercepte la petición y evite CORS.
let baseUrl = import.meta.env.VITE_API_BASE_URL || ''

// Fallback al monolito antiguo si no está configurado
if (!baseUrl) {
  baseUrl = 'https://servicioatraccionapi20260428073304-c5fpe4fja8hvetc0.canadacentral-01.azurewebsites.net/api/v1/yanick-maila'
}

// Si es URL absoluta y no termina en /yanick-maila, lo agrega automáticamente
if (baseUrl.startsWith('http') && !baseUrl.endsWith('/yanick-maila')) {
  baseUrl = baseUrl.replace(/\/$/, '') + '/yanick-maila'
}

const api = axios.create({
  baseURL: baseUrl,
  headers: {
    'Content-Type': 'application/json',
  }
})

api.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore()
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => {
    // Si la respuesta tiene el formato estándar { success, data, message, errors }
    if (response.data && Object.prototype.hasOwnProperty.call(response.data, 'success')) {
      return response.data.data
    }
    return response.data
  },
  (error) => {
    const response = error.response
    const authStore = useAuthStore()

    if (response?.status === 401) {
      authStore.logout()
      window.location.href = '/admin/login'
      return Promise.reject(new Error('Sesión expirada'))
    }

    // Manejo de errores de validación de .NET (400 Bad Request)
    if (response?.status === 400 && response.data?.errors) {
      const validationErrors = response.data.errors
      const messages = Object.keys(validationErrors).map(key => {
        const fieldMessages = validationErrors[key].join(', ')
        return `${key}: ${fieldMessages}`
      })
      return Promise.reject(new Error(messages.join('\n')))
    }

    const errorMessage = response?.data?.message || response?.data?.title || 'Ocurrió un error inesperado'
    return Promise.reject(new Error(errorMessage))
  }
)

export { baseUrl }
export default api
