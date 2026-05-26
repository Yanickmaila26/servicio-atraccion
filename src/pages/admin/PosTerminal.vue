<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import attractionService from '@/services/attractions'
import posService from '@/services/pos'
import scheduleService from '@/services/schedule'
import catalogService from '@/services/catalog'
import clientService from '@/services/clients'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import { 
  BanknotesIcon, 
  MapPinIcon, 
  TicketIcon,
  CreditCardIcon,
  UserIcon,
  CheckCircleIcon,
  UserPlusIcon,
  MagnifyingGlassIcon
} from '@heroicons/vue/24/outline'

import Swal from 'sweetalert2'

const loading = ref(false)
const initialLoading = ref(true)
const attractions = ref([])
const ticketCategories = ref([])
const selectedAttraction = ref(null)
const selectedProduct = ref(null)
const products = ref([])
const slots = ref([])
const loadingSlots = ref(false)
const validatingClient = ref(false)
const isExistingClient = ref(false)

const form = ref({
  date: new Date().toISOString().split('T')[0],
  slotId: '',
  clientId: null, // Nuevo: para vincular cliente existente
  clientName: 'Cliente General (POS)',
  clientEmail: 'pos@local.com',
  clientPhone: '',
  clientTaxId: '',
  clientAddress: '',
  paymentMethod: 'cash', // cash, card
  tickets: {} // { ticketCategoryId: quantity }
})

const validateClient = async () => {
  if (!form.value.clientTaxId || form.value.clientTaxId.length < 10) {
    isExistingClient.value = false
    form.value.clientId = null
    return
  }

  validatingClient.value = true
  try {
    const response = await clientService.validate(form.value.clientTaxId)
    // El interceptor suele devolver directamente la data, pero verificamos ambos casos
    const client = response.data || response 
    
    if (client) {
      // Caso A: El cliente ya existe
      form.value.clientId = client.id
      // Combinamos nombre y apellido para el input de visualización
      form.value.clientName = `${client.firstName || ''} ${client.lastName || ''}`.trim() || client.fullName
      form.value.clientEmail = client.email || form.value.clientEmail
      form.value.clientAddress = client.address || form.value.clientAddress
      isExistingClient.value = true
      
      // Notificación rápida
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'info',
        title: 'Datos de cliente cargados',
        showConfirmButton: false,
        timer: 2000
      })
    } else {
      // Caso B: Es un cliente nuevo
      isExistingClient.value = false
      form.value.clientId = null
    }
  } catch (error) {
    console.error('Error al validar cliente:', error)
    isExistingClient.value = false
  } finally {
    validatingClient.value = false
  }
}

watch(() => form.value.clientTaxId, (newVal) => {
  if (newVal && newVal.length >= 10) {
    const timer = setTimeout(validateClient, 500)
    return () => clearTimeout(timer)
  } else {
    isExistingClient.value = false
  }
})

const availableDates = ref([])

const fetchAvailableDates = async (prodId) => {
  if (!prodId) return
  try {
    const data = await scheduleService.getSlots(prodId, {
      fromDate: new Date().toISOString().split('T')[0],
      toDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    })
    // Extraer fechas únicas que tengan capacidad
    const dates = [...new Set(data.filter(s => s.capacityAvailable > 0).map(s => s.slotDate))]
    availableDates.value = dates.sort()
  } catch (err) {
    console.error(err)
  }
}

const fetchInitialData = async () => {
  initialLoading.value = true
  try {
    const [attrRes, catRes] = await Promise.all([
      attractionService.getManagementList({ pageSize: 100 }),
      catalogService.getTicketCategories()
    ])
    attractions.value = attrRes?.items || []
    ticketCategories.value = catRes || []
  } catch (error) {
    console.error(error)
    Swal.fire({
      icon: 'error',
      title: 'Error de conexión',
      text: 'No se pudieron cargar los datos iniciales del POS.',
      confirmButtonColor: '#3b82f6'
    })
  } finally {
    initialLoading.value = false
  }
}

const getTicketCategoryName = (id) => {
  const cat = ticketCategories.value.find(c => c.id === id)
  return cat ? cat.name : `Categoría Oculta`
}

