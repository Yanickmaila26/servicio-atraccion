import api from './api'

export default {
  getManagementList(params) {
    return api.get('/Booking/management', { params })
  },

  getById(id) {
    return api.get(`/Booking/${id}`)
  },

  getByPnr(pnr) {
    return api.get(`/Booking/${pnr}`)
  },

  create(data) {
    return api.post('/Booking', data)
  },

  cancel(id) {
    return api.post(`/Booking/${id}/cancel`)
  }
}
