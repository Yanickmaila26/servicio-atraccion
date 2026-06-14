<script setup>
import { ref, onMounted, computed } from 'vue'
import bookingService from '@/services/bookings'
import billingService from '@/services/billing'
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
  UserIcon,
  DocumentArrowDownIcon
} from '@heroicons/vue/24/outline'

const bookings = ref([])
const invoices = ref([])
const loading = ref(true)

const statusConfig = {
  1: { label: 'Pendiente', color: 'text-yellow-600 bg-yellow-50', icon: PendingIcon },
  2: { label: 'Confirmada', color: 'text-green-600 bg-green-50', icon: CheckCircleIcon },
  3: { label: 'Cancelada', color: 'text-red-600 bg-red-50', icon: XCircleIcon },
  4: { label: 'Completada', color: 'text-blue-600 bg-blue-50', icon: CheckCircleIcon }
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
  // allSettled para que un fallo en facturas no impida ver reservas y viceversa
  const [bookingsRes, invoicesRes] = await Promise.allSettled([
    bookingService.getCustomerBookings(),
    billingService.getMyInvoices()
  ])

  if (bookingsRes.status === 'fulfilled') {
    const data = bookingsRes.value
    bookings.value = (data?.items || data || []).sort((a, b) => {
      return new Date(b.slotDate) - new Date(a.slotDate)
    })
  } else {
    console.error('Error cargando reservas:', bookingsRes.reason)
  }

  if (invoicesRes.status === 'fulfilled') {
    invoices.value = invoicesRes.value || []
  } else {
    console.error('Error cargando facturas:', invoicesRes.reason)
  }

  loading.value = false
}

const formatDateLocal = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('es-ES', { 
    weekday: 'short', 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric' 
  })
}

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
      pnrCode: selectedBooking.value.pnrCode,
      overallRating: reviewForm.value.rating,
      comment: reviewForm.value.comment,
      title: 'Reseña desde Portal',
      languageId: 1
    })
    showReviewModal.value = false
    Swal.fire('¡Gracias!', 'Tu reseña ha sido publicada.', 'success')
    fetchData()
  } catch (error) {
    Swal.fire('Error', error.message || 'No se pudo publicar la reseña', 'error')
  } finally {
    submittingReview.value = false
  }
}

const isBookingClosed = (booking) => {
  if (booking.statusId === 3) return false;
  if (booking.statusId === 4) return true;
  const slotDate = new Date(`${booking.slotDate}T${booking.slotStartTime || '00:00:00'}`)
  return Date.now() > slotDate.getTime()
}

const canCancelBooking = (booking) => {
  if (booking.statusId !== 1 && booking.statusId !== 2) return false;
  if (isBookingClosed(booking)) return false;
  
  const slotDate = new Date(`${booking.slotDate}T${booking.slotStartTime || '00:00:00'}`)
  const policyHours = booking.cancelPolicyHours || 24
  const cancelThreshold = new Date(slotDate.getTime() - (policyHours * 60 * 60 * 1000))
  return Date.now() <= cancelThreshold.getTime()
}

