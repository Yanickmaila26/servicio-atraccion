import { defineStore } from 'pinia';
import AuthService from '../services/AuthService';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user')) || null,
    loading: false,
    error: null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
    getUserRoles: (state) => state.user?.roles || [],
  },

  actions: {
    async login(email, password, isAdmin = false) {
      this.loading = true;
      this.error = null;
      try {
        const data = isAdmin 
          ? await AuthService.loginAdmin(email, password)
          : await AuthService.login(email, password);
        
        const { accessToken, user } = data;
        
        localStorage.setItem('token', accessToken);
        localStorage.setItem('user', JSON.stringify(user));
        
        this.user = user;
        return user;
      } catch (err) {
        this.error = err.response?.data?.message || 'Error de autenticación';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    logout() {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      this.user = null;
    },

    hasRole(allowed) {
      if (!this.user || !this.user.roles) return false;
      if (Array.isArray(allowed)) {
        return allowed.some(role => this.user.roles.includes(role));
      }
      return this.user.roles.includes(allowed);
    }
  }
});
