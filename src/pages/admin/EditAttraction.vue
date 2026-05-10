<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import attractionService from '@/services/attractions'
import catalogService from '@/services/catalog'
import MapPicker from '@/components/common/MapPicker.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import Swal from 'sweetalert2'
import {
  ArrowLeftIcon, PlusIcon, TrashIcon, MapIcon,
  CheckBadgeIcon, GlobeAltIcon, TagIcon, ListBulletIcon
} from '@heroicons/vue/24/outline'

const route = useRoute()
const router = useRouter()
const attractionId = route.params.id

const loading = ref(true)
const saving = ref(false)
const activeTab = ref('general')

// Catalogs
const locations = ref([])
const categories = ref([])
const subcategories = ref([])
const availableTags = ref([])
const availableInclusions = ref([])

// Form
const form = reactive({
  name: '',
  descriptionShort: '',
  descriptionFull: '',
  difficultyLevel: 'moderate',
  meetingPoint: '',
  latitude: 0,
  longitude: 0,
  locationId: '',
  subcategoryId: '',
  tags: [],
  inclusions: [],
  itinerary: { overview: '', stops: [] }
})

// Computed location tree (same pattern as CreateAttractionComplete)
const countries = computed(() => locations.value)
const selectedCountryId = ref('')
const selectedStateId = ref('')
const states = computed(() => {
  const c = countries.value.find(c => c.id === selectedCountryId.value)
  return c ? c.children || [] : []
})
const cities = computed(() => {
  const s = states.value.find(s => s.id === selectedStateId.value)
  return s ? s.children || [] : []
})

watch(selectedCountryId, () => { selectedStateId.value = ''; form.locationId = '' })
watch(selectedStateId, () => { form.locationId = '' })

const selectedCategoryId = ref('')
watch(selectedCategoryId, async (catId) => {
  form.subcategoryId = ''
  subcategories.value = catId ? await catalogService.getSubcategories(catId) : []
})

function toggleTag(tagId) {
  const idx = form.tags.indexOf(tagId)
  if (idx > -1) form.tags.splice(idx, 1)
  else form.tags.push(tagId)
}

function toggleInclusion(inclusionId) {
  const idx = form.inclusions.indexOf(inclusionId)
  if (idx > -1) form.inclusions.splice(idx, 1)
  else form.inclusions.push(inclusionId)
}

function addStop() {
  form.itinerary.stops.push({
    name: '', description: '', stayTimeMinutes: 30,
    admissionType: 'included', latitude: 0, longitude: 0
  })
}
function removeStop(idx) { form.itinerary.stops.splice(idx, 1) }

onMounted(async () => {
  try {
    let a = null
    try {
      a = await attractionService.getById(attractionId)
    } catch (err) {
      console.warn('Direct ID fetch failed, trying search fallback...', err)
      const searchRes = await attractionService.search({ attractionId })
      a = searchRes.items?.find(item => item.id === attractionId)
    }
    
    if (!a) throw new Error('Atracción no encontrada')

    const [locData, catData, tagData, incData] = await Promise.all([
      catalogService.getLocations(),
      catalogService.getCategories(),
      catalogService.getTags(),
      catalogService.getInclusions()
    ])
    locations.value = locData || []
    categories.value = catData || []
    availableTags.value = tagData || []
    availableInclusions.value = incData || []

    // Populate form
    form.name = a.name || ''
    form.descriptionShort = a.descriptionShort || ''
    form.descriptionFull = a.descriptionFull || ''
    form.difficultyLevel = a.difficultyLevel || 'moderate'
    form.meetingPoint = a.meetingPoint || ''
    form.latitude = a.latitude || 0
    form.longitude = a.longitude || 0
    form.locationId = a.locationId || ''
    form.subcategoryId = a.subcategoryId || ''
    form.tags = (a.tags || []).map(t => t.id)
    form.inclusions = (a.inclusions || []).map(i => i.id)
    form.itinerary = {
      overview: a.itinerary?.overview || '',
      stops: (a.itinerary?.stops || []).map(s => ({ ...s }))
    }

    // Load subcategories and location state
    if (a.categoryId || a.subcategoryId) {
      selectedCategoryId.value = a.categoryId || ''
    }
    
    if (a.locationId) {
       countries.value.forEach(c => {
         c.children?.forEach(s => {
           if (s.children?.some(city => city.id === a.locationId)) {
             selectedCountryId.value = c.id
             selectedStateId.value = s.id
           }
         })
       })
    }
  } catch (e) {
    console.error(e)
    Swal.fire('Error', 'No se pudo cargar la atracción (ID: ' + attractionId + '). ' + e.message, 'error')
  } finally {
    loading.value = false
  }
})

