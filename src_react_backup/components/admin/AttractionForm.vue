<template>
  <form @submit.prevent="handleSubmit" class="attraction-form">
    <!-- Tabs Header -->
    <div class="tab-header">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        class="tab-btn"
        :class="{ 'active': activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Tabs Content -->
    <div class="tab-content">
      <div v-if="activeTab === 'general'" class="tab-pane">
        <div class="group">
          <label>Nombre de la Atracción *</label>
          <input type="text" v-model="formData.name" required />
        </div>
        
        <div class="group">
          <label>Descripción Corta</label>
          <textarea v-model="formData.descriptionShort" rows="2"></textarea>
        </div>

        <div class="group">
          <label>Descripción Completa</label>
          <textarea v-model="formData.descriptionFull" rows="5"></textarea>
        </div>

        <div class="row">
          <div class="group">
            <label>Categoría</label>
            <select v-model="selectedCategoryId" required>
              <option value="">Seleccionar...</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
            </select>
          </div>
          <div class="group">
            <label>Subcategoría *</label>
            <select v-model="formData.subcategoryId" required>
              <option value="">Seleccionar...</option>
              <option v-for="sub in subcategories" :key="sub.id" :value="sub.id">{{ sub.name }}</option>
            </select>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'location'" class="tab-pane">
        <div class="group">
          <label>Locación / Ciudad *</label>
          <select v-model="formData.locationId" required>
            <option value="">Seleccionar...</option>
            <option v-for="loc in locations" :key="loc.id" :value="loc.id">{{ loc.name }} ({{ loc.countryCode }})</option>
          </select>
        </div>
        
        <div class="group">
          <label>Dirección Física</label>
          <input type="text" v-model="formData.address" placeholder="Calle, Ciudad, Región..." />
        </div>
        
        <div class="row">
          <div class="group">
            <label>Latitud</label>
            <input type="number" step="any" v-model="formData.latitude" placeholder="Ej. 12.3456" />
          </div>
          <div class="group">
            <label>Longitud</label>
            <input type="number" step="any" v-model="formData.longitude" placeholder="Ej. -78.9012" />
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'details'" class="tab-pane">
        <div class="group">
          <label>Punto de Encuentro</label>
          <input type="text" v-model="formData.meetingPoint" placeholder="Ej. Lobby del hotel..." />
        </div>
        
        <div class="group">
          <label>Nivel de Dificultad</label>
          <select v-model="formData.difficultyLevel">
            <option value="Fácil">Fácil</option>
            <option value="Moderado">Moderado</option>
            <option value="Difícil">Difícil</option>
            <option value="Extremo">Extremo</option>
          </select>
        </div>
      </div>
    </div>

    <div class="form-footer">
      <button type="submit" class="btn-primary" :disabled="saving">
        {{ saving ? 'Guardando...' : (attraction ? 'Actualizar Cambios' : 'Crear Atracción') }}
      </button>
    </div>
  </form>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import CategoryService from '../../services/CategoryService';
import LocationService from '../../services/LocationService';
import AttractionService from '../../services/AttractionService';

const props = defineProps({
  attraction: Object
});

const emit = defineEmits(['success']);

const activeTab = ref('general');
const categories = ref([]);
const locations = ref([]);
const subcategories = ref([]);
const selectedCategoryId = ref('');
const saving = ref(false);

const formData = ref({
  name: props.attraction?.name || '',
  descriptionShort: props.attraction?.descriptionShort || '',
  descriptionFull: props.attraction?.descriptionFull || '',
  address: props.attraction?.address || '',
  latitude: props.attraction?.latitude || '',
  longitude: props.attraction?.longitude || '',
  meetingPoint: props.attraction?.meetingPoint || '',
  difficultyLevel: props.attraction?.difficultyLevel || 'Fácil',
  locationId: props.attraction?.locationId || '',
  subcategoryId: props.attraction?.subcategoryId || ''
});

const tabs = [
  { id: 'general', label: 'Información General' },
  { id: 'location', label: 'Ubicación' },
  { id: 'details', label: 'Detalles Extra' }
];

const loadDependencies = async () => {
  try {
    const [cats, locs] = await Promise.all([
      CategoryService.getAll(),
      LocationService.getAll()
    ]);
    categories.value = cats;
    locations.value = locs;
  } catch (err) {
    console.error(err);
  }
};

const loadSubcategories = async (categoryId) => {
  try {
    subcategories.value = await CategoryService.getSubcategoriesByCategory(categoryId);
  } catch (err) {
    console.error(err);
  }
};

watch(selectedCategoryId, (newId) => {
  if (newId) loadSubcategories(newId);
  else subcategories.value = [];
});

const handleSubmit = async () => {
  saving.value = true;
  try {
    const payload = {
      ...formData.value,
      latitude: formData.value.latitude ? parseFloat(formData.value.latitude) : null,
      longitude: formData.value.longitude ? parseFloat(formData.value.longitude) : null,
    };

    if (props.attraction?.id) {
      await AttractionService.update(props.attraction.id, payload);
    } else {
      await AttractionService.create(payload);
    }
    emit('success');
  } catch (err) {
    alert('Error al guardar la atracción.');
  } finally {
    saving.value = false;
  }
};

onMounted(loadDependencies);
</script>

<style scoped>
.attraction-form {
  display: flex;
  flex-direction: column;
}

.tab-header {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid #334155;
  padding-bottom: 1rem;
}

.tab-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.tab-btn.active {
  color: var(--primary);
  border-bottom: 2px solid var(--primary);
}

.group {
  margin-bottom: 1.5rem;
}

.group label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.85rem;
  color: #cbd5e1;
}

.group input, .group textarea, .group select {
  width: 100%;
  padding: 0.75rem;
  background: #0f172a;
  border: 1px solid #334155;
  color: white;
  border-radius: var(--radius-sm);
}

.row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.form-footer {
  margin-top: 2rem;
  display: flex;
  justify-content: flex-end;
}
</style>
