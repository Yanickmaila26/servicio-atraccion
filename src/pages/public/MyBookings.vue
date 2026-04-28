<script setup>
import { ref, onMounted, computed } from 'vue'
import bookingService from '@/services/bookings'
import reviewService from '@/services/reviews'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import Swal from 'sweetalert2'
import { 
  TicketIcon, 
  CalendarIcon, 
  MapPinIcon, 
  ClockIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  ClockIcon as PendingIcon,
  XCircleIcon,
  StarIcon,
  ChatBubbleBottomCenterTextIcon,
  UserIcon
} from '@heroicons/vue/24/outline'

const bookings = ref([])
const loading = ref(true)

const statusConfig = {
  1: { label: 'Pendiente', color: 'text-yellow-600 bg-yellow-50', icon: PendingIcon },
  2: { label: 'Confirmada', color: 'text-green-600 bg-green-50', icon: CheckCircleIcon },
  3: { label: 'Completada', color: 'text-blue-600 bg-blue-50', icon: CheckCircleIcon },
  4: { label: 'Cancelada', color: 'text-red-600 bg-red-50', icon: XCircleIcon }
}

const showReviewModal = ref(false)
const selectedBooking = ref(null)
const reviewForm = ref({
  rating: 5,
  comment: ''
})
const submittingReview = ref(false)

