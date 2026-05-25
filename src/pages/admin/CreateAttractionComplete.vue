<script setup>
import { ref, onMounted, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import attractionService from '@/services/attractions'
import catalogService from '@/services/catalog'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import MapPicker from '@/components/common/MapPicker.vue'
import Swal from 'sweetalert2'
import { 
  ArrowLeftIcon, 
  ArrowRightIcon,
  PlusIcon, 
  TrashIcon, 
  GlobeAltIcon, 
  PhotoIcon, 
  TicketIcon, 
  MapIcon,
  CheckBadgeIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  FlagIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()
const currentStep = ref(1)
const loading = ref(false)

// Datos maestros
const locations = ref([])
const categories = ref([])
const availableTags = ref([])
const inclusionItems = ref([])
const ticketCategories = ref([])
const languages = [
  { id: 1, name: 'Español' },
  { id: 2, name: 'Inglés' },
  { id: 3, name: 'Francés' }
]

// Estado del Formulario
const form = reactive({
  // STEP 1: Datos Base
  name: '',
  descriptionShort: '',
  descriptionFull: '',
  countryId: '',
  stateId: '',
  cityId: '',
  categoryId: '',
  subcategoryId: '',
  difficultyLevel: 'moderate',
  meetingPoint: '',
  latitude: 0,
  longitude: 0,
  baseDurationMinutes: 60,       // Se replicará en productos
  baseCancelPolicyHours: 24,     // Se replicará en productos
  
  // STEP 2: Multimedia y Clasificación
  media: [],
  tags: [],
  guideLanguages: [], // { languageId, guideType }
  
  // STEP 3: Inclusiones
  inclusions: [], // { inclusionItemId, type }
  
  // STEP 4: Productos
  products: [],
  
  // STEP 5: Itinerario (Opcional)
  tourItineraries: {
    overview: '',
    stops: []
  }
})

// --- Computed: Selectores Jerárquicos (Soporte para Árbol de la API) ---
const countries = computed(() => locations.value) // API ya devuelve países en la raíz

const states = computed(() => {
  const country = countries.value.find(c => c.id === form.countryId)
  return country ? country.children || [] : []
})

const cities = computed(() => {
  const state = states.value.find(s => s.id === form.stateId)
  return state ? state.children || [] : []
})

const subcategories = ref([])

onMounted(async () => {
  try {
    const [locData, catData, tagData, incData, tktData] = await Promise.all([
      catalogService.getLocations(),
      catalogService.getCategories(),
      catalogService.getTags(),
      catalogService.getInclusions(),
      catalogService.getTicketCategories()
    ])
    locations.value = locData || []
    categories.value = catData || []
    availableTags.value = tagData || []
    inclusionItems.value = incData || []
    ticketCategories.value = tktData || []
  } catch (error) {
    console.error('Error cargando catálogos:', error)
  }
})

const handleCategoryChange = async () => {
  form.subcategoryId = ''
  if (form.categoryId) {
    subcategories.value = await catalogService.getSubcategories(form.categoryId)
  } else {
    subcategories.value = []
  }
}

// --- Validation helpers ---
const onlyLetters = (e) => {
  const char = String.fromCharCode(e.charCode)
  if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]$/.test(char)) e.preventDefault()
}
const onlyNumbers = (e) => {
  if (!/\d/.test(String.fromCharCode(e.charCode))) e.preventDefault()
}

// --- Métodos Helpers ---
const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target.result
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX_WIDTH = 1200
        const MAX_HEIGHT = 800
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH }
        } else {
          if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT }
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.8))
      }
    }
    reader.onerror = error => reject(error)
  })
}

const handleFileUpload = async (e) => {
  const files = e.target.files
  for (let file of files) {
    try {
      if (file.type.startsWith('image/')) {
        const tempIndex = form.media.length
        form.media.push({ 
          url: '', 
          title: 'Procesando...', 
          sortOrder: tempIndex + 1, 
          isMain: tempIndex === 0,
          mediaTypeId: 1,
          uploading: true
        })

        // Comprimir y convertir a Base64 en cliente
        const base64Url = await compressImage(file)
        
        form.media[tempIndex].url = base64Url
        form.media[tempIndex].title = file.name
        form.media[tempIndex].uploading = false
      } else if (file.type.startsWith('video/')) {
        Swal.fire('Info', 'La subida de videos actualmente requiere una URL externa o debe ser habilitada.', 'info')
      }
    } catch (error) {
      console.error("Error al procesar imagen", error)
      Swal.fire('Error', 'No se pudo procesar la imagen: ' + (error.message || ''), 'error')
      form.media = form.media.filter(m => m.title !== 'Procesando...')
    }
  }
}

