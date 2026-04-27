<template>
  <div class="container">
    <header class="header">
      <div>
        <h1>Gestión de Reservas</h1>
        <p>Supervisa y administra todas las reservas del sistema ({{ totalCount }} total)</p>
      </div>
    </header>

    <div class="filters">
      <form @submit.prevent="handleSearch" class="search-form">
        <input 
          type="text" 
          placeholder="Buscar por PNR o Atracción..." 
          class="filter-input"
          v-model="searchTerm"
        />
        <button type="submit" class="btn-primary">Buscar</button>
      </form>
    </div>

    <div class="table-container">
      <table class="table">
        <thead>
          <tr>
            <th>PNR</th>
            <th>Atracción</th>
            <th>Fecha/Hora Slot</th>
            <th>Total</th>
            <th>Estado</th>
            <th>Creado</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading"><td colspan="6" class="center">Cargando...</td></tr>
          <tr v-else-if="bookings.length === 0"><td colspan="6" class="center">No se encontraron reservas.</td></tr>
          <tr v-for="booking in bookings" :key="booking.id">
            <td class="pnr-code">{{ booking.pnrCode }}</td>
            <td>{{ booking.attractionName }}</td>
            <td>{{ new Date(booking.slotDate).toLocaleString() }}</td>
            <td>{{ booking.currencyCode }} {{ booking.totalAmount?.toFixed(2) }}</td>
            <td>
              <span class="badge" :class="getStatusClass(booking.statusName)">
                {{ booking.statusName || 'Pendiente' }}
              </span>
            </td>
            <td>{{ new Date(booking.createdAt).toLocaleDateString() }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="pagination" v-if="totalPages > 1">
      <button 
        class="page-btn" 
        :disabled="pageNumber <= 1"
        @click="pageNumber--"
      >
        &laquo; Anterior
      </button>
      <span>Página {{ pageNumber }} de {{ totalPages }}</span>
      <button 
        class="page-btn" 
        :disabled="pageNumber >= totalPages"
        @click="pageNumber++"
      >
        Siguiente &raquo;
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import BookingService from '../../services/BookingService';

const bookings = ref([]);
const loading = ref(true);
const searchTerm = ref('');
const pageNumber = ref(1);
const pageSize = ref(10);
const totalPages = ref(1);
const totalCount = ref(0);

const loadBookings = async () => {
  loading.value = true;
  try {
    const data = await BookingService.getManagement({
      SearchTerm: searchTerm.value,
      PageNumber: pageNumber.value,
      PageSize: pageSize.value
    });
    bookings.value = data.items || [];
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
  loadBookings();
};

watch(pageNumber, loadBookings);

const getStatusClass = (status) => {
  if (!status) return 'pending';
  const s = status.toLowerCase();
  if (s.includes('confirm')) return 'confirmed';
  if (s.includes('cancel')) return 'cancelled';
  return 'pending';
};

onMounted(loadBookings);
</script>

<style scoped>
.container { color: white; }
.header { margin-bottom: 2rem; }
.filters { margin-bottom: 1.5rem; background: #1e293b; padding: 1rem; border-radius: var(--radius-sm); }
.search-form { display: flex; gap: 1rem; }
.filter-input { flex: 1; background: #0f172a; border: 1px solid #334155; color: white; padding: 0.5rem 1rem; border-radius: var(--radius-sm); }

.table-container { background: #1e293b; border: 1px solid #334155; border-radius: var(--radius-lg); overflow: hidden; }
.table { width: 100%; border-collapse: collapse; }
.table th, .table td { padding: 1rem; text-align: left; border-bottom: 1px solid #334155; }
.table th { color: #94a3b8; font-size: 0.85rem; text-transform: uppercase; }

.pnr-code { font-family: monospace; font-weight: bold; color: var(--primary-light); }
.badge { padding: 0.25rem 0.75rem; border-radius: 99px; font-size: 0.75rem; font-weight: 700; }
.confirmed { background: rgba(16, 185, 129, 0.2); color: #34d399; }
.pending { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }
.cancelled { background: rgba(239, 68, 68, 0.2); color: #f87171; }

.pagination { display: flex; justify-content: center; align-items: center; gap: 1rem; padding: 1.5rem; }
.page-btn { background: #334155; border: none; color: white; padding: 0.5rem 1rem; border-radius: var(--radius-sm); cursor: pointer; }
.page-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.center { text-align: center; }
</style>
