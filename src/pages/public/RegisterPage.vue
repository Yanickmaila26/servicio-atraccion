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
const fieldErrors = ref({})

function validateForm() {
  const errors = {}
  const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/

  if (!form.value.firstName.trim()) {
    errors.firstName = 'El nombre es requerido'
  } else if (!nameRegex.test(form.value.firstName)) {
    errors.firstName = 'El nombre no debe contener números ni símbolos'
  }

  if (!form.value.lastName.trim()) {
    errors.lastName = 'El apellido es requerido'
  } else if (!nameRegex.test(form.value.lastName)) {
    errors.lastName = 'El apellido no debe contener números ni símbolos'
  }

  if (!form.value.email.trim()) {
    errors.email = 'El correo es requerido'
  } else if (!emailRegex.test(form.value.email)) {
    errors.email = 'Ingrese un correo electrónico válido sin símbolos especiales inválidos'
  }

  // Validación de documento (Cédula vs Pasaporte)
  if (!form.value.documentNumber.trim()) {
    errors.documentNumber = 'El número de documento es requerido'
  } else {
    if (form.value.documentType === 'DNI') {
      if (!/^\d+$/.test(form.value.documentNumber)) {
        errors.documentNumber = 'La cédula debe contener solo números'
      } else if (form.value.documentNumber.length < 10) {
        errors.documentNumber = 'La cédula debe tener al menos 10 dígitos'
      }
    } else if (form.value.documentType === 'Pasaporte') {
      if (!/^[a-zA-Z0-9]+$/.test(form.value.documentNumber)) {
        errors.documentNumber = 'Formato de pasaporte inválido'
      }
    }
  }

  // Validación de contraseña segura
  if (!form.value.password) {
    errors.password = 'La contraseña es requerida'
  } else if (form.value.password.length < 8) {
    errors.password = 'La contraseña debe tener al menos 8 caracteres'
  } else if (!/(?=.*[0-9])(?=.*[a-zA-Z])/.test(form.value.password)) {
    errors.password = 'La contraseña debe incluir letras y números'
  } else if (form.value.password.toLowerCase().includes('admin') || form.value.password.includes('123')) {
    errors.password = 'La contraseña es muy común y poco segura'
  }

  fieldErrors.value = errors
  return Object.keys(errors).length === 0
}

function onlyLetters(e) {
  const char = String.fromCharCode(e.charCode)
  if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]$/.test(char)) e.preventDefault()
}

function onlyNumbers(e) {
  if (!/\d/.test(String.fromCharCode(e.charCode))) e.preventDefault()
}

async function handleRegister() {
  if (!validateForm()) return

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
              <div>
                <BaseInput 
                  label="Nombre"
                  v-model="form.firstName"
                  placeholder="Juan"
                  :icon="UserIcon"
                  :error="fieldErrors.firstName"
                  @keypress="onlyLetters"
                  required
                />
              </div>
              <div>
                <BaseInput 
                  label="Apellido"
                  v-model="form.lastName"
                  placeholder="Pérez"
                  :icon="UserIcon"
                  :error="fieldErrors.lastName"
                  @keypress="onlyLetters"
                  required
                />
              </div>
            </div>

            <BaseInput 
              label="Correo Electrónico"
              v-model="form.email"
              type="email"
              placeholder="juan@ejemplo.com"
              :icon="EnvelopeIcon"
              :error="fieldErrors.email"
              required
            />

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <BaseInput 
                label="Teléfono"
                v-model="form.phone"
                placeholder="+593 ..."
                :icon="PhoneIcon"
                @keypress="onlyNumbers"
              />
              <div class="space-y-1">
                <label class="text-sm font-semibold text-text-primary">Tipo y Nº Documento</label>
                <div class="flex gap-2">
                  <select 
                    v-model="form.documentType"
                    class="bg-background border border-border rounded-xl px-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  >
                    <option value="DNI">DNI</option>
                    <option value="Pasaporte">Pasaporte</option>
                  </select>
                  <BaseInput 
                    v-model="form.documentNumber"
                    placeholder="1234567890"
                    :icon="IdentificationIcon"
                    class="flex-1"
                    :error="fieldErrors.documentNumber"
                    @keypress="form.documentType === 'DNI' ? onlyNumbers($event) : null"
                  />
                </div>
              </div>
            </div>

            <BaseInput 
              label="Contraseña"
              v-model="form.password"
              type="password"
              placeholder="••••••••"
              :icon="LockClosedIcon"
              :error="fieldErrors.password"
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