const addGuideLanguage = () => form.guideLanguages.push({ languageId: 1, guideType: 'live' })

const addProduct = () => {
  form.products.push({
    title: '',
    description: '',
    minParticipants: 1,
    maxGroupSize: 10,
    isPrivate: false,
    priceTiers: [],
    scheduleTemplate: {
      name: 'Horario Regular',
      validFrom: new Date().toISOString().split('T')[0],
      validTo: '',
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: true,
      sunday: true,
      defaultCapacity: 20,
      times: [{ startTime: '09:00', capacityOverride: null }]
    }
  })
}

const addScheduleTime = (pIdx) => {
  form.products[pIdx].scheduleTemplate.times.push({ startTime: '09:00', capacityOverride: null })
}

const removeScheduleTime = (pIdx, tIdx) => {
  form.products[pIdx].scheduleTemplate.times.splice(tIdx, 1)
}

const addPriceTier = (prodIdx) => {
  form.products[prodIdx].priceTiers.push({ ticketCategoryId: '', price: 0, currencyCode: 'USD' })
}

const addStop = () => {
  // Contraer todas las paradas existentes
  form.tourItineraries.stops.forEach(s => s.isCollapsed = true)
  
  form.tourItineraries.stops.push({ 
    name: '', 
    description: '', 
    stayTimeMinutes: 30, 
    admissionType: 'included',
    latitude: 0,
    longitude: 0,
    isCollapsed: false
  })
}

const toggleStop = (idx) => {
  form.tourItineraries.stops[idx].isCollapsed = !form.tourItineraries.stops[idx].isCollapsed
}

const toggleInclusion = (itemId) => {
  const idx = form.inclusions.findIndex(i => i.inclusionItemId === itemId)
  if (idx > -1) {
    form.inclusions.splice(idx, 1)
  } else {
    form.inclusions.push({ inclusionItemId: itemId, type: 'included' })
  }
}

const setInclusionType = (itemId, type) => {
  const item = form.inclusions.find(i => i.inclusionItemId === itemId)
  if (item) item.type = type
}

const setMainMedia = (idx) => {
  form.media.forEach((m, i) => m.isMain = (i === idx))
}

const removeItem = (arr, idx) => arr.splice(idx, 1)

