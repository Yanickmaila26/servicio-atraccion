import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('@/pages/admin/Dashboard.vue')
      },
      {
        path: 'attractions',
        name: 'ManageAttractions',
        component: () => import('@/pages/admin/ManageAttractions.vue')
      },
      {
        path: 'attractions/create-complete',
        name: 'CreateAttractionComplete',
        component: () => import('@/pages/admin/CreateAttractionComplete.vue')
      },
      {
        path: 'attractions/:id/modalities',
        name: 'ManageModalities',
        component: () => import('@/pages/admin/ManageModalities.vue')
      },
      {
        path: 'clients',
        name: 'ManageClients',
        component: () => import('@/pages/admin/ManageClients.vue')
      },
      {
        path: 'bookings',
        name: 'ManageBookings',
        component: () => import('@/pages/admin/ManageBookings.vue')
      },
      {
        path: 'schedule',
        name: 'ManageSchedule',
        component: () => import('@/pages/admin/ManageSchedule.vue')
      },
      {
        path: 'pos',
        name: 'PosTerminal',
        component: () => import('@/pages/admin/PosTerminal.vue')
      },
      {
        path: 'categories',
        name: 'ManageCategories',
        component: () => import('@/pages/admin/ManageCategories.vue')
      },
      {
        path: 'locations',
        name: 'ManageLocations',
        component: () => import('@/pages/admin/ManageLocations.vue')
      },
      {
        path: 'tags',
        name: 'ManageTags',
        component: () => import('@/pages/admin/ManageTags.vue')
      },
      {
        path: 'inclusions',
        name: 'ManageInclusions',
        component: () => import('@/pages/admin/ManageInclusions.vue')
      },
      {
        path: 'users',
        name: 'ManageUsers',
        component: () => import('@/pages/admin/ManageUsers.vue'),
        meta: { requiresAuth: true, roles: ['Admin'] }
      }
    ]
  },
  {
    path: '/admin/login',
    name: 'AdminLogin',
    component: () => import('@/pages/admin/AdminLoginPage.vue')
  },
  {
    path: '/',
    component: () => import('@/layouts/PublicLayout.vue'),
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('@/pages/public/HomePage.vue')
      },
      {
        path: 'login',
        name: 'Login',
        component: () => import('@/pages/public/LoginPage.vue')
      },
      {
        path: 'register',
        name: 'Register',
        component: () => import('@/pages/public/RegisterPage.vue')
      },
      {
        path: 'attractions',
        name: 'AttractionsList',
        component: () => import('@/pages/public/AttractionsList.vue')
      },
      {
        path: 'attractions/:slug',
        name: 'AttractionDetail',
        component: () => import('@/pages/public/AttractionDetail.vue'),
        props: true
      },
      {
        path: 'my-bookings',
        name: 'MyBookings',
        component: () => import('@/pages/public/MyBookings.vue'),
        meta: { requiresAuth: true }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation Guard simple (se adaptará a la lógica del API)
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    // next({ name: 'Login' })
    next() // Temporalmente permitido para desarrollo visual
  } else {
    next()
  }
})

export default router
