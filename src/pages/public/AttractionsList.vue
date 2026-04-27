<script setup>
import { ref, onMounted } from 'vue'
import attractionService from '@/services/attractions'
import catalogService from '@/services/catalog'
import AttractionCard from '@/components/admin/AttractionCard.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import { MagnifyingGlassIcon, AdjustmentsHorizontalIcon, MapPinIcon } from '@heroicons/vue/24/outline'

const attractions = ref([])
const categories = ref([])
const locations = ref([])
const loading = ref(true)

// Filtros
const searchQuery = ref('')
const selectedCategory = ref('') // usará el slug o id
const selectedLocation = ref('')
const selectedDifficulty = ref('')

const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      SearchTerm: searchQuery.value || undefined,
      CategorySlug: selectedCategory.value || undefined,
      LocationId: selectedLocation.value || undefined,
      DifficultyLevel: selectedDifficulty.value || undefined
    }
    
    const [attrData, catData, locData] = await Promise.all([
      attractionService.search(params),
      catalogService.getCategories(),
      catalogService.getLocations()
    ])
    attractions.value = attrData.items || []
    categories.value = catData || []
    locations.value = locData || []
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

onMounted(fetchData)
</script>

<template>
  <div class="min-h-screen bg-background">
    <!-- Header -->
    <div class="bg-primary/5 border-b border-border py-12">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 class="text-4xl font-extrabold text-text-primary tracking-tight">Explora Experiencias</h1>
        <p class="text-text-secondary mt-4 max-w-2xl text-lg">Encuentra los mejores tours, aventuras y actividades culturales seleccionadas para ti.</p>
      </div>
    </div>

    <!-- Filters & Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="flex flex-col lg:flex-row gap-8">
        <!-- Sidebar Filters -->
        <aside class="w-full lg:w-64 space-y-8">
          <div>
            <h3 class="text-sm font-bold text-text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
              <AdjustmentsHorizontalIcon class="h-4 w-4" /> Filtros
            </h3>
            <div class="space-y-2">
              <button 
                @click="selectedCategory = ''; fetchData()"
                class="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors"
                :class="selectedCategory === '' ? 'bg-primary text-white font-bold' : 'text-text-secondary hover:bg-surface'"
              >
                Todas las categorías
              </button>
              <button 
                v-for="cat in categories" 
                :key="cat.id"
                @click="selectedCategory = cat.slug || cat.id; fetchData()"
                class="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors"
                :class="selectedCategory === (cat.slug || cat.id) ? 'bg-primary text-white font-bold' : 'text-text-secondary hover:bg-surface'"
              >
                {{ cat.name }}
              </button>
            </div>
          </div>
          
          <div class="pt-4 border-t border-border">
            <h3 class="text-sm font-bold text-text-primary uppercase tracking-wider mb-4">Ubicación</h3>
            <select v-model="selectedLocation" @change="fetchData" class="w-full bg-surface border border-border rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm">
              <option value="">Todas las ubicaciones</option>
              <option v-for="loc in locations" :key="loc.id" :value="loc.id">{{ loc.name }}</option>
            </select>
          </div>

          <div class="pt-4 border-t border-border">
            <h3 class="text-sm font-bold text-text-primary uppercase tracking-wider mb-4">Dificultad</h3>
            <select v-model="selectedDifficulty" @change="fetchData" class="w-full bg-surface border border-border rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm">
              <option value="">Cualquier dificultad</option>
              <option value="easy">Fácil</option>
              <option value="moderate">Moderado</option>
              <option value="hard">Difícil</option>
            </select>
          </div>
        </aside>

        <!-- Main Grid -->
        <div class="flex-1 space-y-6">
          <div class="flex gap-4">
            <div class="flex-1">
              <BaseInput 
                v-model="searchQuery"
                placeholder="¿Qué aventura buscas hoy?..."
                :icon="MagnifyingGlassIcon"
                @keyup.enter="fetchData"
              />
            </div>
          </div>

          <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div v-for="i in 4" :key="i" class="h-80 bg-surface animate-pulse rounded-2xl"></div>
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <AttractionCard 
              v-for="attr in attractions" 
              :key="attr.id" 
              :attraction="attr" 
              class="cursor-pointer"
              @click="$router.push(`/attractions/${attr.slug}`)"
            />
            
            <div v-if="attractions.length === 0" class="col-span-full py-20 text-center bg-surface rounded-2xl border border-dashed border-border">
              <MapPinIcon class="h-12 w-12 mx-auto text-text-secondary/30 mb-4" />
              <p class="text-text-secondary italic">No se encontraron atracciones con estos criterios.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
