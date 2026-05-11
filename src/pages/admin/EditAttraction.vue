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
  CheckBadgeIcon, GlobeAltIcon, TagIcon, ListBulletIcon,
  CheckCircleIcon, PhotoIcon
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
  inclusions: [], // Ahora guardará { inclusionItemId, type }
  itinerary: { overview: '', stops: [] }
})

// Computed location tree
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

// Helper functions for Inclusions (Matching CreateAttractionComplete logic)
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

function toggleTag(tagId) {
  const idx = form.tags.indexOf(tagId)
  if (idx > -1) form.tags.splice(idx, 1)
  else form.tags.push(tagId)
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
    console.log('Cargando detalle de atracción ID:', attractionId)
    // Usamos directamente el endpoint estable
    const a = await attractionService.getManagementDetail(attractionId)
    if (!a) throw new Error('La atracción no existe.')

    console.log('Datos de atracción recibidos:', a)

    // Cargar catálogos
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

    // Poblar formulario
    form.name = a.name || ''
    form.descriptionShort = a.descriptionShort || ''
    form.descriptionFull = a.descriptionFull || ''
    form.difficultyLevel = a.difficultyLevel || 'moderate'
    form.meetingPoint = a.meetingPoint || ''
    form.latitude = a.latitude || 0
    form.longitude = a.longitude || 0
    form.locationId = a.locationId || ''
    form.subcategoryId = a.subcategoryId || ''
    
    // Mapeo de Tags (IDs)
    form.tags = (a.tags || []).map(t => t.id || t.tagId)
    
    // Mapeo de Inclusiones (Estructura compleja { inclusionItemId, type })
    form.inclusions = (a.inclusions || []).map(i => ({
      inclusionItemId: i.inclusionItemId || i.id,
      type: i.type || 'included'
    }))
    
    form.itinerary = {
      overview: a.itinerary?.overview || '',
      stops: (a.itinerary?.stops || []).map(s => ({ ...s }))
    }

    // Autoselección de Categoría
    if (a.categoryId) {
      selectedCategoryId.value = a.categoryId
    } else if (a.categoryName) {
      const cat = categories.value.find(c => c.name === a.categoryName)
      if (cat) selectedCategoryId.value = cat.id
    }

    // Reconstrucción del árbol de ubicación basado en la Ciudad (locationId)
    if (a.locationId && locations.value.length) {
      locations.value.forEach(country => {
        country.children?.forEach(state => {
          if (state.children?.some(city => city.id === a.locationId)) {
            selectedCountryId.value = country.id
            setTimeout(() => {
              selectedStateId.value = state.id
              setTimeout(() => {
                form.locationId = a.locationId
              }, 100)
            }, 100)
          }
        })
      })
    }
  } catch (e) {
    console.error('Error cargando atracción:', e)
    Swal.fire('Error', 'No se pudo cargar los datos: ' + e.message, 'error')
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
  { key: 'general', label: 'General', icon: CheckBadgeIcon },
  { key: 'location', label: 'Ubicación', icon: GlobeAltIcon },
  { key: 'tags', label: 'Tags', icon: TagIcon },
  { key: 'inclusions', label: 'Inclusiones', icon: CheckCircleIcon },
  { key: 'itinerary', label: 'Itinerario', icon: ListBulletIcon },
]
</script>

