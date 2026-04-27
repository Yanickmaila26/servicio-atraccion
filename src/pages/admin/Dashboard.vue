<script setup>
import { ref } from 'vue'
import { TicketIcon, UsersIcon, CurrencyDollarIcon, ArrowTrendingUpIcon } from '@heroicons/vue/24/outline'

const stats = ref([
  { name: 'Ingresos Totales', value: '$45,231.89', change: '+20.1%', changeType: 'positive', icon: CurrencyDollarIcon },
  { name: 'Nuevos Usuarios', value: '2,314', change: '+15.2%', changeType: 'positive', icon: UsersIcon },
  { name: 'Reservas Activas', value: '1,203', change: '-3.2%', changeType: 'negative', icon: TicketIcon },
  { name: 'Conversión', value: '24.5%', change: '+4.1%', changeType: 'positive', icon: ArrowTrendingUpIcon },
])

const recentBookings = ref([
  { id: 'RES-1001', user: 'Ana García', attraction: 'Montaña Rusa', date: '2026-04-25', status: 'Confirmado', amount: '$31.00' },
  { id: 'RES-1002', user: 'Carlos Ruiz', attraction: 'Casa del Terror', date: '2026-04-25', status: 'Pendiente', amount: '$20.00' },
  { id: 'RES-1003', user: 'María López', attraction: 'Montaña Rusa', date: '2026-04-24', status: 'Confirmado', amount: '$15.50' },
  { id: 'RES-1004', user: 'Juan Pérez', attraction: 'Rueda de la Fortuna', date: '2026-04-24', status: 'Cancelado', amount: '$12.00' },
])
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
                    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400': booking.status === 'Confirmado',
                    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400': booking.status === 'Pendiente',
                    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400': booking.status === 'Cancelado',
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
