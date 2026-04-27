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

  return { 
    token, 
    user, 
    isAuthenticated, 
    isAdmin, 
    isPartner, 
    isClient,
    canAccessAdmin,
    login, 
    loginAdmin,
    register,
    logout 
  }
})
