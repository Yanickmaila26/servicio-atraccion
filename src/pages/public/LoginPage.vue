<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import { EnvelopeIcon, LockClosedIcon, UserIcon, ShieldCheckIcon } from '@heroicons/vue/24/outline'

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
    await authStore.login(credentials)
    router.push('/')
  } catch (err) {
    error.value = err.message || 'Credenciales inválidas'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-[80vh] flex items-center justify-center p-6">
    <div class="w-full max-w-md bg-surface border border-border rounded-2xl shadow-xl overflow-hidden">
      <!-- Header -->
      <div class="p-8 text-center bg-primary/5 border-b border-border">
        <h1 class="text-2xl font-bold text-text-primary">¡Bienvenido!</h1>
        <p class="text-text-secondary text-sm mt-2">Inicia sesión como cliente para reservar tus atracciones</p>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleLogin" class="p-8 space-y-5">
        <div v-if="error" class="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg text-sm text-center">
          {{ error }}
        </div>

        <BaseInput 
          label="Correo Electrónico"
          v-model="email"
          type="email"
          placeholder="ejemplo@correo.com"
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

        <div class="flex items-center justify-end">
          <a href="#" class="text-xs text-primary hover:underline">¿Olvidaste tu contraseña?</a>
        </div>

        <BaseButton type="submit" class="w-full py-3" :loading="loading">
          Iniciar Sesión
        </BaseButton>

        <p class="text-center text-sm text-text-secondary pt-4">
          ¿No tienes una cuenta? 
          <router-link to="/register" class="text-primary font-semibold hover:underline">Regístrate</router-link>
        </p>
      </form>
    </div>
  </div>
</template>
