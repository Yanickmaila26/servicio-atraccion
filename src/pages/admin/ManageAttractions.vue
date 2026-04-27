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
const loading = ref(true)
const searchQuery = ref('')

// Modal state
const showCreateModal = ref(false)
const createLoading = ref(false)
const newAttraction = ref({
  name: '',
  slug: '',
  descriptionShort: '',
  locationId: '',
  subcategoryId: '',
  difficultyLevel: 'moderate'
})

const showEditModal = ref(false)
const editLoading = ref(false)
const editAttraction = ref({
  id: '',
  name: '',
  slug: '',
  descriptionShort: '',
  locationId: '',
  subcategoryId: '',
  difficultyLevel: 'moderate'
})

const fetchData = async () => {
  loading.value = true
  try {
    const [attrData, locData, catData] = await Promise.all([
      attractionService.getManagementList({ q: searchQuery.value }),
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

const handleCreate = async () => {
  createLoading.value = true
  try {
    // Generar slug automático si está vacío
    if (!newAttraction.value.slug) {
      newAttraction.value.slug = newAttraction.value.name.toLowerCase().replace(/ /g, '-')
    }
    await attractionService.create(newAttraction.value)
    showCreateModal.value = false
    await fetchData()
    Swal.fire({
      icon: 'success',
      title: 'Atracción Creada',
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000
    })
    // Reset form
    newAttraction.value = { name: '', slug: '', descriptionShort: '', locationId: '', subcategoryId: '', difficultyLevel: 'easy' }
  } catch (error) {
    Swal.fire('Error', error.message, 'error')
  } finally {
    createLoading.value = false
  }
}

const handleUpdate = async () => {
  editLoading.value = true
  try {
    if (!editAttraction.value.slug) {
      editAttraction.value.slug = editAttraction.value.name.toLowerCase().replace(/ /g, '-')
    }
    await attractionService.update(editAttraction.value.id, editAttraction.value)
    showEditModal.value = false
    await fetchData()
    Swal.fire({
      icon: 'success',
      title: 'Atracción Actualizada',
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000
    })
  } catch (error) {
    Swal.fire('Error', error.response?.data?.message || error.message, 'error')
  } finally {
    editLoading.value = false
  }
}

const toggleStatus = async (attraction) => {
  try {
    await attractionService.toggleStatus(attraction.id, !attraction.isPublished)
    attraction.isPublished = !attraction.isPublished
    Swal.fire({
      icon: 'success',
      title: 'Estado Actualizado',
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2000
    })
  } catch (error) {
    Swal.fire('Error', 'No se pudo cambiar el estado', 'error')
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
  // Rellenar datos
  editAttraction.value = {
    id: attraction.id,
    name: attraction.name || '',
    slug: attraction.slug || '',
    descriptionShort: attraction.descriptionShort || '',
    locationId: attraction.locationId || '',
    subcategoryId: attraction.subcategoryId || '',
    difficultyLevel: attraction.difficultyLevel || 'moderate'
  }
  showEditModal.value = true
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
        <BaseButton variant="outline" @click="router.push('/admin/attractions/create-complete')">
          <PlusIcon class="h-5 w-5 mr-2" />
          Creación Avanzada
        </BaseButton>
        <BaseButton @click="showCreateModal = true">
          <PlusIcon class="h-5 w-5 mr-2" />
          Nueva Rápida
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
        />
        <div class="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            @click="toggleStatus(attr)"
            class="p-2 bg-white dark:bg-surface rounded-lg shadow-lg hover:scale-110 transition-all text-xs font-bold"
            :class="attr.isPublished ? 'text-green-500' : 'text-text-secondary'"
          >
            {{ attr.isPublished ? 'Publicada' : 'Borrador' }}
          </button>
        </div>
      </div>
    </div>

    <div v-else class="py-20 text-center bg-surface rounded-2xl border border-dashed border-border">
      <MapPinIcon class="h-12 w-12 mx-auto text-text-secondary/30 mb-4" />
      <p class="text-text-secondary italic">No se encontraron atracciones.</p>
    </div>

    <!-- Create Modal -->
    <BaseModal :show="showCreateModal" title="Crear Nueva Atracción" @close="showCreateModal = false">
      <form @submit.prevent="handleCreate" class="space-y-6">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <BaseInput label="Nombre de la Atracción" v-model="newAttraction.name" required />
          <BaseInput label="URL Amigable (Slug)" v-model="newAttraction.slug" placeholder="ej: tour-volcan" />
        </div>

        <BaseInput label="Descripción Corta" v-model="newAttraction.descriptionShort" required />

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="space-y-1.5">
            <label class="text-sm font-semibold text-text-primary ml-1">Ubicación</label>
            <select v-model="newAttraction.locationId" class="w-full bg-surface border border-border rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
              <option value="">Seleccionar Ubicación</option>
              <option v-for="loc in locations" :key="loc.id" :value="loc.id">{{ loc.name }}</option>
            </select>
          </div>
          <div class="space-y-1.5">
            <label class="text-sm font-semibold text-text-primary ml-1">Categoría</label>
            <select v-model="newAttraction.subcategoryId" class="w-full bg-surface border border-border rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
              <option value="">Seleccionar Categoría</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="space-y-1.5">
            <label class="text-sm font-semibold text-text-primary ml-1">Ubicación</label>
            <select v-model="newAttraction.locationId" class="w-full bg-surface border border-border rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
              <option value="">Seleccionar Ubicación</option>
              <option v-for="loc in locations" :key="loc.id" :value="loc.id">{{ loc.name }}</option>
            </select>
          </div>
          <div class="space-y-1.5">
            <label class="text-sm font-semibold text-text-primary ml-1">Dificultad</label>
            <select v-model="newAttraction.difficultyLevel" class="w-full bg-surface border border-border rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
              <option value="easy">Fácil</option>
              <option value="moderate">Moderado</option>
              <option value="hard">Difícil</option>
            </select>
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-4">
          <BaseButton variant="outline" type="button" @click="showCreateModal = false">Cancelar</BaseButton>
          <BaseButton type="submit" :loading="createLoading">Guardar Atracción</BaseButton>
        </div>
      </form>
    </BaseModal>

    <!-- Edit Modal -->
    <BaseModal :show="showEditModal" title="Editar Atracción" @close="showEditModal = false">
      <form @submit.prevent="handleUpdate" class="space-y-6">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <BaseInput label="Nombre de la Atracción" v-model="editAttraction.name" required />
          <BaseInput label="URL Amigable (Slug)" v-model="editAttraction.slug" placeholder="ej: tour-volcan" />
        </div>

        <BaseInput label="Descripción Corta" v-model="editAttraction.descriptionShort" required />

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="space-y-1.5">
            <label class="text-sm font-semibold text-text-primary ml-1">Ubicación</label>
            <select v-model="editAttraction.locationId" class="w-full bg-surface border border-border rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
              <option value="">Seleccionar Ubicación</option>
              <option v-for="loc in locations" :key="loc.id" :value="loc.id">{{ loc.name }}</option>
            </select>
          </div>
          <div class="space-y-1.5">
            <label class="text-sm font-semibold text-text-primary ml-1">Categoría</label>
            <select v-model="editAttraction.subcategoryId" class="w-full bg-surface border border-border rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
              <option value="">Seleccionar Categoría</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="space-y-1.5">
            <label class="text-sm font-semibold text-text-primary ml-1">Dificultad</label>
            <select v-model="editAttraction.difficultyLevel" class="w-full bg-surface border border-border rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
              <option value="easy">Fácil</option>
              <option value="moderate">Moderado</option>
              <option value="hard">Difícil</option>
            </select>
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-4">
          <BaseButton variant="outline" type="button" @click="showEditModal = false">Cancelar</BaseButton>
          <BaseButton type="submit" :loading="editLoading">Actualizar Atracción</BaseButton>
        </div>
      </form>
    </BaseModal>
  </div>
</template>
