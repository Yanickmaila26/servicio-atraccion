import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || null)
  
  let initialUser = null
  try {
    const userStr = localStorage.getItem('user')
    if (userStr && userStr !== 'undefined') {
      initialUser = JSON.parse(userStr)
    }
  } catch (e) {
    console.error('Error parsing user from localStorage', e)
  }
  
  const user = ref(initialUser)

  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.roles?.includes('Admin'))
  const isPartner = computed(() => user.value?.roles?.includes('Partner'))
  const isClient = computed(() => user.value?.roles?.includes('Client'))
  const canAccessAdmin = computed(() => isAdmin.value || isPartner.value)

  // ── JWT Expiry Validation ────────────────────────────────────────────────
  function isTokenExpired() {
    if (!token.value) return true
    try {
      // Decode payload (middle segment of JWT, base64url → base64 → JSON)
      const base64Url = token.value.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const payload = JSON.parse(atob(base64))
      if (!payload.exp) return false
      // exp is in seconds, Date.now() is in ms
      return Date.now() >= payload.exp * 1000
    } catch {
      return true // malformed token → treat as expired
    }
  }

  function checkAndAutoLogout() {
    if (token.value && isTokenExpired()) {
      logout()
      return true // indicates logout was triggered
    }
    return false
  }

  async function login(credentials) {
    try {
      const response = await api.post('/auth/login', credentials)
      setAuth(response)
      return response
    } catch (error) {
      throw error
    }
  }

  async function loginAdmin(credentials) {
    try {
      const response = await api.post('/auth/login-admin', credentials)
      setAuth(response)
      return response
    } catch (error) {
      throw error
    }
  }

  async function register(userData) {
    try {
      const response = await api.post('/auth/register', userData)
      setAuth(response)
      return response
    } catch (error) {
      throw error
    }
  }

  function setAuth(response) {
    token.value = response.accessToken
    user.value = response.user
    localStorage.setItem('token', response.accessToken)
    localStorage.setItem('user', JSON.stringify(response.user))
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  async function updateProfile(data) {
    try {
      const response = await api.put('/auth/profile', data)
      // Update local user data if successful
      if (response.user) {
        user.value = { ...user.value, ...response.user }
        localStorage.setItem('user', JSON.stringify(user.value))
      }
      return response
    } catch (error) {
      throw error
    }
  }

  async function changePassword(data) {
    try {
      const response = await api.put('/auth/change-password', data)
      return response
    } catch (error) {
      throw error
    }
  }

  async function forgotPassword(email) {
    try {
      const response = await api.post('/auth/forgot-password', { email })
      return response
    } catch (error) {
      throw error
    }
  }

  async function resetPassword(data) {
    try {
      const response = await api.post('/auth/reset-password', data)
      return response
    } catch (error) {
      throw error
    }
  }

  return { 
    token, 
    user, 
    isAuthenticated, 
    isAdmin, 
    isPartner, 
    isClient,
    canAccessAdmin,
    isTokenExpired,
    checkAndAutoLogout,
    login, 
    loginAdmin,
    register,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword,
    logout 
  }
})
