<script setup>
import { ref, onMounted } from 'vue'
import catalogService from '@/services/catalog'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import { PlusIcon, PencilIcon, TrashIcon, ChevronDownIcon, ChevronUpIcon, MapPinIcon } from '@heroicons/vue/24/outline'

const locationsTree = ref([])
const loading = ref(true)

// Expanded states for accordions
const expandedCountries = ref([])
const expandedStates = ref([])

// Modal state
const showModal = ref(false)
const modalLoading = ref(false)
const modalMode = ref('create') // 'create' or 'edit'

const form = ref({
  id: null,
  name: '',
  type: 'Country', // 'Country', 'State', 'City'
  countryCode: '',
  parentId: null
})

const fetchLocations = async () => {
  loading.value = true
  try {
    locationsTree.value = await catalogService.getLocations()
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

// Toggle accordions
const toggleCountry = (id) => {
  const index = expandedCountries.value.indexOf(id)
  if (index > -1) expandedCountries.value.splice(index, 1)
  else expandedCountries.value.push(id)
}

const toggleState = (id) => {
  const index = expandedStates.value.indexOf(id)
  if (index > -1) expandedStates.value.splice(index, 1)
  else expandedStates.value.push(id)
}

// Open modals
const openCreateCountry = () => {
  form.value = { id: null, name: '', type: 'Country', countryCode: '', parentId: null }
  modalMode.value = 'create'
  showModal.value = true
}

const openCreateState = (countryId) => {
  form.value = { id: null, name: '', type: 'State', countryCode: '', parentId: countryId }
  modalMode.value = 'create'
  showModal.value = true
}

const openCreateCity = (stateId) => {
  form.value = { id: null, name: '', type: 'City', countryCode: '', parentId: stateId }
  modalMode.value = 'create'
  showModal.value = true
}

const openEdit = (loc) => {
  form.value = { 
    id: loc.id, 
    name: loc.name, 
    type: loc.type || loc.Type, // Handling casing just in case
    countryCode: loc.countryCode || loc.CountryCode || '', 
    parentId: loc.parentId || loc.ParentId 
  }
  modalMode.value = 'edit'
  showModal.value = true
}

const handleSubmit = async () => {
  modalLoading.value = true
  try {
    const payload = {
      name: form.value.name,
      type: form.value.type,
      countryCode: form.value.type === 'Country' ? form.value.countryCode : null,
      parentId: form.value.parentId
    }

    if (modalMode.value === 'edit') {
      await catalogService.updateLocation(form.value.id, payload)
    } else {
      await catalogService.createLocation(payload)
      // Auto-expand parent so the new child is visible
      if (form.value.type === 'State' && !expandedCountries.value.includes(form.value.parentId)) {
        expandedCountries.value.push(form.value.parentId)
      } else if (form.value.type === 'City' && !expandedStates.value.includes(form.value.parentId)) {
        expandedStates.value.push(form.value.parentId)
      }
    }
    
    showModal.value = false
    await fetchLocations()
  } catch (error) {
    alert(error.message)
  } finally {
    modalLoading.value = false
  }
}

const handleDelete = async (id) => {
  if (!confirm('¿Estás seguro de eliminar esta ubicación? Se eliminarán también todas sus ubicaciones hijas.')) return
  try {
    await catalogService.deleteLocation(id)
    await fetchLocations()
  } catch (error) {
    alert(error.message)
  }
}

onMounted(fetchLocations)
</script>

<template>
  <div class="space-y-6 max-w-5xl mx-auto pb-20">
    <div class="flex justify-between items-end">
      <div>
        <h1 class="text-2xl font-bold text-text-primary">Gestión de Ubicaciones</h1>
        <p class="text-text-secondary text-sm mt-1">Estructura jerárquica de Países, Provincias y Ciudades.</p>
      </div>
      <BaseButton @click="openCreateCountry">
        <PlusIcon class="h-5 w-5 mr-2" />
        Añadir País
      </BaseButton>
    </div>

    <!-- Contenedor Principal: Lista de Países -->
    <div class="space-y-4 mt-8">
      <div v-if="loading" class="text-center py-10 text-text-secondary">Cargando ubicaciones...</div>
      <div v-else-if="locationsTree.length === 0" class="text-center py-10 bg-surface rounded-2xl border border-dashed border-border text-text-secondary">
        No hay países registrados.
      </div>
      
      <!-- Nivel 1: Países -->
      <div v-for="country in locationsTree" :key="country.id" class="bg-surface border border-border rounded-2xl overflow-hidden transition-all">
        
        <!-- Cabecera País -->
        <div class="flex items-center justify-between p-4 hover:bg-background transition-colors">
          <div class="flex items-center gap-3 flex-1 cursor-pointer" @click="toggleCountry(country.id)">
            <button class="p-1 rounded bg-background border border-border text-text-secondary">
              <ChevronUpIcon v-if="expandedCountries.includes(country.id)" class="h-4 w-4" />
              <ChevronDownIcon v-else class="h-4 w-4" />
            </button>
            <div class="flex items-center gap-2">
              <span class="font-black text-lg text-text-primary">{{ country.name }}</span>
              <span class="px-2 py-0.5 bg-primary/10 text-primary rounded text-[10px] font-bold uppercase border border-primary/20">
                {{ country.countryCode || 'N/A' }}
              </span>
            </div>
          </div>
          
          <div class="flex items-center gap-2">
            <BaseButton size="sm" variant="outline" @click="openCreateState(country.id)" class="text-xs py-1.5 hidden sm:flex">
              + Añadir Provincia
            </BaseButton>
            <button @click="openEdit(country)" class="p-2 text-text-secondary hover:text-primary transition-colors"><PencilIcon class="h-4 w-4" /></button>
            <button @click="handleDelete(country.id)" class="p-2 text-text-secondary hover:text-red-500 transition-colors"><TrashIcon class="h-4 w-4" /></button>
          </div>
        </div>

        <!-- Nivel 2: Provincias (Expandible) -->
        <div v-show="expandedCountries.includes(country.id)" class="bg-background border-t border-border">
          <div v-if="!country.children || country.children.length === 0" class="p-4 text-center text-sm text-text-secondary italic">
            No hay provincias en este país. <button @click="openCreateState(country.id)" class="text-primary hover:underline font-bold">Añadir una</button>.
          </div>
          
          <div v-else class="divide-y divide-border/50">
            <div v-for="state in country.children" :key="state.id" class="pl-8 pr-4">
              
              <!-- Cabecera Provincia -->
              <div class="flex items-center justify-between py-3">
                <div class="flex items-center gap-3 flex-1 cursor-pointer" @click="toggleState(state.id)">
                  <button class="text-text-secondary hover:text-primary transition-colors">
                    <ChevronUpIcon v-if="expandedStates.includes(state.id)" class="h-4 w-4" />
                    <ChevronDownIcon v-else class="h-4 w-4" />
                  </button>
                  <span class="font-bold text-text-primary">{{ state.name }}</span>
                </div>
                
                <div class="flex items-center gap-2 opacity-0 hover:opacity-100 focus-within:opacity-100 transition-opacity" style="opacity: 1;">
                  <button @click="openCreateCity(state.id)" class="text-[10px] font-bold uppercase text-primary bg-primary/5 px-2 py-1 rounded hover:bg-primary/10">
                    + Ciudad
                  </button>
                  <button @click="openEdit(state)" class="p-1.5 text-text-secondary hover:text-primary"><PencilIcon class="h-3 w-3" /></button>
                  <button @click="handleDelete(state.id)" class="p-1.5 text-text-secondary hover:text-red-500"><TrashIcon class="h-3 w-3" /></button>
                </div>
              </div>

              <!-- Nivel 3: Ciudades (Expandible) -->
              <div v-show="expandedStates.includes(state.id)" class="pb-3 pl-8">
                <div v-if="!state.children || state.children.length === 0" class="text-xs text-text-secondary italic">
                  Sin ciudades. <button @click="openCreateCity(state.id)" class="text-primary hover:underline">Añadir</button>.
                </div>
                
                <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  <div v-for="city in state.children" :key="city.id" class="flex items-center justify-between bg-surface border border-border px-3 py-2 rounded-lg group">
                    <div class="flex items-center gap-2">
                      <MapPinIcon class="h-3 w-3 text-primary" />
                      <span class="text-sm font-medium text-text-secondary group-hover:text-text-primary transition-colors">{{ city.name }}</span>
                    </div>
                    <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button @click="openEdit(city)" class="p-1 text-text-secondary hover:text-primary"><PencilIcon class="h-3 w-3" /></button>
                      <button @click="handleDelete(city.id)" class="p-1 text-text-secondary hover:text-red-500"><TrashIcon class="h-3 w-3" /></button>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- Modal Dinámico -->
    <BaseModal :show="showModal" :title="modalMode === 'create' ? `Añadir ${form.type === 'Country' ? 'País' : form.type === 'State' ? 'Provincia' : 'Ciudad'}` : 'Editar Ubicación'" @close="showModal = false">
      <form @submit.prevent="handleSubmit" class="space-y-4">
        
        <BaseInput :label="`Nombre de ${form.type === 'Country' ? 'País' : form.type === 'State' ? 'Provincia' : 'Ciudad'}`" v-model="form.name" required placeholder="Ej: Ecuador" />
        
        <div v-if="form.type === 'Country'" class="bg-primary/5 p-4 rounded-xl border border-primary/20">
          <BaseInput label="Código de País ISO (2 Letras)" v-model="form.countryCode" placeholder="Ej: EC" maxlength="2" class="uppercase" />
          <p class="text-[10px] text-text-secondary mt-1">Usado para configuraciones regionales o mapas.</p>
        </div>

        <div v-if="form.type === 'State' || form.type === 'City'" class="bg-surface p-4 rounded-xl border border-border">
          <p class="text-xs font-bold text-text-secondary uppercase mb-2">Relación</p>
          <p class="text-sm text-text-primary">
            Esta ubicación se creará dentro de la jerarquía seleccionada previamente.
          </p>
        </div>

        <div class="flex justify-end gap-3 pt-4">
          <BaseButton variant="outline" type="button" @click="showModal = false">Cancelar</BaseButton>
          <BaseButton type="submit" :loading="modalLoading">Guardar</BaseButton>
        </div>
      </form>
    </BaseModal>
  </div>
</template>
