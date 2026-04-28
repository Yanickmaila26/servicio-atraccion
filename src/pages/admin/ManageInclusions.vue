<script setup>
import { ref, onMounted } from 'vue'
import catalogService from '@/services/catalog'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import { PlusIcon, PencilIcon, TrashIcon, CheckCircleIcon } from '@heroicons/vue/24/outline'

import Swal from 'sweetalert2'

const inclusions = ref([])
const loading = ref(true)
const showModal = ref(false)
const modalLoading = ref(false)
const editingId = ref(null)

const form = ref({
  defaultText: '',
  iconSlug: '',
  languageId: 1
})

const validateName = (name) => {
  const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/
  return regex.test(name)
}

const fetchInclusions = async () => {
  loading.value = true
  try {
    inclusions.value = await catalogService.getInclusions()
  } catch (error) {
    console.error(error)
    Swal.fire('Error', 'No se pudieron cargar las inclusiones.', 'error')
  } finally {
    loading.value = false
  }
}

const openCreate = () => {
  editingId.value = null
  form.value = { defaultText: '', iconSlug: '', languageId: 1 }
  showModal.value = true
}

const openEdit = (inc) => {
  editingId.value = inc.id
  form.value = { ...inc }
  showModal.value = true
}

const handleSubmit = async () => {
  if (!validateName(form.value.defaultText)) {
    return Swal.fire('Formato Inválido', 'El nombre solo debe contener letras y espacios.', 'warning')
  }

  modalLoading.value = true
  try {
    const payload = {
      defaultText: form.value.defaultText.trim(),
      iconSlug: form.value.iconSlug?.trim() || null,
      languageId: form.value.languageId
    }
    
    if (editingId.value) {
      await catalogService.updateInclusion(editingId.value, payload)
      Swal.fire('Actualizado', 'Inclusión actualizada correctamente.', 'success')
    } else {
      await catalogService.createInclusion(payload)
      Swal.fire('Creado', 'Inclusión creada correctamente.', 'success')
    }
    showModal.value = false
    fetchInclusions()
  } catch (error) {
    Swal.fire('Error', error.message, 'error')
  } finally {
    modalLoading.value = false
  }
}

const handleDelete = async (id) => {
  const result = await Swal.fire({
    title: '¿Eliminar inclusión?',
    text: 'Esta acción no se puede deshacer.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  })

  if (!result.isConfirmed) return

  try {
    await catalogService.deleteInclusion(id)
    Swal.fire('Eliminado', 'Inclusión eliminada.', 'success')
    fetchInclusions()
  } catch (error) {
    Swal.fire('Error', error.message, 'error')
  }
}

onMounted(fetchInclusions)
</script>

<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-text-primary">Servicios Incluidos</h1>
        <p class="text-text-secondary text-sm">Gestiona los ítems que pueden estar incluidos en las atracciones.</p>
      </div>
      <BaseButton @click="openCreate">
        <PlusIcon class="h-5 w-5 mr-2" />
        Nueva Inclusión
      </BaseButton>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div v-for="inc in inclusions" :key="inc.id" class="bg-surface p-5 rounded-2xl border border-border flex justify-between items-start group">
        <div class="flex gap-3 items-center">
          <div class="p-2 bg-primary/10 text-primary rounded-lg font-bold uppercase text-xs w-12 text-center">
            {{ inc.iconSlug || 'Icono' }}
          </div>
          <div>
            <h3 class="font-bold text-text-primary">{{ inc.defaultText }}</h3>
          </div>
        </div>
        <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button @click="openEdit(inc)" class="p-1 hover:text-primary"><PencilIcon class="h-4 w-4" /></button>
          <button @click="handleDelete(inc.id)" class="p-1 hover:text-red-500"><TrashIcon class="h-4 w-4" /></button>
        </div>
      </div>
    </div>

    <BaseModal :show="showModal" title="Gestionar Inclusión" @close="showModal = false">
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <BaseInput label="Texto por Defecto (Nombre)" v-model="form.defaultText" required />
        <BaseInput label="Icon Slug (Opcional, ej: 'bus', 'coffee')" v-model="form.iconSlug" />
        <div class="flex justify-end gap-3 pt-4">
          <BaseButton variant="outline" type="button" @click="showModal = false">Cancelar</BaseButton>
          <BaseButton type="submit" :loading="modalLoading">Guardar</BaseButton>
        </div>
      </form>
    </BaseModal>
  </div>
</template>
