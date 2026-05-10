<script setup>
import { ref, onMounted, onUnmounted, computed, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import attractionService from '@/services/attractions'
import bookingService from '@/services/bookings'
import scheduleService from '@/services/schedule'
import paymentService from '@/services/payments'
import reviewService from '@/services/reviews'
import BaseButton from '@/components/common/BaseButton.vue'
import Swal from 'sweetalert2'
import 'leaflet/dist/leaflet.css'
import {
  MapPinIcon, ClockIcon, UserGroupIcon, CheckBadgeIcon, XMarkIcon,
  LanguageIcon, ShieldCheckIcon, ArrowLeftIcon, StarIcon,
  MapIcon, ChevronDownIcon, MinusIcon, PlusIcon, CreditCardIcon,
  SpeakerWaveIcon, DocumentTextIcon, MicrophoneIcon, PhotoIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/stores/auth'
import { useCheckoutStore } from '@/stores/checkout'

const route = useRoute()
const router = useRouter()
const attraction = ref(null)
const loading = ref(true)
const mapContainer = ref(null)
let leafletMap = null

// Ticket + slot state
const selectedProduct = ref(null)
const availableSlots = ref([])
const loadingSlots = ref(false)
const selectedSlot = ref(null)
const selectedDate = ref(null)
const ticketCounts = ref({})
const showPaymentForm = ref(false)
const processingPayment = ref(false)

const reviews = ref([])
const reviewsLoading = ref(true)
const averageRating = computed(() => {
  if (reviews.value.length === 0) return 0
  const sum = reviews.value.reduce((acc, r) => acc + r.rating, 0)
  return sum / reviews.value.length
})

// Passenger info: one entry per priceTier with qty > 0
const passengerForms = ref([]) // [{tierId, tierName, qty, firstName, lastName, docType, docNumber}]

const paymentForm = ref({ cardNumber: '', expiry: '', cvv: '' })

// Errors
const errors = ref({})

function clearError(field) { delete errors.value[field] }

const difficultyInfo = {
  easy: { label: 'Fácil', color: 'bg-green-100 text-green-700', desc: 'Apto para todos. Sin condición física especial requerida.' },
  moderate: { label: 'Moderado', color: 'bg-yellow-100 text-yellow-700', desc: 'Requiere buena condición física básica.' },
  hard: { label: 'Difícil', color: 'bg-red-100 text-red-700', desc: 'Exige buena forma física y experiencia previa.' }
}

const inclusionConfig = {
  included:     { label: '✅ ¿Qué incluye?',    color: 'text-green-600',  bg: 'bg-green-50 border-green-200' },
  not_included: { label: '❌ No incluye',        color: 'text-red-600',    bg: 'bg-red-50 border-red-200' },
  optional:     { label: '⚡ Opcional',           color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200' },
  bring:        { label: '🎒 Debes llevar',       color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-200' }
}

const guideTypeConfig = {
  live:    { label: 'Presencial', icon: '👤' },
  audio:   { label: 'Audio',      icon: '🔊' },
  written: { label: 'Escrito',    icon: '📄' },
  app:     { label: 'App',        icon: '📱' }
}

const languageNames = { 1: 'Español', 2: 'Inglés', 3: 'Francés', 4: 'Portugués', 5: 'Alemán', 6: 'Italiano' }

// Agrupar inclusions por tipo
const groupedInclusions = computed(() => {
  if (!attraction.value?.inclusions?.length) return []
  const order = ['included', 'not_included', 'optional', 'bring']
  const groups = {}
  attraction.value.inclusions.forEach(inc => {
    const t = inc.type || 'included'
    if (!groups[t]) groups[t] = []
    groups[t].push(inc)
  })
  return order.filter(t => groups[t]).map(t => ({ type: t, config: inclusionConfig[t], items: groups[t] }))
})

// Cart computed
const cartItems = computed(() => {
  if (!selectedProduct.value) return []
  return selectedProduct.value.priceTiers
    .filter(t => (ticketCounts.value[t.id] || 0) > 0)
    .map(t => ({
      tierId: t.id,
      name: t.categoryName || 'Ticket',
      price: t.price,
      currency: t.currencyCode || 'USD',
      qty: ticketCounts.value[t.id] || 0,
      subtotal: t.price * (ticketCounts.value[t.id] || 0)
    }))
})

const cartTotal = computed(() => cartItems.value.reduce((s, i) => s + i.subtotal, 0))
const cartCount = computed(() => cartItems.value.reduce((s, i) => s + i.qty, 0))

async function selectProduct(prod) {
  selectedProduct.value = prod
  ticketCounts.value = {}
  prod.priceTiers.forEach(t => { ticketCounts.value[t.id] = 0 })
  selectedSlot.value = null
  selectedDate.value = null
  availableSlots.value = []
  showPaymentForm.value = false
  passengerForms.value = []
  errors.value = {}

  // Load next 60 days of slots
  loadingSlots.value = true
  try {
    const today = new Date()
    const from = today.toISOString().split('T')[0]
    const to = new Date(today.setDate(today.getDate() + 60)).toISOString().split('T')[0]
    availableSlots.value = await scheduleService.getSlots(prod.id, { fromDate: from, toDate: to })
  } catch (e) { console.error(e) }
  finally { loadingSlots.value = false }
}

function changeQty(tierId, delta) {
  const current = ticketCounts.value[tierId] || 0
  const next = Math.max(0, Math.min(10, current + delta))
  ticketCounts.value[tierId] = next
}

const groupedSlots = computed(() => {
  const groups = {}
  availableSlots.value.forEach(s => {
    if (!groups[s.slotDate]) groups[s.slotDate] = []
    groups[s.slotDate].push(s)
  })
  return Object.keys(groups).sort().map(date => ({
    date,
    slots: groups[date].sort((a, b) => a.startTime.localeCompare(b.startTime))
  }))
})

function openPaymentForm() {
  const authStore = useAuthStore()
  if (!authStore.isAuthenticated) {
    Swal.fire({
      icon: 'info',
      title: 'Inicia sesión',
      text: 'Debes iniciar sesión o registrarte para continuar con tu reserva.',
      confirmButtonText: 'Ir a Login',
      showCancelButton: true,
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#3b82f6'
    }).then((res) => {
      if (res.isConfirmed) router.push('/login')
    })
    return
  }

  errors.value = {}
  if (!selectedSlot.value) {
    errors.value.slot = 'Debes seleccionar un horario disponible.'
    return
  }
  if (cartCount.value === 0) {
    errors.value.tickets = 'Debes seleccionar al menos un ticket.'
    return
  }
  if (selectedProduct.value.minParticipants > 1 && cartCount.value < selectedProduct.value.minParticipants) {
    errors.value.tickets = `Esta experiencia requiere un mínimo de ${selectedProduct.value.minParticipants} participantes.`
    return
  }

  // Build passenger forms per tier
  const forms = []
  selectedProduct.value.priceTiers
    .filter(t => (ticketCounts.value[t.id] || 0) > 0)
    .forEach(t => {
      const qty = ticketCounts.value[t.id]
      if (selectedProduct.value.isPrivate) {
        for (let i = 0; i < qty; i++) {
          forms.push({ tierId: t.id, tierName: `${t.categoryName || 'Ticket'} #${i + 1}`, qty: 1, firstName: '', lastName: '', docType: 'Pasaporte', docNumber: '', email: i === 0 ? '' : 'n/a' })
        }
      } else {
        forms.push({ tierId: t.id, tierName: t.categoryName || 'Ticket', qty, firstName: '', lastName: '', docType: 'Pasaporte', docNumber: '', email: forms.length === 0 ? '' : 'n/a' })
      }
    })

  // Save to checkout store and navigate
  const checkoutStore = useCheckoutStore()
  checkoutStore.set({
    attraction: attraction.value,
    product: selectedProduct.value,
    slot: selectedSlot.value,
    cartItems: cartItems.value,
    passengerForms: forms
  })
  router.push('/checkout')
}

// ── Validation helpers ──────────────────────────────────────────────────────
function onlyLetters(e) {
  const char = String.fromCharCode(e.charCode)
  if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]$/.test(char)) e.preventDefault()
}
function onlyNumbers(e) {
  if (!/\d/.test(String.fromCharCode(e.charCode))) e.preventDefault()
}
function formatCardNumber(e) {
  let v = e.target.value.replace(/\D/g, '').slice(0, 16)
  paymentForm.value.cardNumber = v.replace(/(\d{4})(?=\d)/g, '$1 ')
}
function formatExpiry(e) {
  let v = e.target.value.replace(/\D/g, '').slice(0, 4)
  if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2)
  paymentForm.value.expiry = v
}

function validatePayment() {
  const e = {}
  const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/
  
  passengerForms.value.forEach((p, i) => {
    if (!p.firstName.trim()) {
      e[`fn_${i}`] = 'Nombre requerido'
    } else if (!nameRegex.test(p.firstName)) {
      e[`fn_${i}`] = 'Solo letras'
    }

    if (!p.lastName.trim()) {
      e[`ln_${i}`] = 'Apellido requerido'
    } else if (!nameRegex.test(p.lastName)) {
      e[`ln_${i}`] = 'Solo letras'
    }

    if (!p.docNumber.trim()) {
      e[`dn_${i}`] = 'Documento requerido'
    } else {
      if (p.docType === 'Cédula' && !/^\d{10}$/.test(p.docNumber)) {
        e[`dn_${i}`] = '10 dígitos'
      } else if (p.docType === 'Pasaporte' && !/^[a-zA-Z0-9]+$/.test(p.docNumber)) {
        e[`dn_${i}`] = 'Inválido'
      }
    }

    // Solo validar email para el primer pasajero (contacto)
    if (i === 0) {
      if (!p.email.trim() || !/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/.test(p.email)) {
        e[`em_${i}`] = 'Email inválido'
      }
    }
  })

  const raw = paymentForm.value.cardNumber.replace(/\s/g, '')
  if (raw.length < 16) e.card = 'Número de tarjeta inválido'
  
  // Validación de fecha de vencimiento
  if (!/^\d{2}\/\d{2}$/.test(paymentForm.value.expiry)) {
    e.expiry = 'Formato MM/AA'
  } else {
    const [mm, aa] = paymentForm.value.expiry.split('/').map(Number)
    const now = new Date()
    const curMonth = now.getMonth() + 1
    const curYear = Number(now.getFullYear().toString().slice(-2))
    
    if (mm < 1 || mm > 12) {
      e.expiry = 'Mes inválido'
    } else if (aa < curYear || (aa === curYear && mm < curMonth)) {
      e.expiry = 'Tarjeta vencida'
    }
  }

  if (paymentForm.value.cvv.length < 3) e.cvv = 'CVV inválido'
  errors.value = e
  return Object.keys(e).length === 0
}

async function processPayment() {
  if (!validatePayment()) return
  processingPayment.value = true
  try {
    // PASO 1: Crear la reserva (isPosSale = false)
    const payload = {
      slotId: selectedSlot.value.id,
      contactName: passengerForms.value[0]?.firstName + ' ' + passengerForms.value[0]?.lastName,
      contactEmail: passengerForms.value[0]?.email,
      isPosSale: false,
      passengers: passengerForms.value.map(p => ({
        priceTierId: p.tierId,
        firstName: p.firstName.trim(),
        lastName: p.lastName.trim(),
        documentType: p.docType,
        documentNumber: p.docNumber.trim(),
        quantity: p.qty
      }))
    }
    const booking = await bookingService.create(payload)

    // PASO 2: Simular pasarela de pagos externa (ej. Stripe/PayPal)
    await new Promise(r => setTimeout(r, 1500))
    const fakeExternalId = 'pi_' + Math.random().toString(36).substr(2, 9)

    // PASO 3: Registrar el pago en nuestra API (Directamente como Completado/Succeeded)
    const paymentPayload = {
      bookingId: booking.id, // Ojo: asumimos que el backend retorna el ID (booking.id)
      paymentMethodId: 1, // 1=Tarjeta
      amount: cartTotal.value,
      currencyCode: 'USD',
      transactionExternalId: fakeExternalId,
      statusId: 2 // 2 = Succeeded / Completado
    }
    const payment = await paymentService.create(paymentPayload)

    showPaymentForm.value = false
    ticketCounts.value = {}
    selectedProduct.value = null
    selectedSlot.value = null
    
    await Swal.fire({
      icon: 'success',
      title: '¡Reserva y Pago confirmados!',
      html: `<b>Código PNR: ${booking.pnrCode || 'Confirmado'}</b><br>Tu reserva en <b>${attraction.value?.name}</b> ha sido procesada y pagada con éxito.<br>Recibirás los detalles en <b>${payload.contactEmail}</b>.`,
      confirmButtonColor: '#3b82f6',
      confirmButtonText: 'Perfecto'
    })
  } catch (err) {
    const msg = err.response?.data?.message || err.response?.data?.title || err.message || 'Intenta nuevamente.'
    Swal.fire({ icon: 'error', title: 'Error al procesar pago', text: msg, confirmButtonColor: '#ef4444' })
  } finally {
    processingPayment.value = false
  }
}

async function initMap() {
  if (!mapContainer.value || !attraction.value) return
  if (leafletMap) { leafletMap.remove(); leafletMap = null }

  const L = (await import('leaflet')).default

  // Fix missing default icon images in Vite
  delete L.Icon.Default.prototype._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  })

  const lat = parseFloat(attraction.value.latitude)
  const lng = parseFloat(attraction.value.longitude)
  const hasCoords = !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0
  const centerLat = hasCoords ? lat : 14.0818
  const centerLng = hasCoords ? lng : -87.2068

  await nextTick()
  leafletMap = L.map(mapContainer.value, { 
    zoomControl: true,
    scrollWheelZoom: false, // Evitar zoom accidental al hacer scroll
    dragging: true,         // Permitir navegar
    touchZoom: true,
    doubleClickZoom: false  // Evitar zoom al hacer doble clic
  }).setView([centerLat, centerLng], 14)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(leafletMap)

  if (hasCoords) {
    L.marker([centerLat, centerLng])
      .addTo(leafletMap)
      .bindPopup(`<b>Punto de Encuentro: ${attraction.value.name}</b>${attraction.value.meetingPoint ? '<br>' + attraction.value.meetingPoint : ''}`)
      .openPopup()
  }

  // Paradas del itinerario
  const pathCoords = []
  if (hasCoords) pathCoords.push([centerLat, centerLng])

  if (attraction.value.itinerary?.stops) {
    attraction.value.itinerary.stops.forEach((stop, idx) => {
      if (!stop.latitude || !stop.longitude) return
      const sLat = parseFloat(stop.latitude)
      const sLng = parseFloat(stop.longitude)
      if (isNaN(sLat) || isNaN(sLng)) return
      
      const pos = [sLat, sLng]
      pathCoords.push(pos)
      
      L.circleMarker(pos, { radius: 8, color: '#f97316', fillColor: '#f97316', fillOpacity: 1, weight: 2 })
        .addTo(leafletMap)
        .bindPopup(`<b>Parada ${stop.stopNumber}: ${stop.name}</b>${stop.description ? '<br>' + stop.description : ''}`)
    })
  }

  if (pathCoords.length > 1) {
    L.polyline(pathCoords, { color: '#f97316', weight: 3, opacity: 0.6, dashArray: '10, 10' }).addTo(leafletMap)
    leafletMap.fitBounds(L.latLngBounds(pathCoords), { padding: [50, 50] })
  }

  setTimeout(() => leafletMap?.invalidateSize(), 300)
}



