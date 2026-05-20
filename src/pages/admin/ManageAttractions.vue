<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import attractionService from '@/services/attractions'
import catalogService from '@/services/catalog'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import AttractionCard from '@/components/admin/AttractionCard.vue'
import Swal from 'sweetalert2'
import { PlusIcon, MagnifyingGlassIcon, MapPinIcon, TagIcon } from '@heroicons/vue/24/outline'

const router = useRouter()
const attractions = ref([])
const locations = ref([])
const categories = ref([])
// No more local modal state for editing, using a separate page now.
const loading = ref(true)
const searchQuery = ref('')

const fetchData = async () => {
  loading.value = true
  try {
    const [attrData, locData, catData] = await Promise.all([
      attractionService.getManagementList({ 
        searchTerm: searchQuery.value,
        pageNumber: 1,
        pageSize: 50 
      }),
      catalogService.getLocations(),
      catalogService.getCategories()
    ])
    attractions.value = attrData.items || []
    locations.value = locData || []
    categories.value = catData || []
  } catch (error) {
    console.error('Error fetching data:', error)
  } finally {
    loading.value = false
  }
}



// handleUpdate was removed in favor of EditAttraction.vue page logic.

const toggleStatus = async (attraction) => {
  try {
    await attractionService.toggleStatus(attraction.id, !attraction.isPublished)
    attraction.isPublished = !attraction.isPublished
    Swal.fire({
      icon: 'success',
      title: attraction.isPublished ? 'Atracción Publicada' : 'Atracción en Borrador',
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2000
    })
  } catch (error) {
    Swal.fire('Error', 'No se pudo cambiar el estado de publicación', 'error')
  }
}

const toggleActive = async (attraction) => {
  try {
    // Nota: El backend aún necesita el endpoint /active. Por ahora simulamos o usamos un mensaje.
    // await attractionService.toggleActive(attraction.id, !attraction.isActive)
    
    // Simulación hasta que el back esté listo
    attraction.isActive = !attraction.isActive
    
    Swal.fire({
      icon: 'info',
      title: attraction.isActive ? 'Atracción Activada' : 'Atracción Desactivada',
      text: attraction.isActive ? '' : 'La atracción ya no estará disponible para nuevas reservas.',
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000
    })
  } catch (error) {
    Swal.fire('Error', 'No se pudo cambiar el estado administrativo', 'error')
  }
}

const handleDelete = async (attraction) => {
  const result = await Swal.fire({
    title: '¿Eliminar atracción?',
    text: `Estás a punto de eliminar "${attraction.name}". Esta acción no se puede deshacer.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  })

  if (result.isConfirmed) {
    try {
      await attractionService.delete(attraction.id)
      Swal.fire('Eliminado', 'La atracción ha sido eliminada.', 'success')
      await fetchData()
    } catch (error) {
      Swal.fire('Error', error.message, 'error')
    }
  }
}

const handleEdit = (attraction) => {
  router.push(`/admin/attractions/${attraction.id}/edit`)
}

const handleViewModalities = (attraction) => {
  router.push(`/admin/attractions/${attraction.id}/modalities`)
}

onMounted(fetchData)
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-2xl font-bold text-text-primary">Gestión de Atracciones</h1>
        <p class="text-text-secondary text-sm">Administra y publica tus experiencias en la plataforma</p>
      </div>
      <div class="flex gap-3">
        <BaseButton @click="router.push('/admin/attractions/create-complete')">
          <PlusIcon class="h-5 w-5 mr-2" />
          Nueva Atracción
        </BaseButton>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-surface p-4 rounded-2xl border border-border flex gap-4">
      <div class="flex-1">
        <BaseInput 
          v-model="searchQuery"
          placeholder="Buscar por nombre o descripción..."
          :icon="MagnifyingGlassIcon"
          @keyup.enter="fetchData"
        />
      </div>
      <BaseButton variant="outline" @click="fetchData">Buscar</BaseButton>
    </div>

    <!-- Content -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="i in 6" :key="i" class="h-64 bg-surface animate-pulse rounded-2xl"></div>
    </div>

    <div v-else-if="attractions.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="attr in attractions" :key="attr.id" class="relative group">
        <AttractionCard 
          :attraction="attr" 
          :isAdmin="true"
          @edit="handleEdit(attr)" 
          @delete="handleDelete(attr)" 
          @toggle-status="toggleStatus"
          @toggle-active="toggleActive"
          @view-modalities="handleViewModalities(attr)"
        />
      </div>
    </div>

    <div v-else class="py-20 text-center bg-surface rounded-2xl border border-dashed border-border">
      <MapPinIcon class="h-12 w-12 mx-auto text-text-secondary/30 mb-4" />
      <p class="text-text-secondary italic">No se encontraron atracciones.</p>
    </div>
    <!-- Edit Modal was removed. Redirecting to EditAttraction.vue instead. -->
  </div>
</template>
