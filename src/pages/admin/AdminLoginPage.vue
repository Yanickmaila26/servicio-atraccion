<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import { EnvelopeIcon, LockClosedIcon, ShieldCheckIcon } from '@heroicons/vue/24/outline'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  loading.value = true
  error.value = ''
  try {
    const credentials = { email: email.value, password: password.value }
    await authStore.loginAdmin(credentials)
    router.push('/admin')
  } catch (err) {
    error.value = err.message || 'Error de acceso administrativo'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-background flex items-center justify-center p-6">
    <div class="w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden">
      <!-- Header -->
      <div class="p-8 text-center bg-primary border-b border-primary-dark text-white">
        <ShieldCheckIcon class="h-12 w-12 mx-auto mb-4" />
        <h1 class="text-2xl font-bold">Panel de Gestión</h1>
        <p class="text-primary-light text-sm mt-2 font-medium">Acceso restringido para personal autorizado</p>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleLogin" class="p-8 space-y-6">
        <div v-if="error" class="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg text-sm text-center font-medium">
          {{ error }}
        </div>

        <BaseInput 
          label="Email Administrativo"
          v-model="email"
          type="email"
          placeholder="admin@sistema.com"
          :icon="EnvelopeIcon"
          required
        />

        <BaseInput 
          label="Contraseña"
          v-model="password"
          type="password"
          placeholder="••••••••"
          :icon="LockClosedIcon"
          required
        />

        <BaseButton type="submit" class="w-full py-4 text-lg" :loading="loading">
          Entrar al Sistema
        </BaseButton>

        <div class="text-center">
          <router-link to="/" class="text-xs text-text-secondary hover:text-primary transition-colors">
            Volver al Portal Público
          </router-link>
        </div>
      </form>
    </div>
  </div>
</template>