const fetchData = async () => {
  loading.value = true
  try {
    const data = await bookingService.getCustomerBookings()
    bookings.value = data.items || []
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

onMounted(fetchData)

// Agrupar por Atracción + Fecha + Hora para evitar duplicados visuales si el usuario hizo varias reservas para lo mismo
const groupedBookings = computed(() => {
  const groups = {}
  bookings.value.forEach(b => {
    // Usamos el ID de la atracción o el nombre + fecha + hora como llave
    const key = `${b.attractionName}-${b.slotDate}-${b.slotStartTime}`
    if (!groups[key]) {
      groups[key] = {
        ...b,
        pnrList: [b.pnrCode],
        // Clonamos tickets para no mutar el original
        allTickets: b.tickets.map(t => ({ ...t }))
      }
    } else {
      // Si ya existe, sumamos montos y pasajeros, y combinamos tickets
      groups[key].totalAmount += b.totalAmount
      groups[key].totalPassengers += b.totalPassengers
      if (!groups[key].pnrList.includes(b.pnrCode)) {
        groups[key].pnrList.push(b.pnrCode)
      }
      
      b.tickets.forEach(t => {
        const existing = groups[key].allTickets.find(et => et.categoryName === t.categoryName)
        if (existing) {
          existing.quantity += t.quantity
        } else {
          groups[key].allTickets.push({ ...t })
        }
      })
    }
  })
  return Object.values(groups)
})

const openReviewModal = (booking) => {
  selectedBooking.value = booking
  reviewForm.value = { rating: 5, comment: '' }
  showReviewModal.value = true
}

const submitReview = async () => {
  if (!reviewForm.value.comment.trim()) return
  submittingReview.value = true
  try {
    await reviewService.create({
      bookingId: selectedBooking.value.id,
      rating: reviewForm.value.rating,
      comment: reviewForm.value.comment
    })
    showReviewModal.value = false
    Swal.fire('¡Gracias!', 'Tu reseña ha sido publicada con éxito.', 'success')
    fetchData()
  } catch (error) {
    Swal.fire('Error', error.response?.data?.message || 'No se pudo publicar la reseña', 'error')
  } finally {
    submittingReview.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-4xl mx-auto">
      <header class="mb-10">
        <h1 class="text-3xl font-extrabold text-text-primary tracking-tight">Mis Reservas</h1>
        <p class="text-text-secondary mt-2">Gestiona tus próximos tours y revisa tu historial de aventuras.</p>
      </header>

      <div v-if="loading" class="space-y-4">
        <div v-for="i in 3" :key="i" class="h-32 bg-surface animate-pulse rounded-2xl border border-border"></div>
      </div>

      <div v-else-if="groupedBookings.length === 0" class="text-center py-20 bg-surface rounded-3xl border border-dashed border-border">
        <TicketIcon class="h-16 w-16 mx-auto text-text-secondary/20 mb-4" />
        <h2 class="text-xl font-bold text-text-primary">Aún no tienes reservas</h2>
        <p class="text-text-secondary mt-2 mb-8">¿Listo para tu próxima aventura? Explora nuestras atracciones.</p>
        <router-link to="/attractions" class="inline-flex items-center justify-center px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-all">
          Explorar Atracciones
        </router-link>
      </div>

      <div v-else class="space-y-6">
        <div v-for="booking in groupedBookings" :key="booking.id" 
          class="bg-surface rounded-3xl border border-border overflow-hidden hover:shadow-soft transition-all group">
          <div class="p-6 flex flex-col md:flex-row gap-6">
            <!-- Info -->
            <div class="flex-1">
              <div class="flex items-center justify-between mb-2">
                <div class="flex gap-2">
                  <span v-for="pnr in booking.pnrList" :key="pnr" class="text-[10px] font-black uppercase tracking-widest text-text-secondary bg-background px-2 py-0.5 rounded border border-border">
                    PNR: {{ pnr }}
                  </span>
                </div>
                <span class="px-2 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1"
                  :class="statusConfig[booking.statusId]?.color || 'bg-gray-100 text-gray-600'">
                  <component :is="statusConfig[booking.statusId]?.icon || PendingIcon" class="h-3 w-3" />
                  {{ booking.statusName || 'Desconocido' }}
                </span>
              </div>
              
              <h3 class="text-2xl font-black text-text-primary mb-1">{{ booking.attractionName }}</h3>
              <p class="text-sm text-primary font-bold mb-4">{{ booking.productTitle || 'Tour Estándar' }}</p>

              <div class="flex flex-wrap gap-4 mb-6">
                <div class="flex items-center gap-2 text-sm font-bold text-text-secondary">
                  <CalendarIcon class="h-4 w-4 text-primary" />
                  <span>{{ booking.slotDate }}</span>
                </div>
                <div class="flex items-center gap-2 text-sm font-bold text-text-secondary">
                  <ClockIcon class="h-4 w-4 text-primary" />
                  <span>{{ booking.slotStartTime }}</span>
                </div>
              </div>

              <!-- Tickets Detail -->
              <div class="bg-background rounded-2xl p-4 border border-border space-y-2">
                <div class="text-[10px] font-black text-text-secondary uppercase mb-2">Tickets Adquiridos</div>
                <div v-for="ticket in booking.allTickets" :key="ticket.categoryName" class="flex justify-between items-center text-sm">
                  <div class="flex items-center gap-2">
                    <div class="w-5 h-5 rounded bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary">{{ ticket.quantity }}</div>
                    <span class="font-bold text-text-primary">{{ ticket.categoryName }}</span>
                  </div>
                  <span class="text-text-secondary">${{ ticket.unitPrice.toFixed(2) }} c/u</span>
                </div>
              </div>
            </div>

            <!-- Actions / Price -->
            <div class="flex flex-col justify-between items-end border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6 min-w-[160px]">
              <div class="text-right w-full">
                <div class="text-[10px] font-black text-text-secondary uppercase">Monto Total</div>
                <div class="text-3xl font-black text-primary">${{ booking.totalAmount?.toFixed(2) }}</div>
                <div class="text-[10px] text-text-secondary mt-1">{{ booking.totalPassengers }} viajeros en total</div>
              </div>
              
              <div class="flex flex-col gap-2 w-full mt-6">
                <button 
                  v-if="booking.canReview"
                  @click="openReviewModal(booking)"
                  class="flex items-center justify-center gap-2 px-4 py-3 bg-yellow-400 text-yellow-950 rounded-xl text-sm font-black hover:bg-yellow-500 transition-all shadow-sm"
                >
                  <StarIcon class="h-4 w-4 fill-yellow-950" /> Dejar reseña
                </button>
                <router-link :to="`/attractions/${booking.attractionSlug}`" class="flex items-center justify-center gap-2 px-4 py-3 bg-surface border border-border rounded-xl text-sm font-bold text-text-primary hover:bg-background transition-all">
                  Ver Atracción <ChevronRightIcon class="h-4 w-4" />
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Review Modal -->
    <BaseModal :show="showReviewModal" @close="showReviewModal = false" title="Calificar Experiencia">
      <div class="space-y-6">
        <div class="text-center">
          <p class="text-text-secondary text-sm mb-4">¿Qué te pareció tu visita a <br><span class="font-bold text-text-primary">{{ selectedBooking?.attractionName }}</span>?</p>
          <div class="flex justify-center gap-2">
            <button v-for="star in 5" :key="star" @click="reviewForm.rating = star">
              <StarIcon class="h-10 w-10 transition-all hover:scale-110" 
                :class="star <= reviewForm.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'" />
            </button>
          </div>
        </div>

        <div>
          <label class="text-xs font-black uppercase text-text-secondary ml-1">Tu comentario</label>
          <textarea v-model="reviewForm.comment" rows="4" class="w-full mt-1 bg-surface border border-border rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="Cuéntanos lo mejor de este tour..."></textarea>
        </div>

        <BaseButton class="w-full" :loading="submittingReview" @click="submitReview" :disabled="!reviewForm.comment.trim()">
          Publicar Reseña
        </BaseButton>
      </div>
    </BaseModal>
  </div>
</template>

