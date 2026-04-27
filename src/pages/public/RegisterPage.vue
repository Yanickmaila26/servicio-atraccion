<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import { EnvelopeIcon, LockClosedIcon, UserIcon, PhoneIcon, IdentificationIcon } from '@heroicons/vue/24/outline'

const router = useRouter()
const authStore = useAuthStore()

const form = ref({
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  phone: '',
  documentType: 'DNI',
  documentNumber: ''
})

const loading = ref(false)
const error = ref('')

async function handleRegister() {
  loading.value = true
  error.value = ''
  try {
    await authStore.register(form.value)
    router.push('/')
  } catch (err) {
    error.value = err.message || 'Error al registrarse'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-[90vh] flex items-center justify-center p-6">
    <div class="w-full max-w-2xl bg-surface border border-border rounded-2xl shadow-xl overflow-hidden">
      <div class="flex flex-col md:flex-row">
        <!-- Sidebar/Image Section -->
        <div class="md:w-1/3 bg-primary p-8 text-white flex flex-col justify-center">
          <h2 class="text-3xl font-bold">Únete a nosotros</h2>
          <p class="mt-4 text-primary-light text-sm">Crea una cuenta para empezar a reservar tus atracciones favoritas.</p>
          <div class="mt-8 space-y-4">
            <div class="flex items-center gap-3 text-sm">
              <div class="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center">✓</div>
              Reservas rápidas
            </div>
            <div class="flex items-center gap-3 text-sm">
              <div class="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center">✓</div>
              Historial de viajes
            </div>
          </div>
        </div>

        <!-- Form Section -->
        <div class="md:w-2/3 p-8">
          <h1 class="text-2xl font-bold text-text-primary mb-6">Crear Cuenta</h1>
          
          <form @submit.prevent="handleRegister" class="space-y-4">
            <div v-if="error" class="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg text-sm text-center">
              {{ error }}
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <BaseInput 
                label="Nombre"
                v-model="form.firstName"
                placeholder="Juan"
                :icon="UserIcon"
                required
              />
              <BaseInput 
                label="Apellido"
                v-model="form.lastName"
                placeholder="Pérez"
                :icon="UserIcon"
                required
              />
            </div>

            <BaseInput 
              label="Correo Electrónico"
              v-model="form.email"
              type="email"
              placeholder="juan@ejemplo.com"
              :icon="EnvelopeIcon"
              required
            />

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <BaseInput 
                label="Teléfono"
                v-model="form.phone"
                placeholder="+593 ..."
                :icon="PhoneIcon"
              />
              <BaseInput 
                label="Nº Documento"
                v-model="form.documentNumber"
                placeholder="1234567890"
                :icon="IdentificationIcon"
              />
            </div>

            <BaseInput 
              label="Contraseña"
              v-model="form.password"
              type="password"
              placeholder="••••••••"
              :icon="LockClosedIcon"
              required
            />

            <div class="pt-4">
              <BaseButton type="submit" class="w-full py-3" :loading="loading">
                Comenzar ahora
              </BaseButton>
            </div>

            <p class="text-center text-sm text-text-secondary">
              ¿Ya tienes una cuenta? 
              <router-link to="/login" class="text-primary font-semibold hover:underline">Inicia Sesión</router-link>
            </p>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