<template>
  <div class="max-w-5xl mx-auto pb-20 px-4">
    <!-- Header -->
    <div class="flex items-center gap-4 mb-8 pt-6">
      <button @click="router.push('/admin/attractions')" class="p-2.5 hover:bg-surface rounded-2xl transition-all border border-border shadow-sm group">
        <ArrowLeftIcon class="h-5 w-5 text-text-secondary group-hover:text-primary transition-colors" />
      </button>
      <div>
        <h1 class="text-3xl font-black text-text-primary tracking-tight">Editar Atracción</h1>
        <p class="text-text-secondary text-sm">Gestiona los detalles completos de la experiencia.</p>
      </div>
    </div>

    <div v-if="loading" class="py-32 text-center text-text-secondary bg-surface rounded-3xl border border-border">
      <div class="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
      <p class="font-bold">Cargando datos maestros...</p>
    </div>

    <div v-else class="space-y-6">
      <!-- Tabs Premium -->
      <div class="flex gap-2 bg-surface border border-border rounded-2xl p-1.5 overflow-x-auto no-scrollbar shadow-sm">
        <button v-for="tab in tabs" :key="tab.key" @click="activeTab = tab.key"
          class="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black transition-all whitespace-nowrap"
          :class="activeTab === tab.key ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]' : 'text-text-secondary hover:bg-background hover:text-primary'">
          <component :is="tab.icon" class="h-4 w-4" />
          {{ tab.label }}
        </button>
      </div>

      <!-- Tab: General -->
      <div v-if="activeTab === 'general'" class="bg-surface border border-border rounded-3xl p-8 space-y-6 animate-in fade-in duration-500">
        <div class="flex items-center gap-2 mb-2">
          <CheckBadgeIcon class="h-6 w-6 text-primary" />
          <h2 class="text-xl font-bold text-text-primary">Información General</h2>
        </div>

        <BaseInput label="Nombre de la Atracción" v-model="form.name" required placeholder="Ej: Tour Volcán Cotopaxi Full Day" />

        <div class="space-y-2">
          <label class="text-xs font-black uppercase text-text-secondary ml-1">Descripción Corta (Max 250)</label>
          <textarea v-model="form.descriptionShort" rows="2" maxlength="250"
            class="w-full bg-background border border-border rounded-2xl py-3 px-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm transition-all"
            placeholder="Resumen para las tarjetas de búsqueda..."></textarea>
        </div>

        <div class="space-y-2">
          <label class="text-xs font-black uppercase text-text-secondary ml-1">Descripción Completa</label>
          <textarea v-model="form.descriptionFull" rows="6"
            class="w-full bg-background border border-border rounded-2xl py-4 px-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm transition-all"
            placeholder="Describe la experiencia detalladamente..."></textarea>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div class="space-y-2">
            <label class="text-xs font-black uppercase text-text-secondary ml-1">Nivel de Exigencia</label>
            <select v-model="form.difficultyLevel"
              class="w-full bg-background border border-border rounded-2xl py-3.5 px-4 outline-none focus:ring-2 focus:ring-primary/20 font-bold text-sm">
              <option value="">Sin especificar</option>
              <option value="easy">Fácil (Caminata ligera)</option>
              <option value="moderate">Moderada (Esfuerzo medio)</option>
              <option value="hard">Difícil (Alta exigencia)</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Tab: Location -->
      <div v-if="activeTab === 'location'" class="bg-surface border border-border rounded-3xl p-8 space-y-6 animate-in fade-in duration-500">
        <div class="flex items-center gap-2 mb-2">
          <GlobeAltIcon class="h-6 w-6 text-primary" />
          <h2 class="text-xl font-bold text-text-primary">Ubicación y Mapa</h2>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div class="space-y-2">
            <label class="text-xs font-black uppercase text-text-secondary ml-1">País</label>
            <select v-model="selectedCountryId" class="w-full bg-background border border-border rounded-2xl py-3.5 px-4 outline-none focus:ring-2 focus:ring-primary/20 font-bold text-sm">
              <option value="">Seleccionar...</option>
              <option v-for="c in countries" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>
          <div class="space-y-2">
            <label class="text-xs font-black uppercase text-text-secondary ml-1">Provincia / Región</label>
            <select v-model="selectedStateId" :disabled="!states.length" class="w-full bg-background border border-border rounded-2xl py-3.5 px-4 outline-none disabled:opacity-50 font-bold text-sm">
              <option value="">Seleccionar...</option>
              <option v-for="s in states" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
          </div>
          <div class="space-y-2">
            <label class="text-xs font-black uppercase text-text-secondary ml-1">Ciudad (Punto Base)</label>
            <select v-model="form.locationId" :disabled="!cities.length" class="w-full bg-background border border-border rounded-2xl py-3.5 px-4 outline-none disabled:opacity-50 border-primary/30 font-bold text-sm">
              <option value="">Seleccionar...</option>
              <option v-for="city in cities" :key="city.id" :value="city.id">{{ city.name }}</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
          <div class="space-y-2">
            <label class="text-xs font-black uppercase text-text-secondary ml-1">Categoría</label>
            <select v-model="selectedCategoryId" class="w-full bg-background border border-border rounded-2xl py-3.5 px-4 outline-none focus:ring-2 focus:ring-primary/20 font-bold text-sm">
              <option value="">Seleccionar categoría...</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
            </select>
          </div>
          <div class="space-y-2">
            <label class="text-xs font-black uppercase text-text-secondary ml-1">Subcategoría</label>
            <select v-model="form.subcategoryId" :disabled="!subcategories.length" class="w-full bg-background border border-border rounded-2xl py-3.5 px-4 outline-none disabled:opacity-50 font-bold text-sm">
              <option value="">Seleccionar subcategoría...</option>
              <option v-for="sc in subcategories" :key="sc.id" :value="sc.id">{{ sc.name }}</option>
            </select>
          </div>
        </div>

        <div class="space-y-4 pt-6 border-t border-border">
          <h3 class="text-sm font-black uppercase text-text-primary tracking-wider">Geolocalización (Google Maps)</h3>
          <MapPicker 
            v-model:lat="form.latitude" 
            v-model:lng="form.longitude" 
            label="Mueve el pin hasta el punto de encuentro exacto"
          />
          <div class="grid grid-cols-2 gap-4">
            <BaseInput label="Latitud" type="number" step="any" v-model.number="form.latitude" disabled class="opacity-70" />
            <BaseInput label="Longitud" type="number" step="any" v-model.number="form.longitude" disabled class="opacity-70" />
          </div>
          <BaseInput label="Punto de Encuentro (Texto)" v-model="form.meetingPoint" placeholder="Instrucciones precisas para el turista..." />
        </div>
      </div>

      <!-- Tab: Tags -->
      <div v-if="activeTab === 'tags'" class="bg-surface border border-border rounded-3xl p-8 space-y-6 animate-in fade-in duration-500">
        <div class="flex items-center gap-2">
          <TagIcon class="h-6 w-6 text-primary" />
          <h2 class="text-xl font-bold text-text-primary">Etiquetas</h2>
        </div>
        <p class="text-text-secondary text-sm">Selecciona los tags para mejorar la búsqueda del cliente.</p>
        
        <div class="flex flex-wrap gap-3">
          <button v-for="tag in availableTags" :key="tag.id"
            @click="toggleTag(tag.id)"
            class="px-5 py-2.5 rounded-full text-xs font-black border transition-all uppercase tracking-wider"
            :class="form.tags.includes(tag.id)
              ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
              : 'bg-background border-border text-text-secondary hover:border-primary/40 hover:text-primary'">
            {{ tag.name }}
          </button>
        </div>
      </div>

      <!-- Tab: Inclusions (Same UI as CreateAttractionComplete) -->
      <div v-if="activeTab === 'inclusions'" class="bg-surface border border-border rounded-3xl p-8 space-y-6 animate-in fade-in duration-500">
        <div class="flex items-center gap-2 mb-2">
          <CheckBadgeIcon class="h-6 w-6 text-primary" />
          <h2 class="text-xl font-bold text-text-primary">¿Qué incluye la atracción?</h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div v-for="item in availableInclusions" :key="item.id" 
            class="p-5 border rounded-2xl transition-all" 
            :class="form.inclusions.some(i => i.inclusionItemId === item.id) ? 'border-primary bg-primary/5 shadow-sm' : 'border-border bg-background hover:bg-surface'">
            
            <div class="flex items-center gap-4 mb-4">
              <input type="checkbox" 
                :checked="form.inclusions.some(i => i.inclusionItemId === item.id)" 
                @change="toggleInclusion(item.id)" 
                class="rounded-lg text-primary focus:ring-primary w-6 h-6 border-border" />
              <span class="font-black text-sm text-text-primary uppercase tracking-tight">{{ item.defaultText || item.name }}</span>
            </div>
            
            <!-- Tipos de Inclusión Avanzados -->
            <div v-if="form.inclusions.some(i => i.inclusionItemId === item.id)" class="grid grid-cols-4 gap-1.5 mt-2 p-1 bg-surface rounded-xl border border-border/50">
              <button 
                v-for="type in ['included', 'not_included', 'optional', 'bring']" 
                :key="type"
                @click="setInclusionType(item.id, type)"
                class="py-2 text-[9px] font-black uppercase rounded-lg border transition-all"
                :class="form.inclusions.find(i => i.inclusionItemId === item.id).type === type ? 'bg-primary text-white border-primary shadow-sm' : 'bg-transparent text-text-secondary border-transparent hover:bg-background'">
                {{ {included: 'Incluye', not_included: 'No Inc', optional: 'Opcional', bring: 'Llevar'}[type] }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab: Itinerary Stops -->
      <div v-if="activeTab === 'itinerary'" class="bg-surface border border-border rounded-3xl p-8 space-y-6 animate-in fade-in duration-500">
        <div class="flex items-center justify-between border-b border-border pb-4">
          <div class="flex items-center gap-2">
            <ListBulletIcon class="h-6 w-6 text-primary" />
            <h2 class="text-xl font-bold text-text-primary">Itinerario y Paradas</h2>
          </div>
          <BaseButton size="sm" variant="outline" @click="addStop">
            <PlusIcon class="h-4 w-4 mr-1" /> Agregar Parada
          </BaseButton>
        </div>

        <div class="space-y-2">
          <label class="text-xs font-black uppercase text-text-secondary ml-1">Descripción general del recorrido</label>
          <textarea v-model="form.itinerary.overview" rows="3"
            class="w-full bg-background border border-border rounded-2xl py-3 px-4 focus:ring-2 focus:ring-primary/20 outline-none text-sm transition-all"
            placeholder="Breve descripción del recorrido completo..."></textarea>
        </div>

        <div v-if="form.itinerary.stops.length === 0" class="py-16 text-center text-text-secondary italic border-2 border-dashed border-border rounded-3xl bg-background/50">
          <MapIcon class="h-10 w-10 mx-auto mb-3 opacity-20" />
          No hay paradas configuradas.
        </div>

        <div v-else class="space-y-4">
          <div v-for="(stop, idx) in form.itinerary.stops" :key="idx"
            class="bg-background border border-border rounded-3xl p-6 space-y-6 shadow-sm relative group transition-all hover:border-primary/30">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <span class="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-black text-sm shadow-lg shadow-primary/20">{{ idx + 1 }}</span>
                <h4 class="font-black text-text-primary uppercase tracking-tight">{{ stop.name || 'Nueva Parada' }}</h4>
              </div>
              <button @click="removeStop(idx)" class="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                <TrashIcon class="h-5 w-5" />
              </button>
            </div>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <BaseInput label="Nombre de la Parada" v-model="stop.name" required />
              <div class="space-y-2">
                <label class="text-xs font-black uppercase text-text-secondary ml-1">Tipo de Admisión</label>
                <select v-model="stop.admissionType" class="w-full bg-surface border border-border rounded-2xl py-3 px-4 outline-none focus:ring-2 focus:ring-primary/20 font-bold text-sm">
                  <option value="included">Incluido</option>
                  <option value="optional">Opcional</option>
                  <option value="excluded">No incluido</option>
                  <option value="bring">Llevar entrada</option>
                </select>
              </div>
            </div>

            <MapPicker 
              v-model:lat="stop.latitude" 
              v-model:lng="stop.longitude" 
              :label="'Ubicación de ' + (stop.name || 'la parada')"
            />

            <div class="grid grid-cols-3 gap-6">
              <BaseInput label="Duración (min)" type="number" v-model.number="stop.stayTimeMinutes" />
              <BaseInput label="Latitud" type="number" step="any" v-model.number="stop.latitude" disabled class="opacity-70" />
              <BaseInput label="Longitud" type="number" step="any" v-model.number="stop.longitude" disabled class="opacity-70" />
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="flex justify-end items-center gap-4 pt-6 border-t border-border">
        <BaseButton variant="outline" @click="router.push('/admin/attractions')" class="px-10">Cancelar</BaseButton>
        <BaseButton @click="handleSave" :loading="saving" class="px-12 bg-primary shadow-xl shadow-primary/30">
          <CheckCircleIcon class="h-5 w-5 mr-2" /> Guardar Todos los Cambios
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

textarea { resize: none; }

@keyframes fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-in {
  animation: fade-in 0.4s ease-out forwards;
}
</style>