async function handleSave() {
  if (!form.name.trim()) return Swal.fire('Atención', 'El nombre es requerido.', 'warning')

  saving.value = true
  try {
    const payload = {
      name: form.name,
      descriptionShort: form.descriptionShort,
      descriptionFull: form.descriptionFull,
      difficultyLevel: form.difficultyLevel || null,
      meetingPoint: form.meetingPoint,
      latitude: form.latitude,
      longitude: form.longitude,
      locationId: form.locationId || null,
      subcategoryId: form.subcategoryId || null,
      tags: form.tags,
      inclusions: form.inclusions,
      itinerary: (form.itinerary.overview || form.itinerary.stops.length > 0)
        ? {
            languageId: 1,
            overview: form.itinerary.overview,
            stops: form.itinerary.stops.map((s, i) => ({ ...s, stopNumber: i + 1 }))
          }
        : null
    }
    await attractionService.update(attractionId, payload)
    Swal.fire({ icon: 'success', title: 'Atracción actualizada', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 })
    router.push('/admin/attractions')
  } catch (err) {
    Swal.fire('Error', err.response?.data?.message || err.message, 'error')
  } finally {
    saving.value = false
  }
}

const tabs = [
  { key: 'general', label: 'General', icon: 'CheckBadgeIcon' },
  { key: 'location', label: 'Ubicación', icon: 'GlobeAltIcon' },
  { key: 'tags', label: 'Tags', icon: 'TagIcon' },
  { key: 'inclusions', label: 'Inclusiones', icon: 'CheckCircleIcon' },
  { key: 'itinerary', label: 'Itinerario', icon: 'ListBulletIcon' },
]
</script>

