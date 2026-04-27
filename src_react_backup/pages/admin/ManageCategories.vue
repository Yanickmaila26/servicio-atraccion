<template>
  <div class="container">
    <div class="header">
      <h1>Gestión de Categorías</h1>
      <p>Organiza las atracciones en categorías y subcategorías</p>
    </div>

    <div class="grid">
      <!-- Categories Panel -->
      <div class="panel">
        <div class="panel-header">
          <h2>Categorías Principales</h2>
          <button class="add-btn" @click="handleOpenModal('category')">+ Nueva Categoría</button>
        </div>
        
        <div v-if="loading" class="loading">Cargando...</div>
        <div v-else class="list">
          <p v-if="categories.length === 0" class="empty-state">No hay categorías registradas.</p>
          <div 
            v-for="cat in categories" 
            :key="cat.id" 
            class="list-item"
            :class="{ 'selected': selectedCategory?.id === cat.id }"
            @click="selectedCategory = cat"
          >
            <div class="item-info">
              <span class="item-name">{{ cat.name }}</span>
              <span class="item-meta">Orden: {{ cat.sortOrder }} | {{ cat.isActive ? 'Activo' : 'Inactivo' }}</span>
            </div>
            <div class="item-actions">
              <button class="action-btn" @click.stop="handleOpenModal('category', cat)">Editar</button>
              <button class="action-btn delete" @click.stop="handleDelete('category', cat.id)">X</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Subcategories Panel -->
      <div class="panel">
        <div class="panel-header">
          <h2>Subcategorías {{ selectedCategory ? `de ${selectedCategory.name}` : '' }}</h2>
          <button 
            class="add-btn" 
            @click="handleOpenModal('subcategory')"
            :disabled="!selectedCategory"
          >
            + Nueva Subcategoría
          </button>
        </div>

        <div v-if="!selectedCategory" class="empty-state">
          <p>Selecciona una categoría de la izquierda para ver sus subcategorías.</p>
        </div>
        <div v-else class="list">
          <p v-if="subcategories.length === 0" class="empty-state">No hay subcategorías para esta categoría.</p>
          <div v-for="sub in subcategories" :key="sub.id" class="list-item">
            <div class="item-info">
              <span class="item-name">{{ sub.name }}</span>
            </div>
            <div class="item-actions">
              <button class="action-btn" @click="handleOpenModal('subcategory', sub)">Editar</button>
              <button class="action-btn delete" @click="handleDelete('subcategory', sub.id)">X</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="modal-overlay">
      <div class="modal-content">
        <div class="panel-header">
          <h2>{{ isEditing ? 'Editar' : 'Nueva' }} {{ modalType === 'category' ? 'Categoría' : 'Subcategoría' }}</h2>
        </div>
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label>Nombre</label>
            <input type="text" v-model="formData.name" required />
          </div>

          <div v-if="modalType === 'subcategory'" class="form-group">
            <label>Categoría Padre</label>
            <select v-model="formData.categoryId" required>
              <option value="">Seleccione...</option>
              <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>

          <div class="form-group">
            <label>Icono URL (opcional)</label>
            <input type="text" v-model="formData.iconUrl" />
          </div>

          <template v-if="modalType === 'category'">
            <div class="form-group">
              <label>Orden</label>
              <input type="number" v-model="formData.sortOrder" />
            </div>
            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="formData.isActive" /> Activo
              </label>
            </div>
          </template>

          <div class="form-actions">
            <button type="button" class="cancel-btn" @click="showModal = false">Cancelar</button>
            <button type="submit" class="save-btn" :disabled="saving">
              {{ saving ? 'Guardando...' : 'Guardar' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import CategoryService from '../../services/CategoryService';

const categories = ref([]);
const subcategories = ref([]);
const selectedCategory = ref(null);
const loading = ref(true);
const saving = ref(false);

const showModal = ref(false);
const modalType = ref('');
const isEditing = ref(false);
const editId = ref(null);
const formData = ref({ name: '', iconUrl: '', sortOrder: 0, isActive: true, categoryId: '' });

const loadCategories = async () => {
  try {
    loading.value = true;
    categories.value = await CategoryService.getAll();
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const loadSubcategories = async (categoryId) => {
  try {
    subcategories.value = await CategoryService.getSubcategoriesByCategory(categoryId);
  } catch (err) {
    console.error(err);
  }
};

watch(selectedCategory, (newCat) => {
  if (newCat) loadSubcategories(newCat.id);
  else subcategories.value = [];
});

const handleOpenModal = (type, item = null) => {
  modalType.value = type;
  if (item) {
    isEditing.value = true;
    editId.value = item.id;
    formData.value = {
      name: item.name || '',
      iconUrl: item.iconUrl || '',
      sortOrder: item.sortOrder || 0,
      isActive: item.isActive !== undefined ? item.isActive : true,
      categoryId: type === 'subcategory' ? item.categoryId : ''
    };
  } else {
    isEditing.value = false;
    editId.value = null;
    formData.value = {
      name: '',
      iconUrl: '',
      sortOrder: 0,
      isActive: true,
      categoryId: type === 'subcategory' && selectedCategory.value ? selectedCategory.value.id : ''
    };
  }
  showModal.value = true;
};

const handleSubmit = async () => {
  saving.value = true;
  try {
    if (modalType.value === 'category') {
      const payload = { ...formData.value };
      if (isEditing.value) await CategoryService.update(editId.value, payload);
      else await CategoryService.create(payload);
      await loadCategories();
    } else {
      const payload = { ...formData.value };
      if (isEditing.value) await CategoryService.updateSubcategory(editId.value, payload);
      else await CategoryService.createSubcategory(payload);
      if (selectedCategory.value) await loadSubcategories(selectedCategory.value.id);
    }
    showModal.value = false;
  } catch (err) {
    alert('Error al guardar');
  } finally {
    saving.value = false;
  }
};

const handleDelete = async (type, id) => {
  if (!confirm('¿Estás seguro?')) return;
  try {
    if (type === 'category') {
      await CategoryService.delete(id);
      if (selectedCategory.value?.id === id) selectedCategory.value = null;
      await loadCategories();
    } else {
      await CategoryService.deleteSubcategory(id);
      if (selectedCategory.value) await loadSubcategories(selectedCategory.value.id);
    }
  } catch (err) {
    alert('Error al eliminar');
  }
};

onMounted(loadCategories);
</script>

<style scoped>
.container {
  color: #f1f5f9;
}

.header {
  margin-bottom: 2rem;
}

.header h1 {
  font-size: 1.8rem;
  font-weight: 800;
  color: white;
  margin-bottom: 0.5rem;
}

.header p {
  color: #94a3b8;
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.panel {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: var(--radius-lg);
  padding: 1.5rem;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #334155;
}

.panel-header h2 {
  font-size: 1.25rem;
  color: white;
}

.add-btn {
  background: var(--primary);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.2s;
}

.list-item:hover {
  border-color: #475569;
}

.list-item.selected {
  border-color: var(--primary);
  background: rgba(30, 136, 229, 0.1);
}

.item-name {
  font-weight: 600;
  color: white;
  display: block;
}

.item-meta {
  font-size: 0.75rem;
  color: #94a3b8;
}

.item-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  background: transparent;
  border: 1px solid #475569;
  color: #cbd5e1;
  padding: 0.4rem 0.75rem;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  cursor: pointer;
}

.action-btn.delete:hover {
  color: #f87171;
  border-color: #ef4444;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: #1e293b;
  padding: 2rem;
  border-radius: var(--radius-lg);
  width: 400px;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.85rem;
  color: #cbd5e1;
}

.form-group input, .form-group select {
  width: 100%;
  padding: 0.75rem;
  background: #0f172a;
  border: 1px solid #334155;
  color: white;
  border-radius: var(--radius-sm);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
}

.save-btn {
  background: var(--primary);
  color: white;
  border: none;
  padding: 0.5rem 1.5rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.cancel-btn {
  background: transparent;
  border: 1px solid #475569;
  color: #cbd5e1;
  padding: 0.5rem 1rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
}
</style>
