<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useCheckoutStore } from '@/stores/checkout'
import bookingService from '@/services/bookings'
import paymentService from '@/services/payments'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import Swal from 'sweetalert2'
import {
  CreditCardIcon, ShieldCheckIcon, LockClosedIcon, CheckCircleIcon,
  ArrowLeftIcon, ClockIcon, MapPinIcon, TicketIcon, UserIcon, ChevronRightIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()
const checkoutStore = useCheckoutStore()

// Scroll al top al cargar (fix: la página no debe aparecer al fondo)
onMounted(() => {
  window.scrollTo({ top: 0, behavior: 'instant' })
  if (!checkoutStore.attraction || !checkoutStore.slot) {
    router.push('/attractions')
  }
})

// Acceso directo al estado del store (Pinia desenvuelve automáticamente los refs)
const attraction = computed(() => checkoutStore.attraction)
const slot = computed(() => checkoutStore.slot)
const product = computed(() => checkoutStore.product)
const cartItems = computed(() => checkoutStore.cartItems)
const cartTotal = computed(() => checkoutStore.cartItems.reduce((s, i) => s + i.subtotal, 0))
const cartCount = computed(() => checkoutStore.cartItems.reduce((s, i) => s + i.qty, 0))
const passengerForms = computed(() => checkoutStore.passengerForms)

// Steps: 1 = Datos viajero, 2 = Pago
const currentStep = ref(1)
const processingPayment = ref(false)
const errors = ref({})

const paymentMethod = ref('card')
const paymentForm = ref({ cardNumber: '', expiry: '', cvv: '', cardName: '' })

// ── Validation helpers ──────────────────────────────────────────────────────

// Solo letras y espacios (sin números ni símbolos)
function onlyLetters(e) {
  const char = String.fromCharCode(e.charCode)
  if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]$/.test(char)) e.preventDefault()
}

// Limpiar el número de documento al cambiar el tipo
function onDocTypeChange(p) {
  p.docNumber = ''
}

// Solo dígitos numéricos
function onlyDigits(e) {
  if (!/\d/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
    e.preventDefault()
  }
}

// Validación dinámica del campo de documento según tipo
function validateDocInput(e, p) {
  if (p.docType === 'Cédula' || p.docType === 'DNI') {
    // Solo números
    if (!/\d/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault()
    }
  }
  // Pasaporte: permite letras y números (sin símbolos especiales)
}

// Formateo reactivo con watchers (más robusto que eventos directos del DOM)
watch(() => paymentForm.value.cardNumber, (newVal) => {
  if (!newVal) return
  const digits = newVal.replace(/\D/g, '').slice(0, 16)
  const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ')
  if (newVal !== formatted) {
    paymentForm.value.cardNumber = formatted
  }
})

watch(() => paymentForm.value.expiry, (newVal) => {
  if (!newVal) return
  const digits = newVal.replace(/\D/g, '').slice(0, 4)
  const formatted = digits.length >= 3 ? digits.slice(0, 2) + '/' + digits.slice(2) : digits
  if (newVal !== formatted) {
    paymentForm.value.expiry = formatted
  }
})

// Solo dígitos en tarjeta (se mantiene para bloquear letras desde el teclado)
function onlyDigitsCard(e) {
  if (!/\d/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
    e.preventDefault()
  }
}

// Solo dígitos en CVV
function onlyDigitsCvv(e) {
  if (!/\d/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
    e.preventDefault()
  }
}

function clearError(field) { delete errors.value[field] }

