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
    // Usamos el endpoint /complete que es el que está funcionando en producción
    return api.get(`/admin-attraction/${id}/complete`)
  },

  // Administrativos
  getManagementList(params) {
    // params puede incluir pageNumber, pageSize, search, etc.
    return api.get('/admin-attraction/management', { params })
  },

  create(data) {
    return api.post('/admin-attraction', data)
  },

  createComplete(data) {
    return api.post('/admin-attraction/complete', data)
  },

  update(id, data) {
    return api.put(`/admin-attraction/${id}`, data)
  },

  delete(id) {
    return api.delete(`/admin-attraction/${id}`)
  },

  toggleStatus(id, isPublished) {
    return api.patch(`/admin-attraction/${id}/status`, { isPublished })
  }
}
