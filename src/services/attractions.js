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
    // Para marketplace/público (puede usar slug o ID)
    return api.get(`/Attraction/${id}`)
  },

  getManagementDetail(id) {
    // NUEVO: Endpoint optimizado para edición administrativa
    return api.get(`/Attraction/management/${id}`)
  },

  // Administrativos
  getManagementList(params) {
    // params puede incluir pageNumber, pageSize, search, etc.
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
