import api from './api'

export default {
  // Públicos
  getTopRated(count = 5) {
    return api.get('/Attraction/top', { params: { count } })
  },
  
  search(params) {
    return api.get('/Attraction', { params })
  },
  
  getBySlug(slug, langId = 1) {
    return api.get(`/Attraction/${slug}`, { params: { requestedLangId: langId } })
  },

  getById(id) {
    return api.get(`/Attraction/${id}`)
  },

  // Administrativos
  getManagementList(params) {
    return api.get('/Attraction/management', { params })
  },

  create(data) {
    return api.post('/Attraction', data)
  },

  createComplete(data) {
    return api.post('/Attraction/complete', data)
  },

  update(id, data) {
    return api.put(`/Attraction/${id}`, data)
  },

  delete(id) {
    return api.delete(`/Attraction/${id}`)
  },

  toggleStatus(id, isPublished) {
    return api.patch(`/Attraction/${id}/status`, { isPublished })
  }
}
