<script setup>
import { ref, onMounted, computed } from 'vue'
import scheduleService from '@/services/schedule'
import attractionService from '@/services/attractions'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import Swal from 'sweetalert2'
import { 
  CalendarDaysIcon, 
  ClockIcon, 
  TrashIcon, 
  ChevronRightIcon,
  ArrowLeftIcon,
  TableCellsIcon,
  CogIcon
} from '@heroicons/vue/24/outline'

// ── Estado de Selección ─────────────────────────────────────────────────────
const attractions = ref([])
const selectedAttractionId = ref('')
const products = ref([])
const selectedProduct = ref(null) // El objeto completo de la modalidad seleccionada
const loading = ref(false)
const loadingProducts = ref(false)

// ── Pestañas ────────────────────────────────────────────────────────────────
const activeTab = ref('config') // 'config' | 'slots'

// ── Formulario de Configuración (Plantilla) ───────────────────────────────
const templateForm = ref(initialTemplateForm())

function initialTemplateForm() {
  return {
    name: 'Horario Regular',
    validFrom: new Date().toISOString().split('T')[0],
    validTo: '',
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: false,
    sunday: false,
    defaultCapacity: 20,
    times: [{ startTime: '09:00', capacityOverride: null }]
  }
}

const daysList = [
  { key: 'monday',    label: 'L', name: 'Lunes' },
  { key: 'tuesday',   label: 'M', name: 'Martes' },
  { key: 'wednesday', label: 'M', name: 'Miércoles' },
  { key: 'thursday',  label: 'J', name: 'Jueves' },
  { key: 'friday',    label: 'V', name: 'Viernes' },
  { key: 'saturday',  label: 'S', name: 'Sábado' },
  { key: 'sunday',    label: 'D', name: 'Domingo' }
]

const addTime = () => {
  templateForm.value.times.push({ startTime: '09:00', capacityOverride: null })
}

const removeTime = (idx) => {
  templateForm.value.times.splice(idx, 1)
}

const saveSchedule = async () => {
  // --- Validaciones ---
  if (!templateForm.value.validFrom || !templateForm.value.validTo) {
    return Swal.fire('Atención', 'Debes indicar las fechas de inicio y fin de la vigencia.', 'warning')
  }
  if (templateForm.value.validFrom > templateForm.value.validTo) {
    return Swal.fire('Atención', 'La fecha “Válido Desde” no puede ser posterior a “Válido Hasta”.', 'warning')
  }
  if (!templateForm.value.defaultCapacity || templateForm.value.defaultCapacity < 1) {
    return Swal.fire('Atención', 'La capacidad total debe ser mayor a 0.', 'warning')
  }
  // Validar contra el maxGroupSize de la modalidad seleccionada
  const maxPax = selectedProduct.value?.maxGroupSize
  if (maxPax && templateForm.value.defaultCapacity < maxPax) {
    return Swal.fire(
      'Capacidad insuficiente',
      `La capacidad total (${templateForm.value.defaultCapacity} cupos) no puede ser menor al máximo de participantes por reserva de esta modalidad (${maxPax} pax). Ajusta la capacidad a al menos ${maxPax}.`,
      'warning'
    )
  }
  if (templateForm.value.times.length === 0) {
    return Swal.fire('Atención', 'Agrega al menos un horario de salida.', 'warning')
  }
  // Validar capacidades específicas de cada horario
  for (const t of templateForm.value.times) {
    if (t.capacityOverride !== null && t.capacityOverride !== undefined && t.capacityOverride !== '') {
      const cap = Number(t.capacityOverride)
      if (cap < 1) {
        return Swal.fire('Atención', 'La capacidad específica de un horario debe ser mayor a 0.', 'warning')
      }
      if (maxPax && cap < maxPax) {
        return Swal.fire(
          'Capacidad específica insuficiente',
          `Una de las capacidades específicas (${cap}) es menor al máximo de pax de la modalidad (${maxPax}).`,
          'warning'
        )
      }
    }
  }

  loading.value = true
  try {
    const payload = {
      ...templateForm.value,
      times: templateForm.value.times.map(t => ({
        startTime: t.startTime.length === 5 ? t.startTime : t.startTime.substring(0, 5),
        capacityOverride: t.capacityOverride ? Number(t.capacityOverride) : null
      }))
    }
    const result = await scheduleService.createSchedule(selectedProduct.value.id, payload)
    Swal.fire({
      icon: 'success',
      title: 'Disponibilidad Generada',
      text: result.message || 'La disponibilidad ha sido creada y los slots generados correctamente.',
      confirmButtonColor: '#3b82f6'
    })
    templateForm.value = initialTemplateForm()
    activeTab.value = 'slots'
    await loadSlots()
  } catch (err) {
    Swal.fire('Error', err.response?.data?.message || err.message, 'error')
  } finally {
    loading.value = false
  }
}

