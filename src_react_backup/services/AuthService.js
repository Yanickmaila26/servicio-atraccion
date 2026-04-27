import apiClient from '../api/apiClient';

const AuthService = {
  login: async (email, password) => {
    const response = await apiClient.post('/Auth/login', { email, password });
    return response.data;
  },

  loginAdmin: async (email, password) => {
    const response = await apiClient.post('/Auth/login-admin', { email, password });
    return response.data;
  },

  register: async (userData) => {
    const response = await apiClient.post('/Auth/register', userData);
    return response.data;
  }
};

export default AuthService;
