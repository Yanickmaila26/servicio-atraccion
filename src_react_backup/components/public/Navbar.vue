<template>
  <nav class="navbar" :class="{ 'navbar-scrolled': scrolled }">
    <div class="container">
      <div class="navbar-brand">
        <router-link to="/">
          <img src="../../assets/logo_atracciones.png" alt="Logo" class="logo" />
        </router-link>
      </div>

      <div class="navbar-links">
        <router-link to="/" class="nav-link">Inicio</router-link>
        <router-link to="/catalog" class="nav-link">Atracciones</router-link>
        
        <template v-if="auth.isAuthenticated">
          <router-link to="/client/bookings" class="nav-link">Mis Reservas</router-link>
          <div class="user-menu">
            <span class="user-name">Hola, {{ auth.user?.firstName }}</span>
            <button @click="handleLogout" class="btn-logout">Cerrar Sesión</button>
          </div>
        </template>
        
        <template v-else>
          <router-link to="/login" class="btn-login">Iniciar Sesión</router-link>
          <router-link to="/register" class="btn-register">Registrarse</router-link>
        </template>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';

const auth = useAuthStore();
const router = useRouter();
const scrolled = ref(false);

const handleScroll = () => {
  scrolled.value = window.scrollY > 50;
};

const handleLogout = () => {
  auth.logout();
  router.push('/login');
};

onMounted(() => window.addEventListener('scroll', handleScroll));
onUnmounted(() => window.removeEventListener('scroll', handleScroll));
</script>

<style scoped>
.navbar {
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 1000;
  padding: 1.5rem 0;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  background: transparent;
}

.navbar-scrolled {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  padding: 1rem 0;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.05);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 2rem;
}

.logo {
  height: 45px;
  transition: transform 0.3s;
}

.navbar-links {
  display: flex;
  gap: 2.5rem;
  align-items: center;
}

.nav-link {
  text-decoration: none;
  color: var(--text-primary);
  font-weight: 600;
  font-size: 0.95rem;
  transition: color 0.3s;
}

.nav-link:hover {
  color: var(--primary);
}

.btn-login {
  text-decoration: none;
  color: var(--primary);
  font-weight: 700;
  font-size: 0.95rem;
}

.btn-register {
  text-decoration: none;
  background: var(--primary);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-sm);
  font-weight: 700;
  box-shadow: 0 4px 15px rgba(30, 136, 229, 0.3);
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-name {
  font-weight: 600;
  color: var(--text-secondary);
}

.btn-logout {
  background: transparent;
  border: 1px solid #e2e8f0;
  padding: 0.5rem 1rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-weight: 600;
}
</style>
