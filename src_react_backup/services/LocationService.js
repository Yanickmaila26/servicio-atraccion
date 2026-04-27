import apiClient from '../api/apiClient';

const LocationService = {
  getAll: async () => {
    const response = await apiClient.get('/Location');
    return response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(`/Location/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await apiClient.post('/Location', data);
    return response.data;
  },

  update: async (id, data) => {
    await apiClient.put(`/Location/${id}`, data);
  },

  delete: async (id) => {
    await apiClient.delete(`/Location/${id}`);
  }
};

export default LocationService;