// ── Gestión de Slots Generados ──────────────────────────────────────────────
const slots = ref([])
const loadingSlots = ref(false)
const slotFilters = ref({
  fromDate: new Date().toISOString().split('T')[0],
  toDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
  startTime: ''
})
const selectedSlotIds = ref([])
const expandedDates = ref([])

const groupedSlots = computed(() => {
  const groups = {}
  
  slots.value.forEach(slot => {
    // Filtro local por hora
    if (slotFilters.value.startTime) {
      const filterTime = slotFilters.value.startTime.substring(0, 5)
      const sTime = slot.startTime ? slot.startTime.substring(0, 5) : ''
      if (sTime !== filterTime) return // Saltar si no coincide
    }

    if (!groups[slot.slotDate]) {
      groups[slot.slotDate] = []
    }
    groups[slot.slotDate].push(slot)
  })

  // Convertir a arreglo y ordenar
  return Object.keys(groups).sort().map(date => ({
    date,
    slots: groups[date]
  }))
})

// Total de slots después del filtro para contar fácilmente
const totalFilteredSlots = computed(() => {
  return groupedSlots.value.reduce((total, group) => total + group.slots.length, 0)
})

const toggleDate = (date) => {
  const idx = expandedDates.value.indexOf(date)
  if (idx > -1) expandedDates.value.splice(idx, 1)
  else expandedDates.value.push(date)
}

const loadSlots = async () => {
  if (!selectedProduct.value) return
  loadingSlots.value = true
  selectedSlotIds.value = []
  expandedDates.value = []
  try {
    const data = await scheduleService.getSlots(selectedProduct.value.id, slotFilters.value)
    slots.value = data || []
    // Expandir la primera fecha por defecto si hay resultados
    if (slots.value.length > 0) {
      expandedDates.value.push(slots.value[0].slotDate)
    }
  } catch (err) {
    Swal.fire('Error', 'No se pudieron cargar los horarios generados.', 'error')
    slots.value = []
  } finally {
    loadingSlots.value = false
  }
}

const toggleSlotSelection = (slotId) => {
  const idx = selectedSlotIds.value.indexOf(slotId)
  if (idx > -1) {
    selectedSlotIds.value.splice(idx, 1)
  } else {
    selectedSlotIds.value.push(slotId)
  }
}

const toggleAllSlotsInGroup = (groupSlots) => {
  const availableSlots = groupSlots.filter(s => !s.hasBookings).map(s => s.id)
  const allSelected = availableSlots.every(id => selectedSlotIds.value.includes(id))
  
  if (allSelected && availableSlots.length > 0) {
    // Deseleccionar todos
    selectedSlotIds.value = selectedSlotIds.value.filter(id => !availableSlots.includes(id))
  } else {
    // Seleccionar todos los disponibles que no estén ya seleccionados
    availableSlots.forEach(id => {
      if (!selectedSlotIds.value.includes(id)) {
        selectedSlotIds.value.push(id)
      }
    })
  }
}

