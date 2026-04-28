import api from './api'

export default {
  getByAttraction(attractionId, params) {
    return api.get(`/Review/attraction/${attractionId}`, { params })
  },
  create(data) {
    return api.post('/Review', data)
  },
  getManagementList(params) {
    return api.get('/Review/management', { params })
  }
}
