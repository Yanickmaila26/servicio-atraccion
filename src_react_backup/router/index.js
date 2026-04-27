import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

// Layouts
import AdminLayout from '../layouts/AdminLayout.vue';
import PublicLayout from '../layouts/PublicLayout.vue';

// Pages (Public)
import HomePage from '../pages/public/HomePage.vue';
import LoginPage from '../pages/public/LoginPage.vue';
import RegisterPage from '../pages/public/RegisterPage.vue';

// Pages (Admin)
import AdminLoginPage from '../pages/admin/AdminLoginPage.vue';
import AdminDashboard from '../pages/admin/AdminDashboard.vue';
import ManageAttractions from '../pages/admin/ManageAttractions.vue';
import ManageCategories from '../pages/admin/ManageCategories.vue';
import ManageBookings from '../pages/admin/ManageBookings.vue';
import ManageClients from '../pages/admin/ManageClients.vue';

// Pages (Client)
import MyBookingsPage from '../pages/client/MyBookingsPage.vue';

const routes = [
  {
    path: '/admin/login',
    name: 'AdminLogin',
    component: AdminLoginPage
  },
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAuth: true, roles: ['Admin', 'Partner'] },
    children: [
      { path: '', name: 'AdminDashboard', component: AdminDashboard },
      { path: 'attractions', name: 'ManageAttractions', component: ManageAttractions },
      { path: 'categories', name: 'ManageCategories', component: ManageCategories },
      { path: 'bookings', name: 'ManageBookings', component: ManageBookings },
      { path: 'clients', name: 'ManageClients', component: ManageClients },
    ]
  },
  {
    path: '/',
    component: PublicLayout,
    children: [
      { path: '', name: 'Home', component: HomePage },
      { path: 'login', name: 'Login', component: LoginPage },
      { path: 'register', name: 'Register', component: RegisterPage },
      { 
        path: 'client/bookings', 
        name: 'MyBookings', 
        component: MyBookingsPage,
        meta: { requiresAuth: true, roles: ['Client'] }
      },
    ]
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Navigation Guard
router.beforeEach((to, from, next) => {
  const auth = useAuthStore();
  
  if (to.meta.requiresAuth) {
    if (!auth.isAuthenticated) {
      const isDashboardRoute = to.path.startsWith('/admin');
      return next({ name: isDashboardRoute ? 'AdminLogin' : 'Login' });
    }
    
    if (to.meta.roles && !auth.hasRole(to.meta.roles)) {
      const isDashboardRoute = to.path.startsWith('/admin');
      return next({ name: isDashboardRoute ? 'AdminLogin' : 'Login' });
    }
  }
  
  next();
});

export default router;