const cancelBooking = async (booking) => {
  const result = await Swal.fire({
    title: '¿Confirmar Cancelación?',
    text: `¿Estás seguro de que deseas cancelar la reserva ${booking.pnrCode}? Esta acción no se puede deshacer.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    confirmButtonText: 'Sí, Cancelar',
    cancelButtonText: 'No, mantener'
  })

  if (result.isConfirmed) {
    try {
      await bookingService.cancel(booking.pnrCode, 'Cancelado por el cliente desde portal')
      Swal.fire('Cancelada', 'La reserva ha sido cancelada.', 'success')
      fetchData()
    } catch (error) {
      Swal.fire('Error', error.message || 'Hubo un error al cancelar', 'error')
    }
  }
}

const downloadPdf = async (booking) => {
  const invoice = invoices.value.find(i => i.bookingId === booking.id)
  if (invoice) {
    Swal.fire({
      title: 'Descargando...',
      text: 'Preparando tu factura en PDF',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading()
      }
    })
    try {
      await billingService.downloadPdfFile(invoice.id, invoice.invoiceNumber || 'factura')
      Swal.close()
    } catch (error) {
      console.error(error)
      Swal.fire('Error', 'No se pudo descargar la factura. Inténtalo de nuevo.', 'error')
    }
  } else {
    Swal.fire({
      icon: 'info',
      title: 'Sin comprobante',
      text: 'Aún no se ha generado una factura para esta reserva. Si realizaste el pago, puede demorar unos minutos.',
      confirmButtonColor: '#3b82f6'
    })
  }
}

onMounted(fetchData)
</script>

<template>
  <div class="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-4xl mx-auto">
      <header class="mb-10">
        <h1 class="text-3xl font-black text-text-primary tracking-tight">Mis Reservaciones</h1>
        <p class="text-text-secondary mt-2">Gestiona tus aventuras y revisa tus comprobantes.</p>
      </header>

      <div v-if="loading" class="space-y-6">
        <div v-for="i in 3" :key="i" class="h-48 bg-surface animate-pulse rounded-3xl border border-border"></div>
      </div>

      <div v-else-if="bookings.length === 0" class="text-center py-20 bg-surface rounded-3xl border-2 border-dashed border-border">
        <TicketIcon class="h-16 w-16 mx-auto text-text-secondary/20 mb-4" />
        <h2 class="text-xl font-bold text-text-primary">Aún no tienes reservas</h2>
        <p class="text-text-secondary mt-2 mb-8">¿Listo para tu próxima aventura?</p>
        <router-link to="/attractions" class="inline-flex px-8 py-3 bg-primary text-white font-black rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 transition-all">
          Explorar Atracciones
        </router-link>
      </div>

      <div v-else class="space-y-6">
        <div v-for="booking in bookings" :key="booking.id" 
          class="bg-surface rounded-3xl border border-border overflow-hidden hover:shadow-md transition-all group">
          <div class="flex flex-col md:flex-row">
            <!-- Left Image -->
            <div class="md:w-1/3 relative h-48 md:h-auto overflow-hidden bg-gray-100">
              <img :src="booking.attractionImage || 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&q=80'" 
                class="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-all duration-700" />
              <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div class="absolute bottom-4 left-4">
                <span class="px-2 py-1 bg-white/20 backdrop-blur-md rounded-lg text-[10px] font-black text-white uppercase tracking-widest border border-white/30">
                  PNR: {{ booking.pnrCode }}
                </span>
              </div>
            </div>

            <!-- Right Content -->
            <div class="flex-1 p-6 md:p-8">
              <div class="flex justify-between items-start mb-4">
                <div>
                  <h3 class="text-xl font-black text-text-primary leading-tight">{{ booking.attractionName }}</h3>
                  <p class="text-xs font-bold text-primary mt-1">{{ booking.productTitle || 'Tour Estándar' }}</p>
                </div>
                <div class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5"
                  :class="statusConfig[booking.statusId]?.color || 'bg-gray-100 text-gray-700'">
                  <component :is="statusConfig[booking.statusId]?.icon || PendingIcon" class="h-3 w-3" />
                  {{ booking.statusName }}
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-y border-border mb-6">
                <div class="space-y-1">
                  <div class="text-[10px] font-black text-text-secondary uppercase">Fecha y Hora (Local)</div>
                  <div class="text-sm font-bold text-text-primary">{{ formatDateLocal(booking.slotDate) }}</div>
                  <div class="text-xs text-text-secondary">{{ booking.slotStartTime?.substring(0,5) }} h</div>
                </div>
                <div class="space-y-1 text-right md:text-left">
                  <div class="text-[10px] font-black text-text-secondary uppercase">Monto Total</div>
                  <div class="text-xl font-black text-primary">${{ booking.totalAmount?.toFixed(2) }} <span class="text-[10px] text-text-secondary uppercase">{{ booking.currencyCode }}</span></div>
                  <div class="text-[10px] text-text-secondary">{{ booking.totalPassengers || 1 }} ticket(s) adquiridos</div>
                </div>
              </div>

              <div class="flex flex-wrap gap-3">
                <button v-if="canCancelBooking(booking)" 
                  @click="cancelBooking(booking)"
                  class="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-black border border-red-100 hover:bg-red-600 hover:text-white transition-all">
                  Cancelar Reserva
                </button>
                <button v-if="isBookingClosed(booking) && booking.statusId !== 3" 
                  @click="openReviewModal(booking)"
                  class="px-4 py-2 bg-yellow-400 text-yellow-950 rounded-xl text-xs font-black hover:bg-yellow-500 transition-all shadow-sm">
                  Dejar Reseña
                </button>
                <button @click="downloadPdf(booking)" class="p-2 bg-background border border-border rounded-xl hover:bg-surface transition-all" title="Ver Comprobante">
                  <DocumentArrowDownIcon class="h-5 w-5 text-text-secondary" />
                </button>
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