<template>
  <div class="max-w-4xl mx-auto pb-20 px-4">
    <!-- Header -->
    <div class="flex items-center gap-4 mb-8 pt-4">
      <button @click="router.push('/admin/attractions')" class="p-2 hover:bg-surface rounded-xl transition-colors border border-border">
        <ArrowLeftIcon class="h-5 w-5 text-text-secondary" />
      </button>
      <div>
        <h1 class="text-2xl font-black text-text-primary">Editar Atracción</h1>
        <p class="text-text-secondary text-sm">Los cambios se guardan en el servidor al hacer clic en Guardar.</p>
      </div>
    </div>

    <div v-if="loading" class="py-24 text-center text-text-secondary">
      <div class="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
      Cargando...
    </div>

    <div v-else class="space-y-6">
      <!-- Tabs -->
      <div class="flex gap-1 bg-surface border border-border rounded-2xl p-1 flex-wrap">
        <button v-for="tab in tabs" :key="tab.key" @click="activeTab = tab.key"
          class="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold transition-all min-w-[100px]"
          :class="activeTab === tab.key ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:text-primary'">
          {{ tab.label }}
        </button>
      </div>

      <!-- Tab: General -->
      <div v-if="activeTab === 'general'" class="bg-surface border border-border rounded-3xl p-6 space-y-5">
        <h2 class="font-black text-text-primary text-lg">Información General</h2>

        <BaseInput label="Nombre de la Atracción" v-model="form.name" required placeholder="Nombre visible al cliente" />

        <div class="space-y-1.5">
          <label class="text-sm font-semibold text-text-primary ml-1">Descripción Corta</label>
          <textarea v-model="form.descriptionShort" rows="2"
            class="w-full bg-background border border-border rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
            placeholder="Resumen breve que aparece en las tarjetas"></textarea>
        </div>

        <div class="space-y-1.5">
          <label class="text-sm font-semibold text-text-primary ml-1">Descripción Completa</label>
          <textarea v-model="form.descriptionFull" rows="5"
            class="w-full bg-background border border-border rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
            placeholder="Descripción completa con todos los detalles"></textarea>
        </div>

        <div class="space-y-1.5">
          <label class="text-sm font-semibold text-text-primary ml-1">Nivel de Dificultad</label>
          <select v-model="form.difficultyLevel"
            class="w-full bg-background border border-border rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-primary/20 outline-none">
            <option value="">Sin especificar</option>
            <option value="easy">Fácil</option>
            <option value="moderate">Moderado</option>
            <option value="hard">Difícil</option>
          </select>
        </div>
      </div>

      <!-- Tab: Location -->
      <div v-if="activeTab === 'location'" class="bg-surface border border-border rounded-3xl p-6 space-y-5">
        <h2 class="font-black text-text-primary text-lg">Ubicación</h2>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="space-y-1.5">
            <label class="text-sm font-semibold text-text-primary ml-1">País</label>
            <select v-model="selectedCountryId" class="w-full bg-background border border-border rounded-xl py-2.5 px-4 outline-none focus:ring-2 focus:ring-primary/20">
              <option value="">Seleccionar...</option>
              <option v-for="c in countries" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>
          <div class="space-y-1.5">
            <label class="text-sm font-semibold text-text-primary ml-1">Estado / Región</label>
            <select v-model="selectedStateId" :disabled="!states.length" class="w-full bg-background border border-border rounded-xl py-2.5 px-4 outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50">
              <option value="">Seleccionar...</option>
              <option v-for="s in states" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
          </div>
          <div class="space-y-1.5">
            <label class="text-sm font-semibold text-text-primary ml-1">Ciudad</label>
            <select v-model="form.locationId" :disabled="!cities.length" class="w-full bg-background border border-border rounded-xl py-2.5 px-4 outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50">
              <option value="">Seleccionar...</option>
              <option v-for="city in cities" :key="city.id" :value="city.id">{{ city.name }}</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="space-y-1.5">
            <label class="text-sm font-semibold text-text-primary ml-1">Categoría</label>
            <select v-model="selectedCategoryId" class="w-full bg-background border border-border rounded-xl py-2.5 px-4 outline-none focus:ring-2 focus:ring-primary/20">
              <option value="">Seleccionar categoría...</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
            </select>
          </div>
          <div class="space-y-1.5">
            <label class="text-sm font-semibold text-text-primary ml-1">Subcategoría</label>
            <select v-model="form.subcategoryId" :disabled="!subcategories.length" class="w-full bg-background border border-border rounded-xl py-2.5 px-4 outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50">
              <option value="">Seleccionar subcategoría...</option>
              <option v-for="sc in subcategories" :key="sc.id" :value="sc.id">{{ sc.name }}</option>
            </select>
          </div>
        </div>

        <BaseInput label="Punto de Encuentro" v-model="form.meetingPoint" placeholder="Ej: Entrada principal del parque, frente al kiosko azul" />

        <div class="space-y-1.5">
          <label class="text-sm font-semibold text-text-primary ml-1 flex items-center gap-2">
            <MapIcon class="h-4 w-4 text-primary" /> Coordenadas GPS (Punto de Encuentro)
          </label>
          <div class="grid grid-cols-2 gap-4">
            <BaseInput label="Latitud" type="number" step="any" v-model.number="form.latitude" placeholder="Ej: 14.0818" />
            <BaseInput label="Longitud" type="number" step="any" v-model.number="form.longitude" placeholder="Ej: -87.2068" />
          </div>
          <p class="text-xs text-text-secondary px-1 italic">
            Usa Google Maps: haz clic derecho en el punto → "¿Qué hay aquí?" para obtener las coordenadas.
          </p>
        </div>
      </div>

      <!-- Tab: Tags -->
      <div v-if="activeTab === 'tags'" class="bg-surface border border-border rounded-3xl p-6 space-y-5">
        <h2 class="font-black text-text-primary text-lg">Etiquetas</h2>
        <p class="text-text-secondary text-sm">Selecciona las etiquetas que clasifican mejor esta atracción.</p>
        <div class="flex flex-wrap gap-3">
          <button v-for="tag in availableTags" :key="tag.id"
            @click="toggleTag(tag.id)"
            class="px-4 py-2 rounded-full text-sm font-bold border transition-all"
            :class="form.tags.includes(tag.id)
              ? 'bg-primary text-white border-primary shadow-md'
              : 'bg-background border-border text-text-secondary hover:border-primary/40'">
            {{ tag.name }}
          </button>
        </div>
        <p class="text-xs text-text-secondary italic">{{ form.tags.length }} etiqueta(s) seleccionada(s)</p>
      </div>

      <!-- Tab: Inclusions -->
      <div v-if="activeTab === 'inclusions'" class="bg-surface border border-border rounded-3xl p-6 space-y-5">
        <h2 class="font-black text-text-primary text-lg">Inclusiones y Exclusiones</h2>
        <p class="text-text-secondary text-sm">Selecciona los elementos que están incluidos en el servicio base.</p>
        
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button v-for="inc in availableInclusions" :key="inc.id"
            @click="toggleInclusion(inc.id)"
            class="flex items-center gap-3 p-4 rounded-2xl border transition-all text-left"
            :class="form.inclusions.includes(inc.id)
              ? 'bg-primary/5 border-primary text-primary'
              : 'bg-background border-border text-text-secondary hover:border-primary/40'">
            <div class="w-5 h-5 rounded-md border flex items-center justify-center shrink-0"
              :class="form.inclusions.includes(inc.id) ? 'bg-primary border-primary' : 'bg-surface border-border'">
              <PlusIcon v-if="!form.inclusions.includes(inc.id)" class="h-3 w-3" />
              <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3 h-3 text-white">
                <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" />
              </svg>
            </div>
            <span class="font-bold text-sm">{{ inc.name }}</span>
          </button>
        </div>
        
        <p v-if="availableInclusions.length === 0" class="py-10 text-center text-text-secondary italic border border-dashed border-border rounded-2xl">
          No hay inclusiones configuradas en el catálogo global.
        </p>
      </div>

      <!-- Tab: Itinerary Stops -->
      <div v-if="activeTab === 'itinerary'" class="bg-surface border border-border rounded-3xl p-6 space-y-5">
        <div class="flex items-center justify-between">
          <h2 class="font-black text-text-primary text-lg">Paradas del Itinerario</h2>
          <BaseButton size="sm" variant="outline" @click="addStop">
            <PlusIcon class="h-4 w-4 mr-1" /> Agregar Parada
          </BaseButton>
        </div>

        <div class="space-y-1.5">
          <label class="text-sm font-semibold text-text-primary ml-1">Descripción general del recorrido</label>
          <textarea v-model="form.itinerary.overview" rows="3"
            class="w-full bg-background border border-border rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
            placeholder="Breve descripción del recorrido completo..."></textarea>
        </div>

        <div v-if="form.itinerary.stops.length === 0" class="py-10 text-center text-text-secondary italic border border-dashed border-border rounded-2xl">
          No hay paradas. Haz clic en "Agregar Parada" para empezar.
        </div>

        <div v-else class="space-y-4">
          <div v-for="(stop, idx) in form.itinerary.stops" :key="idx"
            class="bg-background border border-border rounded-2xl p-5 space-y-4">
            <div class="flex items-center justify-between">
              <span class="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-black text-sm">{{ idx + 1 }}</span>
              <button @click="removeStop(idx)" class="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                <TrashIcon class="h-4 w-4" />
              </button>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <BaseInput label="Nombre de la Parada" v-model="stop.name" required />
              <div class="space-y-1.5">
                <label class="text-sm font-semibold text-text-primary ml-1">Tipo de Admisión</label>
                <select v-model="stop.admissionType" class="w-full bg-surface border border-border rounded-xl py-2.5 px-4 outline-none focus:ring-2 focus:ring-primary/20">
                  <option value="included">Incluido</option>
                  <option value="optional">Opcional</option>
                  <option value="excluded">No incluido</option>
                </select>
              </div>
            </div>
            <div class="space-y-1.5">
              <label class="text-sm font-semibold text-text-primary ml-1">Descripción</label>
              <textarea v-model="stop.description" rows="2"
                class="w-full bg-surface border border-border rounded-xl py-2 px-4 focus:ring-2 focus:ring-primary/20 outline-none text-sm"></textarea>
            </div>
            <div class="grid grid-cols-3 gap-4">
              <BaseInput label="Duración (min)" type="number" v-model.number="stop.stayTimeMinutes" min="1" />
              <BaseInput label="Latitud" type="number" step="any" v-model.number="stop.latitude" />
              <BaseInput label="Longitud" type="number" step="any" v-model.number="stop.longitude" />
            </div>
          </div>
        </div>
      </div>

      <!-- Save Button -->
      <div class="flex justify-end gap-4 pt-2">
        <BaseButton variant="outline" @click="router.push('/admin/attractions')">Cancelar</BaseButton>
        <BaseButton @click="handleSave" :loading="saving" class="px-8">
          <CheckBadgeIcon class="h-5 w-5 mr-2" /> Guardar Cambios
        </BaseButton>
      </div>
    </div>
  </div>
</template>
