import apiClient from '../api/apiClient';

const CategoryService = {
  getAll: async () => {
    const response = await apiClient.get('/Category');
    return response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(`/Category/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await apiClient.post('/Category', data);
    return response.data;
  },

  update: async (id, data) => {
    await apiClient.put(`/Category/${id}`, data);
  },

  delete: async (id) => {
    await apiClient.delete(`/Category/${id}`);
  },

  getAllSubcategories: async () => {
    const response = await apiClient.get('/Category/subcategory');
    return response.data;
  },

  getSubcategoriesByCategory: async (categoryId) => {
    const response = await apiClient.get(`/Category/${categoryId}/subcategory`);
    return response.data;
  },

  createSubcategory: async (data) => {
    const response = await apiClient.post('/Category/subcategory', data);
    return response.data;
  },

  updateSubcategory: async (id, data) => {
    await apiClient.put(`/Category/subcategory/${id}`, data);
  },

  deleteSubcategory: async (id) => {
    await apiClient.delete(`/Category/subcategory/${id}`);
  }
};

export default CategoryService;
