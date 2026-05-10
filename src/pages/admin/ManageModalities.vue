<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import productsService from '@/services/products'
import attractionService from '@/services/attractions'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import Swal from 'sweetalert2'
import { TicketIcon, ArrowLeftIcon, PlusIcon, PencilIcon, TrashIcon, CheckBadgeIcon } from '@heroicons/vue/24/outline'

const route = useRoute()
const router = useRouter()
const attractionId = route.params.id

const attraction = ref(null)
const products = ref([])
const loading = ref(true)

// Modal states
const showCreateModal = ref(false)
const showEditModal = ref(false)
const actionLoading = ref(false)

const form = ref({
  id: '',
  title: '',
  slug: '',
  description: '',
  durationMinutes: 60,
  durationDescription: '1 hora',
  cancelPolicyHours: 24,
  cancelPolicyText: 'Cancelación gratuita 24 horas antes',
  maxGroupSize: 10,
  minParticipants: 1,
  isPrivate: false
})

const resetForm = () => {
  form.value = {
    id: '',
    title: '',
    slug: '',
    description: '',
    durationMinutes: 60,
    durationDescription: '1 hora',
    cancelPolicyHours: 24,
    cancelPolicyText: 'Cancelación gratuita 24 horas antes',
    maxGroupSize: 10,
    minParticipants: 1,
    isPrivate: false
  }
}

const fetchData = async () => {
  loading.value = true
  try {
    const attrData = await attractionService.search({ attractionId })
    attraction.value = attrData.items?.find(a => a.id === attractionId) || { name: 'Atracción' }
    
    const prodData = await productsService.getByAttraction(attractionId)
    products.value = prodData || []
  } catch (error) {
    Swal.fire('Error', 'No se pudieron cargar las modalidades.', 'error')
  } finally {
    loading.value = false
  }
}

const openCreate = () => {
  resetForm()
  showCreateModal.value = true
}

const openEdit = (product) => {
  form.value = { ...product }
  showEditModal.value = true
}

const handleCreate = async () => {
  actionLoading.value = true
  try {
    const data = { ...form.value, attractionId }
    if (!data.slug) {
      data.slug = data.title.toLowerCase().replace(/ /g, '-')
    }
    await productsService.create(data)
    showCreateModal.value = false
    Swal.fire('Éxito', 'Modalidad creada con éxito', 'success')
    fetchData()
  } catch (error) {
    Swal.fire('Error', error.response?.data?.message || 'Error al crear', 'error')
  } finally {
    actionLoading.value = false
  }
}

const handleEdit = async () => {
  actionLoading.value = true
  try {
    await productsService.update(form.value.id, form.value)
    showEditModal.value = false
    Swal.fire('Éxito', 'Modalidad actualizada con éxito', 'success')
    fetchData()
  } catch (error) {
    Swal.fire('Error', error.response?.data?.message || 'Error al actualizar', 'error')
  } finally {
    actionLoading.value = false
  }
}

