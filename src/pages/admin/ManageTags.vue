<script setup>
import { ref, onMounted } from 'vue'
import catalogService from '@/services/catalog'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import { PlusIcon, PencilIcon, TrashIcon, TagIcon } from '@heroicons/vue/24/outline'

const tags = ref([])
const loading = ref(true)
const showModal = ref(false)
const modalLoading = ref(false)
const editingId = ref(null)

const form = ref({
  name: '',
  slug: ''
})

const fetchTags = async () => {
  loading.value = true
  try {
    tags.value = await catalogService.getTags()
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const openCreate = () => {
  editingId.value = null
  form.value = { name: '', slug: '' }
  showModal.value = true
}

const openEdit = (tag) => {
  editingId.value = tag.id
  form.value = { ...tag }
  showModal.value = true
}

const handleSubmit = async () => {
  modalLoading.value = true
  try {
    if (editingId.value) {
      await catalogService.updateTag(editingId.value, form.value)
    } else {
      await catalogService.createTag(form.value)
    }
    showModal.value = false
    fetchTags()
  } catch (error) {
    alert(error.message)
  } finally {
    modalLoading.value = false
  }
}

const handleDelete = async (id) => {
  if (!confirm('¿Eliminar etiqueta?')) return
  try {
    await catalogService.deleteTag(id)
    fetchTags()
  } catch (error) {
    alert(error.message)
  }
}

onMounted(fetchTags)
</script>

<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-text-primary">Etiquetas de Atracción</h1>
        <p class="text-text-secondary text-sm">Gestiona los tags para filtrar y organizar atracciones.</p>
      </div>
      <BaseButton @click="openCreate">
        <PlusIcon class="h-5 w-5 mr-2" />
        Nueva Etiqueta
      </BaseButton>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div v-for="tag in tags" :key="tag.id" class="bg-surface p-4 rounded-xl border border-border flex justify-between items-center group">
        <div>
          <span class="text-sm font-bold text-text-primary">{{ tag.name }}</span>
        </div>
        <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button @click="openEdit(tag)" class="p-1 hover:text-primary"><PencilIcon class="h-4 w-4" /></button>
          <button @click="handleDelete(tag.id)" class="p-1 hover:text-red-500"><TrashIcon class="h-4 w-4" /></button>
        </div>
      </div>
    </div>

    <BaseModal :show="showModal" title="Gestionar Etiqueta" @close="showModal = false">
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <BaseInput label="Nombre de la Etiqueta" v-model="form.name" required />
        <BaseInput label="Slug (opcional, generado automáticamente si está vacío)" v-model="form.slug" />
        <div class="flex justify-end gap-3 pt-4">
          <BaseButton variant="outline" type="button" @click="showModal = false">Cancelar</BaseButton>
          <BaseButton type="submit" :loading="modalLoading">Guardar</BaseButton>
        </div>
      </form>
    </BaseModal>
  </div>
</template>
