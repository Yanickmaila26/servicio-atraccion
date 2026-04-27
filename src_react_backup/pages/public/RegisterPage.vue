<template>
  <div class="register-container">
    <div class="register-card card-saas">
      <div class="register-header">
        <h1>Crea tu cuenta</h1>
        <p>Únete para empezar a reservar tus próximas aventuras.</p>
      </div>

      <form @submit.prevent="handleSubmit" class="register-form">
        <div class="row">
          <div class="form-group">
            <label>Nombre</label>
            <input type="text" v-model="formData.firstName" required />
          </div>
          <div class="form-group">
            <label>Apellido</label>
            <input type="text" v-model="formData.lastName" required />
          </div>
        </div>

        <div class="form-group">
          <label>Correo Electrónico</label>
          <input type="email" v-model="formData.email" required />
        </div>

        <div class="form-group">
          <label>Contraseña</label>
          <input type="password" v-model="formData.password" required />
        </div>

        <div class="row">
          <div class="form-group">
            <label>Tipo Documento</label>
            <select v-model="formData.documentType" required>
              <option value="DNI">DNI</option>
              <option value="Pasaporte">Pasaporte</option>
              <option value="CE">Cédula Extranjería</option>
            </select>
          </div>
          <div class="form-group">
            <label>Nro. Documento</label>
            <input type="text" v-model="formData.documentNumber" required />
          </div>
        </div>

        <div class="form-group">
          <label>Teléfono</label>
          <input type="text" v-model="formData.phone" required />
        </div>

        <button type="submit" class="btn-primary register-btn" :disabled="loading">
          {{ loading ? 'Creando cuenta...' : 'Registrarse' }}
        </button>
      </form>

      <div class="register-footer">
        <p>¿Ya tienes una cuenta? <router-link to="/login">Inicia sesión</router-link></p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import AuthService from '../../services/AuthService';

const router = useRouter();
const loading = ref(false);

const formData = ref({
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  phone: '',
  documentType: 'DNI',
  documentNumber: ''
});

const handleSubmit = async () => {
  loading.value = true;
  try {
    await AuthService.register(formData.value);
    alert('Registro exitoso. Ahora puedes iniciar sesión.');
    router.push('/login');
  } catch (err) {
    alert('Error en el registro. Por favor verifica tus datos.');
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.register-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 4rem 2rem; background: var(--surface); }
.register-card { width: 100%; max-width: 600px; padding: 3rem; background: white; }
.register-header { text-align: center; margin-bottom: 2rem; }
.register-header h1 { font-size: 2rem; font-weight: 800; }
.register-form { display: flex; flex-direction: column; gap: 1.25rem; }
.row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.form-group { display: flex; flex-direction: column; gap: 0.4rem; }
.form-group label { font-weight: 600; font-size: 0.9rem; }
.form-group input, .form-group select { padding: 0.75rem; border: 1px solid var(--border); border-radius: var(--radius-sm); }
.register-btn { margin-top: 1rem; padding: 1rem; }
.register-footer { text-align: center; margin-top: 2rem; }
.register-footer a { color: var(--primary); font-weight: 700; text-decoration: none; }
</style>