const handleDelete = async (product) => {
  const result = await Swal.fire({
    title: '¿Eliminar Modalidad?',
    text: `¿Deseas eliminar "${product.title}"?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  })

  if (result.isConfirmed) {
    try {
      const res = await productsService.delete(product.id)
      // Si fue un soft-delete, el backend retornará success y posiblemente no lance error,
      // la UI se entera porque volvemos a hacer fetch y el status IsActive bajará (si lo mostramos).
      // Wait, let's just refetch.
      Swal.fire('Modalidad eliminada', 'La operación se realizó con éxito.', 'success')
      fetchData()
    } catch (error) {
      Swal.fire('Aviso', error.response?.data?.message || 'No se pudo eliminar la modalidad.', 'warning')
    }
  }
}

const toggleActive = async (product) => {
  try {
    await productsService.toggleActive(product.id, !product.isActive)
    product.isActive = !product.isActive
    Swal.fire('Éxito', `Modalidad ${product.isActive ? 'activada' : 'desactivada'}.`, 'success')
  } catch (error) {
    Swal.fire('Error', 'No se pudo cambiar el estado.', 'error')
  }
}

import { watch } from 'vue'
watch(() => form.value.cancelPolicyHours, (val) => {
  if (val === 0) {
    form.value.cancelPolicyText = 'No reembolsable'
  } else if (val === 24) {
    form.value.cancelPolicyText = 'Cancelación gratuita hasta 24 horas antes'
  } else {
    form.value.cancelPolicyText = `Cancelación gratuita hasta ${val} horas antes`
  }
})

onMounted(fetchData)
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div class="flex items-center gap-4">
        <button @click="router.push('/admin/attractions')" class="p-2 bg-surface border border-border rounded-lg hover:bg-background transition-colors text-text-secondary">
          <ArrowLeftIcon class="h-5 w-5" />
        </button>
        <div>
          <h1 class="text-2xl font-bold text-text-primary flex items-center gap-2">
            <TicketIcon class="h-6 w-6 text-primary" /> Modalidades
          </h1>
          <p class="text-text-secondary text-sm">Gestionando: <span class="font-bold text-primary">{{ attraction?.name || 'Cargando...' }}</span></p>
        </div>
      </div>
      <BaseButton @click="openCreate">
        <PlusIcon class="h-5 w-5 mr-2" />
        Nueva Modalidad
      </BaseButton>
    </div>

    <div v-if="loading" class="py-12 text-center text-text-secondary">Cargando modalidades...</div>
    
    <div v-else-if="products.length === 0" class="py-20 text-center bg-surface rounded-2xl border border-dashed border-border">
      <TicketIcon class="h-12 w-12 mx-auto text-text-secondary/30 mb-4" />
      <h2 class="text-lg font-bold text-text-primary">No hay modalidades</h2>
      <p class="text-text-secondary mt-1">Crea la primera modalidad o ticket para esta atracción.</p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="product in products" :key="product.id" class="bg-surface border border-border rounded-2xl p-5 hover:shadow-soft transition-all flex flex-col relative" :class="!product.isActive ? 'opacity-70' : ''">
        <div class="absolute top-4 right-4 flex gap-1">
          <span v-if="!product.isActive" class="px-2 py-0.5 text-[10px] font-bold uppercase bg-red-100 text-red-600 rounded">Inactiva</span>
        </div>
        
        <h3 class="text-lg font-black text-text-primary pr-16">{{ product.title }}</h3>
        <p class="text-sm text-text-secondary mt-1 line-clamp-2">{{ product.description || 'Sin descripción' }}</p>
        
        <div class="mt-4 space-y-2 text-sm">
          <div class="flex justify-between border-b border-border pb-1">
            <span class="text-text-secondary">Duración:</span>
            <span class="font-bold text-text-primary">{{ product.durationDescription }}</span>
          </div>
          <div class="flex justify-between border-b border-border pb-1">
            <span class="text-text-secondary">Capacidad:</span>
            <span class="font-bold text-text-primary">{{ product.minParticipants }} - {{ product.maxGroupSize }} pax</span>
          </div>
          <div class="flex justify-between border-b border-border pb-1">
            <span class="text-text-secondary">Pol. Cancelación:</span>
            <span class="font-bold text-text-primary">{{ product.cancelPolicyHours }}h</span>
          </div>
        </div>
        
        <div class="mt-auto pt-6 flex justify-between gap-2 border-t border-border mt-4">
          <button @click="toggleActive(product)" class="flex-1 flex items-center justify-center gap-1 py-2 text-xs font-bold rounded-lg border transition-colors" :class="product.isActive ? 'text-red-600 bg-red-50 hover:bg-red-100 border-red-200' : 'text-green-600 bg-green-50 hover:bg-green-100 border-green-200'">
             {{ product.isActive ? 'Desactivar' : 'Activar' }}
          </button>
          <button @click="openEdit(product)" class="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors" title="Editar">
             <PencilIcon class="h-4 w-4" />
          </button>
          <button @click="handleDelete(product)" class="p-2 text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors" title="Eliminar">
             <TrashIcon class="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Create/Edit Form Modal -->
    <BaseModal :show="showCreateModal || showEditModal" :title="showCreateModal ? 'Nueva Modalidad' : 'Editar Modalidad'" @close="showCreateModal = false; showEditModal = false" size="lg">
      <form @submit.prevent="showCreateModal ? handleCreate() : handleEdit()" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BaseInput label="Título del Producto/Ticket" v-model="form.title" required />
          <BaseInput label="Slug (URL amigable)" v-model="form.slug" placeholder="Opcional, se genera auto" />
        </div>
        
        <div class="space-y-1.5">
          <label class="text-sm font-semibold text-text-primary ml-1">Descripción</label>
          <textarea v-model="form.description" rows="3" class="w-full bg-surface border border-border rounded-xl py-2 px-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"></textarea>
        </div>
        
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <BaseInput label="Duración (min)" type="number" v-model="form.durationMinutes" required />
          <BaseInput label="Duración (texto)" v-model="form.durationDescription" placeholder="ej: 1h 30m" />
          <div class="space-y-1">
            <BaseInput label="Min. Pax" type="number" v-model="form.minParticipants" required />
            <p class="text-[10px] text-text-secondary px-1 italic">Mínimo de personas para operar</p>
          </div>
          <div class="space-y-1">
            <BaseInput label="Max. Pax" type="number" v-model="form.maxGroupSize" required />
            <p class="text-[10px] text-text-secondary px-1 italic">Máximo por grupo/reserva</p>
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BaseInput label="Horas Políticas Canc." type="number" v-model="form.cancelPolicyHours" required />
          <BaseInput label="Texto Políticas Canc." v-model="form.cancelPolicyText" required />
        </div>
        
        <div class="flex items-center gap-2 pt-2">
          <input type="checkbox" id="isPrivate" v-model="form.isPrivate" class="w-4 h-4 rounded text-primary border-border focus:ring-primary">
          <label for="isPrivate" class="text-sm font-bold text-text-primary">Es un tour privado (se bloquea todo el horario al reservar)</label>
        </div>

        <div class="flex justify-end gap-3 pt-4 border-t border-border mt-6">
          <BaseButton variant="outline" type="button" @click="showCreateModal = false; showEditModal = false">Cancelar</BaseButton>
          <BaseButton type="submit" :loading="actionLoading">{{ showCreateModal ? 'Crear Modalidad' : 'Guardar Cambios' }}</BaseButton>
        </div>
      </form>
    </BaseModal>
  </div>
</template>