function validatePassengers() {
  const e = {}
  // Nombre: solo letras, sin números ni caracteres especiales peligrosos
  const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]{2,}$/
  // Email estricto: bloquea caracteres de inyección SQL/XSS
  const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/

  passengerForms.value.forEach((p, i) => {
    if (!p.firstName.trim()) {
      e[`fn_${i}`] = 'Nombre requerido'
    } else if (!nameRegex.test(p.firstName.trim())) {
      e[`fn_${i}`] = 'Solo letras, sin números ni símbolos'
    }

    if (!p.lastName.trim()) {
      e[`ln_${i}`] = 'Apellido requerido'
    } else if (!nameRegex.test(p.lastName.trim())) {
      e[`ln_${i}`] = 'Solo letras, sin números ni símbolos'
    }

    if (!p.docNumber.trim()) {
      e[`dn_${i}`] = 'Documento requerido'
    } else if (p.docType === 'Cédula' || p.docType === 'DNI') {
      if (!/^\d{10}$/.test(p.docNumber.trim())) {
        e[`dn_${i}`] = 'La Cédula debe tener exactamente 10 dígitos numéricos'
      }
    } else if (p.docType === 'Pasaporte') {
      if (!/^[A-Z0-9]{6,12}$/i.test(p.docNumber.trim())) {
        e[`dn_${i}`] = 'Pasaporte inválido (6-12 caracteres alfanuméricos)'
      }
    }

    // Email solo requerido para el primer pasajero
    if (p.email !== 'n/a') {
      if (!p.email?.trim()) {
        e[`em_${i}`] = 'Email de contacto requerido'
      } else if (!emailRegex.test(p.email.trim())) {
        e[`em_${i}`] = 'Formato de email inválido'
      }
    }
  })
  errors.value = e
  return Object.keys(e).length === 0
}

function validatePayment() {
  const e = {}
  if (paymentMethod.value === 'card') {
    const raw = paymentForm.value.cardNumber.replace(/\s/g, '')
    if (!/^\d{16}$/.test(raw)) e.card = 'Número de tarjeta inválido (16 dígitos)'

    if (!paymentForm.value.cardName.trim()) e.cardName = 'Nombre en tarjeta requerido'

    if (!/^\d{2}\/\d{2}$/.test(paymentForm.value.expiry)) {
      e.expiry = 'Formato inválido (MM/AA)'
    } else {
      const [mm, aa] = paymentForm.value.expiry.split('/').map(Number)
      const now = new Date()
      const curMonth = now.getMonth() + 1
      const curYear = Number(now.getFullYear().toString().slice(-2))
      if (mm < 1 || mm > 12) {
        e.expiry = 'Mes inválido (01-12)'
      } else if (aa < curYear || (aa === curYear && mm < curMonth)) {
        e.expiry = 'La tarjeta está vencida'
      }
    }

    const cvvRaw = paymentForm.value.cvv.replace(/\D/g, '')
    if (cvvRaw.length < 3 || cvvRaw.length > 4) e.cvv = 'CVV inválido (3-4 dígitos)'
  }
  errors.value = e
  return Object.keys(e).length === 0
}

