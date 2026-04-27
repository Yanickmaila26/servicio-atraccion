import apiClient from '../api/apiClient';

const ClientService = {
  getAll: async (params = {}) => {
    const response = await apiClient.get('/Client', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(`/Client/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await apiClient.post('/Client', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await apiClient.put(`/Client/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    await apiClient.delete(`/Client/${id}`);
  }
};

export default ClientService;
