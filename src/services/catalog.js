import api from './api'

export default {
  // Ubicaciones
  getLocations() {
    return api.get('/Location')
  },
  createLocation(data) {
    return api.post('/Location', data)
  },
  updateLocation(id, data) {
    return api.put(`/Location/${id}`, data)
  },
  deleteLocation(id) {
    return api.delete(`/Location/${id}`)
  },
  
  // Categorías y Subcategorías
  getCategories() {
    return api.get('/Category')
  },
  getSubcategories(categoryId) {
    return api.get(`/Category/${categoryId}/Subcategory`)
  },
  createCategory(data) {
    return api.post('/Category', data)
  },
  createSubcategory(data) {
    return api.post('/Category/subcategory', data)
  },
  updateSubcategory(id, data) {
    return api.put(`/Category/subcategory/${id}`, data)
  },
  deleteSubcategory(id) {
    return api.delete(`/Category/subcategory/${id}`)
  },
  updateCategory(id, data) {
    return api.put(`/Category/${id}`, data)
  },
  deleteCategory(id) {
    return api.delete(`/Category/${id}`)
  },

  // Etiquetas (Tags)
  getTags() {
    return api.get('/Tag')
  },
  createTag(data) {
    return api.post('/Tag', data)
  },
  updateTag(id, data) {
    return api.put(`/Tag/${id}`, data)
  },
  deleteTag(id) {
    return api.delete(`/Tag/${id}`)
  },
  
  // Categorías de Ticket (Adulto, Niño, etc.)
  getTicketCategories() {
    return api.get('/TicketCategory')
  },

  // Inclusiones (Inclusions)
  getInclusions() {
    return api.get('/Inclusion')
  },
  createInclusion(data) {
    return api.post('/Inclusion', data)
  },
  updateInclusion(id, data) {
    return api.put(`/Inclusion/${id}`, data)
  },
  deleteInclusion(id) {
    return api.delete(`/Inclusion/${id}`)
  }
}