function goToPayment() {
  if (!validatePassengers()) return
  currentStep.value = 2
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function processPayment() {
  if (!validatePayment()) return
  processingPayment.value = true
  try {
    const payload = {
      slotId: slot.value.id,
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

    await new Promise(r => setTimeout(r, 1500))
    const fakeExternalId = 'pi_' + Math.random().toString(36).substr(2, 9)

    await paymentService.create({
      bookingId: booking.id,
      paymentMethodId: paymentMethod.value === 'paypal' ? 3 : 1,
      amount: cartTotal.value,
      currencyCode: 'USD',
      transactionExternalId: fakeExternalId,
      statusId: 2
    })

    checkoutStore.clear()

    await Swal.fire({
      icon: 'success',
      title: '¡Reserva Confirmada!',
      html: `<b>PNR: ${booking.pnrCode || 'Confirmado'}</b><br>
             Tu experiencia en <b>${attraction.value?.name}</b> está reservada.<br>
             Revisa tu correo en <b>${payload.contactEmail}</b>.`,
      confirmButtonColor: '#3b82f6',
      confirmButtonText: 'Ver mis reservas'
    })
    router.push('/my-bookings')
  } catch (err) {
    const msg = err.response?.data?.message || err.message || 'Error al procesar el pago.'
    Swal.fire({ icon: 'error', title: 'Error de Pago', text: msg, confirmButtonColor: '#ef4444' })
  } finally {
    processingPayment.value = false
  }
}
</script>

<template>
  <div v-if="!attraction" class="min-h-screen flex items-center justify-center">
    <div class="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
  </div>

  <div v-else class="min-h-screen bg-background">
    <!-- Header -->
    <div class="bg-surface border-b border-border sticky top-0 z-30">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <button @click="router.back()" class="flex items-center gap-2 text-text-secondary hover:text-primary transition-colors text-sm font-medium">
          <ArrowLeftIcon class="h-5 w-5" /> Volver
        </button>
        <div class="flex items-center gap-2 text-sm font-black text-text-primary">
          <LockClosedIcon class="h-4 w-4 text-green-600" />
          Pago Seguro
        </div>
        <!-- Step indicator -->
        <div class="flex items-center gap-2 text-xs">
          <span :class="currentStep >= 1 ? 'text-primary font-bold' : 'text-text-secondary'">Viajeros</span>
          <ChevronRightIcon class="h-3 w-3 text-border" />
          <span :class="currentStep >= 2 ? 'text-primary font-bold' : 'text-text-secondary'">Pago</span>
        </div>
      </div>
    </div>

    <div class="max-w-5xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">

      <!-- LEFT: Main Form -->
      <div class="lg:col-span-2 space-y-6">

        <!-- Step 1: Passenger Data -->
        <div v-if="currentStep === 1" class="space-y-6">
          <div>
            <h1 class="text-2xl font-black text-text-primary">Datos del viajero</h1>
            <p class="text-text-secondary text-sm mt-1">
              {{ product?.isPrivate ? 'Tour privado: ingresa los datos de cada participante.' : 'Ingresa los datos de un representante por categoría de ticket.' }}
            </p>
          </div>

          <div v-for="(p, i) in passengerForms" :key="i" class="bg-surface border border-border rounded-2xl p-6 space-y-4">
            <div class="flex items-center gap-3 pb-3 border-b border-border">
              <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <UserIcon class="h-4 w-4 text-primary" />
              </div>
              <div>
                <div class="font-bold text-text-primary text-sm">{{ p.tierName }}</div>
                <div class="text-xs text-text-secondary" v-if="p.qty > 1">{{ p.qty }} personas</div>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="space-y-1">
                <BaseInput :label="i === 0 ? 'Nombre (Contacto principal)' : 'Nombre'" v-model="p.firstName" @keypress="onlyLetters" required />
                <p v-if="errors[`fn_${i}`]" class="text-xs text-red-500">{{ errors[`fn_${i}`] }}</p>
              </div>
              <div class="space-y-1">
                <BaseInput label="Apellido" v-model="p.lastName" @keypress="onlyLetters" required />
                <p v-if="errors[`ln_${i}`]" class="text-xs text-red-500">{{ errors[`ln_${i}`] }}</p>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="text-sm font-semibold text-text-primary ml-1">Tipo de Documento</label>
                <select v-model="p.docType" @change="onDocTypeChange(p)" class="w-full bg-background border border-border rounded-xl py-2.5 px-4 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                  <option>Cédula</option>
                  <option>Pasaporte</option>
                  <option>DNI</option>
                </select>
              </div>
              <div class="space-y-1">
                <BaseInput 
                  :label="'Número de Documento'"
                  v-model="p.docNumber"
                  :maxlength="p.docType === 'Cédula' || p.docType === 'DNI' ? 10 : 12"
                  :placeholder="p.docType === 'Cédula' ? '10 dígitos' : p.docType === 'Pasaporte' ? 'Ej: AB1234567' : ''"
                  @keydown="validateDocInput($event, p)"
                  required
                />
                <p v-if="errors[`dn_${i}`]" class="text-xs text-red-500">{{ errors[`dn_${i}`] }}</p>
              </div>
            </div>

            <div v-if="i === 0" class="space-y-1">
              <BaseInput label="Email de contacto" type="email" v-model="p.email" placeholder="Para recibir confirmación" required />
              <p v-if="errors[`em_${i}`]" class="text-xs text-red-500">{{ errors[`em_${i}`] }}</p>
            </div>
          </div>

          <BaseButton class="w-full py-4 text-base" @click="goToPayment">
            Continuar al Pago <ChevronRightIcon class="h-5 w-5 ml-1" />
          </BaseButton>
        </div>

        <!-- Step 2: Payment -->
        <div v-if="currentStep === 2" class="space-y-6">
          <div>
            <button @click="currentStep = 1" class="flex items-center gap-1 text-sm text-text-secondary hover:text-primary mb-4 transition-colors">
              <ArrowLeftIcon class="h-4 w-4" /> Editar datos del viajero
            </button>
            <h1 class="text-2xl font-black text-text-primary">Método de Pago</h1>
          </div>

          <!-- Method selector -->
          <div class="grid grid-cols-2 gap-3">
            <button @click="paymentMethod = 'card'"
              class="p-4 border-2 rounded-2xl flex items-center gap-3 transition-all font-bold text-sm"
              :class="paymentMethod === 'card' ? 'border-primary bg-primary/5 text-primary' : 'border-border text-text-secondary hover:border-primary/40'">
              <CreditCardIcon class="h-6 w-6" /> Tarjeta de crédito/débito
            </button>
            <button @click="paymentMethod = 'paypal'"
              class="p-4 border-2 rounded-2xl flex items-center gap-3 transition-all font-bold text-sm"
              :class="paymentMethod === 'paypal' ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-border text-text-secondary hover:border-blue-300'">
              <span class="text-lg font-black">Pay</span><span class="text-lg font-black text-blue-400">Pal</span>
            </button>
          </div>

          <!-- Card Form -->
          <div v-if="paymentMethod === 'card'" class="bg-surface border border-border rounded-2xl p-6 space-y-4">
            <div class="flex items-center gap-2 mb-4">
              <LockClosedIcon class="h-4 w-4 text-green-600" />
              <span class="text-xs text-text-secondary">Conexión cifrada SSL de 256 bits</span>
            </div>

            <!-- Card visual -->
            <div class="relative h-44 rounded-2xl bg-gradient-to-br from-primary via-blue-600 to-purple-700 text-white p-6 overflow-hidden shadow-lg mb-6">
              <div class="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/10 -mr-10 -mt-10"></div>
              <div class="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/5 -ml-8 -mb-8"></div>
              <div class="absolute top-5 right-6 text-xs font-bold opacity-70">VISA / MASTERCARD</div>
              <div class="text-xl font-mono font-bold tracking-widest mt-6">
                {{ paymentForm.cardNumber || '•••• •••• •••• ••••' }}
              </div>
              <div class="flex justify-between mt-4 text-sm">
                <div>
                  <div class="text-[10px] opacity-60 uppercase">Titular</div>
                  <div class="font-bold">{{ paymentForm.cardName || 'NOMBRE APELLIDO' }}</div>
                </div>
                <div class="text-right">
                  <div class="text-[10px] opacity-60 uppercase">Vence</div>
                  <div class="font-bold">{{ paymentForm.expiry || 'MM/AA' }}</div>
                </div>
              </div>
            </div>

            <div class="space-y-1">
              <label class="text-sm font-semibold text-text-primary ml-1">Número de tarjeta</label>
              <input
                type="text"
                inputmode="numeric"
                v-model="paymentForm.cardNumber"
                @keydown="onlyDigitsCard"
                placeholder="1234 5678 9012 3456"
                maxlength="19"
                class="w-full bg-surface border border-border rounded-xl py-2.5 px-4 transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-text-secondary/50 text-text-primary"
              />
              <p v-if="errors.card" class="text-xs text-red-500">{{ errors.card }}</p>
            </div>
            <div class="space-y-1">
              <BaseInput label="Nombre en la tarjeta" v-model="paymentForm.cardName" placeholder="Como aparece en la tarjeta" @keypress="onlyLetters" />
              <p v-if="errors.cardName" class="text-xs text-red-500">{{ errors.cardName }}</p>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1">
                <label class="text-sm font-semibold text-text-primary ml-1">Vencimiento</label>
                <input
                  type="text"
                  inputmode="numeric"
                  v-model="paymentForm.expiry"
                  @keydown="onlyDigitsCard"
                  placeholder="MM/AA"
                  maxlength="5"
                  class="w-full bg-surface border border-border rounded-xl py-2.5 px-4 transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-text-secondary/50 text-text-primary"
                />
                <p v-if="errors.expiry" class="text-xs text-red-500">{{ errors.expiry }}</p>
              </div>
              <div class="space-y-1">
                <label class="text-sm font-semibold text-text-primary ml-1">CVV</label>
                <input
                  type="password"
                  inputmode="numeric"
                  :value="paymentForm.cvv"
                  @input="e => { paymentForm.cvv = e.target.value.replace(/\D/g, '').slice(0, 4) }"
                  @keydown="onlyDigitsCvv"
                  placeholder="•••"
                  maxlength="4"
                  class="w-full bg-surface border border-border rounded-xl py-2.5 px-4 transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-text-secondary/50 text-text-primary"
                />
                <p v-if="errors.cvv" class="text-xs text-red-500">{{ errors.cvv }}</p>
              </div>
            </div>
          </div>

          <!-- PayPal placeholder -->
          <div v-if="paymentMethod === 'paypal'" class="bg-blue-50 border border-blue-200 rounded-2xl p-8 text-center">
            <div class="text-4xl font-black text-blue-600 mb-3">Pay<span class="text-blue-400">Pal</span></div>
            <p class="text-text-secondary text-sm">Serás redirigido a PayPal para completar el pago de forma segura.</p>
            <p class="text-xs text-text-secondary mt-2 italic">* Integración con API de PayPal pendiente de configuración.</p>
          </div>

          <!-- Guarantee badges -->
          <div class="flex flex-wrap gap-3 justify-center pt-2">
            <span class="flex items-center gap-1 text-xs text-text-secondary bg-surface border border-border rounded-full px-3 py-1.5">
              <ShieldCheckIcon class="h-4 w-4 text-green-500" /> Pago 100% seguro
            </span>
            <span class="flex items-center gap-1 text-xs text-text-secondary bg-surface border border-border rounded-full px-3 py-1.5">
              <CheckCircleIcon class="h-4 w-4 text-blue-500" /> Confirmación inmediata
            </span>
            <span class="flex items-center gap-1 text-xs text-text-secondary bg-surface border border-border rounded-full px-3 py-1.5">
              <LockClosedIcon class="h-4 w-4 text-primary" /> Datos encriptados
            </span>
          </div>

          <BaseButton class="w-full py-4 text-base" @click="processPayment" :loading="processingPayment">
            <LockClosedIcon class="h-5 w-5 mr-2" />
            Pagar ${{ cartTotal.toFixed(2) }} USD
          </BaseButton>
        </div>
      </div>

      <!-- RIGHT: Order Summary Sidebar -->
      <aside class="space-y-4">
        <div class="bg-surface border border-border rounded-2xl p-5 sticky top-24">
          <h3 class="font-black text-text-primary mb-4">Resumen de tu reserva</h3>

          <div class="space-y-3">
            <div class="flex items-start gap-3">
              <MapPinIcon class="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <div class="font-bold text-text-primary text-sm">{{ attraction?.name }}</div>
                <div class="text-xs text-text-secondary">{{ attraction?.locationName }}</div>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <TicketIcon class="h-4 w-4 text-primary shrink-0" />
              <div class="text-sm text-text-secondary">{{ product?.title }}</div>
            </div>
            <div class="flex items-center gap-3">
              <ClockIcon class="h-4 w-4 text-primary shrink-0" />
              <div class="text-sm">
                <span class="font-bold text-text-primary">{{ slot?.slotDate }}</span>
                <span class="text-text-secondary ml-1">a las {{ slot?.startTime?.substring(0,5) }}</span>
              </div>
            </div>
          </div>

          <div class="border-t border-border mt-4 pt-4 space-y-2">
            <div v-for="item in cartItems" :key="item.tierId" class="flex justify-between text-sm">
              <span class="text-text-secondary">{{ item.name }} × {{ item.qty }}</span>
              <span class="font-bold text-text-primary">${{ item.subtotal.toFixed(2) }}</span>
            </div>
          </div>

          <div class="border-t border-border mt-4 pt-4 flex justify-between items-center">
            <span class="font-black text-text-primary">Total</span>
            <span class="text-2xl font-black text-primary">${{ cartTotal.toFixed(2) }}<span class="text-xs text-text-secondary font-normal ml-1">USD</span></span>
          </div>

          <div class="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-700 text-center">
            ✅ {{ product?.cancelPolicyText || 'Cancelación gratuita disponible' }}
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>
