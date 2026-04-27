<template>
  <div class="login-container">
    <div class="login-card card-saas">
      <div class="login-header">
        <h1>Bienvenido de nuevo</h1>
        <p>Ingresa tus credenciales para acceder a tus reservas.</p>
      </div>

      <form @submit.prevent="handleSubmit" class="login-form">
        <div v-if="auth.error" class="error-msg">
          {{ auth.error }}
        </div>

        <div class="form-group">
          <label>Correo Electrónico</label>
          <input 
            type="email" 
            v-model="email" 
            placeholder="ejemplo@correo.com" 
            required 
          />
        </div>

        <div class="form-group">
          <label>Contraseña</label>
          <input 
            type="password" 
            v-model="password" 
            placeholder="••••••••" 
            required 
          />
        </div>

        <button type="submit" class="btn-primary login-btn" :disabled="auth.loading">
          {{ auth.loading ? 'Iniciando sesión...' : 'Iniciar Sesión' }}
        </button>
      </form>

      <div class="login-footer">
        <p>¿No tienes una cuenta? <router-link to="/register">Regístrate aquí</router-link></p>
      </div>
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

const handleSubmit = async () => {
  try {
    await auth.login(email.value, password.value);
    router.push('/');
  } catch (err) {
    console.error('Login error:', err);
  }
};
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--surface);
  padding: 2rem;
}

.login-card {
  width: 100%;
  max-width: 450px;
  padding: 3rem;
  background: white;
}

.login-header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.login-header h1 {
  font-size: 2rem;
  font-weight: 800;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.login-header p {
  color: var(--text-secondary);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text-primary);
}

.form-group input {
  padding: 0.8rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: var(--radius-sm);
  font-size: 1rem;
  transition: border-color 0.3s;
}

.form-group input:focus {
  outline: none;
  border-color: var(--primary);
}

.login-btn {
  margin-top: 1rem;
  padding: 1rem;
}

.error-msg {
  background: #fff5f5;
  color: #c53030;
  padding: 1rem;
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  text-align: center;
}

.login-footer {
  text-align: center;
  margin-top: 2rem;
  font-size: 0.95rem;
  color: var(--text-secondary);
}

.login-footer a {
  color: var(--primary);
  font-weight: 700;
  text-decoration: none;
}
</style>
