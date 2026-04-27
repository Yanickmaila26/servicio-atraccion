<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useDark, useToggle } from '@vueuse/core'
import { SunIcon, MoonIcon, UserIcon, ArrowRightOnRectangleIcon } from '@heroicons/vue/24/outline'

const router = useRouter()
const authStore = useAuthStore()
const isDark = useDark()
const toggleDark = useToggle(isDark)

const handleLogout = () => {
  authStore.logout()
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen bg-background text-text-primary font-sans transition-colors duration-300">
    <!-- Navbar -->
    <nav class="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16 items-center">
          <div class="flex items-center gap-2 cursor-pointer" @click="router.push('/')">
            <div class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">A</div>
            <span class="text-xl font-bold tracking-tight hidden sm:block">Sistema<span class="text-primary">Atracciones</span></span>
          </div>

          <div class="flex items-center gap-4">
            <!-- Theme Toggle -->
            <button 
              @click="toggleDark()" 
              class="p-2 rounded-full hover:bg-surface transition-colors"
              title="Cambiar tema"
            >
              <SunIcon v-if="isDark" class="h-5 w-5 text-yellow-400" />
              <MoonIcon v-else class="h-5 w-5 text-slate-700" />
            </button>

            <!-- Auth Buttons -->
            <template v-if="!authStore.isAuthenticated">
              <button 
                @click="router.push('/login')" 
                class="text-sm font-medium hover:text-primary transition-colors"
              >
                Iniciar Sesión
              </button>
              <button 
                @click="router.push('/register')" 
                class="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition-all shadow-sm"
              >
                Registrarse
              </button>
            </template>
            <template v-else>
              <div class="flex items-center gap-3">
                <span class="text-sm font-medium hidden sm:block">{{ authStore.user?.email }}</span>
                <button 
                  @click="router.push(authStore.canAccessAdmin ? '/admin' : '/')" 
                  class="p-2 bg-surface rounded-full hover:bg-border transition-colors"
                  title="Mi Perfil"
                >
                  <UserIcon class="h-5 w-5" />
                </button>
                <button 
                  @click="handleLogout" 
                  class="p-2 text-text-secondary hover:text-red-500 transition-colors"
                  title="Cerrar Sesión"
                >
                  <ArrowRightOnRectangleIcon class="h-5 w-5" />
                </button>
              </div>
            </template>
          </div>
        </div>
      </div>
    </nav>

    <!-- Content -->
    <main>
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- Footer -->
    <footer class="bg-surface border-t border-border mt-20 py-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p class="text-text-secondary text-sm">© 2026 SistemaAtracciones. Todos los derechos reservados.</p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
