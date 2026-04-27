<template>
  <div class="home-page">
    <Hero />

    <section class="section container">
      <div class="section-header">
        <h2 class="section-title">Atracciones Destacadas</h2>
        <p class="section-subtitle">Explora las experiencias más valoradas por nuestros viajeros.</p>
      </div>

      <div v-if="loading" class="centered">
        <div class="spinner"></div>
        <p>Buscando las mejores experiencias...</p>
      </div>

      <div v-else-if="error" class="error-card">
        <p>{{ error }}</p>
        <button @click="loadAttractions" class="btn-primary">Reintentar</button>
      </div>

      <div v-else class="grid">
        <template v-if="attractions.length > 0">
          <div v-for="attr in attractions" :key="attr.id" class="card-saas attraction-card">
            <div 
              class="card-image" 
              :style="{ backgroundImage: `url(${attr.mainImageUrl || '/src/assets/image_hero.png'})` }"
            >
              <div class="tag">{{ attr.categoryName || 'Aventura' }}</div>
            </div>
            <div class="card-body">
              <h3 class="card-title">{{ attr.name }}</h3>
              <p class="card-text">{{ attr.descriptionShort }}</p>
              <div class="card-footer">
                <div class="price-container">
                  <span class="price-label">Desde</span>
                  <span class="price-value">${{ attr.startingPrice?.toFixed(2) }}</span>
                </div>
                <button class="btn-primary">Reservar</button>
              </div>
            </div>
          </div>
        </template>
        <div v-else class="centered">
          <p>No se encontraron atracciones por el momento.</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import Hero from '../../components/public/Hero.vue';
import AttractionService from '../../services/AttractionService';

const attractions = ref([]);
const loading = ref(true);
const error = ref(null);

const loadAttractions = async () => {
  loading.value = true;
  error.value = null;
  try {
    const data = await AttractionService.search();
    attractions.value = data.items || [];
  } catch (err) {
    error.value = 'Error al cargar las atracciones. Por favor, intenta de nuevo.';
    console.error(err);
  } finally {
    loading.value = false;
  }
};

onMounted(loadAttractions);
</script>

<style scoped>
.home-page {
  padding-bottom: 5rem;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

.section {
  padding: 5rem 0;
}

.section-header {
  margin-bottom: 4rem;
  text-align: center;
}

.section-title {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--text-primary);
  margin-bottom: 1rem;
}

.section-subtitle {
  color: var(--text-secondary);
  font-size: 1.1rem;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 2.5rem;
}

.attraction-card {
  transition: transform 0.3s;
}

.attraction-card:hover {
  transform: translateY(-10px);
}

.card-image {
  height: 250px;
  background-size: cover;
  background-position: center;
  position: relative;
}

.tag {
  position: absolute;
  top: 1rem;
  left: 1rem;
  background: white;
  padding: 0.4rem 1rem;
  border-radius: 99px;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--primary);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.card-body {
  padding: 1.5rem;
}

.card-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
  color: var(--text-primary);
}

.card-text {
  color: var(--text-secondary);
  font-size: 0.95rem;
  line-height: 1.6;
  margin-bottom: 1.5rem;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.price-container {
  display: flex;
  flex-direction: column;
}

.price-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  font-weight: 700;
}

.price-value {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--primary);
}

.centered {
  text-align: center;
  padding: 5rem 0;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(30, 136, 229, 0.1);
  border-left-color: var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1.5rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-card {
  text-align: center;
  padding: 3rem;
  background: #fff5f5;
  border-radius: var(--radius-lg);
}

.error-card p {
  color: #c53030;
  margin-bottom: 1.5rem;
}
</style>