async function loadAttraction() {
  loading.value = true
  reviewsLoading.value = true
  try {
    const slug = route.params.slug
    const [data, revData] = await Promise.all([
      attractionService.getBySlug(slug),
      reviewService.getByAttraction(slug)
    ])
    attraction.value = data
    reviews.value = revData.items || []
    
    loading.value = false
    reviewsLoading.value = false
    
    await nextTick()
    await initMap()
  } catch (e) {
    console.error(e)
    loading.value = false
    reviewsLoading.value = false
  }
}

onMounted(loadAttraction)

watch(() => route.params.slug, () => {
  loadAttraction()
})

onUnmounted(() => { if (leafletMap) { leafletMap.remove(); leafletMap = null } })
</script>

<template>
  <div v-if="loading" class="min-h-screen flex items-center justify-center">
    <div class="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full"></div>
  </div>

  <div v-else-if="!attraction" class="min-h-screen flex items-center justify-center">
    <p class="text-text-secondary">Atracción no encontrada.</p>
  </div>

  <div v-else class="bg-background min-h-screen">
    <!-- Hero -->
    <div class="relative h-[55vh] overflow-hidden">
      <img
        :src="attraction.gallery?.find(m => m.isMain)?.url || attraction.gallery?.[0]?.url || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80'"
        class="w-full h-full object-cover"
      />
      <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent"></div>
      <button @click="router.back()" class="absolute top-6 left-6 p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-all">
        <ArrowLeftIcon class="h-6 w-6" />
      </button>
      <div class="absolute bottom-10 left-0 right-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex flex-wrap gap-2 mb-3">
          <span v-for="tag in attraction.tags" :key="tag.id" class="px-3 py-1 bg-primary text-white text-xs font-bold rounded-full">{{ tag.name }}</span>
          <span v-if="attraction.categoryName" class="px-3 py-1 bg-white/20 text-white text-xs font-bold rounded-full backdrop-blur-sm">{{ attraction.categoryName }}</span>
        </div>
        <h1 class="text-4xl md:text-5xl font-extrabold text-white tracking-tight">{{ attraction.name }}</h1>
        <div class="flex flex-wrap items-center gap-5 mt-4 text-white/90 text-sm">
          <div class="flex items-center gap-2">
            <MapPinIcon class="h-4 w-4" />
            <span>{{ attraction.locationName || 'Ubicación no especificada' }}{{ attraction.locationCountryCode ? `, ${attraction.locationCountryCode}` : '' }}</span>
          </div>
          <div v-if="attraction.difficultyLevel" class="flex items-center gap-2">
            <ShieldCheckIcon class="h-4 w-4" />
            <span>{{ difficultyInfo[attraction.difficultyLevel]?.label || attraction.difficultyLevel }}</span>
          </div>
          <div v-if="attraction.ratingAverage > 0" class="flex items-center gap-1">
            <StarIcon class="h-4 w-4 text-yellow-400 fill-yellow-400" />
            <span class="font-bold">{{ attraction.ratingAverage.toFixed(1) }}</span>
            <span class="text-white/60">({{ attraction.ratingCount }} reseñas)</span>
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-10">

        <!-- LEFT: main content -->
        <div class="lg:col-span-2 space-y-10">

          <!-- Description -->
          <section>
            <h2 class="text-2xl font-bold text-text-primary mb-4">Descripción General</h2>
            <p class="text-text-secondary leading-relaxed text-base">
              {{ attraction.descriptionFull || attraction.descriptionShort || 'Sin descripción disponible.' }}
            </p>
          </section>

          <!-- Gallery Slider -->
          <section v-if="attraction.gallery && attraction.gallery.length > 0">
            <h2 class="text-2xl font-bold text-text-primary mb-4 flex items-center gap-2">
              <PhotoIcon class="h-6 w-6 text-primary" />
              Galería
            </h2>
            <div class="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory hide-scrollbar">
              <div 
                v-for="img in attraction.gallery" 
                :key="img.url" 
                class="min-w-[280px] md:min-w-[400px] h-[200px] md:h-[280px] snap-center shrink-0 rounded-2xl overflow-hidden border border-border shadow-sm group relative"
              >
                <img :src="img.url" :alt="img.title" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
            </div>
          </section>

          <!-- Difficulty Banner -->
          <div v-if="attraction.difficultyLevel && difficultyInfo[attraction.difficultyLevel]"
            class="flex items-center gap-4 p-4 rounded-2xl border"
            :class="difficultyInfo[attraction.difficultyLevel].color">
            <ShieldCheckIcon class="h-6 w-6 shrink-0" />
            <div>
              <span class="font-bold block">Nivel: {{ difficultyInfo[attraction.difficultyLevel].label }}</span>
              <span class="text-sm">{{ difficultyInfo[attraction.difficultyLevel].desc }}</span>
            </div>
          </div>

          <!-- Inclusions grouped -->
          <section v-if="groupedInclusions.length > 0" class="bg-surface p-6 rounded-3xl border border-border">
            <h2 class="text-xl font-bold text-text-primary mb-5">Lo que necesitas saber</h2>
            <div class="space-y-5">
              <div v-for="group in groupedInclusions" :key="group.type">
                <div class="flex items-center gap-2 mb-2 pb-2 border-b border-border">
                  <span class="font-black text-sm" :class="group.config.color">{{ group.config.label }}</span>
                </div>
                <ul class="space-y-1.5">
                  <li v-for="inc in group.items" :key="inc.id" class="flex items-center gap-2 text-sm text-text-primary">
                    <span class="w-1.5 h-1.5 rounded-full shrink-0" :class="{ 'bg-green-500': group.type === 'included', 'bg-red-400': group.type === 'not_included', 'bg-yellow-500': group.type === 'optional', 'bg-blue-500': group.type === 'bring' }"></span>
                    {{ inc.name }}
                  </li>
                </ul>
              </div>
            </div>
          </section>

          <!-- MAP - always rendered, shows placeholder if no coords -->
          <section>
            <h2 class="text-2xl font-bold text-text-primary mb-4 flex items-center gap-2">
              <MapIcon class="h-6 w-6 text-primary" /> Ubicación
            </h2>
            <div ref="mapContainer" class="h-80 rounded-3xl overflow-hidden border border-border shadow-sm relative z-0"></div>
          </section>

          <!-- Itinerary Stops -->
          <section v-if="attraction.itinerary?.stops?.length > 0">
            <h2 class="text-2xl font-bold text-text-primary mb-6">Paradas del Recorrido</h2>
            <div class="relative">
              <div class="absolute left-5 top-0 bottom-0 w-0.5 bg-border"></div>
              <div class="space-y-6">
                <div v-for="stop in attraction.itinerary.stops" :key="stop.id" class="relative flex gap-5 pl-12">
                  <div class="absolute left-0 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-black text-sm shadow shrink-0">
                    {{ stop.stopNumber }}
                  </div>
                  <div class="bg-surface border border-border rounded-2xl p-5 flex-1">
                    <div class="flex items-start justify-between gap-4">
                      <h3 class="font-bold text-text-primary">{{ stop.name }}</h3>
                      <span v-if="stop.admissionType" class="text-[10px] font-black uppercase px-2 py-1 rounded-md shrink-0"
                        :class="{
                          'bg-green-100 text-green-700': stop.admissionType === 'included',
                          'bg-yellow-100 text-yellow-700': stop.admissionType === 'optional',
                          'bg-red-100 text-red-700': stop.admissionType === 'excluded',
                          'bg-blue-100 text-blue-700': stop.admissionType === 'bring'
                        }">
                        {{ 
                          stop.admissionType === 'included' ? 'Incluido' : 
                          stop.admissionType === 'optional' ? 'Opcional' : 
                          stop.admissionType === 'excluded' ? 'No incluido' : 
                          stop.admissionType === 'bring' ? 'Llevar' : stop.admissionType 
                        }}
                      </span>
                    </div>
                    <p v-if="stop.description" class="text-sm text-text-secondary mt-2">{{ stop.description }}</p>
                    <div v-if="stop.durationMinutes" class="flex items-center gap-1 mt-2 text-xs text-text-secondary">
                      <ClockIcon class="h-3 w-3" /> {{ stop.durationMinutes }} min aprox.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Products / Ticket Selector -->
          <section id="experiences">
            <h2 class="text-2xl font-bold text-text-primary mb-6">Selecciona tu Experiencia</h2>
            <div class="space-y-4">
              <div v-for="prod in attraction.products" :key="prod.id"
                class="border rounded-3xl overflow-hidden transition-all"
                :class="selectedProduct?.id === prod.id ? 'border-primary shadow-lg' : 'border-border bg-surface hover:border-primary/40'">
                <!-- Header -->
                <button @click="selectProduct(prod)" class="w-full text-left p-6 flex items-center justify-between gap-4">
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                      <h3 class="text-lg font-extrabold text-text-primary">{{ prod.title }}</h3>
                      <span v-if="prod.isPrivate" class="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded uppercase">Privado</span>
                    </div>
                    <p class="text-sm text-text-secondary">{{ prod.description }}</p>
                    <div class="flex flex-wrap gap-4 text-xs font-semibold text-text-secondary mt-2">
                      <span class="flex items-center gap-1"><ClockIcon class="h-3.5 w-3.5" />{{ prod.durationDescription || (prod.durationMinutes ? `${prod.durationMinutes} min` : 'Consultar') }}</span>
                      <span v-if="prod.maxGroupSize" class="flex items-center gap-1"><UserGroupIcon class="h-3.5 w-3.5" />Máx {{ prod.maxGroupSize }} personas</span>
                      <span v-if="prod.minParticipants > 1" class="flex items-center gap-1 text-primary"><UserGroupIcon class="h-3.5 w-3.5" />Mínimo {{ prod.minParticipants }} personas</span>
                    </div>
                  </div>
                  <div class="text-right shrink-0">
                    <div class="text-xs text-text-secondary font-bold uppercase">Desde</div>
                    <div class="text-2xl font-black text-primary">${{ prod.priceTiers[0]?.price || 0 }}</div>
                  </div>
                  <ChevronDownIcon class="h-5 w-5 text-text-secondary shrink-0 transition-transform" :class="selectedProduct?.id === prod.id ? 'rotate-180' : ''" />
                </button>

                <!-- Ticket Selector & Slots (expanded) -->
                <div v-if="selectedProduct?.id === prod.id" class="border-t border-border px-6 pb-6 bg-background/50">
                  <div class="pt-5 space-y-5">
                    
                    <!-- Slot Selection -->
                    <div>
                      <h4 class="font-bold text-text-primary text-sm mb-3">1. Selecciona Fecha y Hora</h4>
                      <div v-if="loadingSlots" class="text-sm text-text-secondary animate-pulse">Cargando horarios...</div>
                      <div v-else-if="availableSlots.length === 0" class="text-sm text-red-500 bg-red-50 p-3 rounded-lg border border-red-200">
                        No hay horarios disponibles para esta experiencia.
                      </div>
                      <div v-else class="space-y-4">
                        <!-- Date Selection -->
                        <div class="flex overflow-x-auto gap-2 pb-2 hide-scrollbar snap-x">
                          <button v-for="group in groupedSlots" :key="group.date"
                            @click="selectedDate = group.date; selectedSlot = null"
                            class="flex-shrink-0 px-4 py-2 rounded-xl border text-center transition-all snap-start"
                            :class="selectedDate === group.date ? 'bg-primary border-primary text-white font-bold shadow-md' : 'bg-surface border-border text-text-primary hover:border-primary/50'">
                            <div class="text-[10px] uppercase opacity-80">{{ new Date(group.date).toLocaleDateString('es-ES', { weekday: 'short' }) }}</div>
                            <div class="text-sm font-bold">{{ new Date(group.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) }}</div>
                          </button>
                        </div>

                        <!-- Time Selection -->
                        <div v-if="selectedDate" class="grid grid-cols-2 sm:grid-cols-4 gap-2 animate-in fade-in slide-in-from-top-1 duration-300">
                          <button v-for="slot in groupedSlots.find(g => g.date === selectedDate).slots" :key="slot.id"
                            @click="selectedSlot = slot; clearError('slot')"
                            :disabled="slot.capacityAvailable === 0"
                            class="p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1"
                            :class="[
                              selectedSlot?.id === slot.id ? 'bg-primary border-primary text-white font-bold shadow-sm' : 'bg-surface border-border text-text-primary hover:border-primary/50',
                              slot.capacityAvailable === 0 ? 'opacity-40 grayscale cursor-not-allowed border-dashed bg-gray-50 text-text-secondary' : ''
                            ]">
                            <div class="text-sm">{{ slot.startTime.substring(0,5) }}</div>
                            <div class="text-[10px] font-black uppercase tracking-tight" :class="selectedSlot?.id === slot.id ? 'text-white/90' : (slot.capacityAvailable < 5 ? 'text-red-500' : 'text-green-600')">
                              {{ slot.capacityAvailable > 0 ? `${slot.capacityAvailable} libres` : 'Agotado' }}
                            </div>
                          </button>
                        </div>
                        <div v-else class="text-xs text-text-secondary italic text-center py-2 bg-surface rounded-xl border border-dashed border-border">
                          Selecciona una fecha para ver los horarios disponibles
                        </div>
                      </div>
                      <div v-if="errors.slot" class="text-xs text-red-500 mt-1.5 font-medium">{{ errors.slot }}</div>
                    </div>

                    <!-- Tickets -->
                    <div>
                      <h4 class="font-bold text-text-primary text-sm mb-3">2. Selecciona Tickets</h4>
                      <div class="space-y-3">
                        <div v-for="tier in prod.priceTiers" :key="tier.id"
                          class="flex items-center justify-between bg-surface rounded-xl px-4 py-3 border border-border">
                          <div>
                            <div class="font-bold text-text-primary text-sm">{{ tier.categoryName || 'Ticket' }}</div>
                            <div class="text-primary font-black">${{ tier.price.toFixed(2) }} <span class="text-xs font-normal text-text-secondary">{{ tier.currencyCode }}</span></div>
                          </div>
                          <div class="flex items-center gap-3">
                            <button @click="changeQty(tier.id, -1); clearError('tickets')"
                              class="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors">
                              <MinusIcon class="h-4 w-4" />
                            </button>
                            <span class="w-8 text-center font-black text-lg">{{ ticketCounts[tier.id] || 0 }}</span>
                            <button @click="changeQty(tier.id, 1); clearError('tickets')"
                              class="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-green-50 hover:border-green-300 hover:text-green-600 transition-colors">
                              <PlusIcon class="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                      <div v-if="errors.tickets" class="text-xs text-red-500 mt-1.5 font-medium">{{ errors.tickets }}</div>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Reviews Section -->
          <section v-if="reviews.length > 0 || reviewsLoading" id="reviews" class="bg-surface border border-border rounded-3xl p-8 shadow-sm">
            <div class="flex items-center justify-between mb-8">
              <div>
                <h2 class="text-2xl font-bold text-text-primary flex items-center gap-2">
                  <ChatBubbleLeftRightIcon class="h-6 w-6 text-primary" /> Opiniones de viajeros
                </h2>
                <div class="flex items-center gap-2 mt-1">
                  <div class="flex">
                    <StarIcon v-for="i in 5" :key="i" class="h-4 w-4" :class="i <= Math.round(averageRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'" />
                  </div>
                  <span class="text-sm text-text-secondary">({{ reviews.length }} reseñas)</span>
                </div>
              </div>
            </div>

            <div v-if="reviewsLoading" class="space-y-4">
              <div v-for="i in 2" :key="i" class="h-32 bg-background animate-pulse rounded-2xl"></div>
            </div>

            <div v-else-if="reviews.length === 0" class="text-center py-12 bg-background rounded-2xl border border-dashed border-border">
              <ChatBubbleLeftRightIcon class="h-10 w-10 mx-auto text-text-secondary/20 mb-3" />
              <p class="text-text-secondary italic">Aún no hay opiniones para esta atracción. ¡Sé el primero en compartir tu experiencia!</p>
            </div>

            <div v-else class="space-y-6">
              <div v-for="rev in reviews" :key="rev.id" class="border-b border-border last:border-0 pb-6 last:pb-0">
                <div class="flex items-center justify-between mb-3">
                  <div class="flex items-center gap-3">
                    <div class="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {{ rev.userName?.charAt(0) || 'U' }}
                    </div>
                    <div>
                      <div class="font-bold text-text-primary text-sm">{{ rev.userName }}</div>
                      <div class="text-[10px] text-text-secondary">{{ new Date(rev.createdAt).toLocaleDateString() }}</div>
                    </div>
                  </div>
                  <div class="flex">
                    <StarIcon v-for="i in 5" :key="i" class="h-3 w-3" :class="i <= rev.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'" />
                  </div>
                </div>
                <p class="text-text-secondary text-sm leading-relaxed">{{ rev.comment }}</p>
                <div v-if="rev.isVerified" class="mt-3 flex items-center gap-1.5 text-green-600 text-[10px] font-bold uppercase tracking-wider">
                  <ShieldCheckIcon class="h-3 w-3" /> Compra Verificada
                </div>
              </div>
            </div>
          </section>
        </div>

        <!-- RIGHT: Sidebar -->
        <aside class="space-y-6">
          <!-- Info Card -->
          <div class="p-6 bg-surface rounded-3xl border border-border sticky top-6 space-y-5">
            <h3 class="text-lg font-bold text-text-primary">Información del Viaje</h3>
            <div class="space-y-4 text-sm">
              <div class="flex items-start gap-3">
                <MapPinIcon class="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <div class="font-bold text-text-primary">Ubicación</div>
                  <div class="text-text-secondary">
                    {{ attraction.locationName || 'No especificada' }}
                    {{ attraction.address ? `— ${attraction.address}` : '' }}
                  </div>
                </div>
              </div>
              <div v-if="attraction.meetingPoint" class="flex items-start gap-3">
                <MapPinIcon class="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
                <div>
                  <div class="font-bold text-text-primary">Punto de encuentro</div>
                  <div class="text-text-secondary">{{ attraction.meetingPoint }}</div>
                </div>
              </div>
              <div v-if="attraction.guideLanguages?.length > 0" class="flex items-start gap-3">
                <LanguageIcon class="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <div class="font-bold text-text-primary">Idiomas del guía</div>
                  <div class="flex flex-wrap gap-1.5 mt-1">
                    <span v-for="lang in attraction.guideLanguages" :key="`${lang.languageId}-${lang.guideType}`"
                      class="inline-flex items-center gap-1 px-2.5 py-1 bg-background border border-border rounded-lg text-xs font-semibold">
                      <span>{{ languageNames[lang.languageId] || lang.name }}</span>
                      <span class="text-text-secondary">&middot;</span>
                      <span class="text-primary">{{ guideTypeConfig[lang.guideType]?.label || lang.guideType }}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Cart Summary -->
            <div v-if="cartCount > 0" class="mt-4 border-t border-border pt-4">
              <h4 class="font-bold text-text-primary mb-3 text-sm">Resumen de Compra</h4>
              <div class="space-y-2">
                <div v-for="item in cartItems" :key="item.tierId" class="flex justify-between text-sm">
                  <span class="text-text-secondary">{{ item.name }} × {{ item.qty }}</span>
                  <span class="font-bold">${{ item.subtotal.toFixed(2) }}</span>
                </div>
                <div class="border-t border-border pt-2 flex justify-between font-black text-base">
                  <span>Total</span>
                  <span class="text-primary">${{ cartTotal.toFixed(2) }}</span>
                </div>
              </div>
              <BaseButton class="w-full mt-4" @click="openPaymentForm">
                <CreditCardIcon class="h-5 w-5 mr-2" /> Pagar ahora
              </BaseButton>
            </div>

            <div class="p-3 bg-primary/5 rounded-xl border border-primary/20 text-xs text-text-secondary text-center italic">
              * Cancelación gratuita hasta 24h antes del tour.
            </div>
          </div>
        </aside>
      </div>
    </div>

    <!-- Payment Modal -->
    <div v-if="showPaymentForm" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div class="bg-background rounded-3xl shadow-2xl w-full max-w-2xl my-8 overflow-hidden flex flex-col max-h-[90vh]">
        
        <div class="flex items-center justify-between px-6 py-4 border-b border-border bg-surface shrink-0">
          <h2 class="text-lg font-black text-text-primary flex items-center gap-2">
            <CreditCardIcon class="h-6 w-6 text-primary" /> Confirmar Reserva
          </h2>
          <button @click="showPaymentForm = false" class="p-2 hover:bg-gray-200 rounded-lg transition-colors">
            <XMarkIcon class="h-5 w-5" />
          </button>
        </div>

        <div class="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          
          <!-- Summary Header -->
          <div class="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex flex-col sm:flex-row justify-between gap-4">
            <div>
              <div class="text-xs font-bold text-primary uppercase tracking-wider mb-1">{{ selectedProduct?.title }}</div>
              <div class="font-bold text-text-primary text-sm flex items-center gap-1.5">
                <ClockIcon class="h-4 w-4 text-text-secondary" /> {{ selectedSlot?.slotDate }} a las {{ selectedSlot?.startTime }}
              </div>
            </div>
            <div class="text-right">
              <div class="text-xs font-bold text-text-secondary uppercase">Total a pagar</div>
              <div class="text-xl font-black text-primary">${{ cartTotal.toFixed(2) }} USD</div>
            </div>
          </div>

          <!-- Passengers -->
          <div>
            <h3 class="font-bold text-text-primary mb-4 text-sm border-b border-border pb-2">Información de Pasajeros</h3>
            <div class="space-y-5">
              <div v-for="(p, i) in passengerForms" :key="p.tierId" class="bg-surface border border-border p-4 rounded-2xl relative">
                <div class="absolute -top-3 left-4 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {{ p.tierName }} × {{ p.qty }}
                </div>
                
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                  <div>
                    <label class="text-[11px] font-bold text-text-secondary uppercase">Nombres</label>
                    <input v-model="p.firstName" @keypress="onlyLetters" @input="clearError(`fn_${i}`)"
                      class="mt-1 w-full bg-background border rounded-xl py-2 px-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                      :class="errors[`fn_${i}`] ? 'border-red-400' : 'border-border'" placeholder="Ej. Juan Carlos" />
                    <span v-if="errors[`fn_${i}`]" class="text-[10px] text-red-500 font-medium">{{ errors[`fn_${i}`] }}</span>
                  </div>
                  <div>
                    <label class="text-[11px] font-bold text-text-secondary uppercase">Apellidos</label>
                    <input v-model="p.lastName" @keypress="onlyLetters" @input="clearError(`ln_${i}`)"
                      class="mt-1 w-full bg-background border rounded-xl py-2 px-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                      :class="errors[`ln_${i}`] ? 'border-red-400' : 'border-border'" placeholder="Ej. Pérez Gómez" />
                    <span v-if="errors[`ln_${i}`]" class="text-[10px] text-red-500 font-medium">{{ errors[`ln_${i}`] }}</span>
                  </div>
                  <div class="sm:col-span-2">
                    <label class="text-[11px] font-bold text-text-secondary uppercase">Documento de Identidad</label>
                    <div class="flex gap-2 mt-1">
                      <select v-model="p.docType"
                        class="bg-background border border-border rounded-xl px-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
                        <option value="Cédula">Cédula</option>
                        <option value="Pasaporte">Pasaporte</option>
                      </select>
                      <input v-model="p.docNumber" @input="clearError(`dn_${i}`)"
                        class="flex-1 bg-background border rounded-xl py-2 px-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        :class="errors[`dn_${i}`] ? 'border-red-400' : 'border-border'" placeholder="Número de documento" />
                    </div>
                    <span v-if="errors[`dn_${i}`]" class="text-[10px] text-red-500 font-medium">{{ errors[`dn_${i}`] }}</span>
                  </div>
                  <!-- Email only for first passenger (Contact) -->
                  <div v-if="i === 0">
                    <label class="text-[11px] font-bold text-text-secondary uppercase">Email de contacto</label>
                    <input v-model="p.email" type="email" @input="clearError(`em_${i}`)"
                      class="mt-1 w-full bg-background border rounded-xl py-2 px-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                      :class="errors[`em_${i}`] ? 'border-red-400' : 'border-border'" placeholder="correo@ejemplo.com" />
                    <span v-if="errors[`em_${i}`]" class="text-[10px] text-red-500 font-medium">{{ errors[`em_${i}`] }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Payment Method -->
          <div>
            <h3 class="font-bold text-text-primary mb-4 text-sm border-b border-border pb-2 flex items-center justify-between">
              <span>Método de Pago</span>
              <span class="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-1"><ShieldCheckIcon class="h-3 w-3"/> Seguro</span>
            </h3>
            
            <div class="bg-surface border border-border p-4 rounded-2xl space-y-4">
              <div>
                <label class="text-[11px] font-bold text-text-secondary uppercase">Número de Tarjeta</label>
                <input :value="paymentForm.cardNumber" @input="e => { formatCardNumber(e); clearError('card') }"
                  class="mt-1 w-full bg-background border rounded-xl py-2 px-3 text-sm font-mono tracking-widest focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  :class="errors.card ? 'border-red-400' : 'border-border'" placeholder="0000 0000 0000 0000" maxlength="19" />
                <span v-if="errors.card" class="text-[10px] text-red-500 font-medium">{{ errors.card }}</span>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="text-[11px] font-bold text-text-secondary uppercase">Vencimiento</label>
                  <input :value="paymentForm.expiry" @input="e => { formatExpiry(e); clearError('expiry') }"
                    class="mt-1 w-full bg-background border rounded-xl py-2 px-3 text-sm font-mono focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    :class="errors.expiry ? 'border-red-400' : 'border-border'" placeholder="MM/AA" maxlength="5" />
                  <span v-if="errors.expiry" class="text-[10px] text-red-500 font-medium">{{ errors.expiry }}</span>
                </div>
                <div>
                  <label class="text-[11px] font-bold text-text-secondary uppercase">CVV</label>
                  <input v-model="paymentForm.cvv" @keypress="onlyNumbers" @input="clearError('cvv')"
                    class="mt-1 w-full bg-background border rounded-xl py-2 px-3 text-sm font-mono focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    :class="errors.cvv ? 'border-red-400' : 'border-border'" placeholder="123" maxlength="4" type="password" />
                  <span v-if="errors.cvv" class="text-[10px] text-red-500 font-medium">{{ errors.cvv }}</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        <div class="p-4 border-t border-border bg-surface shrink-0">
          <BaseButton class="w-full h-12 text-base font-bold" @click="processPayment" :loading="processingPayment">
            Pagar ${{ cartTotal.toFixed(2) }} USD
          </BaseButton>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
.leaflet-container {
  z-index: 1 !important;
}
</style>
