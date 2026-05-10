<script setup>
import { MapPinIcon, TagIcon, TicketIcon, CheckBadgeIcon } from '@heroicons/vue/24/outline'

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

const emit = defineEmits(['edit', 'delete', 'toggle-status', 'toggle-active', 'view-modalities'])
</script>

<template>
  <div class="bg-background rounded-xl border border-border overflow-hidden hover:shadow-soft transition-all duration-300 group flex flex-col h-full relative">
    
    <!-- Botón de Estado de Publicación (Solo Admin) -->
    <div v-if="isAdmin" class="absolute top-3 right-3 z-10 flex gap-2">
      <button 
        @click.stop="emit('toggle-status', attraction)"
        class="px-3 py-1.5 text-[10px] font-black uppercase rounded-full shadow-lg backdrop-blur-md transition-all hover:scale-105" 
        :class="attraction.isPublished ? 'bg-green-500 text-white border border-green-400' : 'bg-gray-500 text-white border border-gray-400'"
        :title="attraction.isPublished ? 'Publicada: visible para los clientes. Clic para poner en borrador.' : 'Borrador: oculta para los clientes. Clic para publicar.'"
      >
        {{ attraction.isPublished ? 'Publicada' : 'Borrador' }}
      </button>
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
      <div v-if="!isAdmin" class="absolute bottom-3 left-3 flex gap-2 flex-wrap max-w-[90%]">
        <span v-if="attraction.categoryName" class="px-2 py-1 text-[10px] font-bold uppercase bg-white/95 text-text-primary rounded-md shadow-sm backdrop-blur-sm border border-border/50">
          {{ attraction.categoryName }}
        </span>
        <span v-if="attraction.difficultyLevel" class="px-2 py-1 text-[10px] font-bold uppercase bg-primary text-white rounded-md shadow-sm border border-primary-dark">
          {{ attraction.difficultyLevel === 'easy' ? 'Fácil' : attraction.difficultyLevel === 'moderate' ? 'Moderado' : 'Difícil' }}
        </span>
        <!-- Tags -->
        <span v-for="tag in attraction.tags?.slice(0, 2)" :key="tag.id" class="px-2 py-1 text-[10px] font-bold uppercase bg-background/80 text-text-secondary rounded-md shadow-sm backdrop-blur-sm border border-border">
          {{ tag.name }}
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
          <button 
            v-if="isAdmin" 
            @click.stop="emit('view-modalities', attraction)"
            class="text-[10px] font-black uppercase px-2 py-1 rounded border transition-all hover:shadow-sm"
            :class="(attraction.products?.length || attraction.productCount || attraction.modalityCount || 0) > 0 
              ? 'bg-surface text-text-secondary border-border hover:bg-primary/5 hover:text-primary hover:border-primary/20' 
              : 'bg-primary/5 text-primary border-primary/30 hover:bg-primary hover:text-white hover:border-primary'"
          >
            {{ (attraction.products?.length || attraction.productCount || attraction.modalityCount || 0) }} {{ (attraction.products?.length || attraction.productCount || attraction.modalityCount || 0) === 1 ? 'Modalidad' : 'Modalidades' }}
            <span v-if="(attraction.products?.length || attraction.productCount || attraction.modalityCount || 0) === 0" class="ml-1">+</span>
          </button>
          <div v-else class="text-sm font-bold text-primary">
            <template v-if="attraction.startingPrice > 0">
              Desde {{ attraction.currencyCode || 'USD' }} ${{ attraction.startingPrice?.toFixed(2) }}
            </template>
            <template v-else>
              Consultar precio
            </template>
          </div>
        </div>
        
        <div v-if="isAdmin" class="flex gap-2 items-center">
          <!-- Botón Activar/Desactivar Reservas -->
          <div class="relative group/tooltip">
            <button 
              @click.stop="emit('toggle-active', attraction)"
              class="transition-colors p-1.5 rounded-md focus:outline-none flex items-center gap-1"
              :class="attraction.isActive ? 'text-blue-500 hover:bg-blue-50' : 'text-orange-500 hover:bg-orange-50'"
            >
              <CheckBadgeIcon v-if="attraction.isActive" class="w-5 h-5" />
              <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </button>
            <!-- Tooltip explicativo (Ajustado para no cortarse) -->
            <div class="absolute bottom-full right-0 mb-2 w-56 bg-gray-900 text-white text-[10px] rounded-lg p-2 opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50 text-center shadow-xl">
              <strong class="text-xs">{{ attraction.isActive ? 'Activo' : 'Inactivo' }}</strong><br>
              <p class="mt-1">{{ attraction.isActive ? 'Acepta nuevas reservas. Clic para bloquear.' : 'No acepta reservas nuevas. Clic para reactivar.' }}</p>
              <div class="text-gray-400 text-[9px] mt-2 pt-2 border-t border-white/10 italic">
                Nota: Diferente a Publicada/Borrador. Puede estar publicada pero cerrada a reservas.
              </div>
              <div class="absolute top-full right-4 border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>

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
            @click.stop="emit('view-modalities', attraction)"
            class="text-text-secondary hover:text-primary transition-colors p-1.5 rounded-md hover:bg-surface focus:outline-none"
            title="Ver Modalidades"
          >
            <TicketIcon class="w-5 h-5" />
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
</template>
