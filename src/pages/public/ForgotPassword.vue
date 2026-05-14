<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import { ArrowLeftIcon, EnvelopeIcon } from '@heroicons/vue/24/outline'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const loading = ref(false)
const success = ref(false)
const devToken = ref('')
const errorMsg = ref('')

const handleSubmit = async () => {
  errorMsg.value = ''
  loading.value = true
  try {
    const response = await authStore.forgotPassword(email.value)
    // Extraer token temporal para entorno de desarrollo
    if (response && response.dev_token_temporal) {
      devToken.value = response.dev_token_temporal
    }
    success.value = true
  } catch (error) {
    errorMsg.value = error.response?.data?.message || 'Hubo un error al procesar tu solicitud.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <h2 class="mt-6 text-center text-3xl font-black text-text-primary uppercase tracking-tight">
        Recuperar Cuenta
      </h2>
      <p class="mt-2 text-center text-sm text-text-secondary">
        Ingresa tu correo para recibir un enlace de recuperación.
      </p>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-surface py-8 px-4 shadow-xl sm:rounded-3xl border border-border sm:px-10">
        
        <div v-if="success" class="text-center space-y-6">
          <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
            <EnvelopeIcon class="h-8 w-8 text-green-600" />
          </div>
          <h3 class="text-xl font-bold text-text-primary">¡Correo Enviado!</h3>
          <p class="text-sm text-text-secondary">
            Si el correo <strong>{{ email }}</strong> está registrado, recibirías instrucciones (simuladas por ahora).
          </p>
          <div v-if="devToken" class="p-4 bg-yellow-50 border border-yellow-200 rounded-xl mt-4">
            <p class="text-xs text-yellow-800 font-bold mb-2">Entorno de Desarrollo: Correo Simulado</p>
            <BaseButton @click="router.push(`/reset-password?token=${devToken}&email=${email}`)" class="w-full">
              Simular click en el correo
            </BaseButton>
          </div>
          <div class="pt-4 border-t border-border">
            <button @click="router.push('/login')" class="font-bold text-primary hover:text-primary-dark transition-colors">
              Volver al inicio de sesión
            </button>
          </div>
        </div>

        <form v-else class="space-y-6" @submit.prevent="handleSubmit">
          <div v-if="errorMsg" class="p-3 bg-red-50 text-red-600 text-sm font-bold rounded-xl border border-red-200">
            {{ errorMsg }}
          </div>

          <BaseInput 
            label="Correo Electrónico" 
            type="email" 
            v-model="email" 
            placeholder="ejemplo@correo.com" 
            required 
          />

          <div>
            <BaseButton type="submit" class="w-full" :loading="loading">
              Enviar Enlace
            </BaseButton>
          </div>

          <div class="mt-6 text-center">
            <button type="button" @click="router.push('/login')" class="text-sm font-bold text-text-secondary hover:text-primary transition-colors flex items-center justify-center gap-2 mx-auto">
              <ArrowLeftIcon class="h-4 w-4" />
              Volver al inicio de sesión
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
