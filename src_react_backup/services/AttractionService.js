import apiClient from '../api/apiClient';

const AttractionService = {
  search: async (params = {}) => {
    const response = await apiClient.get('/Attraction', { params });
    return response.data;
  },

  getManagement: async (params = {}) => {
    const response = await apiClient.get('/Attraction/management', { params });
    return response.data;
  },

  getTopRated: async (count = 5) => {
    const response = await apiClient.get('/Attraction/top', { params: { count } });
    return response.data;
  },

  getBySlug: async (slug, requestedLangId = 1) => {
    const response = await apiClient.get(`/Attraction/${slug}`, { params: { requestedLangId } });
    return response.data;
  },

  getAvailability: async (attractionId, startDate, endDate) => {
    const response = await apiClient.get(`/Attraction/${attractionId}/availability`, {
      params: { startDate, endDate }
    });
    return response.data;
  },

  create: async (data) => {
    const response = await apiClient.post('/Attraction', data);
    return response.data;
  },

  update: async (id, data) => {
    await apiClient.put(`/Attraction/${id}`, data);
  },

  delete: async (id) => {
    await apiClient.delete(`/Attraction/${id}`);
  },

  toggleStatus: async (id, isPublished) => {
    await apiClient.patch(`/Attraction/${id}/status`, { isPublished });
  }
};

export default AttractionService;
