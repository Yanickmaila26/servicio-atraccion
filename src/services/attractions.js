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
    // /Attraction/{slug} ahora devuelve el shape del contrato YAML (integradores).
    // El front usa /Attraction/detail/{slug} que mantiene el shape rico (products, gallery, etc.).
    return api.get(`/Attraction/detail/${slug}`, { params: { requestedLangId: langId } })
  },

  getById(id) {
    return api.get(`/Attraction/detail/${id}`)
  },

  getManagementDetail(slug) {
    return api.get(`/admin-attraction/${slug}`)
  },

  // Administrativos
  getManagementList(params) {
    return api.get('/admin-attraction', { params })
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
