<template>
  <section class="hero">
    <div class="hero-overlay"></div>
    <div class="container hero-content">
      <div class="hero-text">
        <h1 class="hero-title">
          Descubre <span class="highlight">Aventuras</span> Inolvidables
        </h1>
        <p class="hero-description">
          Reserva las mejores experiencias turísticas con confirmación instantánea y guías certificados.
        </p>
        <div class="hero-actions">
          <button class="btn-primary btn-large">Explorar Ahora</button>
          <button class="btn-secondary btn-large">Ver Ofertas</button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero {
  height: 90vh;
  min-height: 600px;
  background-image: url('../../assets/image_hero.png');
  background-size: cover;
  background-position: center;
  position: relative;
  display: flex;
  align-items: center;
  color: white;
}

.hero-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    to right,
    rgba(15, 23, 42, 0.9),
    rgba(15, 23, 42, 0.4)
  );
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  position: relative;
  z-index: 1;
  width: 100%;
}

.hero-text {
  max-width: 700px;
}

.hero-title {
  font-size: 4.5rem;
  font-weight: 800;
  line-height: 1.1;
  margin-bottom: 2rem;
  letter-spacing: -0.02em;
}

.highlight {
  color: var(--primary-light);
  background: linear-gradient(to right, #64b5f6, #2196f3);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-description {
  font-size: 1.25rem;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 3rem;
  line-height: 1.6;
}

.hero-actions {
  display: flex;
  gap: 1.5rem;
}

.btn-large {
  padding: 1rem 2.5rem;
  font-size: 1.1rem;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>
