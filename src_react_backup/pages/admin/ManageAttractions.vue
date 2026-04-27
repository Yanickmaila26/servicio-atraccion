<template>
  <div class="container">
    <header class="header">
      <div>
        <h1>Gestión de Atracciones</h1>
        <p>Crea, edita y gestiona el catálogo de experiencias turísticas.</p>
      </div>
      <button class="btn-primary" @click="handleCreate" v-if="!showForm">
        + Nueva Atracción
      </button>
    </header>

    <div v-if="showForm" class="card-saas form-container">
      <div class="form-header">
        <h2>{{ selectedAttraction ? 'Editar' : 'Crear' }} Atracción</h2>
        <button @click="showForm = false" class="close-btn">Cancelar</button>
      </div>
      <AttractionForm 
        :attraction="selectedAttraction" 
        @success="handleFormSuccess" 
      />
    </div>

    <div v-else class="card-saas">
      <div v-if="loading" class="loading-state">Cargando listado...</div>
      <div v-else-if="error" class="error-state">{{ error }}</div>
      
      <table v-else class="table">
        <thead>
          <tr>
            <th>Imagen</th>
            <th>Nombre</th>
            <th>Ubicación</th>
            <th>Nivel</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="attr in attractions" :key="attr.id">
            <td>
              <div 
                class="table-thumb" 
                :style="{ backgroundImage: `url(${attr.mainImageUrl || '../../assets/logo_atracciones.png'})` }"
              ></div>
            </td>
            <td>
              <div class="attr-name">{{ attr.name }}</div>
              <div class="attr-slug">{{ attr.id.substring(0,8) }}...</div>
            </td>
            <td>{{ attr.locationName || 'Sin ubicación' }}</td>
            <td><span class="badge">{{ attr.difficultyLevel }}</span></td>
            <td>
              <div class="actions">
                <button class="action-btn" @click="handleEdit(attr)">✏️</button>
                <button class="action-btn destructive" @click="handleDelete(attr.id)">🗑️</button>
              </div>
            </td>
          </tr>
          <tr v-if="attractions.length === 0">
            <td colspan="5" style="text-align: center; padding: 2rem;">No hay atracciones registradas.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import AttractionService from '../../services/AttractionService';
import AttractionForm from '../../components/admin/AttractionForm.vue';

const attractions = ref([]);
const loading = ref(true);
const error = ref(null);
const showForm = ref(false);
const selectedAttraction = ref(null);

const loadAttractions = async () => {
  loading.value = true;
  error.value = null;
  try {
    const data = await AttractionService.getManagement();
    attractions.value = data.items || [];
  } catch (err) {
    error.value = 'Error al cargar las atracciones.';
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const handleCreate = () => {
  selectedAttraction.value = null;
  showForm.value = true;
};

const handleEdit = (attr) => {
  selectedAttraction.value = attr;
  showForm.value = true;
};

const handleFormSuccess = () => {
  showForm.value = false;
  loadAttractions();
};

const handleDelete = async (id) => {
  if (!confirm('¿Seguro que quieres eliminar esta atracción?')) return;
  try {
    await AttractionService.delete(id);
    loadAttractions();
  } catch (err) {
    alert('Error al eliminar');
  }
};

onMounted(loadAttractions);
</script>

<style scoped>
.container {
  color: white;
}

.header {
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header h1 {
  font-size: 1.8rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
}

.form-container {
  padding: 2rem;
  animation: slideUp 0.3s ease;
}

.form-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 2rem;
}

.close-btn {
  background: transparent;
  border: 1px solid #334155;
  color: #94a3b8;
  padding: 0.5rem 1rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table th, .table td {
  padding: 1.25rem;
  text-align: left;
  border-bottom: 1px solid #334155;
}

.table th {
  color: #94a3b8;
  font-size: 0.85rem;
  text-transform: uppercase;
}

.table-thumb {
  width: 60px;
  height: 60px;
  background-size: cover;
  background-position: center;
  border-radius: var(--radius-sm);
}

.attr-name {
  font-weight: 700;
  color: white;
}

.attr-slug {
  font-size: 0.75rem;
  color: #94a3b8;
}

.badge {
  background: rgba(30, 136, 229, 0.1);
  color: var(--primary-light);
  padding: 0.25rem 0.75rem;
  border-radius: 99px;
  font-size: 0.75rem;
  font-weight: 700;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  background: #334155;
  border: none;
  padding: 0.5rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.action-btn.destructive:hover {
  background: #ef4444;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
