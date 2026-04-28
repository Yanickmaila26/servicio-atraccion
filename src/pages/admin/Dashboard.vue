<script setup>
import { ref, onMounted, computed } from 'vue'
import bookingService from '@/services/bookings'
import { TicketIcon, UsersIcon, CurrencyDollarIcon, ArrowTrendingUpIcon } from '@heroicons/vue/24/outline'

const rawBookings = ref([])
const loading = ref(true)

const stats = computed(() => {
  const bookings = rawBookings.value
  const totalRevenue = bookings.filter(b => b.statusName?.toLowerCase() === 'succeeded' || b.statusName?.toLowerCase() === 'completed').reduce((sum, b) => sum + b.totalAmount, 0)
  const activeBookings = bookings.filter(b => b.statusName?.toLowerCase() !== 'cancelled').length
  
  return [
    { name: 'Ingresos Pagados', value: `$${totalRevenue.toFixed(2)}`, change: '100%', changeType: 'positive', icon: CurrencyDollarIcon },
    { name: 'Total Reservas', value: bookings.length.toString(), change: 'Total', changeType: 'positive', icon: TicketIcon },
    { name: 'Reservas Activas', value: activeBookings.toString(), change: 'Activas', changeType: 'positive', icon: ArrowTrendingUpIcon },
    { name: 'Nuevos Usuarios', value: 'N/A', change: 'En progreso', changeType: 'neutral', icon: UsersIcon },
  ]
})

const recentBookings = computed(() => {
  // Tomamos las últimas 5 reservas
  return rawBookings.value.slice(0, 5).map(b => ({
    id: b.pnrCode || 'N/A',
    user: b.clientName || 'Cliente anónimo',
    attraction: b.attractionName || 'Desconocida',
    date: b.slotDate || b.createdAt.split('T')[0],
    status: b.statusName || 'Pendiente',
    amount: `$${b.totalAmount.toFixed(2)}`
  }))
})

onMounted(async () => {
  loading.value = true
  try {
    const data = await bookingService.getManagementList({ pageSize: 50 })
    rawBookings.value = data.items || []
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h2 class="text-2xl font-bold text-text-primary">Dashboard</h2>
      <p class="text-text-secondary mt-1">Resumen general del sistema y métricas clave.</p>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <div 
        v-for="item in stats" 
        :key="item.name" 
        class="bg-surface overflow-hidden rounded-xl border border-border p-5 hover:shadow-soft transition-shadow duration-200"
      >
        <div class="flex items-center">
          <div class="flex-shrink-0 bg-primary/10 rounded-md p-3">
            <component :is="item.icon" class="h-6 w-6 text-primary" aria-hidden="true" />
          </div>
          <div class="ml-5 w-0 flex-1">
            <dl>
              <dt class="truncate text-sm font-medium text-text-secondary">{{ item.name }}</dt>
              <dd>
                <div class="text-2xl font-bold text-text-primary">{{ item.value }}</div>
              </dd>
            </dl>
          </div>
        </div>
        <div class="mt-4 flex items-center justify-between text-sm">
          <div 
            :class="[item.changeType === 'positive' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400', 'flex items-baseline font-semibold']"
          >
            {{ item.change }}
          </div>
          <span class="text-text-secondary text-xs">vs mes anterior</span>
        </div>
      </div>
    </div>

    <!-- Recent Bookings Table -->
    <div class="bg-surface border border-border rounded-xl shadow-sm overflow-hidden mt-8">
      <div class="px-6 py-5 border-b border-border flex justify-between items-center">
        <h3 class="text-lg font-medium leading-6 text-text-primary">Reservas Recientes</h3>
        <button class="text-sm font-medium text-primary hover:text-primary-dark transition-colors">Ver todas</button>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-border">
          <thead class="bg-background">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">ID</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Usuario</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Atracción</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Fecha</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Estado</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Monto</th>
            </tr>
          </thead>
          <tbody class="bg-surface divide-y divide-border">
            <tr v-for="booking in recentBookings" :key="booking.id" class="hover:bg-background/50 transition-colors">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">{{ booking.id }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{{ booking.user }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{{ booking.attraction }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{{ booking.date }}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span 
                  class="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full"
                  :class="{
                    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400': ['confirmada','confirmed','succeeded','completed'].includes(booking.status?.toLowerCase()),
                    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400': ['pendiente','pending'].includes(booking.status?.toLowerCase()),
                    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400': ['cancelada','cancelled','failed','refunded'].includes(booking.status?.toLowerCase()),
                  }"
                >
                  {{ booking.status }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-text-primary font-medium">{{ booking.amount }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
