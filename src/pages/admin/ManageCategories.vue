<script setup>
import { ref, onMounted } from 'vue'
import catalogService from '@/services/catalog'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  ChevronDownIcon, 
  ChevronUpIcon,
  TagIcon 
} from '@heroicons/vue/24/outline'

const categories = ref([])
const loading = ref(true)
const expandedCategoryId = ref(null)
const subcategoriesMap = ref({}) // { categoryId: [subcats] }

const showModal = ref(false)
const modalLoading = ref(false)
const editingItem = ref(null) // { type: 'category'|'subcategory', data: {} }

const categoryForm = ref({ name: '', description: '', icon: '' })
const subcategoryForm = ref({ name: '', categoryId: null })

const fetchCategories = async () => {
  loading.value = true
  try {
    categories.value = await catalogService.getCategories()
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const toggleCategory = async (categoryId) => {
  if (expandedCategoryId.value === categoryId) {
    expandedCategoryId.value = null
    return
  }
  
  expandedCategoryId.value = categoryId
  if (!subcategoriesMap.value[categoryId]) {
    try {
      const subs = await catalogService.getSubcategories(categoryId)
      subcategoriesMap.value[categoryId] = subs
    } catch (error) {
      console.error('Error fetching subcategories:', error)
    }
  }
}

const openCreateCategory = () => {
  editingItem.value = { type: 'category' }
  categoryForm.value = { name: '', description: '', icon: '' }
  showModal.value = true
}

const openCreateSubcategory = (categoryId) => {
  editingItem.value = { type: 'subcategory', parentId: categoryId }
  subcategoryForm.value = { name: '', categoryId }
  showModal.value = true
}

const handleSubmit = async () => {
  modalLoading.value = true
  try {
    if (editingItem.value.type === 'category') {
      await catalogService.createCategory(categoryForm.value)
    } else {
      await catalogService.createSubcategory(editingItem.value.parentId, subcategoryForm.value)
      // Refresh subcategories for this category
      const subs = await catalogService.getSubcategories(editingItem.value.parentId)
      subcategoriesMap.value[editingItem.value.parentId] = subs
    }
    showModal.value = false
    fetchCategories()
  } catch (error) {
    alert('Error: ' + error.message)
  } finally {
    modalLoading.value = false
  }
}

const handleDeleteCategory = async (id) => {
  if (!confirm('¿Eliminar categoría? Esto afectará a sus subcategorías.')) return
  try {
    await catalogService.deleteCategory(id)
    fetchCategories()
  } catch (error) {
    alert(error.message)
  }
}

onMounted(fetchCategories)
</script>

<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-text-primary">Categorías y Subcategorías</h1>
        <p class="text-text-secondary text-sm">Organiza las experiencias del sistema de forma jerárquica.</p>
      </div>
      <BaseButton @click="openCreateCategory">
        <PlusIcon class="h-5 w-5 mr-2" />
        Nueva Categoría
      </BaseButton>
    </div>

    <div class="space-y-4">
      <div v-for="cat in categories" :key="cat.id" class="bg-surface rounded-2xl border border-border overflow-hidden transition-all shadow-sm">
        <!-- Category Header -->
        <div 
          @click="toggleCategory(cat.id)"
          class="p-5 flex items-center justify-between cursor-pointer hover:bg-primary/5 transition-colors"
        >
          <div class="flex items-center gap-4">
            <div class="p-2 bg-primary/10 rounded-lg text-primary">
              <TagIcon class="h-5 w-5" />
            </div>
            <div>
              <h3 class="font-bold text-text-primary">{{ cat.name }}</h3>
              <!-- Solo mostrar descripción si tiene contenido -->
              <p v-if="cat.description" class="text-xs text-text-secondary mt-1">{{ cat.description }}</p>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <div class="flex gap-2">
              <button @click.stop="handleDeleteCategory(cat.id)" class="p-2 hover:bg-red-50 text-red-500 rounded-lg">
                <TrashIcon class="h-4 w-4" />
              </button>
            </div>
            <component :is="expandedCategoryId === cat.id ? ChevronUpIcon : ChevronDownIcon" class="h-5 w-5 text-text-secondary" />
          </div>
        </div>

        <!-- Subcategories (Expanded) -->
        <div v-if="expandedCategoryId === cat.id" class="bg-background/30 border-t border-border p-6 space-y-4">
          <div class="flex justify-between items-center">
            <h4 class="text-xs font-bold text-text-secondary uppercase tracking-widest">Subcategorías</h4>
            <button 
              @click="openCreateSubcategory(cat.id)"
              class="text-xs font-bold text-primary flex items-center gap-1 hover:underline"
            >
              <PlusIcon class="h-3 w-3" /> Añadir Subcategoría
            </button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div 
              v-for="sub in subcategoriesMap[cat.id]" 
              :key="sub.id"
              class="p-3 bg-surface border border-border rounded-xl flex justify-between items-center group"
            >
              <span class="text-sm font-medium text-text-primary">{{ sub.name }}</span>
              <button class="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all">
                <TrashIcon class="h-4 w-4" />
              </button>
            </div>
            <div v-if="subcategoriesMap[cat.id]?.length === 0" class="col-span-full py-4 text-center text-text-secondary text-sm italic">
              No hay subcategorías en esta sección.
            </div>
          </div>
        </div>
      </div>

      <div v-if="categories.length === 0 && !loading" class="py-20 text-center text-text-secondary italic">
        No hay categorías registradas.
      </div>
    </div>

    <!-- Modals -->
    <BaseModal 
      :show="showModal" 
      :title="editingItem?.type === 'category' ? 'Nueva Categoría' : 'Nueva Subcategoría'" 
      @close="showModal = false"
    >
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <template v-if="editingItem?.type === 'category'">
          <BaseInput label="Nombre de Categoría" v-model="categoryForm.name" required />
          <BaseInput label="Descripción (Opcional)" v-model="categoryForm.description" />
          <BaseInput label="Icono (HeroIcon Slug)" v-model="categoryForm.icon" placeholder="TagIcon" />
        </template>
        
        <template v-else>
          <BaseInput label="Nombre de Subcategoría" v-model="subcategoryForm.name" required />
          <div class="p-3 bg-primary/5 border border-primary/10 rounded-lg text-[10px] text-primary font-bold uppercase tracking-widest">
            Se añadirá a la categoría seleccionada
          </div>
        </template>
        
        <div class="flex justify-end gap-3 pt-4">
          <BaseButton variant="outline" type="button" @click="showModal = false">Cancelar</BaseButton>
          <BaseButton type="submit" :loading="modalLoading">Guardar</BaseButton>
        </div>
      </form>
    </BaseModal>
  </div>
</template>
