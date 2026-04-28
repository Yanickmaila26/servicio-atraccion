<script setup>
import { ref, onMounted, computed } from 'vue'
import bookingService from '@/services/bookings'
import BaseButton from '@/components/common/BaseButton.vue'
import { TicketIcon, MagnifyingGlassIcon, ArrowPathIcon, MapPinIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'

import Swal from 'sweetalert2'

const bookings = ref([])
const loading = ref(true)
const searchQuery = ref('')
const expandedAttractions = ref([])

const fetchBookings = async () => {
  loading.value = true
  try {
    const data = await bookingService.getManagementList({ q: searchQuery.value })
    bookings.value = data?.items || []
    
    // Expandir el primer grupo por defecto si hay datos
    if (groupedBookings.value.length > 0) {
      expandedAttractions.value = [groupedBookings.value[0].attractionName]
    }
  } catch (error) {
    console.error(error)
    Swal.fire({
      icon: 'error',
      title: 'Error al cargar reservas',
      text: error.message || 'No se pudo conectar con el servidor.',
      confirmButtonColor: '#3b82f6'
    })
  } finally {
    loading.value = false
  }
}

const groupedBookings = computed(() => {
  const groups = {}
  bookings.value.forEach(booking => {
    const name = booking.attractionName || 'Atracción Desconocida'
    if (!groups[name]) {
      groups[name] = []
    }
    groups[name].push(booking)
  })

  return Object.keys(groups).sort().map(attractionName => ({
    attractionName,
    bookings: groups[attractionName]
  }))
})

const toggleAttraction = (name) => {
  const idx = expandedAttractions.value.indexOf(name)
  if (idx > -1) expandedAttractions.value.splice(idx, 1)
  else expandedAttractions.value.push(name)
}

const getStatusClass = (status) => {
  switch (status?.toLowerCase()) {
    case 'confirmada':
    case 'confirmed': return 'bg-green-100 text-green-700 border-green-200'
    case 'pendiente':
    case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    case 'cancelada':
    case 'cancelled': return 'bg-red-100 text-red-700 border-red-200'
    default: return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}

onMounted(fetchBookings)
</script>

<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-text-primary flex items-center gap-2">
          <TicketIcon class="h-8 w-8 text-primary" />
          Gestión de Reservas
        </h1>
        <p class="text-text-secondary text-sm mt-1">Monitorea y gestiona las reservas agrupadas por atracción.</p>
      </div>
      <BaseButton variant="outline" @click="fetchBookings" :loading="loading">
        <ArrowPathIcon class="h-5 w-5 mr-2" />
        Actualizar
      </BaseButton>
    </div>

    <!-- Filters -->
    <div class="bg-surface p-4 rounded-2xl border border-border flex gap-4">
      <div class="flex-1">
        <div class="relative group">
          <MagnifyingGlassIcon class="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary group-focus-within:text-primary transition-colors" />
          <input 
            v-model="searchQuery"
            placeholder="Buscar por código PNR..."
            class="w-full bg-background border border-border rounded-xl py-2.5 pl-10 pr-4 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            @keyup.enter="fetchBookings"
          />
        </div>
      </div>
      <BaseButton @click="fetchBookings">Filtrar</BaseButton>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="py-12 text-center text-text-secondary">
      Cargando reservas...
    </div>

    <!-- Empty State -->
    <div v-else-if="groupedBookings.length === 0" class="py-20 text-center bg-surface rounded-2xl border border-dashed border-border">
      <TicketIcon class="h-12 w-12 mx-auto text-text-secondary/30 mb-4" />
      <p class="text-text-secondary italic">No se encontraron reservas.</p>
    </div>

    <!-- Grouped Content -->
    <div v-else class="space-y-6">
      <div v-for="group in groupedBookings" :key="group.attractionName" class="border border-border rounded-2xl overflow-hidden bg-surface shadow-sm">
        
        <!-- Accordion Header -->
        <button 
          @click="toggleAttraction(group.attractionName)" 
          class="w-full flex items-center justify-between px-6 py-4 hover:bg-background/50 transition-colors"
          :class="expandedAttractions.includes(group.attractionName) ? 'bg-background border-b border-border' : ''"
        >
          <div class="flex items-center gap-3">
            <MapPinIcon class="h-6 w-6 text-primary" />
            <span class="font-black text-lg text-text-primary">{{ group.attractionName }}</span>
            <span class="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-bold">
              {{ group.bookings.length }} reservas
            </span>
          </div>
          <ChevronRightIcon 
            class="h-6 w-6 text-text-secondary transition-transform" 
            :class="expandedAttractions.includes(group.attractionName) ? 'rotate-90' : ''" 
          />
        </button>

        <!-- Accordion Body -->
        <div v-show="expandedAttractions.includes(group.attractionName)" class="overflow-x-auto">
          <table class="w-full text-left">
            <thead class="bg-background text-xs font-bold text-text-secondary uppercase border-b border-border">
              <tr>
                <th class="px-6 py-4">PNR / Código</th>
                <th class="px-6 py-4">Cliente (Requiere API)</th>
                <th class="px-6 py-4 text-center">Fecha del Tour</th>
                <th class="px-6 py-4 text-right">Total Pagado</th>
                <th class="px-6 py-4 text-center">Estado</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border/50">
              <tr v-for="booking in group.bookings" :key="booking.id" class="hover:bg-background/80 transition-colors">
                <td class="px-6 py-4 font-mono font-bold text-primary">{{ booking.pnrCode || booking.pnr }}</td>
                <td class="px-6 py-4">
                  <div class="text-sm font-medium text-text-primary">{{ booking.clientName || 'Sin datos del cliente' }}</div>
                  <div class="text-xs text-text-secondary" v-if="booking.clientEmail">{{ booking.clientEmail }}</div>
                </td>
                <td class="px-6 py-4 text-sm font-bold text-center">
                  {{ booking.slotDate ? new Date(booking.slotDate).toLocaleDateString() : 'N/A' }}
                </td>
                <td class="px-6 py-4 font-bold text-text-primary text-right">
                  {{ booking.currencyCode || '$' }} {{ booking.totalAmount?.toFixed(2) || '0.00' }}
                </td>
                <td class="px-6 py-4 text-center">
                  <span class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border" :class="getStatusClass(booking.statusName || booking.status)">
                    {{ booking.statusName || booking.status }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
