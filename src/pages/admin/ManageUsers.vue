<script setup>
import { ref, onMounted } from 'vue'
import userService from '@/services/users'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import Swal from 'sweetalert2'
import { 
  UsersIcon, 
  UserPlusIcon, 
  TrashIcon, 
  ShieldCheckIcon, 
  IdentificationIcon,
  EnvelopeIcon,
  LockClosedIcon,
  TagIcon
} from '@heroicons/vue/24/outline'

const users = ref([])
const loading = ref(true)
const showModal = ref(false)
const submitting = ref(false)

const newUser = ref({
  email: '',
  password: '',
  name: '',
  role: 'Partner'
})

const fetchUsers = async () => {
  loading.value = true
  try {
    const data = await userService.getUsers({ pageSize: 50 })
    users.value = data.items || []
  } catch (error) {
    console.error(error)
    Swal.fire('Error', 'No se pudieron cargar los usuarios.', 'error')
  } finally {
    loading.value = false
  }
}

const handleCreateUser = async () => {
  submitting.value = true
  try {
    await userService.createUser(newUser.value)
    Swal.fire('Éxito', 'Usuario creado correctamente.', 'success')
    showModal.value = false
    newUser.value = { email: '', password: '', name: '', role: 'Partner' }
    fetchUsers()
  } catch (error) {
    Swal.fire('Error', error.message || 'No se pudo crear el usuario.', 'error')
  } finally {
    submitting.value = false
  }
}

const toggleStatus = async (user) => {
  try {
    const newStatus = !user.isActive
    await userService.updateStatus(user.id, newStatus)
    user.isActive = newStatus
    Swal.fire({
      icon: 'success',
      title: newStatus ? 'Usuario Activado' : 'Usuario Desactivado',
      timer: 1500,
      showConfirmButton: false
    })
  } catch (error) {
    Swal.fire('Error', 'No se pudo cambiar el estado.', 'error')
  }
}

const handleDelete = async (user) => {
  const result = await Swal.fire({
    title: '¿Estás seguro?',
    text: `Eliminarás al usuario ${user.email}. Esta acción es irreversible.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  })

  if (result.isConfirmed) {
    try {
      await userService.deleteUser(user.id)
      Swal.fire('Eliminado', 'El usuario ha sido eliminado.', 'success')
      fetchUsers()
    } catch (error) {
      Swal.fire('Error', 'No se pudo eliminar el usuario.', 'error')
    }
  }
}

onMounted(fetchUsers)
</script>

<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <div>
        <h2 class="text-2xl font-bold text-text-primary">Gestión de Usuarios</h2>
        <p class="text-text-secondary mt-1">Administra los accesos de administradores y partners.</p>
      </div>
      <BaseButton @click="showModal = true" class="flex items-center gap-2">
        <UserPlusIcon class="h-5 w-5" />
        Nuevo Usuario
      </BaseButton>
    </div>

    <!-- Table -->
    <div class="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
      <div v-if="loading" class="flex justify-center py-12">
        <div class="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
      
      <div v-else-if="users.length === 0" class="text-center py-12">
        <UsersIcon class="h-12 w-12 text-text-secondary mx-auto mb-4 opacity-20" />
        <p class="text-text-secondary">No hay usuarios registrados aparte de ti.</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-border">
          <thead class="bg-background">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Nombre / Email</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Rol</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Estado</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Creado el</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody class="bg-surface divide-y divide-border">
            <tr v-for="user in users" :key="user.id" class="hover:bg-background/50 transition-colors">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                    {{ user.name.charAt(0).toUpperCase() }}
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-text-primary">{{ user.name }}</div>
                    <div class="text-xs text-text-secondary">{{ user.email }}</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span 
                  class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full"
                  :class="user.role === 'Admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'"
                >
                  {{ user.role }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <button 
                  @click="toggleStatus(user)"
                  class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                  :class="user.isActive ? 'bg-green-500' : 'bg-gray-200'"
                >
                  <span 
                    class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                    :class="user.isActive ? 'translate-x-5' : 'translate-x-0'"
                  ></span>
                </button>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                {{ new Date(user.createdAt).toLocaleDateString() }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button @click="handleDelete(user)" class="text-red-500 hover:text-red-700 transition-colors">
                  <TrashIcon class="h-5 w-5" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Create User -->
    <div v-if="showModal" class="fixed inset-0 z-50 overflow-y-auto">
      <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 transition-opacity" aria-hidden="true" @click="showModal = false">
          <div class="absolute inset-0 bg-black opacity-50"></div>
        </div>

        <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div class="inline-block align-bottom bg-surface rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-border">
          <div class="bg-surface px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div class="sm:flex sm:items-start">
              <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 sm:mx-0 sm:h-10 sm:w-10">
                <UserPlusIcon class="h-6 w-6 text-primary" />
              </div>
              <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 class="text-lg leading-6 font-bold text-text-primary">Nuevo Usuario Administrativo</h3>
                <div class="mt-4 space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-text-secondary mb-1">Email</label>
                    <div class="relative">
                      <EnvelopeIcon class="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary/50" />
                      <input 
                        v-model="newUser.email" 
                        type="email" 
                        class="w-full bg-background border border-border rounded-xl py-2.5 pl-10 pr-4 text-text-primary focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        placeholder="ejemplo@correo.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-text-secondary mb-1">Nombre Completo</label>
                    <div class="relative">
                      <IdentificationIcon class="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary/50" />
                      <input 
                        v-model="newUser.name" 
                        type="text" 
                        class="w-full bg-background border border-border rounded-xl py-2.5 pl-10 pr-4 text-text-primary focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        placeholder="Juan Pérez"
                      />
                    </div>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-text-secondary mb-1">Contraseña</label>
                    <div class="relative">
                      <LockClosedIcon class="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary/50" />
                      <input 
                        v-model="newUser.password" 
                        type="password" 
                        class="w-full bg-background border border-border rounded-xl py-2.5 pl-10 pr-4 text-text-primary focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-text-secondary mb-1">Rol en el sistema</label>
                    <div class="grid grid-cols-2 gap-4">
                      <button 
                        @click="newUser.role = 'Partner'"
                        class="flex flex-col items-center p-3 border-2 rounded-xl transition-all"
                        :class="newUser.role === 'Partner' ? 'border-primary bg-primary/5' : 'border-border hover:border-text-secondary/30'"
                      >
                        <TagIcon class="h-6 w-6 mb-1" :class="newUser.role === 'Partner' ? 'text-primary' : 'text-text-secondary'" />
                        <span class="text-sm font-bold" :class="newUser.role === 'Partner' ? 'text-primary' : 'text-text-primary'">Partner</span>
                        <span class="text-[10px] text-text-secondary">Gestión de atracciones</span>
                      </button>
                      
                      <button 
                        @click="newUser.role = 'Admin'"
                        class="flex flex-col items-center p-3 border-2 rounded-xl transition-all"
                        :class="newUser.role === 'Admin' ? 'border-primary bg-primary/5' : 'border-border hover:border-text-secondary/30'"
                      >
                        <ShieldCheckIcon class="h-6 w-6 mb-1" :class="newUser.role === 'Admin' ? 'text-primary' : 'text-text-secondary'" />
                        <span class="text-sm font-bold" :class="newUser.role === 'Admin' ? 'text-primary' : 'text-text-primary'">Admin</span>
                        <span class="text-[10px] text-text-secondary">Control total</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="bg-background px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-3">
            <BaseButton @click="handleCreateUser" :loading="submitting">Crear Usuario</BaseButton>
            <BaseButton variant="outline" @click="showModal = false">Cancelar</BaseButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-spin {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
