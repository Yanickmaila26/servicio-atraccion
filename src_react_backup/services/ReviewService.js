import apiClient from '../api/apiClient';

const ReviewService = {
  create: async (data) => {
    const response = await apiClient.post('/Review', data);
    return response.data;
  },

  getManagement: async (params = {}) => {
    const response = await apiClient.get('/Review/management', { params });
    return response.data;
  },

  getByAttraction: async (attractionId, page = 1, pageSize = 10) => {
    const response = await apiClient.get(`/Review/attraction/${attractionId}`, {
      params: { page, pageSize }
    });
    return response.data;
  },

  delete: async (id) => {
    await apiClient.delete(`/Review/${id}`);
  }
};

export default ReviewService;
