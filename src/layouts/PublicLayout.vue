<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useDark, useToggle } from '@vueuse/core'
import { SunIcon, MoonIcon, UserIcon, ArrowRightOnRectangleIcon, TicketIcon } from '@heroicons/vue/24/outline'

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
          <div class="flex items-center gap-8">
            <div class="flex items-center gap-2 cursor-pointer group" @click="router.push('/')">
              <div class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold group-hover:scale-110 transition-transform">A</div>
              <span class="text-xl font-bold tracking-tight hidden sm:block">Sistema<span class="text-primary">Atracciones</span></span>
            </div>

            <div class="hidden md:flex items-center gap-6">
              <router-link to="/" class="text-sm font-bold text-text-secondary hover:text-primary transition-colors" active-class="text-primary">Inicio</router-link>
              <router-link to="/attractions" class="text-sm font-bold text-text-secondary hover:text-primary transition-colors" active-class="text-primary">Explorar Tours</router-link>
              <router-link v-if="authStore.isAuthenticated && !authStore.canAccessAdmin" to="/my-bookings" class="text-sm font-bold text-text-secondary hover:text-primary transition-colors" active-class="text-primary">Mis Reservas</router-link>
              <router-link v-if="authStore.isAuthenticated && !authStore.canAccessAdmin" to="/my-invoices" class="text-sm font-bold text-text-secondary hover:text-primary transition-colors" active-class="text-primary">Mis Facturas</router-link>
            </div>
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
                  v-if="!authStore.canAccessAdmin"
                  @click="router.push('/my-bookings')" 
                  class="p-2 bg-surface rounded-full hover:bg-border transition-colors text-primary"
                  title="Mis Reservas"
                >
                  <TicketIcon class="h-5 w-5" />
                </button>
                <button 
                  v-if="!authStore.canAccessAdmin"
                  @click="router.push('/my-invoices')" 
                  class="p-2 bg-surface rounded-full hover:bg-border transition-colors text-primary"
                  title="Mis Facturas"
                >
                  <DocumentTextIcon class="h-5 w-5" />
                </button>
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
      <router-view :key="$route.fullPath" />
    </main>

    <!-- Footer -->
    <footer class="bg-surface border-t border-border mt-20 py-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div class="col-span-1 md:col-span-2">
            <div class="flex items-center gap-2 mb-4">
              <div class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">A</div>
              <span class="text-xl font-bold tracking-tight">Sistema<span class="text-primary">Atracciones</span></span>
            </div>
            <p class="text-text-secondary text-sm max-w-xs">Explora las mejores atracciones y tours con la mejor tecnología y seguridad en tus reservas.</p>
          </div>
          
          <div>
            <h4 class="text-sm font-black uppercase tracking-wider text-text-primary mb-4">Explorar</h4>
            <ul class="space-y-2">
              <li><router-link to="/attractions" class="text-sm text-text-secondary hover:text-primary transition-colors">Todos los Tours</router-link></li>
              <li><router-link to="/" class="text-sm text-text-secondary hover:text-primary transition-colors">Destinos Destacados</router-link></li>
            </ul>
          </div>

          <div>
            <h4 class="text-sm font-black uppercase tracking-wider text-text-primary mb-4">Cuenta</h4>
            <ul class="space-y-2">
              <li v-if="authStore.isAuthenticated"><router-link to="/my-bookings" class="text-sm text-text-secondary hover:text-primary transition-colors">Mis Reservas</router-link></li>
              <li v-if="authStore.isAuthenticated"><router-link to="/my-invoices" class="text-sm text-text-secondary hover:text-primary transition-colors">Mis Facturas</router-link></li>
              <li v-else><router-link to="/login" class="text-sm text-text-secondary hover:text-primary transition-colors">Iniciar Sesión</router-link></li>
              <li><router-link to="/register" class="text-sm text-text-secondary hover:text-primary transition-colors">Crear Cuenta</router-link></li>
            </ul>
          </div>

          <div>
            <h4 class="text-sm font-black uppercase tracking-wider text-text-primary mb-4">Administración</h4>
            <ul class="space-y-2">
              <li>
                <button @click="router.push('/admin/login')" class="text-sm text-text-secondary hover:text-primary transition-colors flex items-center gap-1">
                  Portal Administrativo
                </button>
              </li>
            </ul>
          </div>
        </div>
        
        <div class="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p class="text-text-secondary text-xs">© 2026 SistemaAtracciones. Todos los derechos reservados.</p>
          <div class="flex gap-6">
            <a href="#" class="text-xs text-text-secondary hover:text-primary transition-colors">Privacidad</a>
            <a href="#" class="text-xs text-text-secondary hover:text-primary transition-colors">Términos</a>
          </div>
        </div>
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
