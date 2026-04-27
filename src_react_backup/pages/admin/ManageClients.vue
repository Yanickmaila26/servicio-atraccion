<template>
  <div class="container">
    <header class="header">
      <div>
        <h1>Directorio de Clientes</h1>
        <p>Consulta la base de datos de usuarios registrados ({{ totalCount }} total)</p>
      </div>
    </header>

    <div class="filters">
      <form @submit.prevent="handleSearch" class="search-form">
        <input 
          type="text" 
          placeholder="Nombre o Email..." 
          class="filter-input"
          v-model="searchTerm"
          style="flex: 2"
        />
        <input 
          type="text" 
          placeholder="Documento..." 
          class="filter-input"
          v-model="documentNumber"
          style="flex: 1"
        />
        <button type="submit" class="btn-primary">Filtrar</button>
      </form>
    </div>

    <div class="table-container">
      <table class="table">
        <thead>
          <tr>
            <th>Identificación</th>
            <th>Nombre Completo</th>
            <th>Email</th>
            <th>Teléfono</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading"><td colspan="4" class="center">Cargando...</td></tr>
          <tr v-for="client in clients" :key="client.id">
            <td><span class="ident-tag">DOC</span> {{ client.identification }}</td>
            <td>{{ client.fullName }}</td>
            <td>{{ client.email }}</td>
            <td>{{ client.phone || '-' }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="pagination" v-if="totalPages > 1">
      <button class="page-btn" :disabled="pageNumber <= 1" @click="pageNumber--">&laquo;</button>
      <span>Página {{ pageNumber }} de {{ totalPages }}</span>
      <button class="page-btn" :disabled="pageNumber >= totalPages" @click="pageNumber++">&raquo;</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import ClientService from '../../services/ClientService';

const clients = ref([]);
const loading = ref(true);
const searchTerm = ref('');
const documentNumber = ref('');
const pageNumber = ref(1);
const totalPages = ref(1);
const totalCount = ref(0);

const loadClients = async () => {
  loading.value = true;
  try {
    const data = await ClientService.getAll({
      SearchTerm: searchTerm.value,
      DocumentNumber: documentNumber.value,
      PageNumber: pageNumber.value,
      PageSize: 10
    });
    clients.value = data.items || [];
    totalPages.value = data.totalPages || 1;
    totalCount.value = data.totalCount || 0;
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  pageNumber.value = 1;
  loadClients();
};

watch(pageNumber, loadClients);
onMounted(loadClients);
</script>

<style scoped>
.container { color: white; }
.header { margin-bottom: 2rem; }
.filters { margin-bottom: 1.5rem; background: #1e293b; padding: 1rem; border-radius: var(--radius-sm); }
.search-form { display: flex; gap: 1rem; }
.filter-input { background: #0f172a; border: 1px solid #334155; color: white; padding: 0.5rem 1rem; border-radius: var(--radius-sm); }
.table-container { background: #1e293b; border: 1px solid #334155; border-radius: var(--radius-lg); overflow: hidden; }
.table { width: 100%; border-collapse: collapse; }
.table th, .table td { padding: 1rem; text-align: left; border-bottom: 1px solid #334155; }
.table th { color: #94a3b8; font-size: 0.85rem; text-transform: uppercase; }
.ident-tag { font-size: 0.7rem; color: #94a3b8; background: #0f172a; padding: 0.2rem 0.4rem; border-radius: 4px; margin-right: 0.5rem; }
.pagination { display: flex; justify-content: center; align-items: center; gap: 1rem; padding: 1.5rem; }
.page-btn { background: #334155; border: none; color: white; padding: 0.5rem 1rem; border-radius: var(--radius-sm); cursor: pointer; }
.center { text-align: center; }
</style>
