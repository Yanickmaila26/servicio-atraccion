<script setup>
import { computed } from 'vue'
import { Bars3Icon, MoonIcon, SunIcon, BellIcon, ArrowRightOnRectangleIcon } from '@heroicons/vue/24/outline'
import { useDark, useToggle } from '@vueuse/core'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const emit = defineEmits(['toggle-sidebar'])

const isDark = useDark({
  selector: 'html',
  attribute: 'class',
  valueDark: 'dark',
  valueLight: 'light',
})
const toggleDark = useToggle(isDark)

const authStore = useAuthStore()
const userInitials = computed(() => {
  if (!authStore.user?.email) return 'U'
  return authStore.user.email.charAt(0).toUpperCase()
})

const router = useRouter()
const handleLogout = () => {
  authStore.logout()
  router.push('/')
}
</script>

<template>
  <header class="h-16 bg-background border-b border-border flex items-center justify-between px-4 sm:px-6 z-10 transition-colors">
    <div class="flex items-center gap-4">
      <button 
        @click="emit('toggle-sidebar')"
        class="text-text-secondary hover:text-text-primary focus:outline-none p-1 rounded-md hover:bg-surface transition-colors"
      >
        <Bars3Icon class="h-6 w-6" />
      </button>
      <h1 class="text-xl font-semibold text-text-primary hidden sm:block">
        {{ $route.name === 'Dashboard' ? 'Panel de Control' : $route.name }}
      </h1>
    </div>

    <div class="flex items-center gap-4">
      <!-- Dark mode toggle -->
      <button 
        @click="toggleDark()"
        class="text-text-secondary hover:text-text-primary p-2 rounded-full hover:bg-surface transition-colors focus:outline-none"
      >
        <SunIcon v-if="isDark" class="h-5 w-5" />
        <MoonIcon v-else class="h-5 w-5" />
      </button>

      <!-- Notifications -->
      <button class="text-text-secondary hover:text-text-primary p-2 rounded-full hover:bg-surface transition-colors focus:outline-none relative">
        <BellIcon class="h-5 w-5" />
        <span class="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500"></span>
      </button>

      <!-- User Profile -->
      <div class="flex items-center gap-3 border-l border-border pl-4 ml-2">
        <div class="flex flex-col items-end hidden sm:flex">
          <span class="text-sm font-medium text-text-primary">{{ authStore.user?.email }}</span>
          <span class="text-[10px] font-bold text-primary uppercase tracking-wider">{{ authStore.user?.roles?.[0] }}</span>
        </div>
        <div class="h-9 w-9 rounded-full bg-primary text-white flex items-center justify-center font-bold shadow-soft">
          {{ userInitials }}
        </div>
        
        <button 
          @click="handleLogout" 
          class="p-2 text-text-secondary hover:text-red-500 transition-colors focus:outline-none"
          title="Cerrar Sesión"
        >
          <ArrowRightOnRectangleIcon class="h-5 w-5" />
        </button>
      </div>
    </div>
  </header>
</template>