const deleteSlot = async (slot) => {
  if (slot.hasBookings) {
    return Swal.fire('Acción no permitida', 'Este horario tiene reservas y no puede eliminarse.', 'error')
  }
  
  const confirm = await Swal.fire({
    title: '¿Eliminar horario?',
    text: `Eliminarás el horario del ${slot.slotDate} a las ${slot.startTime.substring(0,5)}.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  })

  if (!confirm.isConfirmed) return

  loading.value = true
  try {
    await scheduleService.deleteSlot(selectedProduct.value.id, slot.id)
    Swal.fire('Eliminado', 'El horario ha sido eliminado.', 'success')
    await loadSlots()
  } catch (err) {
    Swal.fire('Error', err.response?.data?.message || err.message, 'error')
  } finally {
    loading.value = false
  }
}

// ── Eliminación Masiva (Bulk) ───────────────────────────────────────────────
const showBulkDeleteModal = ref(false)
const bulkDeleteType = ref('exact') // 'exact', 'range', 'day'
const bulkDeleteForm = ref({ exactDate: '', fromDate: '', toDate: '', dayOfWeek: 0 })

const executeBulkDelete = async () => {
  const confirm = await Swal.fire({
    title: 'Confirmar Eliminación Masiva',
    text: 'Se eliminarán los slots que coincidan con el criterio seleccionado. Las reservas activas no serán afectadas.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    confirmButtonText: 'Eliminar',
    cancelButtonText: 'Cancelar'
  })

  if (!confirm.isConfirmed) return

  loading.value = true
  try {
    const payload = {}
    if (bulkDeleteType.value === 'exact') payload.exactDate = bulkDeleteForm.value.exactDate
    if (bulkDeleteType.value === 'range') {
      payload.fromDate = bulkDeleteForm.value.fromDate
      payload.toDate = bulkDeleteForm.value.toDate
    }
    if (bulkDeleteType.value === 'day') {
      payload.fromDate = bulkDeleteForm.value.fromDate
      payload.toDate = bulkDeleteForm.value.toDate
      payload.dayOfWeek = bulkDeleteForm.value.dayOfWeek
    }

    const res = await scheduleService.bulkDeleteSlots(selectedProduct.value.id, payload)
    Swal.fire('Éxito', res.message || `Se eliminaron ${res.slotsDeleted} slots. ${res.slotsSkipped} omitidos.`, 'success')
    showBulkDeleteModal.value = false
    await loadSlots()
  } catch (err) {
    Swal.fire('Error', err.response?.data?.message || err.message, 'error')
  } finally {
    loading.value = false
  }
}

// ── Navegación General ──────────────────────────────────────────────────────
const onAttractionChange = async () => {
  selectedProduct.value = null
  products.value = []
  slots.value = []

  if (!selectedAttractionId.value) return

  loadingProducts.value = true
  try {
    products.value = await scheduleService.getByAttraction(selectedAttractionId.value)
  } catch (err) {
    Swal.fire('Error', 'No se pudieron cargar las modalidades.', 'error')
  } finally {
    loadingProducts.value = false
  }
}

const onProductSelect = async (product) => {
  selectedProduct.value = product
  activeTab.value = 'config'
}

const backToProducts = () => {
  selectedProduct.value = null
  slots.value = []
}

onMounted(async () => {
  try {
    const res = await attractionService.getManagementList({ pageSize: 100 })
    attractions.value = res.items || []
  } catch (error) {
    console.error('Error cargando atracciones:', error)
  }
})
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-6 pb-20">

    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-2xl font-bold text-text-primary flex items-center gap-2">
          <CalendarDaysIcon class="h-8 w-8 text-primary" /> Gestión de Horarios
        </h1>
        <p class="text-text-secondary mt-1 text-sm">Configura la disponibilidad y gestiona los horarios generados por modalidad.</p>
      </div>

      <!-- Selector Atracción -->
      <div class="w-full sm:w-72">
        <label class="text-xs font-bold uppercase text-text-secondary ml-1">Seleccionar Atracción</label>
        <select 
          v-model="selectedAttractionId" 
          @change="onAttractionChange" 
          class="w-full bg-surface border border-border rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
        >
          <option value="">Seleccione una experiencia...</option>
          <option v-for="attr in attractions" :key="attr.id" :value="attr.id">{{ attr.name }}</option>
        </select>
      </div>
    </div>

    <!-- Estado inicial -->
    <div v-if="!selectedAttractionId" class="py-24 text-center bg-surface rounded-3xl border border-dashed border-border">
      <CalendarDaysIcon class="h-12 w-12 mx-auto text-border mb-3" />
      <p class="text-text-secondary">Selecciona una atracción para gestionar sus modalidades.</p>
    </div>

    <!-- Cargando modalidades -->
    <div v-else-if="loadingProducts" class="py-24 text-center bg-surface rounded-3xl border border-border">
      <div class="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-3"></div>
      <p class="text-text-secondary text-sm">Cargando modalidades...</p>
    </div>

    <!-- ── Lista de Modalidades ─────────────────────────────────────── -->
    <div v-else-if="!selectedProduct" class="space-y-4">
      <div class="flex justify-between items-center">
        <h2 class="text-lg font-bold text-text-primary">Modalidades de la Atracción</h2>
        <span class="text-xs text-text-secondary">{{ products.length }} modalidad(es)</span>
      </div>

      <div v-if="products.length === 0" class="py-16 text-center bg-surface rounded-3xl border border-dashed border-border">
        <p class="text-text-secondary italic">Esta atracción no tiene modalidades configuradas aún.</p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <button
          v-for="prod in products"
          :key="prod.id"
          @click="onProductSelect(prod)"
          class="bg-surface border border-border rounded-2xl p-5 text-left hover:border-primary hover:shadow-md transition-all group"
        >
          <div class="flex items-start justify-between mb-3">
            <div>
              <h3 class="font-bold text-text-primary group-hover:text-primary transition-colors">{{ prod.title }}</h3>
              <p class="text-xs text-text-secondary mt-0.5">{{ prod.isPrivate ? '🔒 Tour Exclusivo' : '👥 Tour Compartido' }}</p>
            </div>
            <span 
              class="text-[10px] font-black px-2 py-1 rounded-full uppercase"
              :class="prod.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'"
            >
              {{ prod.isActive !== false ? 'Activo' : 'Inactivo' }}
            </span>
          </div>
          <div class="flex items-center justify-between">
            <div class="text-xs text-text-secondary space-x-3">
              <span>Min: {{ prod.minParticipants || 1 }}</span>
              <span>Max: {{ prod.maxGroupSize || '—' }}</span>
            </div>
            <ChevronRightIcon class="h-5 w-5 text-text-secondary group-hover:text-primary transition-colors" />
          </div>
        </button>
      </div>
    </div>

    <!-- ── Vista de Modalidad Seleccionada ─────────────────────────── -->
    <div v-else class="space-y-6 animate-in fade-in">

      <!-- Breadcrumb -->
      <div class="flex items-center gap-3">
        <button @click="backToProducts" class="flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary transition-colors">
          <ArrowLeftIcon class="h-4 w-4" /> Modalidades
        </button>
        <ChevronRightIcon class="h-4 w-4 text-border" />
        <span class="text-sm font-bold text-text-primary">{{ selectedProduct.title }}</span>
      </div>

      <!-- Pestañas -->
      <div class="flex gap-2 bg-surface p-1 rounded-xl border border-border w-max flex-wrap">
        <button 
          @click="activeTab = 'config'" 
          class="px-5 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2"
          :class="activeTab === 'config' ? 'bg-primary text-white shadow-md' : 'text-text-secondary hover:text-primary'"
        >
          <CogIcon class="h-4 w-4" /> Configurar Disponibilidad
        </button>
        <button 
          @click="activeTab = 'slots'; loadSlots()" 
          class="px-5 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2"
          :class="activeTab === 'slots' ? 'bg-primary text-white shadow-md' : 'text-text-secondary hover:text-primary'"
        >
          <TableCellsIcon class="h-4 w-4" /> Horarios Generados
        </button>
      </div>

      <!-- ── TAB A: Configurar Disponibilidad ──────────────────────────── -->
      <div v-if="activeTab === 'config'" class="space-y-6">
        <div class="bg-surface rounded-3xl border border-border p-6 md:p-8">
          <div class="mb-6">
            <h2 class="text-lg font-bold text-text-primary">Definir Nuevo Patrón Horario</h2>
            <p class="text-sm text-text-secondary">Se guardará esta plantilla y se generarán los horarios automáticamente en el calendario.</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <BaseInput label="Nombre de la Configuración" v-model="templateForm.name" placeholder="Ej: Horario Regular" />
            <div class="space-y-1">
              <BaseInput label="Capacidad Total por Horario / Cupos" type="number" v-model.number="templateForm.defaultCapacity" :min="selectedProduct?.maxGroupSize || 1" />
              <p class="text-[10px] text-text-secondary px-1 italic">
                Mín. {{ selectedProduct?.maxGroupSize || 1 }} cupos (igual al máx. pax de la modalidad)
              </p>
            </div>
            <div class="space-y-1">
              <BaseInput label="Válido Desde" type="date" v-model="templateForm.validFrom"
                @change="templateForm.validTo = (templateForm.validTo && templateForm.validFrom > templateForm.validTo) ? '' : templateForm.validTo"
              />
            </div>
            <BaseInput label="Válido Hasta" type="date" v-model="templateForm.validTo" :min="templateForm.validFrom" />
          </div>

          <div class="space-y-3 mb-6">
            <label class="text-sm font-black uppercase text-text-secondary">Días de Operación</label>
            <div class="flex flex-wrap gap-3">
              <button 
                v-for="day in daysList" :key="day.key"
                @click.prevent="templateForm[day.key] = !templateForm[day.key]"
                class="w-14 h-14 rounded-xl text-sm font-black border transition-all flex flex-col items-center justify-center"
                :class="templateForm[day.key] ? 'bg-primary text-white border-primary shadow-md' : 'bg-background text-text-secondary border-border hover:bg-surface'"
              >
                <span class="text-base">{{ day.label }}</span>
                <span class="text-[10px] opacity-70 leading-none">{{ day.name.substring(0,3) }}</span>
              </button>
            </div>
          </div>

          <div class="space-y-4 mb-8">
            <div class="flex justify-between items-center">
              <label class="text-sm font-black uppercase text-text-secondary">Horarios de Salida</label>
              <BaseButton size="sm" variant="outline" @click="addTime">+ Añadir Hora</BaseButton>
            </div>
            <div class="flex flex-col gap-3">
              <div 
                v-for="(time, tIdx) in templateForm.times" :key="tIdx" 
                class="flex flex-wrap sm:flex-nowrap items-center gap-3 bg-background border border-border rounded-xl px-4 py-3"
              >
                <div class="flex items-center gap-2">
                  <ClockIcon class="h-5 w-5 text-primary flex-shrink-0" />
                  <input 
                    type="time" 
                    v-model="time.startTime" 
                    class="bg-transparent border border-border rounded-lg px-2 py-1 text-sm font-bold outline-none w-28 focus:border-primary" 
                  />
                </div>
                <div class="flex items-center gap-2 ml-auto">
                  <label class="text-xs text-text-secondary whitespace-nowrap">Capacidad Específica (Opcional):</label>
                  <input 
                    type="number" 
                    v-model.number="time.capacityOverride" 
                    placeholder="Auto"
                    min="1"
                    class="bg-transparent border border-border rounded-lg px-2 py-1 text-sm font-bold outline-none w-20 focus:border-primary text-center placeholder-gray-400" 
                    :title="`Mínimo ${selectedProduct?.maxGroupSize || 1} cupos. Si no se indica, se usa la capacidad total del patrón.`"
                  />
                  <button @click.prevent="removeTime(tIdx)" class="text-red-400 hover:text-red-600 transition-colors ml-2 p-1 bg-red-50 hover:bg-red-100 rounded-lg">
                    <TrashIcon class="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div v-if="templateForm.times.length === 0" class="p-4 rounded-xl border border-dashed border-border w-full text-center text-text-secondary italic">
                Añade al menos un horario para generar la disponibilidad.
              </div>
            </div>
          </div>

          <div class="flex justify-end pt-6 border-t border-border">
            <BaseButton @click="saveSchedule" :loading="loading" class="px-8">Generar Disponibilidad</BaseButton>
          </div>
        </div>
      </div>

      <!-- ── TAB B: Horarios Generados ─────────────────────────────────── -->
      <div v-if="activeTab === 'slots'" class="space-y-6">
        <div class="bg-surface rounded-3xl border border-border p-6 md:p-8">
          
          <!-- Filtros y Acciones -->
          <div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6 pb-6 border-b border-border">
            <div class="flex flex-wrap items-end gap-4">
              <div class="w-40">
                <label class="text-xs font-bold text-text-secondary ml-1">Desde</label>
                <input type="date" v-model="slotFilters.fromDate" class="w-full bg-background border border-border rounded-lg py-2 px-3 text-sm"
                  @change="slotFilters.toDate = (slotFilters.toDate && slotFilters.fromDate > slotFilters.toDate) ? slotFilters.fromDate : slotFilters.toDate"
                />
              </div>
              <div class="w-40">
                <label class="text-xs font-bold text-text-secondary ml-1">Hasta</label>
                <input type="date" v-model="slotFilters.toDate" :min="slotFilters.fromDate" class="w-full bg-background border border-border rounded-lg py-2 px-3 text-sm" />
              </div>
              <div class="w-32">
                <label class="text-xs font-bold text-text-secondary ml-1">Hora (Opcional)</label>
                <input type="time" v-model="slotFilters.startTime" class="w-full bg-background border border-border rounded-lg py-2 px-3 text-sm" />
              </div>
              <BaseButton size="sm" @click="loadSlots" :loading="loadingSlots">Buscar Rango</BaseButton>
            </div>
            
            <BaseButton size="sm" variant="outline" class="text-red-600 border-red-200 hover:bg-red-50" @click="showBulkDeleteModal = true">
              Eliminación Masiva
            </BaseButton>
          </div>

          <!-- Tabla de Slots -->
          <div v-if="loadingSlots" class="py-12 text-center text-text-secondary">
            Cargando horarios...
          </div>
          <div v-else-if="groupedSlots.length === 0" class="py-12 text-center border border-dashed border-border rounded-xl text-text-secondary italic">
            No se encontraron horarios con los filtros actuales.
          </div>
          <div v-else class="space-y-4">
            <div class="mb-3 flex justify-between items-center text-sm">
              <span class="text-text-secondary">Total: <strong>{{ totalFilteredSlots }}</strong> horarios en {{ groupedSlots.length }} días</span>
              <button v-if="selectedSlotIds.length > 0" @click="showBulkDeleteModal = true; bulkDeleteType = 'exact'" class="text-red-500 font-bold hover:underline">
                Eliminar {{ selectedSlotIds.length }} seleccionados
              </button>
            </div>
            
            <div v-for="group in groupedSlots" :key="group.date" class="border border-border rounded-2xl overflow-hidden bg-surface">
              <!-- Acordeón Header -->
              <button 
                @click="toggleDate(group.date)" 
                class="w-full flex items-center justify-between px-6 py-4 hover:bg-background/50 transition-colors"
                :class="expandedDates.includes(group.date) ? 'bg-background border-b border-border' : ''"
              >
                <div class="flex items-center gap-3">
                  <CalendarDaysIcon class="h-5 w-5 text-primary" />
                  <span class="font-bold text-text-primary">{{ group.date }}</span>
                  <span class="text-xs bg-primary/10 text-primary px-2 py-1 rounded-md">{{ group.slots.length }} horarios</span>
                </div>
                <div class="flex items-center gap-4">
                  <div @click.stop>
                    <button 
                      @click="toggleAllSlotsInGroup(group.slots)" 
                      class="text-xs font-bold px-3 py-1 rounded-lg transition-colors"
                      :class="group.slots.every(s => selectedSlotIds.includes(s.id) || s.hasBookings) && group.slots.filter(s => !s.hasBookings).length > 0 ? 'bg-primary text-white' : 'bg-surface border border-border text-text-secondary hover:text-primary'"
                    >
                      Seleccionar Todo
                    </button>
                  </div>
                  <ChevronRightIcon 
                    class="h-5 w-5 text-text-secondary transition-transform" 
                    :class="expandedDates.includes(group.date) ? 'rotate-90' : ''" 
                  />
                </div>
              </button>

              <!-- Acordeón Body (Tabla) -->
              <div v-show="expandedDates.includes(group.date)" class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                  <thead>
                    <tr class="bg-background text-text-secondary text-xs border-b border-border">
                      <th class="py-2 px-6 w-10"></th>
                      <th class="py-2 px-4 font-bold">Hora</th>
                      <th class="py-2 px-4 font-bold text-center">Cap. Total</th>
                      <th class="py-2 px-4 font-bold text-center text-blue-600">Vendidos</th>
                      <th class="py-2 px-4 font-bold text-center text-green-600">Disponibles</th>
                      <th class="py-2 px-4 font-bold">Estado</th>
                      <th class="py-2 px-6 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="slot in group.slots" :key="slot.id" class="border-b border-border/50 hover:bg-background/80 transition-colors last:border-b-0">
                      <td class="py-3 px-6">
                        <input 
                          type="checkbox" 
                          :disabled="slot.hasBookings" 
                          :checked="selectedSlotIds.includes(slot.id)" 
                          @change="toggleSlotSelection(slot.id)" 
                          class="rounded border-border text-primary focus:ring-primary disabled:opacity-50" 
                        />
                      </td>
                      <td class="py-3 px-4 font-bold text-primary flex items-center gap-2">
                        <ClockIcon class="h-4 w-4" /> {{ slot.startTime?.substring(0,5) }}
                      </td>
                      <td class="py-3 px-4 text-center">{{ slot.capacityTotal }}</td>
                      <td class="py-3 px-4 text-center">
                        <span class="font-bold" :class="slot.capacityTotal - slot.capacityAvailable > 0 ? 'text-blue-600' : 'text-text-secondary/40'">
                          {{ slot.capacityTotal - slot.capacityAvailable }}
                        </span>
                      </td>
                      <td class="py-3 px-4 text-center font-black" :class="slot.capacityAvailable === 0 ? 'text-red-500' : 'text-green-600'">
                        {{ slot.capacityAvailable }}
                      </td>
                      <td class="py-3 px-4">
                        <span v-if="slot.hasBookings" class="inline-flex items-center gap-1 text-xs font-bold px-2 py-1 bg-blue-100 text-blue-700 rounded-md">
                          <span class="w-2 h-2 rounded-full bg-blue-500"></span> Con reservas
                        </span>
                        <span v-else-if="slot.capacityAvailable === 0" class="inline-flex items-center gap-1 text-xs font-bold px-2 py-1 bg-red-100 text-red-700 rounded-md">
                          <span class="w-2 h-2 rounded-full bg-red-500"></span> Lleno
                        </span>
                        <span v-else class="inline-flex items-center gap-1 text-xs font-bold px-2 py-1 bg-green-100 text-green-700 rounded-md">
                          <span class="w-2 h-2 rounded-full bg-green-500"></span> Libre
                        </span>
                      </td>
                      <td class="py-3 px-6 text-right">
                        <button 
                          @click="deleteSlot(slot)" 
                          :disabled="slot.hasBookings"
                          class="p-1.5 rounded-lg text-text-secondary hover:text-red-500 hover:bg-red-50 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-text-secondary transition-all"
                          :title="slot.hasBookings ? 'No se puede eliminar porque tiene reservas' : 'Eliminar horario'"
                        >
                          <TrashIcon class="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>

  <!-- Modal Eliminación Masiva -->
  <div v-if="showBulkDeleteModal" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
    <div class="bg-surface rounded-3xl w-full max-w-md p-6 shadow-xl border border-border">
      <h3 class="text-lg font-bold text-red-600 mb-2">Eliminación Masiva de Horarios</h3>
      <p class="text-sm text-text-secondary mb-6">Selecciona el criterio para eliminar múltiples horarios a la vez. No se afectarán horarios que ya tengan reservas.</p>
      
      <div class="flex gap-4 mb-4">
        <label class="flex items-center gap-2 cursor-pointer">
          <input type="radio" v-model="bulkDeleteType" value="exact" class="text-red-500 focus:ring-red-500" />
          <span class="text-sm font-bold text-text-secondary">Día Específico</span>
        </label>
        <label class="flex items-center gap-2 cursor-pointer">
          <input type="radio" v-model="bulkDeleteType" value="range" class="text-red-500 focus:ring-red-500" />
          <span class="text-sm font-bold text-text-secondary">Rango / Mes</span>
        </label>
        <label class="flex items-center gap-2 cursor-pointer">
          <input type="radio" v-model="bulkDeleteType" value="day" class="text-red-500 focus:ring-red-500" />
          <span class="text-sm font-bold text-text-secondary">Día Semanal</span>
        </label>
      </div>

      <div class="bg-red-500/5 p-4 rounded-xl border border-red-500/20 mb-6 space-y-4">
        <div v-if="bulkDeleteType === 'exact'">
          <BaseInput label="Fecha exacta a eliminar" type="date" v-model="bulkDeleteForm.exactDate" />
        </div>
        
        <div v-if="bulkDeleteType === 'range' || bulkDeleteType === 'day'" class="grid grid-cols-2 gap-4">
          <BaseInput label="Desde" type="date" v-model="bulkDeleteForm.fromDate" />
          <BaseInput label="Hasta" type="date" v-model="bulkDeleteForm.toDate" />
        </div>

        <div v-if="bulkDeleteType === 'day'">
          <label class="text-xs font-bold text-text-secondary uppercase">Día de la semana a borrar</label>
          <select v-model="bulkDeleteForm.dayOfWeek" class="w-full mt-1 bg-background border border-border rounded-lg p-2 text-sm">
            <option :value="0">Domingo</option>
            <option :value="1">Lunes</option>
            <option :value="2">Martes</option>
            <option :value="3">Miércoles</option>
            <option :value="4">Jueves</option>
            <option :value="5">Viernes</option>
            <option :value="6">Sábado</option>
          </select>
        </div>
      </div>

      <div class="flex justify-end gap-3">
        <BaseButton variant="outline" @click="showBulkDeleteModal = false">Cancelar</BaseButton>
        <BaseButton class="bg-red-500 hover:bg-red-600 border-red-600 text-white" @click="executeBulkDelete" :loading="loading">
          Eliminar Horarios
        </BaseButton>
      </div>
    </div>
  </div>

</template>

<style scoped>
.animate-in {
  animation: fadeIn 0.3s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
