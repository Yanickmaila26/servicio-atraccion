<script setup>
import { ref, onMounted, computed } from 'vue'
import bookingService from '@/services/bookings'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import { TicketIcon, MagnifyingGlassIcon, ArrowPathIcon, MapPinIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'

import Swal from 'sweetalert2'

const bookings = ref([])
const loading = ref(true)
const loadingDetail = ref(false)
const searchQuery = ref('')
const expandedAttractions = ref([])
const showDetailModal = ref(false)
const selectedBooking = ref(null)

const openDetail = async (booking) => {
  showDetailModal.value = true
  loadingDetail.value = true
  selectedBooking.value = booking // muestra datos básicos mientras carga
  try {
    const fullDetail = await bookingService.getById(booking.id)
    selectedBooking.value = fullDetail
  } catch (e) {
    console.error('Error cargando detalle:', e)
  } finally {
    loadingDetail.value = false
  }
}

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

const isBookingClosed = (booking) => {
  if (booking.statusId === 3 || booking.statusId === 4 || booking.statusName?.toLowerCase() === 'cancelada') return false;
  if (!booking.slotDate || !booking.slotStartTime) return false;
  const slotDate = new Date(`${booking.slotDate}T${booking.slotStartTime}`)
  return Date.now() > slotDate.getTime()
}

const canCancelBooking = (booking) => {
  if (booking.statusId === 3 || booking.statusId === 4 || booking.statusName?.toLowerCase() === 'cancelada') return false;
  if (isBookingClosed(booking)) return false;
  if (!booking.slotDate || !booking.slotStartTime || booking.cancelPolicyHours == null) return false;
  const slotDate = new Date(`${booking.slotDate}T${booking.slotStartTime}`)
  const cancelThreshold = new Date(slotDate.getTime() - (booking.cancelPolicyHours * 60 * 60 * 1000))
  return Date.now() <= cancelThreshold.getTime()
}

const cancelBooking = async (booking) => {
  const result = await Swal.fire({
    title: 'Confirmar Cancelación Administrativa',
    text: `¿Estás seguro de cancelar la reserva de ${booking.totalPassengers} tickets para la atracción "${booking.attractionName}"?`,
    icon: 'warning',
    input: 'text',
    inputPlaceholder: 'Motivo de cancelación (opcional)',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Sí, Cancelar',
    cancelButtonText: 'No, mantener'
  })

  if (result.isConfirmed) {
    try {
      await bookingService.cancel(booking.pnrCode || booking.pnr, result.value || 'Cancelado por el administrador')
      Swal.fire('Cancelada', 'La reserva ha sido cancelada.', 'success')
      fetchBookings()
    } catch (error) {
      Swal.fire('Error', error.response?.data?.message || 'Hubo un error al cancelar', 'error')
    }
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
                <th class="px-6 py-4">Cliente</th>
                <th class="px-6 py-4 text-center">Fecha del Tour</th>
                <th class="px-6 py-4 text-right">Total Pagado</th>
                <th class="px-6 py-4 text-center">Estado</th>
                <th class="px-6 py-4 text-center">Acciones</th>
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
                  <span v-if="isBookingClosed(booking)" class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border bg-gray-100 text-gray-700 border-gray-200">
                    Cerrada
                  </span>
                  <span v-else class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border" :class="getStatusClass(booking.statusName || booking.status)">
                    {{ booking.statusName || booking.status }}
                  </span>
                </td>
                <td class="px-6 py-4 text-center">
                  <div class="flex items-center justify-center gap-2">
                    <button 
                      @click="openDetail(booking)"
                      class="text-xs font-bold text-primary hover:text-primary-dark bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors border border-primary/10"
                      title="Ver Detalles"
                    >
                      Detalles
                    </button>
                    <button 
                      v-if="canCancelBooking(booking)" 
                      @click="cancelBooking(booking)" 
                      class="text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors border border-red-100"
                    >
                      Cancelar
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Detail Modal -->
    <BaseModal :show="showDetailModal" title="Detalle de la Reserva" @close="showDetailModal = false" size="xl">
      <div v-if="selectedBooking" class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-4">
            <h3 class="text-sm font-black uppercase text-text-secondary border-b border-border pb-2">Información General</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <div class="text-text-secondary text-xs">PNR / Código</div>
                <div class="font-bold text-primary font-mono text-base">{{ selectedBooking.pnrCode || selectedBooking.pnr }}</div>
              </div>
              <div>
                <div class="text-text-secondary text-xs">Estado</div>
                <span class="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border mt-1" :class="getStatusClass(selectedBooking.statusName || selectedBooking.status)">
                  {{ selectedBooking.statusName || selectedBooking.status }}
                </span>
              </div>
              <div>
                <div class="text-text-secondary text-xs">Atracción</div>
                <div class="font-bold text-text-primary">{{ selectedBooking.attractionName }}</div>
              </div>
              <div>
                <div class="text-text-secondary text-xs">Modalidad</div>
                <div class="font-bold text-text-primary">{{ selectedBooking.productTitle }}</div>
              </div>
              <div>
                <div class="text-text-secondary text-xs">Fecha del Tour</div>
                <div class="font-bold text-text-primary">{{ new Date(selectedBooking.slotDate).toLocaleDateString() }}</div>
              </div>
              <div>
                <div class="text-text-secondary text-xs">Hora de Inicio</div>
                <div class="font-bold text-text-primary">{{ selectedBooking.slotStartTime }}</div>
              </div>
            </div>
          </div>

          <div class="space-y-4">
            <h3 class="text-sm font-black uppercase text-text-secondary border-b border-border pb-2">Cliente / Contacto</h3>
            <div v-if="loadingDetail" class="py-4 text-center text-text-secondary text-sm">Cargando...</div>
            <div v-else class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-text-secondary">Nombre:</span>
                <span class="font-bold text-text-primary">{{ selectedBooking.contactName || selectedBooking.clientName || 'N/A' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-text-secondary">Email:</span>
                <span class="font-bold text-text-primary">{{ selectedBooking.contactEmail || selectedBooking.clientEmail || selectedBooking.userEmail || 'N/A' }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-4">
          <h3 class="text-sm font-black uppercase text-text-secondary border-b border-border pb-2">Desglose de Pasajeros</h3>
          <div v-if="loadingDetail" class="py-8 text-center text-text-secondary text-sm">Cargando detalle...</div>
          <div v-else class="bg-background rounded-2xl border border-border overflow-hidden overflow-x-auto">
            <table class="w-full text-left text-sm min-w-[500px]">
              <thead class="bg-surface font-bold text-text-secondary text-xs uppercase border-b border-border">
                <tr>
                  <th class="px-4 py-3">Nombre</th>
                  <th class="px-4 py-3">Categoría</th>
                  <th class="px-4 py-3 text-center">Documento</th>
                  <th class="px-4 py-3 text-right">Cant / Precio</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border">
                <tr v-for="(p, idx) in (selectedBooking.passengers || [])" :key="idx" class="hover:bg-surface/50 transition-colors">
                  <td class="px-4 py-3 font-medium text-text-primary">{{ p.fullName || '—' }}</td>
                  <td class="px-4 py-3">{{ p.priceTierLabel || 'Ticket' }}</td>
                  <td class="px-4 py-3 text-center text-xs text-text-secondary">{{ p.documentNumber || '—' }}</td>
                  <td class="px-4 py-3 text-right font-bold">{{ p.quantity }} × ${{ p.unitPrice?.toFixed(2) }}</td>
                </tr>
                <tr v-if="!(selectedBooking.passengers?.length)">
                  <td colspan="4" class="px-4 py-6 text-center text-text-secondary text-xs italic">Sin datos de pasajeros</td>
                </tr>
              </tbody>
              <tfoot class="bg-surface/30">
                <tr>
                  <td colspan="3" class="px-4 py-3 text-right font-black text-text-secondary">Total Pasajeros:</td>
                  <td class="px-4 py-3 text-right font-black text-primary text-lg">{{ selectedBooking.totalPassengers || selectedBooking.passengers?.reduce((s,p) => s+p.quantity,0) || 0 }}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div v-if="selectedBooking.statusName?.toLowerCase() === 'cancelada'" class="p-4 bg-red-50 border border-red-200 rounded-2xl">
          <h4 class="text-xs font-black text-red-700 uppercase mb-1">Información de Cancelación</h4>
          <div class="text-sm text-red-600">
            <span class="font-bold">Motivo:</span> {{ selectedBooking.cancelReason || 'No especificado' }}
          </div>
          <div class="text-xs text-red-500 mt-1">
            Fecha: {{ new Date(selectedBooking.cancelledAt).toLocaleString() }}
          </div>
        </div>

        <div class="flex justify-end pt-4 border-t border-border">
          <BaseButton @click="showDetailModal = false">Cerrar</BaseButton>
        </div>
      </div>
    </BaseModal>
  </div>
</template>
