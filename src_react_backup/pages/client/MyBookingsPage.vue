<template>
  <div class="container-page">
    <header class="header">
      <h1 class="title">Mis Reservas</h1>
      <p class="subtitle">Consulta el historial y estado de tus próximas aventuras.</p>
    </header>

    <div v-if="loading" class="center">Cargando tus reservas...</div>
    
    <div v-else-if="bookings.length === 0" class="empty-state">
      <h2>Aún no tienes reservas</h2>
      <p>Explora nuestro catálogo de atracciones y comienza tu próxima aventura.</p>
      <button class="btn-primary" @click="router.push('/')">Explorar Atracciones</button>
    </div>

    <template v-else>
      <div class="grid">
        <div v-for="booking in bookings" :key="booking.id" class="booking-card">
          <div class="card-header">
            <div>
              <span class="pnr">{{ booking.pnrCode }}</span>
              <span class="date">Reservado el {{ new Date(booking.createdAt).toLocaleDateString() }}</span>
            </div>
            <span class="badge" :class="getStatusClass(booking.statusName)">
              {{ booking.statusName || 'Pendiente' }}
            </span>
          </div>
          
          <div class="card-body">
            <h3 class="attraction-name">{{ booking.attractionName }}</h3>
            <div class="details">
              <div class="detail-row">
                <span>Fecha:</span>
                <span>{{ new Date(booking.slotDate).toLocaleDateString() }}</span>
              </div>
              <div class="total">
                <span>Total:</span>
                <span>{{ booking.currencyCode }} {{ booking.totalAmount?.toFixed(2) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="pagination" v-if="totalPages > 1">
        <button class="page-btn" :disabled="pageNumber <= 1" @click="pageNumber--">&laquo;</button>
        <span>Página {{ pageNumber }} de {{ totalPages }}</span>
        <button class="page-btn" :disabled="pageNumber >= totalPages" @click="pageNumber++">&raquo;</button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import BookingService from '../../services/BookingService';

const router = useRouter();
const bookings = ref([]);
const loading = ref(true);
const pageNumber = ref(1);
const totalPages = ref(1);

const loadMyBookings = async () => {
  loading.value = true;
  try {
    const data = await BookingService.getMyBookings(pageNumber.value, 10);
    bookings.value = data.items || [];
    totalPages.value = data.totalPages || 1;
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const getStatusClass = (status) => {
  if (!status) return 'pending';
  const s = status.toLowerCase();
  if (s.includes('confirm')) return 'confirmed';
  if (s.includes('cancel')) return 'cancelled';
  return 'pending';
};

watch(pageNumber, loadMyBookings);
onMounted(loadMyBookings);
</script>

<style scoped>
.container-page { max-width: 1200px; margin: 0 auto; padding: 8rem 2rem 4rem; min-height: 100vh; }
.header { margin-bottom: 3rem; }
.title { font-size: 2.5rem; font-weight: 800; margin-bottom: 0.5rem; }
.subtitle { color: var(--text-secondary); }

.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 2rem; }
.booking-card { background: white; border-radius: var(--radius-lg); border: 1px solid var(--border); overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
.card-header { padding: 1.5rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: flex-start; background: var(--surface); }
.pnr { font-family: monospace; font-size: 1.1rem; font-weight: 700; color: var(--primary); display: block; }
.date { font-size: 0.85rem; color: var(--text-secondary); }
.badge { padding: 0.25rem 0.75rem; border-radius: 99px; font-size: 0.75rem; font-weight: 700; }
.confirmed { background: rgba(16, 185, 129, 0.1); color: #059669; }
.pending { background: rgba(245, 158, 11, 0.1); color: #d97706; }
.cancelled { background: rgba(239, 68, 68, 0.1); color: #dc2626; }

.card-body { padding: 1.5rem; }
.attraction-name { font-size: 1.25rem; font-weight: 700; margin-bottom: 1rem; }
.detail-row { display: flex; justify-content: space-between; color: var(--text-secondary); }
.total { margin-top: 1rem; padding-top: 1rem; border-top: 1px dashed var(--border); display: flex; justify-content: space-between; font-weight: 800; font-size: 1.2rem; }

.empty-state { text-align: center; padding: 4rem; background: var(--surface); border-radius: var(--radius-lg); border: 1px dashed var(--border); }
.pagination { display: flex; justify-content: center; align-items: center; gap: 1rem; margin-top: 3rem; }
.page-btn { background: white; border: 1px solid var(--border); padding: 0.5rem 1rem; border-radius: var(--radius-sm); cursor: pointer; }
.center { text-align: center; padding: 4rem; }
</style>
