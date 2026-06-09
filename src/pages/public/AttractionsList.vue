<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import attractionService from '@/services/attractions'
import catalogService from '@/services/catalog'
import AttractionCard from '@/components/admin/AttractionCard.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import { MagnifyingGlassIcon, AdjustmentsHorizontalIcon, MapPinIcon } from '@heroicons/vue/24/outline'
import { HubConnectionBuilder } from '@microsoft/signalr'
import { baseUrl } from '@/services/api'

const attractions = ref([])
const categories = ref([])
const locations = ref([])
const loading = ref(true)

const subcategories = ref([])
const tags = ref([])
const languages = [
  { id: 1, name: 'Español' },
  { id: 2, name: 'Inglés' },
  { id: 3, name: 'Francés' },
  { id: 4, name: 'Portugués' }
]

// Filtros
const searchQuery = ref('')
const selectedCategory = ref('') 
const selectedSubcategory = ref('')
const selectedLocation = ref('')
const selectedTags = ref([])
const selectedDifficulties = ref([])
const selectedLanguages = ref([])
const selectedRating = ref(0)

const flattenedLocations = computed(() => {
  const result = []
  const flatten = (items, level = 0) => {
    items.forEach(item => {
      result.push({
        ...item,
        displayName: `${' '.repeat(level * 3)}${level > 0 ? '↳ ' : ''}${item.name}`
      })
      if (item.children && item.children.length > 0) {
        flatten(item.children, level + 1)
      }
    })
  }
  flatten(locations.value)
  return result
})

const clearFilters = () => {
  searchQuery.value = ''
  selectedCategory.value = ''
  selectedSubcategory.value = ''
  selectedLocation.value = ''
  selectedTags.value = []
  selectedDifficulties.value = []
  selectedLanguages.value = []
  selectedRating.value = 0
  subcategories.value = []
  fetchData()
}

const isGuid = (val) => {
  const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return typeof val === 'string' && guidRegex.test(val)
}

const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      SearchTerm: searchQuery.value || undefined,
      CategorySlug: isGuid(selectedCategory.value) ? undefined : (selectedCategory.value || undefined),
      CategoryId: isGuid(selectedCategory.value) ? selectedCategory.value : undefined,
      SubcategoryId: selectedSubcategory.value || undefined,
      LocationId: selectedLocation.value || undefined,
      TagIds: selectedTags.value.length > 0 ? selectedTags.value.join(',') : undefined,
      DifficultyLevels: selectedDifficulties.value.length > 0 ? selectedDifficulties.value.join(',') : undefined,
      LanguageIds: selectedLanguages.value.length > 0 ? selectedLanguages.value.join(',') : undefined,
      MinRating: selectedRating.value > 0 ? selectedRating.value : undefined,
      IsPublished: true,
      IsActive: true
    }
    
    const [attrData, catData, locData, tagData] = await Promise.all([
      attractionService.search(params),
      catalogService.getCategories(),
      catalogService.getLocations(),
      catalogService.getTags()
    ])
    attractions.value = attrData.items || []
    categories.value = catData || []
    locations.value = locData || []
    tags.value = tagData || []
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const handleCategoryChange = async (cat) => {
  selectedCategory.value = cat.slug || cat.id
  selectedSubcategory.value = ''
  subcategories.value = []
  if (cat.id) {
    try {
      subcategories.value = await catalogService.getSubcategories(cat.id)
    } catch (e) { console.error(e) }
  }
  fetchData()
}

watch([selectedTags, selectedDifficulties, selectedLanguages, selectedLocation, selectedRating], () => {
  fetchData()
}, { deep: true })

let connection = null

onMounted(async () => {
  await fetchData()

  // Conectar a SignalR para actualizaciones en tiempo real
  try {
    let hubUrl = '/hub/notifications'
    if (baseUrl.startsWith('http')) {
      hubUrl = `${new URL(baseUrl).origin}/hub/notifications`
    }
    
    connection = new HubConnectionBuilder()
      .withUrl(hubUrl)
      .withAutomaticReconnect()
      .build()

    connection.on("OnAttractionCreated", (newAttraction) => {
      console.log("Nueva atracción recibida por SignalR:", newAttraction)
      // Añadir la atracción al principio de la lista si no existe ya
      if (newAttraction && newAttraction.id) {
        const index = attractions.value.findIndex(a => a.id === newAttraction.id)
        if (index === -1) {
          attractions.value.unshift(newAttraction)
        }
      }
    })

    await connection.start()
    console.log("Conectado con éxito a SignalR Hub")
  } catch (error) {
    console.error("Error al conectar a SignalR Hub:", error)
  }
})

onUnmounted(async () => {
  if (connection) {
    await connection.stop()
    console.log("Desconectado de SignalR Hub")
  }
})
</script>

