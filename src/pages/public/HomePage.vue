<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import attractionService from '@/services/attractions'
import BaseButton from '@/components/common/BaseButton.vue'
import AttractionCard from '@/components/admin/AttractionCard.vue' // Reusando componente para consistencia
import { ArrowRightIcon, SparklesIcon, MapPinIcon } from '@heroicons/vue/24/outline'

const router = useRouter()
const authStore = useAuthStore()

const topAttractions = ref([])
const loading = ref(true)

onMounted(async () => {
  try {
    const data = await attractionService.getTopRated(6)
    topAttractions.value = data
  } catch (error) {
    console.error('Error fetching attractions:', error)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <!-- Hero Section -->
    <header class="relative py-20 overflow-hidden bg-primary/5">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div class="text-center max-w-3xl mx-auto">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-6 animate-pulse">
            <SparklesIcon class="h-4 w-4" />
            NUEVAS EXPERIENCIAS 2026
          </div>
          <h1 class="text-5xl sm:text-7xl font-extrabold text-text-primary tracking-tight mb-6 leading-tight">
            Descubre lugares <span class="text-primary">Inolvidables</span>
          </h1>
          <p class="text-lg text-text-secondary mb-10 leading-relaxed">
            Reserva las mejores atracciones y tours culturales con un solo clic. 
            Calidad garantizada y soporte 24/7 para tus aventuras.
          </p>
          
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <BaseButton @click="router.push('/login')" v-if="!authStore.isAuthenticated">
              Comenzar ahora
              <ArrowRightIcon class="h-5 w-5 ml-1" />
            </BaseButton>
            
            <BaseButton 
              variant="outline" 
              @click="router.push('/admin')" 
              v-if="authStore.canAccessAdmin"
            >
              Ir al Panel de Administración
              <ArrowRightIcon class="h-5 w-5 ml-1" />
            </BaseButton>
          </div>
        </div>
      </div>
      
      <!-- Background pattern -->
      <div class="absolute inset-0 -z-0 opacity-20 pointer-events-none">
        <svg class="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" stroke-width="0.5"/>
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />
        </svg>
      </div>
    </header>

    <!-- Content Section -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div class="flex justify-between items-end mb-10">
        <div>
          <h2 class="text-3xl font-bold text-text-primary">Atracciones Destacadas</h2>
          <p class="text-text-secondary mt-2">Las experiencias mejor valoradas por nuestros viajeros</p>
        </div>
        <button 
          @click="router.push('/attractions')"
          class="text-primary font-semibold hover:underline flex items-center gap-1 text-sm"
        >
          Ver todas
          <ArrowRightIcon class="h-4 w-4" />
        </button>
      </div>

      <!-- Grid -->
      <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        <div v-for="i in 6" :key="i" class="h-80 bg-surface animate-pulse rounded-2xl"></div>
      </div>
      
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        <AttractionCard 
          v-for="attraction in topAttractions" 
          :key="attraction.id" 
          :attraction="attraction" 
          class="cursor-pointer"
          @click="router.push(`/attractions/${attraction.slug}`)"
        />
        
        <div v-if="topAttractions.length === 0" class="col-span-full py-20 text-center bg-surface rounded-2xl border border-dashed border-border">
          <MapPinIcon class="h-12 w-12 mx-auto text-text-secondary/30 mb-4" />
          <p class="text-text-secondary italic">No hay atracciones disponibles en este momento.</p>
        </div>
      </div>
    </section>
  </div>
</template>