// --- Submit ---
async function handleSubmit() {
  loading.value = true
  try {
    // Validar fechas de disponibilidad
    for (let p of form.products) {
      if (p.scheduleTemplate.validFrom && p.scheduleTemplate.validTo) {
        const fromDate = new Date(p.scheduleTemplate.validFrom)
        const toDate = new Date(p.scheduleTemplate.validTo)
        if (toDate < fromDate) {
          throw new Error(`En la modalidad "${p.title || 'sin título'}", la fecha 'Válido Hasta' no puede ser menor que 'Válido Desde'.`)
        }
      }
    }

    // Preparar el payload según lo acordado: replicar duración/cancelación y incluir scheduleTemplate
    const productsPayload = form.products.map(p => ({
      ...p,
      durationMinutes: form.baseDurationMinutes,
      cancelPolicyHours: form.baseCancelPolicyHours,
      // Aseguramos que los tiempos tengan el formato HH:mm:ss si es necesario
      scheduleTemplate: {
        ...p.scheduleTemplate,
        times: p.scheduleTemplate.times.map(t => ({ 
          startTime: t.startTime.length === 5 ? t.startTime : t.startTime.substring(0, 5),
          capacityOverride: t.capacityOverride ? Number(t.capacityOverride) : null
        }))
      }
    }))

    // Formatear el itinerario para que coincida con CompleteItineraryRequest
    const itineraryPayload = (form.tourItineraries.overview || form.tourItineraries.stops.length > 0)
      ? {
          languageId: 1, // Por defecto Español como indica el back
          overview: form.tourItineraries.overview,
          stops: form.tourItineraries.stops.map((s, index) => ({
            ...s,
            stopNumber: index + 1
          }))
        }
      : null

    const payload = {
      name: form.name,
      descriptionShort: form.descriptionShort,
      descriptionFull: form.descriptionFull,
      locationId: form.cityId, // Enviamos el ID final (Ciudad)
      subcategoryId: form.subcategoryId,
      difficultyLevel: form.difficultyLevel || null, // Se envía null si está vacío
      meetingPoint: form.meetingPoint,
      latitude: form.latitude,
      longitude: form.longitude,
      media: form.media,
      tags: form.tags,
      guideLanguages: form.guideLanguages,
      inclusions: form.inclusions,
      products: productsPayload,
      itinerary: itineraryPayload
    }

    await attractionService.createComplete(payload)
    await Swal.fire({
      icon: 'success',
      title: '¡Atracción Creada!',
      text: 'La atracción se ha guardado correctamente. Ahora ve a Configurar Calendario.',
      confirmButtonText: 'Continuar',
      confirmButtonColor: '#3b82f6'
    })
    router.push('/admin/attractions')
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Error de Validación',
      text: error.message,
      confirmButtonColor: '#ef4444'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="max-w-5xl mx-auto pb-20 px-4">
    <!-- Header & Stepper -->
    <div class="mb-10">
      <div class="flex items-center gap-4 mb-6">
        <button @click="router.back()" class="p-2 hover:bg-surface rounded-full transition-colors">
          <ArrowLeftIcon class="h-6 w-6 text-text-secondary" />
        </button>
        <div>
          <h1 class="text-3xl font-black text-text-primary tracking-tight">Nueva Atracción</h1>
          <p class="text-text-secondary text-sm mt-1">Sigue el asistente para publicar tu experiencia.</p>
        </div>
      </div>

      <!-- Stepper Progress -->
      <div class="flex items-center justify-between relative">
        <div class="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-surface z-0"></div>
        <div class="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary z-0 transition-all duration-500" :style="`width: ${(currentStep - 1) * 25}%`"></div>
        
        <div v-for="step in 5" :key="step" class="relative z-10 flex flex-col items-center gap-2">
          <div 
            class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300"
            :class="currentStep >= step ? 'bg-primary text-white shadow-md' : 'bg-surface border-2 border-border text-text-secondary'"
          >
            {{ step }}
          </div>
          <span class="text-xs font-bold uppercase hidden sm:block" :class="currentStep >= step ? 'text-primary' : 'text-text-secondary'">
            {{ step === 1 ? 'Datos Base' : step === 2 ? 'Media' : step === 3 ? 'Inclusiones' : step === 4 ? 'Modalidades' : 'Itinerario' }}
          </span>
        </div>
      </div>
    </div>

    <!-- MAIN FORM CONTAINER -->
    <div class="bg-surface rounded-3xl border border-border shadow-sm p-8 min-h-[500px]">
      
      <!-- ================= PASO 1: DATOS BASE ================= -->
      <div v-if="currentStep === 1" class="space-y-8 animate-in fade-in">
        <div class="flex items-center gap-2 mb-6 border-b border-border pb-4">
          <GlobeAltIcon class="h-6 w-6 text-primary" />
          <h2 class="text-xl font-bold text-text-primary">Información General</h2>
        </div>

        <BaseInput label="Título de la Atracción" v-model="form.name" required placeholder="Ej: Tour Volcán Cotopaxi" @keypress="onlyLetters" />
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="space-y-2">
            <label class="text-xs font-black uppercase text-text-secondary ml-1">País</label>
            <select v-model="form.countryId" class="w-full bg-background border border-border rounded-xl py-3 px-4 outline-none">
              <option value="">Seleccionar...</option>
              <option v-for="c in countries" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>
          <div class="space-y-2">
            <label class="text-xs font-black uppercase text-text-secondary ml-1">Provincia</label>
            <select v-model="form.stateId" :disabled="!form.countryId" class="w-full bg-background border border-border rounded-xl py-3 px-4 outline-none disabled:opacity-50">
              <option value="">Seleccionar...</option>
              <option v-for="s in states" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
          </div>
          <div class="space-y-2">
            <label class="text-xs font-black uppercase text-text-secondary ml-1">Ciudad (Obligatorio)</label>
            <select v-model="form.cityId" :disabled="!form.stateId" class="w-full bg-background border border-border rounded-xl py-3 px-4 outline-none border-primary/50 disabled:opacity-50">
              <option value="">Seleccionar...</option>
              <option v-for="ci in cities" :key="ci.id" :value="ci.id">{{ ci.name }}</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-2">
            <label class="text-xs font-black uppercase text-text-secondary ml-1">Categoría</label>
            <select v-model="form.categoryId" @change="handleCategoryChange" class="w-full bg-background border border-border rounded-xl py-3 px-4 outline-none">
              <option value="">Seleccionar...</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
            </select>
          </div>
          <div class="space-y-2">
            <label class="text-xs font-black uppercase text-text-secondary ml-1">Subcategoría</label>
            <select v-model="form.subcategoryId" :disabled="!form.categoryId" class="w-full bg-background border border-border rounded-xl py-3 px-4 outline-none border-primary/50 disabled:opacity-50">
              <option value="">Seleccionar...</option>
              <option v-for="sub in subcategories" :key="sub.id" :value="sub.id">{{ sub.name }}</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 bg-primary/5 p-6 rounded-2xl border border-primary/10">
          <BaseInput label="Duración Base (Minutos)" type="number" v-model.number="form.baseDurationMinutes" @keypress="onlyNumbers" />
          <BaseInput label="Pol. Cancelación (Horas previas)" type="number" v-model.number="form.baseCancelPolicyHours" @keypress="onlyNumbers" />
          <p class="col-span-full text-xs text-text-secondary italic">Estos valores se aplicarán por defecto a todas las modalidades (productos) que crees.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="space-y-2 col-span-3 md:col-span-1">
            <label class="text-xs font-black uppercase text-text-secondary ml-1">Nivel de exigencia física</label>
            <select v-model="form.difficultyLevel" class="w-full bg-background border border-border rounded-xl py-3 px-4 outline-none">
              <option value="">Ninguna (Ticket simple, pase)</option>
              <option value="easy">Fácil (Caminata ligera)</option>
              <option value="moderate">Moderada (Esfuerzo medio)</option>
              <option value="hard">Difícil (Alta exigencia)</option>
            </select>
          </div>
        </div>

        <BaseInput label="Descripción Corta (Max 250)" v-model="form.descriptionShort" maxlength="250" />
        
        <div class="space-y-2">
          <label class="text-xs font-black uppercase text-text-secondary ml-1">Descripción Larga (Completa)</label>
          <textarea v-model="form.descriptionFull" class="w-full bg-background border border-border rounded-xl p-4 min-h-[150px] outline-none"></textarea>
        </div>

        <!-- Coordenadas Base con Mapa -->
        <div class="bg-surface border border-border p-6 rounded-2xl space-y-4">
          <h3 class="text-sm font-black uppercase text-text-primary">Ubicación y Punto de Encuentro</h3>
          <MapPicker 
            v-model:lat="form.latitude" 
            v-model:lng="form.longitude" 
            label="Selecciona la ubicación principal en el mapa"
          />
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <BaseInput label="Latitud" v-model.number="form.latitude" type="number" step="0.000001" disabled />
            <BaseInput label="Longitud" v-model.number="form.longitude" type="number" step="0.000001" disabled />
          </div>
          <BaseInput label="Punto de Encuentro" v-model="form.meetingPoint" placeholder="Instrucciones para el turista..." @keypress="onlyLetters" />
        </div>
      </div>

      <!-- ================= PASO 2: MEDIA Y CLASIFICACIÓN ================= -->
      <div v-if="currentStep === 2" class="space-y-8 animate-in fade-in">
        <div class="flex items-center gap-2 mb-6 border-b border-border pb-4">
          <PhotoIcon class="h-6 w-6 text-primary" />
          <h2 class="text-xl font-bold text-text-primary">Multimedia y Clasificación</h2>
        </div>

        <!-- Galería -->
        <div class="space-y-4">
          <div class="flex justify-between items-center mb-2">
            <h3 class="text-sm font-black uppercase tracking-wider text-text-primary">Galería de Imágenes</h3>
            <div>
              <input type="file" multiple accept="image/*,video/*" class="hidden" ref="fileInput" @change="handleFileUpload" />
              <BaseButton size="sm" @click="$refs.fileInput.click()">+ Subir Archivos</BaseButton>
            </div>
          </div>
          <p class="text-xs text-text-secondary italic mb-4">Las imágenes se optimizarán automáticamente antes de subirse. Puedes seleccionar varias a la vez.</p>
          <div class="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <div v-for="(m, idx) in form.media" :key="idx" class="relative group bg-background border border-border rounded-2xl overflow-hidden aspect-video">
              <img v-if="m.url" :src="m.url" class="object-cover w-full h-full" />
              <div v-else class="flex items-center justify-center w-full h-full bg-surface text-xs text-text-secondary break-all p-4 text-center">
                {{ m.title || 'Archivo cargado' }}
              </div>
              
              <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                <button 
                  @click="setMainMedia(idx)"
                  class="px-3 py-1.5 text-xs font-bold uppercase rounded-lg border transition-all text-white w-32"
                  :class="m.isMain ? 'bg-primary border-primary' : 'bg-transparent border-white hover:bg-white/20'"
                >
                  {{ m.isMain ? '★ Principal' : 'Hacer Principal' }}
                </button>
                <button @click="removeItem(form.media, idx)" class="px-3 py-1.5 text-xs font-bold uppercase rounded-lg border border-red-500 text-red-500 bg-red-500/20 hover:bg-red-500 hover:text-white w-32 transition-all">
                  Eliminar
                </button>
              </div>
            </div>
            <div v-if="form.media.length === 0" class="col-span-full py-8 border border-dashed border-border rounded-2xl text-center text-text-secondary italic flex flex-col items-center justify-center gap-2 bg-surface">
              <PhotoIcon class="w-10 h-10 text-border" />
              Sin archivos seleccionados
            </div>
          </div>
        </div>

        <!-- Tags -->
        <div class="space-y-4 pt-6 border-t border-border">
          <h3 class="text-sm font-black uppercase tracking-wider text-text-primary">Etiquetas (Tags)</h3>
          <div class="flex flex-wrap gap-2">
            <label v-for="tag in availableTags" :key="tag.id" class="cursor-pointer group">
              <input type="checkbox" :value="tag.id" v-model="form.tags" class="hidden peer" />
              <div class="px-4 py-2 border border-border rounded-full text-sm font-bold text-text-secondary peer-checked:bg-primary peer-checked:text-white transition-all group-hover:bg-background">
                {{ tag.name }}
              </div>
            </label>
          </div>
        </div>

        <!-- Guide Languages -->
        <div class="space-y-4 pt-6 border-t border-border">
          <div class="flex justify-between items-center">
            <h3 class="text-sm font-black uppercase tracking-wider text-text-primary">Idiomas y Tipo de Guía</h3>
            <BaseButton size="sm" variant="outline" @click="addGuideLanguage">+ Añadir Idioma</BaseButton>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div v-for="(g, idx) in form.guideLanguages" :key="idx" class="flex gap-2 items-center bg-background p-3 rounded-xl border border-border">
              <select v-model="g.languageId" class="flex-1 bg-transparent border-none text-sm outline-none font-bold">
                <option v-for="l in languages" :key="l.id" :value="l.id">{{ l.name }}</option>
              </select>
              <select v-model="g.guideType" class="flex-1 bg-surface border border-border rounded-lg px-2 py-1 text-xs outline-none">
                <option value="live">Presencial</option>
                <option value="audio">Audioguía</option>
                <option value="written">Escrita</option>
              </select>
              <button @click="removeItem(form.guideLanguages, idx)" class="text-red-400 p-1"><TrashIcon class="h-4 w-4" /></button>
            </div>
          </div>
        </div>
      </div>

      <!-- ================= PASO 3: INCLUSIONES ================= -->
      <div v-if="currentStep === 3" class="space-y-6 animate-in fade-in">
        <div class="flex items-center gap-2 mb-6 border-b border-border pb-4">
          <CheckBadgeIcon class="h-6 w-6 text-primary" />
          <h2 class="text-xl font-bold text-text-primary">¿Qué incluye la atracción?</h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div v-for="item in inclusionItems" :key="item.id" class="p-4 border rounded-2xl transition-all" :class="form.inclusions.some(i => i.inclusionItemId === item.id) ? 'border-primary bg-primary/5 shadow-sm' : 'border-border bg-background'">
            <div class="flex items-center gap-3 mb-3">
              <input type="checkbox" :checked="form.inclusions.some(i => i.inclusionItemId === item.id)" @change="toggleInclusion(item.id)" class="rounded text-primary focus:ring-primary w-5 h-5" />
              <span class="font-bold text-sm text-text-primary">{{ item.defaultText }}</span>
            </div>
            
            <!-- Tipos de Inclusión -->
            <div v-if="form.inclusions.some(i => i.inclusionItemId === item.id)" class="grid grid-cols-4 gap-1 mt-2">
              <button 
                v-for="type in ['included', 'not_included', 'optional', 'bring']" 
                :key="type"
                @click="setInclusionType(item.id, type)"
                class="py-1 text-[10px] font-black uppercase rounded-md border transition-all"
                :class="form.inclusions.find(i => i.inclusionItemId === item.id).type === type ? 'bg-primary text-white border-primary' : 'bg-surface text-text-secondary border-border hover:bg-background'"
              >
                {{ type === 'included' ? 'Sí Incluye' : type === 'not_included' ? 'No Incluye' : type === 'optional' ? 'Opcional' : 'Llevar' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ================= PASO 4: MODALIDADES Y PRECIOS ================= -->
      <div v-if="currentStep === 4" class="space-y-8 animate-in fade-in">
        <div class="flex items-center justify-between mb-6 border-b border-border pb-4">
          <div class="flex items-center gap-2">
            <TicketIcon class="h-6 w-6 text-primary" />
            <h2 class="text-xl font-bold text-text-primary">Modalidades y Precios</h2>
          </div>
          <BaseButton @click="addProduct" size="sm">+ AÑADIR PRODUCTO</BaseButton>
        </div>

        <div v-for="(p, pIdx) in form.products" :key="pIdx" class="bg-background border border-border rounded-3xl p-6 relative group shadow-sm">
          <button @click="removeItem(form.products, pIdx)" class="absolute top-6 right-6 text-red-500 hover:bg-red-50 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><TrashIcon class="h-5 w-5" /></button>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 pr-12">
            <BaseInput label="Título de la Modalidad" v-model="p.title" placeholder="Ej: Tour Privado VIP" required @keypress="onlyLetters" />
            <BaseInput label="Descripción Corta" v-model="p.description" />
            
            <div class="flex gap-4 col-span-1 md:col-span-2">
              <BaseInput label="Mínimo por Reserva" type="number" v-model.number="p.minParticipants" class="w-1/3" title="Mínimo de tickets que un cliente debe comprar en 1 transacción" @keypress="onlyNumbers" />
              <BaseInput label="Máximo por Reserva" type="number" v-model.number="p.maxGroupSize" class="w-1/3" title="Límite máximo de tickets que un cliente puede comprar en 1 transacción" @keypress="onlyNumbers" />
              <div class="w-1/3 space-y-2">
                <label class="text-xs font-black uppercase text-text-secondary ml-1">¿Tour Privado?</label>
                <div class="flex border border-border rounded-xl overflow-hidden h-12">
                  <button @click.prevent="p.isPrivate = false" class="flex-1 font-bold text-xs" :class="!p.isPrivate ? 'bg-primary text-white' : 'bg-surface hover:bg-background'">NO (Público)</button>
                  <button @click.prevent="p.isPrivate = true" class="flex-1 font-bold text-xs" :class="p.isPrivate ? 'bg-primary text-white' : 'bg-surface hover:bg-background'">SÍ (Exclusivo)</button>
                </div>
              </div>
            </div>
            
            <div class="col-span-1 md:col-span-2 text-xs text-text-secondary mt-1 bg-surface p-3 rounded-xl border border-border">
              <strong class="text-primary mr-1">¿Qué significa esto?</strong> 
              <span v-if="!p.isPrivate">El cliente se unirá a un grupo con otras personas desconocidas hasta llenar el cupo máximo (Ej: Bus turístico).</span>
              <span v-else>El cliente paga por la exclusividad. Nadie más se unirá a su grupo, independientemente del cupo máximo (Ej: Guía personal o yate).</span>
            </div>
          </div>

          <!-- Price Tiers -->
          <div class="bg-surface p-6 rounded-2xl border border-primary/20 mt-4">
            <div class="flex justify-between items-center mb-4">
              <h4 class="text-xs font-black uppercase text-primary">Niveles de Precio (Tickets)</h4>
              <button @click="addPriceTier(pIdx)" class="text-xs font-bold text-primary hover:underline">+ AÑADIR TICKET</button>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div v-for="(tier, tIdx) in p.priceTiers" :key="tIdx" class="flex gap-2 items-center bg-background border border-border p-3 rounded-xl">
                <select v-model="tier.ticketCategoryId" class="flex-1 bg-transparent outline-none text-sm font-bold border-r border-border pr-2">
                  <option value="">Seleccione Categoría</option>
                  <option v-for="tc in ticketCategories" :key="tc.id" :value="tc.id">
                    {{ tc.name }} 
                    <span v-if="tc.ageRangeMin !== null && tc.ageRangeMax !== null">({{ tc.ageRangeMin }}-{{ tc.ageRangeMax }} años)</span>
                  </option>
                </select>
                <span class="text-text-secondary px-2 font-bold">$</span>
                <input type="number" v-model.number="tier.price" class="w-20 bg-transparent outline-none font-black text-lg" placeholder="0.00" @keypress="onlyNumbers" />
                <button @click="removeItem(p.priceTiers, tIdx)" class="text-red-400 p-2"><TrashIcon class="h-4 w-4" /></button>
              </div>
            </div>
          </div>

          <!-- Configuración de Disponibilidad (Schedule Template) -->
          <div class="bg-primary/5 p-6 rounded-2xl border border-primary/20 mt-4 space-y-4">
            <h4 class="text-xs font-black uppercase text-primary tracking-widest">📅 Configuración de Disponibilidad</h4>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <BaseInput label="Nombre de la Plantilla" v-model="p.scheduleTemplate.name" placeholder="Ej: Horario Regular" />
              <div class="grid grid-cols-2 gap-4">
                <BaseInput label="Válido Desde" type="date" v-model="p.scheduleTemplate.validFrom" 
                  @change="p.scheduleTemplate.validTo = (p.scheduleTemplate.validTo && p.scheduleTemplate.validFrom > p.scheduleTemplate.validTo) ? '' : p.scheduleTemplate.validTo" 
                />
                <BaseInput label="Válido Hasta" type="date" v-model="p.scheduleTemplate.validTo" :min="p.scheduleTemplate.validFrom" />
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-xs font-black uppercase text-text-secondary ml-1">Días de Operación</label>
              <div class="flex flex-wrap gap-2">
                <button v-for="day in ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']" 
                  :key="day"
                  @click.prevent="p.scheduleTemplate[day] = !p.scheduleTemplate[day]"
                  class="px-3 py-2 rounded-xl text-xs font-bold border transition-all"
                  :class="p.scheduleTemplate[day] ? 'bg-primary text-white border-primary' : 'bg-surface text-text-secondary border-border'"
                >
                  {{ {monday:'L', tuesday:'M', wednesday:'M', thursday:'J', friday:'V', saturday:'S', sunday:'D'}[day] }}
                </button>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <div class="flex flex-col gap-2">
                <div class="flex justify-between items-center">
                  <label class="text-xs font-black uppercase text-text-secondary ml-1">Horarios de Salida</label>
                  <button @click.prevent="addScheduleTime(pIdx)" class="text-[10px] font-black text-primary hover:underline">+ AÑADIR HORA</button>
                </div>
                <div class="flex flex-col gap-2">
                  <div v-for="(time, tIdx) in p.scheduleTemplate.times" :key="tIdx" class="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-background border border-border rounded-lg p-2">
                    <input type="time" v-model="time.startTime" class="bg-transparent border border-border rounded px-1 py-0.5 text-xs font-bold outline-none w-24" />
                    <input 
                      type="number" 
                      v-model.number="time.capacityOverride" 
                      placeholder="Cap. Auto" 
                      class="bg-transparent border border-border rounded px-1 py-0.5 text-xs outline-none w-20 text-center placeholder-gray-400" 
                      title="Si este horario tiene un vehículo/cupo distinto, indícalo aquí (Opcional)"
                    />
                    <button @click.prevent="removeScheduleTime(pIdx, tIdx)" class="text-red-400 hover:text-red-600 px-1 ml-auto">×</button>
                  </div>
                </div>
              </div>
              <BaseInput label="Capacidad Total / Cupos del Vehículo" type="number" v-model.number="p.scheduleTemplate.defaultCapacity" title="Capacidad física total (Inventario) a la venta por horario" @keypress="onlyNumbers" />
            </div>
          </div>
        </div>
        <p v-if="form.products.length === 0" class="text-center text-text-secondary italic py-8">Añade al menos una modalidad para poder publicar precios.</p>
      </div>

      <!-- ================= PASO 5: ITINERARIO ================= -->
      <div v-if="currentStep === 5" class="space-y-6 animate-in fade-in">
        <div class="flex items-center gap-2 mb-6 border-b border-border pb-4">
          <MapIcon class="h-6 w-6 text-primary" />
          <h2 class="text-xl font-bold text-text-primary">Itinerario del Tour (Opcional)</h2>
        </div>

        <div class="space-y-2">
          <label class="text-xs font-black uppercase text-text-secondary ml-1">Descripción General del Itinerario</label>
          <textarea v-model="form.tourItineraries.overview" class="w-full bg-background border border-border rounded-xl p-4 min-h-[100px] outline-none" placeholder="Un resumen de la ruta completa..."></textarea>
        </div>

        <!-- Indicador de Punto de Inicio -->
        <div v-if="form.meetingPoint" class="bg-primary/5 border border-primary/20 p-4 rounded-2xl flex items-center gap-4">
          <div class="bg-primary text-white p-2 rounded-full shadow-sm">
            <FlagIcon class="h-5 w-5" />
          </div>
          <div>
            <span class="text-[10px] font-black uppercase text-primary tracking-widest">Punto de Inicio (Encuentro)</span>
            <p class="text-sm font-bold text-text-primary">{{ form.meetingPoint }}</p>
          </div>
        </div>

        <div class="pt-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-sm font-black uppercase text-text-primary">Paradas (Stops)</h3>
            <BaseButton size="sm" @click="addStop" variant="outline">+ Añadir Parada</BaseButton>
          </div>

          <div class="space-y-4">
            <div v-for="(s, sIdx) in form.tourItineraries.stops" :key="sIdx" class="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm transition-all">
              <!-- Stop Header (Collapsible) -->
              <div 
                @click="toggleStop(sIdx)"
                class="flex items-center justify-between p-4 cursor-pointer hover:bg-background transition-colors border-b border-transparent"
                :class="{ 'border-border bg-background': !s.isCollapsed }"
              >
                <div class="flex items-center gap-3">
                  <div 
                    class="w-8 h-8 rounded-full flex items-center justify-center font-black text-xs border-2"
                    :class="sIdx === 0 ? 'bg-green-500 border-green-600 text-white' : (sIdx === form.tourItineraries.stops.length - 1 ? 'bg-red-500 border-red-600 text-white' : 'bg-surface border-border text-text-secondary')"
                  >
                    {{ sIdx + 1 }}
                  </div>
                  <div>
                    <h4 class="font-bold text-sm text-text-primary flex items-center gap-2">
                      {{ s.name || 'Nueva Parada' }}
                      <span v-if="sIdx === 0" class="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full uppercase font-black">Primer Destino</span>
                      <span v-if="sIdx > 0 && sIdx === form.tourItineraries.stops.length - 1" class="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full uppercase font-black">Fin del Recorrido</span>
                    </h4>
                  </div>
                </div>
                <div class="flex items-center gap-4">
                  <button @click.stop="removeItem(form.tourItineraries.stops, sIdx)" class="text-red-400 hover:text-red-600 p-1"><TrashIcon class="h-4 w-4" /></button>
                  <ChevronDownIcon class="h-5 w-5 text-text-secondary transition-transform duration-300" :class="{ 'rotate-180': !s.isCollapsed }" />
                </div>
              </div>

              <!-- Stop Content -->
              <div v-show="!s.isCollapsed" class="p-5 space-y-4 bg-background">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <BaseInput label="Nombre de Parada" v-model="s.name" required @keypress="onlyLetters" />
                  <div class="space-y-2">
                    <label class="text-xs font-black uppercase text-text-secondary ml-1">Tipo de Admisión</label>
                    <select v-model="s.admissionType" class="w-full bg-surface border border-border rounded-xl py-3 px-4 outline-none">
                      <option value="included">Incluido en el precio</option>
                      <option value="optional">Opcional (se paga allá)</option>
                      <option value="excluded">No incluido (obligatorio pagar allá)</option>
                      <option value="bring">Llevar (traer entrada/equipo)</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label class="text-xs font-black uppercase text-text-secondary ml-1">Descripción de la parada</label>
                  <textarea v-model="s.description" class="w-full mt-1 bg-surface border border-border rounded-xl p-3 text-sm outline-none" rows="2" placeholder="Detalle de lo que se hace en esta parada..."></textarea>
                </div>
                
                <div class="bg-surface border border-border p-4 rounded-xl">
                  <MapPicker 
                    v-model:lat="s.latitude" 
                    v-model:lng="s.longitude" 
                    :label="'Ubicación de ' + (s.name || 'la parada')"
                  />
                  <div class="flex gap-4 mt-4">
                    <BaseInput label="Tiempo en sitio (Minutos)" type="number" v-model.number="s.stayTimeMinutes" class="w-1/3" />
                    <BaseInput label="Latitud" type="number" step="0.000001" v-model.number="s.latitude" class="w-1/3" disabled />
                    <BaseInput label="Longitud" type="number" step="0.000001" v-model.number="s.longitude" class="w-1/3" disabled />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Stepper Footer -->
    <div class="mt-8 flex justify-between items-center bg-surface p-6 rounded-2xl border border-border">
      <button @click="currentStep--" :disabled="currentStep === 1" class="font-bold text-text-secondary hover:text-primary transition-colors disabled:opacity-30 flex items-center gap-2">
        <ArrowLeftIcon class="h-5 w-5" /> Anterior
      </button>
      
      <BaseButton v-if="currentStep < 5" @click="currentStep++" class="px-8 py-3">
        Siguiente Paso <ArrowRightIcon class="h-5 w-5 ml-2" />
      </BaseButton>
      
      <BaseButton v-if="currentStep === 5" @click="handleSubmit" :loading="loading" color="success" class="px-8 py-3 bg-green-500 hover:bg-green-600 text-white border-green-600">
        <CheckCircleIcon class="h-5 w-5 mr-2" />
        Publicar Atracción
      </BaseButton>
    </div>
  </div>
</template>

<style scoped>
select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  background-size: 1.2em;
}
.animate-in {
  animation: fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
