<template>
  <div class="admin-wrapper">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="brand">
        <img src="../assets/logo_atracciones.png" alt="Logo" class="admin-logo" />
      </div>
      
      <nav class="admin-nav">
        <router-link 
          v-for="item in navItems" 
          :key="item.path" 
          :to="item.path"
          class="nav-item"
          active-class="active"
        >
          <span class="icon">{{ item.icon }}</span>
          <span class="nav-name">{{ item.name }}</span>
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <div class="admin-profile">
          <div class="avatar">{{ auth.user?.firstName?.charAt(0) || 'A' }}</div>
          <div class="profile-info">
            <span class="profile-name">{{ auth.user?.firstName }}</span>
            <span class="profile-role">{{ auth.user?.roles?.join(', ') || 'Staff' }}</span>
          </div>
        </div>
        <button @click="handleLogout" class="logout-btn">
          <span>🚪</span> Salir
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="main-content">
      <header class="top-header">
        <div class="breadcrumb">
          Dashboard / <span class="current-path">{{ currentRouteName }}</span>
        </div>
      </header>

      <section class="content-area">
        <router-view></router-view>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();

const navItems = [
  { name: 'Inicio Dashboard', path: '/admin', icon: '📊' },
  { name: 'Atracciones', path: '/admin/attractions', icon: '🎡' },
  { name: 'Categorías', path: '/admin/categories', icon: '📂' },
  { name: 'Reservas', path: '/admin/bookings', icon: '🎟️' },
  { name: 'Clientes', path: '/admin/clients', icon: '👥' },
];

const currentRouteName = computed(() => {
  const item = navItems.find(i => i.path === route.path);
  return item ? item.name : 'Panel';
});

const handleLogout = () => {
  auth.logout();
  router.push('/login');
};
</script>

<style scoped>
.admin-wrapper {
  display: flex;
  min-height: 100vh;
  background-color: #0f172a; /* Slate 900 */
}

.sidebar {
  width: 280px;
  background-color: #1e293b; /* Slate 800 */
  display: flex;
  flex-direction: column;
  padding: 2rem 0;
  border-right: 1px solid #334155;
  position: fixed;
  height: 100vh;
}

.brand {
  padding: 0 2rem 2rem 2rem;
  border-bottom: 1px solid #334155;
  margin-bottom: 2rem;
}

.admin-logo {
  height: 40px;
  filter: brightness(0) invert(1);
}

.admin-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0 1rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1.25rem;
  text-decoration: none;
  color: #94a3b8;
  border-radius: var(--radius-sm);
  transition: all 0.2s;
  font-weight: 500;
}

.nav-item:hover {
  background-color: #334155;
  color: white;
}

.nav-item.active {
  background-color: var(--primary);
  color: white;
}

.icon {
  font-size: 1.2rem;
}

.sidebar-footer {
  padding: 2rem;
  border-top: 1px solid #334155;
}

.admin-profile {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.avatar {
  width: 40px;
  height: 40px;
  background-color: var(--primary);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
}

.profile-info {
  display: flex;
  flex-direction: column;
}

.profile-name {
  color: white;
  font-weight: 600;
  font-size: 0.9rem;
}

.profile-role {
  color: #94a3b8;
  font-size: 0.75rem;
}

.logout-btn {
  width: 100%;
  padding: 0.75rem;
  background: transparent;
  border: 1px solid #ef4444;
  color: #ef4444;
  border-radius: var(--radius-sm);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-weight: 600;
  transition: all 0.2s;
}

.logout-btn:hover {
  background: #ef4444;
  color: white;
}

.main-content {
  flex: 1;
  margin-left: 280px;
  display: flex;
  flex-direction: column;
}

.top-header {
  height: 70px;
  background-color: #1e293b;
  border-bottom: 1px solid #334155;
  display: flex;
  align-items: center;
  padding: 0 2rem;
}

.breadcrumb {
  color: #94a3b8;
  font-size: 0.9rem;
}

.current-path {
  color: white;
  font-weight: 600;
}

.content-area {
  padding: 2rem;
  flex: 1;
}
</style>