<template>
  <div class="min-h-screen bg-background">
    <!-- Header -->
    <div class="bg-primary/5 border-b border-border py-12">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-end">
          <div>
            <h1 class="text-4xl font-extrabold text-text-primary tracking-tight">Explora Experiencias</h1>
            <p class="text-text-secondary mt-4 max-w-2xl text-lg">Encuentra los mejores tours, aventuras y actividades culturales seleccionadas para ti.</p>
          </div>
          <button @click="clearFilters" class="text-sm font-bold text-primary hover:underline flex items-center gap-1">
            Limpiar todos los filtros
          </button>
        </div>
      </div>
    </div>

    <!-- Filters & Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="flex flex-col lg:flex-row gap-8">
        <!-- Sidebar Filters -->
        <aside class="w-full lg:w-64 space-y-8">
          <!-- Categorías -->
          <div>
            <h3 class="text-sm font-bold text-text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
              <AdjustmentsHorizontalIcon class="h-4 w-4" /> Categorías
            </h3>
            <div class="space-y-1">
              <button 
                @click="selectedCategory = ''; selectedSubcategory = ''; subcategories = []; fetchData()"
                class="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors"
                :class="selectedCategory === '' ? 'bg-primary text-white font-bold shadow-sm' : 'text-text-secondary hover:bg-surface'"
              >
                Todas las categorías
              </button>
              <div v-for="cat in categories" :key="cat.id">
                <button 
                  @click="handleCategoryChange(cat)"
                  class="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors"
                  :class="selectedCategory === (cat.slug || cat.id) ? 'bg-primary text-white font-bold shadow-sm' : 'text-text-secondary hover:bg-surface'"
                >
                  {{ cat.name }}
                </button>
                <div v-if="selectedCategory === (cat.slug || cat.id) && subcategories.length > 0" class="ml-4 mt-1 space-y-1 border-l-2 border-primary/20 pl-2">
                  <button 
                    v-for="sub in subcategories" 
                    :key="sub.id"
                    @click="selectedSubcategory = sub.id; fetchData()"
                    class="w-full text-left px-2 py-1 rounded-md text-xs transition-colors"
                    :class="selectedSubcategory === sub.id ? 'text-primary font-bold' : 'text-text-secondary hover:text-primary'"
                  >
                    {{ sub.name }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Ubicación -->
          <div>
            <h4 class="text-xs font-bold text-text-secondary uppercase tracking-widest mb-3">Ubicación</h4>
            <select v-model="selectedLocation" class="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all">
              <option value="">Cualquier lugar</option>
              <option v-for="loc in flattenedLocations" :key="loc.id" :value="loc.id">
                {{ loc.displayName }}
              </option>
            </select>
          </div>

          <!-- Dificultad (Multi-select) -->
          <div>
            <h4 class="text-xs font-bold text-text-secondary uppercase tracking-widest mb-3">Dificultad</h4>
            <div class="space-y-2">
              <label v-for="d in [{id:'easy', n:'Fácil'}, {id:'moderate', n:'Moderado'}, {id:'hard', n:'Difícil'}]" :key="d.id" class="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" :value="d.id" v-model="selectedDifficulties" class="rounded border-gray-300 text-primary focus:ring-primary" />
                <span class="text-sm text-text-secondary group-hover:text-primary transition-colors">{{ d.n }}</span>
              </label>
            </div>
          </div>

          <!-- Etiquetas (Multi-select) -->
          <div>
            <h4 class="text-xs font-bold text-text-secondary uppercase tracking-widest mb-3">Etiquetas</h4>
            <div class="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              <label v-for="tag in tags" :key="tag.id" class="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" :value="tag.id" v-model="selectedTags" class="rounded border-gray-300 text-primary focus:ring-primary" />
                <span class="text-sm text-text-secondary group-hover:text-primary transition-colors">{{ tag.name }}</span>
              </label>
            </div>
          </div>

          <!-- Idiomas (Multi-select) -->
          <div>
            <h4 class="text-xs font-bold text-text-secondary uppercase tracking-widest mb-3">Idiomas del Guía</h4>
            <div class="space-y-2">
              <label v-for="lang in languages" :key="lang.id" class="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" :value="lang.id" v-model="selectedLanguages" class="rounded border-gray-300 text-primary focus:ring-primary" />
                <span class="text-sm text-text-secondary group-hover:text-primary transition-colors">{{ lang.name }}</span>
              </label>
            </div>
          </div>

          <!-- Calificación -->
          <div class="pt-6 border-t border-border">
            <h3 class="text-sm font-bold text-text-primary uppercase tracking-wider mb-4">Calificación mínima</h3>
            <div class="flex items-center gap-2">
              <button 
                v-for="star in 5" 
                :key="star"
                @click="selectedRating = star"
                class="transition-transform hover:scale-110"
              >
                <StarIcon 
                  class="h-6 w-6" 
                  :class="star <= selectedRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'" 
                />
              </button>
            </div>
          </div>
        </aside>

        <!-- Main Content -->
        <main class="flex-1">
          <!-- Search Bar -->
          <div class="mb-8 relative group">
            <MagnifyingGlassIcon class="h-5 w-5 absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-primary transition-colors" />
            <input 
              v-model="searchQuery"
              @keyup.enter="fetchData"
              type="text" 
              placeholder="Buscar por nombre o descripción..." 
              class="w-full bg-surface border border-border rounded-2xl py-4 pl-12 pr-4 text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all shadow-sm"
            />
          </div>

          <!-- Results -->
          <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div v-for="i in 4" :key="i" class="h-80 bg-surface animate-pulse rounded-2xl"></div>
          </div>
          <div v-else-if="attractions.length === 0" class="text-center py-20 bg-surface rounded-3xl border border-dashed border-border">
            <MapPinIcon class="h-16 w-16 mx-auto text-text-secondary/20 mb-4" />
            <h2 class="text-xl font-bold text-text-primary">No encontramos resultados</h2>
            <p class="text-text-secondary mt-2">Intenta ajustando los filtros o la búsqueda.</p>
          </div>
          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div v-for="attr in attractions" :key="attr.id">
              <AttractionCard 
                :attraction="attr" 
                @click="$router.push(`/attractions/${attr.slug}`)"
                class="cursor-pointer h-full"
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  </div>
</template>
