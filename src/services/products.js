import api from './api'

export default {
  getByAttraction(attractionId) {
    return api.get(`/ProductOption/by-attraction/${attractionId}`)
  },
  
  getById(id) {
    return api.get(`/ProductOption/${id}`)
  },

  create(data) {
    return api.post('/ProductOption', data)
  },

  update(id, data) {
    return api.put(`/ProductOption/${id}`, data)
  },

  toggleActive(id, isActive) {
    return api.patch(`/ProductOption/${id}/toggle`, isActive)
  },

  delete(id) {
    return api.delete(`/ProductOption/${id}`)
  }
}
