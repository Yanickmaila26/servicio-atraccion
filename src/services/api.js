import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://localhost:44362/api/v1', // Ajustar al puerto de la API .NET
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
  (response) => response.data,
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

export default api
