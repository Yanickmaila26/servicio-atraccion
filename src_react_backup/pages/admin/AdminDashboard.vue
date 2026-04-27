<template>
  <div class="card-saas dashboard">
    <h2>Vista General del Negocio</h2>
    <div class="stats-grid">
      <div class="stat-card">
        <p class="label">Atracciones Activas</p>
        <p class="value">12</p>
      </div>
      <div class="stat-card">
        <p class="label">Reservas Hoy</p>
        <p class="value">45</p>
      </div>
      <div class="stat-card">
        <p class="label">Ingresos Mes</p>
        <p class="value accent">$12,450</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  padding: 2rem;
}

h2 {
  margin-bottom: 1.5rem;
  color: white;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}

.stat-card {
  padding: 1.5rem;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: var(--radius-sm);
}

.label {
  font-size: 0.8rem;
  color: #94a3b8;
}

.value {
  font-size: 2rem;
  font-weight: 800;
  color: white;
}

.value.accent {
  color: var(--primary);
}
</style>