const onAttractionSelect = async (attrId) => {
  if (!attrId) {
    selectedAttraction.value = null
    products.value = []
    return
  }
  try {
    selectedAttraction.value = attractions.value.find(a => a.id === attrId)
    // Obtener las modalidades de esta atracción
    products.value = await scheduleService.getByAttraction(attrId) || []
    selectedProduct.value = null
    form.value.tickets = {}
    form.value.slotId = ''
    slots.value = []
  } catch (error) {
    console.error(error)
  }
}

const fetchSlots = async () => {
  if (!selectedProduct.value || !form.value.date) return
  loadingSlots.value = true
  form.value.slotId = ''
  try {
    // Buscar slots solo para la fecha seleccionada
    const data = await scheduleService.getSlots(selectedProduct.value.id, {
      fromDate: form.value.date,
      toDate: form.value.date
    })
    slots.value = data || []
  } catch (err) {
    console.error(err)
    slots.value = []
  } finally {
    loadingSlots.value = false
  }
}

const onProductSelect = (prodId) => {
  selectedProduct.value = products.value.find(p => p.id === prodId)
  form.value.tickets = {}
  form.value.slotId = ''
  if (selectedProduct.value && selectedProduct.value.priceTiers) {
    selectedProduct.value.priceTiers.forEach(tier => {
      form.value.tickets[tier.id] = 0
    })
  }
  fetchAvailableDates(prodId)
  fetchSlots()
}

const taxRate = parseFloat(import.meta.env.VITE_TAX_RATE || '0.15')

const subtotal = computed(() => {
  if (!selectedProduct.value) return 0
  let total = 0
  selectedProduct.value.priceTiers.forEach(tier => {
    const qty = form.value.tickets[tier.id] || 0
    total += tier.price * qty
  })
  return total
})

const taxAmount = computed(() => subtotal.value * taxRate)
const totalAmount = computed(() => subtotal.value + taxAmount.value)

const totalTickets = computed(() => {
  return Object.values(form.value.tickets).reduce((sum, qty) => sum + qty, 0)
})

const registerSale = async () => {
  if (totalTickets.value === 0) return Swal.fire('Atención', 'Debes agregar al menos 1 ticket.', 'warning')
  if (!form.value.slotId) return Swal.fire('Atención', 'Selecciona un horario disponible.', 'warning')

  loading.value = true
  try {
    const payload = {
      slotId: form.value.slotId,
      clientId: form.value.clientId, // Enviamos el ID si existe
      contactName: form.value.clientName || 'Cliente General',
      contactEmail: form.value.clientEmail || 'pos@local.com',
      notes: "Venta POS - " + form.value.paymentMethod,
      attractionId: selectedAttraction.value?.id,
      productOptionId: selectedProduct.value?.id,
      attractionName: selectedAttraction.value?.name,
      productTitle: selectedProduct.value?.title,
      currency: 'USD',
      passengers: Object.entries(form.value.tickets)
        .filter(([_, qty]) => qty > 0)
        .map(([id, qty]) => {
          const tier = selectedProduct.value?.priceTiers.find(t => t.id === id)
          const tierLabel = tier ? getTicketCategoryName(tier.ticketCategoryId) : 'Ticket'
          return {
            priceTierId: id,
            priceTierLabel: tierLabel,
            unitPrice: tier?.price || 0,
            quantity: qty
          }
        }),
      // Objeto de facturación según nueva especificación del backend
      billing: (form.value.clientTaxId || form.value.clientAddress) ? {
        customerName: form.value.clientName,
        taxId: form.value.clientTaxId,
        email: form.value.clientEmail,
        address: form.value.clientAddress
      } : null
    }

    await posService.registerSale(payload)
    await Swal.fire('Éxito', '¡Venta registrada con éxito!', 'success')
    
    // Reset
    selectedAttraction.value = null
    selectedProduct.value = null
    products.value = []
    slots.value = []
    form.value.tickets = {}
    form.value.slotId = ''
    form.value.clientName = 'Cliente General (POS)'
    form.value.clientEmail = 'pos@local.com'
    form.value.clientTaxId = ''
    form.value.clientAddress = ''
  } catch (error) {
    Swal.fire('Error', error.message, 'error')
  } finally {
    loading.value = false
  }
}

