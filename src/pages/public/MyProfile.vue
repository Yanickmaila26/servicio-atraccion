<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import Swal from 'sweetalert2'

const authStore = useAuthStore()

const activeTab = ref('profile')

const profileForm = ref({
  name: '',
  email: '',
  phoneNumber: ''
})

const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const loadingProfile = ref(false)
const loadingPassword = ref(false)

onMounted(() => {
  if (authStore.user) {
    profileForm.value = {
      name: authStore.user.name || '',
      email: authStore.user.email || '',
      phoneNumber: authStore.user.phoneNumber || ''
    }
  }
})

const handleProfileUpdate = async () => {
  loadingProfile.value = true
  try {
    await authStore.updateProfile(profileForm.value)
    Swal.fire('Éxito', 'Perfil actualizado correctamente.', 'success')
  } catch (error) {
    console.error(error)
    Swal.fire('Error', error.response?.data?.message || 'Hubo un error al actualizar el perfil.', 'error')
  } finally {
    loadingProfile.value = false
  }
}

const handlePasswordChange = async () => {
  if (passwordForm.value.newPassword.length < 6) {
    return Swal.fire('Error', 'La nueva contraseña debe tener al menos 6 caracteres.', 'error')
  }
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    return Swal.fire('Error', 'Las contraseñas nuevas no coinciden.', 'error')
  }

  loadingPassword.value = true
  try {
    await authStore.changePassword({
      currentPassword: passwordForm.value.currentPassword,
      newPassword: passwordForm.value.newPassword
    })
    Swal.fire('Éxito', 'Contraseña cambiada correctamente.', 'success')
    passwordForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' }
  } catch (error) {
    console.error(error)
    Swal.fire('Error', error.response?.data?.message || 'Hubo un error al cambiar la contraseña.', 'error')
  } finally {
    loadingPassword.value = false
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
    <div class="bg-surface rounded-3xl shadow-xl overflow-hidden border border-border">
      <div class="flex flex-col md:flex-row h-full min-h-[600px]">
        <!-- Sidebar Tabs -->
        <div class="md:w-64 bg-background border-r border-border p-6 shrink-0">
          <h2 class="text-2xl font-black text-text-primary tracking-tight mb-6 uppercase">Mi Cuenta</h2>
          <nav class="space-y-2">
            <button 
              @click="activeTab = 'profile'"
              class="w-full text-left px-4 py-3 rounded-xl font-bold transition-all text-sm"
              :class="activeTab === 'profile' ? 'bg-primary text-white shadow-md' : 'text-text-secondary hover:bg-surface hover:text-primary'"
            >
              Datos Personales
            </button>
            <button 
              @click="activeTab = 'password'"
              class="w-full text-left px-4 py-3 rounded-xl font-bold transition-all text-sm"
              :class="activeTab === 'password' ? 'bg-primary text-white shadow-md' : 'text-text-secondary hover:bg-surface hover:text-primary'"
            >
              Seguridad
            </button>
          </nav>
        </div>

        <!-- Content Area -->
        <div class="flex-1 p-8 sm:p-12">
          
          <!-- Profile Tab -->
          <div v-if="activeTab === 'profile'" class="animate-in fade-in slide-in-from-right-4 duration-300">
            <div class="mb-8 border-b border-border pb-4">
              <h3 class="text-2xl font-black text-text-primary tracking-tight">Datos Personales</h3>
              <p class="text-text-secondary text-sm mt-1">Actualiza tu información personal y de contacto.</p>
            </div>
            
            <form @submit.prevent="handleProfileUpdate" class="space-y-6 max-w-lg">
              <BaseInput 
                label="Nombre Completo" 
                v-model="profileForm.name" 
                placeholder="Ej. Juan Pérez" 
                required 
              />
              
              <BaseInput 
                label="Correo Electrónico" 
                type="email" 
                v-model="profileForm.email" 
                placeholder="ejemplo@correo.com" 
                required 
              />
              <p class="text-[10px] text-text-secondary -mt-4 ml-1">Nota: Si cambias el correo, deberá ser único en el sistema.</p>
              
              <BaseInput 
                label="Teléfono" 
                type="tel" 
                v-model="profileForm.phoneNumber" 
                placeholder="+593 99 999 9999" 
              />
              
              <div class="pt-4 border-t border-border">
                <BaseButton type="submit" :loading="loadingProfile" class="w-full sm:w-auto">
                  Guardar Cambios
                </BaseButton>
              </div>
            </form>
          </div>

          <!-- Password Tab -->
          <div v-if="activeTab === 'password'" class="animate-in fade-in slide-in-from-right-4 duration-300">
            <div class="mb-8 border-b border-border pb-4">
              <h3 class="text-2xl font-black text-text-primary tracking-tight">Cambiar Contraseña</h3>
              <p class="text-text-secondary text-sm mt-1">Asegura tu cuenta utilizando una contraseña fuerte.</p>
            </div>
            
            <form @submit.prevent="handlePasswordChange" class="space-y-6 max-w-lg">
              <BaseInput 
                label="Contraseña Actual" 
                type="password" 
                v-model="passwordForm.currentPassword" 
                placeholder="••••••••" 
                required 
              />
              
              <div class="pt-4 space-y-6">
                <BaseInput 
                  label="Nueva Contraseña" 
                  type="password" 
                  v-model="passwordForm.newPassword" 
                  placeholder="••••••••" 
                  required 
                />
                
                <BaseInput 
                  label="Confirmar Nueva Contraseña" 
                  type="password" 
                  v-model="passwordForm.confirmPassword" 
                  placeholder="••••••••" 
                  required 
                />
              </div>
              
              <div class="pt-4 border-t border-border">
                <BaseButton type="submit" :loading="loadingPassword" class="w-full sm:w-auto">
                  Actualizar Contraseña
                </BaseButton>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>
