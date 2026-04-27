<script setup>
import { MapPinIcon, TagIcon } from '@heroicons/vue/24/outline'

defineProps({
  attraction: { 
    type: Object, 
    required: true 
  },
  isAdmin: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['edit', 'delete', 'toggle-status'])
</script>

<template>
  <div class="bg-background rounded-xl border border-border overflow-hidden hover:shadow-soft transition-all duration-300 group flex flex-col h-full relative">
    
    <!-- Estado Visual (Solo Admin) -->
    <div v-if="isAdmin" class="absolute top-3 right-3 z-10 flex gap-2">
      <span 
        class="px-2.5 py-1 text-xs font-semibold rounded-full shadow-sm backdrop-blur-sm" 
        :class="attraction.isActive ? 'bg-accent/90 text-white' : 'bg-gray-500/90 text-white'"
      >
        {{ attraction.isActive ? 'Activo' : 'Inactivo' }}
      </span>
    </div>

    <!-- Imagen -->
    <div class="h-48 overflow-hidden bg-surface relative">
      <img 
        v-if="attraction.mainImageUrl || (attraction.media && attraction.media.length > 0)"
        :src="attraction.mainImageUrl || attraction.media[0].url" 
        :alt="attraction.name"
        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
      />
      <div v-else class="w-full h-full flex items-center justify-center text-text-secondary bg-gray-100">
        <MapPinIcon class="h-12 w-12 opacity-30" />
      </div>
      
      <!-- Badges públicos -->
      <div v-if="!isAdmin" class="absolute bottom-3 left-3 flex gap-2 flex-wrap">
        <span v-if="attraction.categoryName" class="px-2 py-1 text-[10px] font-bold uppercase bg-white/90 text-text-primary rounded-md shadow-sm backdrop-blur-sm">
          {{ attraction.categoryName }}
        </span>
        <span v-if="attraction.difficultyLevel" class="px-2 py-1 text-[10px] font-bold uppercase bg-primary/90 text-white rounded-md shadow-sm backdrop-blur-sm">
          {{ attraction.difficultyLevel === 'easy' ? 'Fácil' : attraction.difficultyLevel === 'moderate' ? 'Moderado' : 'Difícil' }}
        </span>
      </div>
    </div>
    
    <!-- Contenido -->
    <div class="p-5 flex-1 flex flex-col">
      <div class="flex items-center gap-1 text-xs text-text-secondary mb-2" v-if="attraction.locationName || attraction.location">
        <MapPinIcon class="h-3 w-3" />
        {{ attraction.locationName || attraction.location }} {{ attraction.locationCountryCode ? `, ${attraction.locationCountryCode}` : '' }}
      </div>

      <h3 class="text-lg font-bold text-text-primary mb-1 line-clamp-1" :title="attraction.name">
        {{ attraction.name || 'Atracción sin nombre' }}
      </h3>
      
      <p class="text-sm text-text-secondary line-clamp-2 mb-4 flex-1" :title="attraction.descriptionShort || attraction.description">
        {{ attraction.descriptionShort || attraction.description || 'No hay una descripción disponible para esta atracción.' }}
      </p>
      
      <div class="flex items-end justify-between mt-auto pt-4 border-t border-border">
        <div>
          <span v-if="isAdmin" class="text-xs font-bold text-text-secondary bg-surface px-2 py-1 rounded border border-border">
            {{ attraction.products?.length || 0 }} Modalidades
          </span>
          <div v-else class="text-sm font-bold text-primary">
            <template v-if="attraction.startingPrice > 0">
              Desde {{ attraction.currencyCode || 'USD' }} ${{ attraction.startingPrice?.toFixed(2) }}
            </template>
            <template v-else>
              Consultar precio
            </template>
          </div>
        </div>
        
        <div v-if="isAdmin" class="flex gap-2">
          <button 
            @click.stop="emit('edit', attraction)"
            class="text-text-secondary hover:text-primary transition-colors p-1.5 rounded-md hover:bg-surface focus:outline-none"
            title="Editar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.89 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.89l12.683-12.683z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 7.125L16.862 4.487" />
            </svg>
          </button>
          <button 
            @click.stop="emit('delete', attraction)"
            class="text-text-secondary hover:text-red-500 transition-colors p-1.5 rounded-md hover:bg-red-50 focus:outline-none"
            title="Eliminar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
