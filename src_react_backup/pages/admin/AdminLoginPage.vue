<template>
  <div class="admin-login-wrapper">
    <div class="login-box card-saas">
      <div class="header">
        <img src="../../assets/logo_atracciones.png" alt="Logo" class="logo" />
        <h1>Panel de Administración</h1>
        <p>Acceso restringido para personal autorizado.</p>
      </div>

      <form @submit.prevent="handleLogin" class="form">
        <div v-if="auth.error" class="error-banner">
          {{ auth.error }}
        </div>

        <div class="field">
          <label>Email Corporativo</label>
          <input type="email" v-model="email" required />
        </div>

        <div class="field">
          <label>Contraseña</label>
          <input type="password" v-model="password" required />
        </div>

        <button type="submit" class="btn-primary submit-btn" :disabled="auth.loading">
          {{ auth.loading ? 'Verificando...' : 'Entrar al Panel' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';

const auth = useAuthStore();
const router = useRouter();

const email = ref('');
const password = ref('');

const handleLogin = async () => {
  try {
    await auth.login(email.value, password.value, true);
    router.push('/admin');
  } catch (err) {
    console.error('Admin login failed:', err);
  }
};
</script>

<style scoped>
.admin-login-wrapper {
  min-height: 100vh;
  background-color: #0f172a;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.login-box {
  width: 100%;
  max-width: 400px;
  background-color: #1e293b;
  border: 1px solid #334155;
  padding: 3rem;
}

.header {
  text-align: center;
  margin-bottom: 2rem;
}

.logo {
  height: 40px;
  margin-bottom: 1.5rem;
  filter: brightness(0) invert(1);
}

.header h1 {
  color: white;
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.header p {
  color: #94a3b8;
  font-size: 0.9rem;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field label {
  color: #cbd5e1;
  font-size: 0.85rem;
  font-weight: 600;
}

.field input {
  background-color: #0f172a;
  border: 1px solid #334155;
  padding: 0.75rem;
  color: white;
  border-radius: var(--radius-sm);
}

.field input:focus {
  outline: none;
  border-color: var(--primary);
}

.submit-btn {
  margin-top: 1rem;
  padding: 0.85rem;
}

.error-banner {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid #ef4444;
  color: #f87171;
  padding: 0.75rem;
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
  text-align: center;
}
</style>
