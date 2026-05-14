<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import { CheckCircleIcon } from '@heroicons/vue/24/outline'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const token = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')

const loading = ref(false)
const success = ref(false)
const errorMsg = ref('')

onMounted(() => {
  token.value = route.query.token || ''
  email.value = route.query.email || ''
  
  if (!token.value || !email.value) {
    errorMsg.value = 'Enlace de recuperación inválido o expirado.'
  }
})

const handleSubmit = async () => {
  if (password.value.length < 6) {
    errorMsg.value = 'La contraseña debe tener al menos 6 caracteres.'
    return
  }
  if (password.value !== confirmPassword.value) {
    errorMsg.value = 'Las contraseñas no coinciden.'
    return
  }

  errorMsg.value = ''
  loading.value = true
  
  try {
    await authStore.resetPassword({
      email: email.value,
      token: token.value,
      newPassword: password.value
    })
    success.value = true
  } catch (error) {
    errorMsg.value = error.response?.data?.message || 'No se pudo restablecer la contraseña. El enlace puede haber expirado.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <h2 class="mt-6 text-center text-3xl font-black text-text-primary uppercase tracking-tight">
        Nueva Contraseña
      </h2>
      <p class="mt-2 text-center text-sm text-text-secondary">
        Ingresa tu nueva contraseña para acceder a tu cuenta.
      </p>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-surface py-8 px-4 shadow-xl sm:rounded-3xl border border-border sm:px-10">
        
        <div v-if="success" class="text-center space-y-6">
          <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
            <CheckCircleIcon class="h-8 w-8 text-green-600" />
          </div>
          <h3 class="text-xl font-bold text-text-primary">¡Contraseña Actualizada!</h3>
          <p class="text-sm text-text-secondary">
            Tu contraseña ha sido cambiada exitosamente. Ya puedes iniciar sesión con tus nuevas credenciales.
          </p>
          <div class="pt-4 border-t border-border">
            <BaseButton @click="router.push('/login')" class="w-full">
              Ir a Iniciar Sesión
            </BaseButton>
          </div>
        </div>

        <form v-else class="space-y-6" @submit.prevent="handleSubmit">
          <div v-if="errorMsg" class="p-3 bg-red-50 text-red-600 text-sm font-bold rounded-xl border border-red-200">
            {{ errorMsg }}
          </div>

          <BaseInput 
            label="Nueva Contraseña" 
            type="password" 
            v-model="password" 
            placeholder="••••••••" 
            required 
            :disabled="!token || !email"
          />

          <BaseInput 
            label="Confirmar Nueva Contraseña" 
            type="password" 
            v-model="confirmPassword" 
            placeholder="••••••••" 
            required 
            :disabled="!token || !email"
          />

          <div>
            <BaseButton type="submit" class="w-full" :loading="loading" :disabled="!token || !email">
              Actualizar Contraseña
            </BaseButton>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
