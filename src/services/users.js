import api from './api'

export default {
  getUsers(params) {
    return api.get('/User', { params })
  },

  createUser(data) {
    return api.post('/User', data)
  },

  updateStatus(id, isActive) {
    return api.patch(`/User/${id}/status`, isActive)
  },

  deleteUser(id) {
    return api.delete(`/User/${id}`)
  }
}
