<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { HomeIcon, TicketIcon, UsersIcon, MapPinIcon, MapIcon, TagIcon, ArrowRightOnRectangleIcon, CheckCircleIcon, CalendarDaysIcon, BanknotesIcon } from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  isOpen: { type: Boolean, default: true }
})

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

const navigation = [
  { name: 'Dashboard', route: 'Dashboard', icon: HomeIcon },
  { name: 'Atracciones', route: 'ManageAttractions', icon: MapPinIcon },
  { name: 'Calendario', route: 'ManageSchedule', icon: CalendarDaysIcon },
  { name: 'Punto de Venta', route: 'PosTerminal', icon: BanknotesIcon },
  { name: 'Categorías', route: 'ManageCategories', icon: TagIcon, roles: ['Admin'] },
  { name: 'Ubicaciones', route: 'ManageLocations', icon: MapIcon, roles: ['Admin'] },
  { name: 'Etiquetas', route: 'ManageTags', icon: TagIcon, roles: ['Admin'] },
  { name: 'Inclusiones', route: 'ManageInclusions', icon: CheckCircleIcon, roles: ['Admin'] },
  { name: 'Usuarios', route: 'ManageClients', icon: UsersIcon, roles: ['Admin'] },
  { name: 'Reservas', route: 'ManageBookings', icon: TicketIcon },
].filter(item => !item.roles || item.roles.includes(authStore.user?.roles?.[0]))

const handleLogout = () => {
  authStore.logout()
  router.push({ name: 'Home' })
}
</script>

<template>
  <aside 
    class="bg-background border-r border-border transition-all duration-300 flex flex-col"
    :class="isOpen ? 'w-64' : 'w-20'"
  >
    <!-- Logo Area -->
    <div class="h-16 flex items-center justify-center border-b border-border px-4">
      <div v-if="isOpen" class="font-bold text-xl text-primary truncate">SistemaAtracciones</div>
      <div v-else class="font-bold text-xl text-primary">SA</div>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 overflow-y-auto py-4">
      <ul class="space-y-1 px-3">
        <li v-for="item in navigation" :key="item.name">
          <router-link 
            :to="{ name: item.route }"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group relative"
            :class="[
              route.name === item.route 
                ? 'bg-primary/10 text-primary font-medium' 
                : 'text-text-secondary hover:bg-surface hover:text-text-primary'
            ]"
          >
            <component :is="item.icon" class="h-6 w-6 shrink-0" />
            <span v-if="isOpen" class="truncate">{{ item.name }}</span>
            
            <!-- Tooltip for collapsed state -->
            <div v-if="!isOpen" class="absolute left-14 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
              {{ item.name }}
            </div>
          </router-link>
        </li>
      </ul>
    </nav>

    <!-- User Profile Info -->
    <div class="p-4 border-t border-border">
      <div class="flex items-center gap-3 px-3 py-2">
        <div class="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
          {{ authStore.user?.email?.charAt(0).toUpperCase() }}
        </div>
        <div v-if="isOpen" class="ml-1 overflow-hidden">
          <p class="text-sm font-medium text-text-primary truncate">
            {{ authStore.user?.email }}
          </p>
          <p class="text-[10px] font-bold text-primary uppercase tracking-wider">
            {{ authStore.user?.roles?.[0] || 'Usuario' }}
          </p>
        </div>
      </div>
    </div>

    <!-- Logout -->
    <div class="p-4 border-t border-border">
      <button 
        @click="handleLogout"
        class="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-text-secondary hover:bg-red-50 hover:text-red-600 transition-colors dark:hover:bg-red-900/20 dark:hover:text-red-400 group relative"
      >
        <ArrowRightOnRectangleIcon class="h-6 w-6 shrink-0" />
        <span v-if="isOpen" class="truncate">Cerrar Sesión</span>
        
        <div v-if="!isOpen" class="absolute left-14 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
          Cerrar Sesión
        </div>
      </button>
    </div>
  </aside>
</template>