onMounted(fetchInitialData)
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-6 pb-20">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-black text-text-primary flex items-center gap-3">
          <BanknotesIcon class="h-10 w-10 text-primary" /> Punto de Venta (POS)
        </h1>
        <p class="text-text-secondary mt-2">Registra ventas directas y Walk-ins. El pago se asume como recaudado localmente.</p>
      </div>
    </div>

    <div v-if="initialLoading" class="flex flex-col items-center justify-center py-20 text-text-secondary">
      <div class="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
      <p class="font-medium">Cargando datos del sistema...</p>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8 animate-in fade-in">
      
      <!-- Columna Izquierda: Selección -->
      <div class="lg:col-span-2 space-y-6">
        
        <!-- 1. Atracción -->
        <div class="bg-surface rounded-3xl border border-border p-6">
          <h2 class="text-sm font-black uppercase text-text-primary flex items-center gap-2 mb-4">
            <span class="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span> 
            Seleccionar Experiencia
          </h2>
          <select @change="e => onAttractionSelect(e.target.value)" class="w-full bg-background border border-border rounded-xl py-4 px-4 font-bold text-lg outline-none focus:border-primary">
            <option value="">Buscar atracción...</option>
            <option v-for="attr in attractions" :key="attr.id" :value="attr.id">{{ attr.name }}</option>
          </select>
        </div>

        <template v-if="selectedAttraction">
          <!-- 2. Modalidad y Fecha -->
          <div class="bg-surface rounded-3xl border border-border p-6 space-y-6">
            <h2 class="text-sm font-black uppercase text-text-primary flex items-center gap-2 mb-4">
              <span class="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span> 
              Modalidad y Horario
            </h2>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-2">
                <label class="text-xs font-bold text-text-secondary uppercase">Producto</label>
                <select @change="e => onProductSelect(e.target.value)" class="w-full bg-background border border-border rounded-xl py-3 px-4 outline-none">
                  <option value="">Seleccione Modalidad...</option>
                  <option v-for="prod in products" :key="prod.id" :value="prod.id">{{ prod.title }}</option>
                </select>
              </div>
              <div class="space-y-2">
                <BaseInput label="Fecha de Reserva" type="date" v-model="form.date" @change="fetchSlots" />
                <div v-if="availableDates.length > 0" class="flex flex-wrap gap-1 mt-1">
                  <span class="text-[10px] font-bold text-text-secondary w-full">Próximas fechas con cupos:</span>
                  <button v-for="d in availableDates.slice(0, 5)" :key="d" 
                    @click.prevent="form.date = d; fetchSlots()"
                    class="px-2 py-0.5 rounded bg-primary/5 text-primary text-[10px] font-bold hover:bg-primary hover:text-white transition-colors">
                    {{ new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Selección de Slot -->
            <div v-if="selectedProduct" class="space-y-2 pt-2 border-t border-border">
              <label class="text-xs font-bold text-text-secondary uppercase">Horarios Disponibles</label>
              <div v-if="loadingSlots" class="text-sm text-text-secondary py-2">Cargando horarios...</div>
              <div v-else-if="slots.length === 0" class="text-sm italic text-red-500 bg-red-50 p-3 rounded-xl border border-red-100">
                No hay disponibilidad generada para esta fecha.
              </div>
              <div v-else class="flex flex-wrap gap-2">
                <button 
                  v-for="slot in slots" :key="slot.id"
                  @click="form.slotId = slot.id"
                  :disabled="slot.capacityAvailable === 0"
                  class="flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all w-28"
                  :class="[
                    form.slotId === slot.id ? 'border-primary bg-primary/10 text-primary shadow-sm' : 'border-border bg-background hover:border-primary/50 text-text-primary',
                    slot.capacityAvailable === 0 ? 'opacity-50 grayscale cursor-not-allowed border-dashed bg-surface' : ''
                  ]"
                >
                  <span class="font-bold text-lg leading-none">{{ slot.startTime.substring(0,5) }}</span>
                  <span class="text-[10px] uppercase font-black mt-1" :class="slot.capacityAvailable > 0 ? 'text-green-600' : 'text-red-500'">
                    {{ slot.capacityAvailable }} cupos
                  </span>
                </button>
              </div>
            </div>
          </div>

          <!-- 3. Tickets -->
          <div v-if="selectedProduct" class="bg-surface rounded-3xl border border-border p-6 space-y-6">
            <h2 class="text-sm font-black uppercase text-text-primary flex items-center gap-2 mb-4">
              <span class="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">3</span> 
              Tickets
            </h2>

            <div class="space-y-3">
              <div v-for="tier in selectedProduct.priceTiers" :key="tier.id" class="flex justify-between items-center p-4 bg-background border border-border rounded-2xl">
                <div>
                  <h4 class="font-bold text-text-primary">{{ getTicketCategoryName(tier.ticketCategoryId) }}</h4>
                  <p class="text-sm text-text-secondary">${{ tier.price.toFixed(2) }}</p>
                </div>
                <div class="flex items-center gap-4">
                  <button @click="form.tickets[tier.id]--" :disabled="form.tickets[tier.id] <= 0" class="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center font-bold hover:bg-red-50 disabled:opacity-30">-</button>
                  <span class="w-8 text-center font-black text-xl">{{ form.tickets[tier.id] }}</span>
                  <button @click="form.tickets[tier.id]++" class="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">+</button>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- Columna Derecha: Checkout -->
      <div class="space-y-6">
        <div class="bg-surface rounded-3xl border border-border p-6 sticky top-24">
          <h2 class="text-xl font-black text-text-primary mb-6">Resumen de Venta</h2>
          
          <div class="space-y-4 mb-8">
            <BaseInput label="Nombre del Cliente" v-model="form.clientName" />
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="relative">
                <BaseInput 
                  label="RUC / Cédula" 
                  v-model="form.clientTaxId" 
                  placeholder="179000..." 
                />
                <div class="absolute right-3 top-[34px] flex items-center">
                  <div v-if="validatingClient" class="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                  <CheckCircleIcon v-else-if="isExistingClient" class="h-5 w-5 text-green-500" title="Cliente frecuente encontrado" />
                  <UserPlusIcon v-else-if="form.clientTaxId.length >= 10" class="h-5 w-5 text-text-secondary opacity-50" title="Nuevo cliente" />
                </div>
              </div>
              <BaseInput label="Email (Factura)" v-model="form.clientEmail" type="email" />
            </div>
            <BaseInput label="Dirección de Facturación" v-model="form.clientAddress" placeholder="Ej: Av. Principal N12" />
            
            <div class="space-y-2 pt-4">
              <label class="text-xs font-bold text-text-secondary uppercase">Método de Pago Local</label>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button 
                  @click="form.paymentMethod = 'cash'"
                  class="flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-bold transition-all"
                  :class="form.paymentMethod === 'cash' ? 'bg-primary/10 border-primary text-primary' : 'border-border text-text-secondary'"
                >
                  <BanknotesIcon class="h-5 w-5" /> Efectivo
                </button>
                <button 
                  @click="form.paymentMethod = 'card'"
                  class="flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-bold transition-all"
                  :class="form.paymentMethod === 'card' ? 'bg-primary/10 border-primary text-primary' : 'border-border text-text-secondary'"
                >
                  <CreditCardIcon class="h-5 w-5" /> Tarjeta POS
                </button>
              </div>
            </div>
          </div>

          <div class="border-t border-border pt-6 mb-6 space-y-2">
            <div class="flex justify-between items-center">
              <span class="text-text-secondary">Tickets Totales</span>
              <span class="font-bold">{{ totalTickets }}</span>
            </div>
            <div class="flex justify-between items-center text-sm">
              <span class="text-text-secondary">Subtotal</span>
              <span class="font-medium">${{ subtotal.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between items-center text-sm">
              <span class="text-text-secondary">IVA ({{ (taxRate * 100).toFixed(0) }}%)</span>
              <span class="font-medium">${{ taxAmount.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between items-end pt-2 border-t border-border/50">
              <span class="text-lg font-bold text-text-primary">Total a Cobrar</span>
              <span class="text-4xl font-black text-primary">${{ totalAmount.toFixed(2) }}</span>
            </div>
          </div>

          <BaseButton 
            class="w-full py-4 text-lg" 
            color="success" 
            :disabled="totalTickets === 0 || !form.slotId"
            :loading="loading"
            @click="registerSale"
          >
            <CheckCircleIcon class="h-6 w-6 mr-2" />
            Procesar Pago
          </BaseButton>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.animate-in {
  animation: fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
