import api from './api'

export default {
  getList(params) {
    return api.get('/Client', { params })
  },

  getById(id) {
    return api.get(`/Client/${id}`)
  },

  create(data) {
    return api.post('/Client', data)
  },

  update(id, data) {
    return api.put(`/Client/${id}`, data)
  },

  delete(id) {
    return api.delete(`/Client/${id}`)
  },

  validate(documentNumber) {
    return api.get(`/Client/validate/${documentNumber}`)
  }
}
