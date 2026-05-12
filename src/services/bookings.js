import api from './api'

export default {
  getManagementList(params) {
    return api.get('/Booking/management', { params })
  },

  getCustomerBookings() {
    return api.get('/Booking/user/history')
  },

  getById(id) {
    return api.get(`/Booking/${id}`)
  },

  getByPnr(pnr) {
    return api.get(`/Booking/${pnr}`)
  },

  create(data) {
    return api.post('/Booking/create', data)
  },

  cancel(pnrCode, reason = '') {
    return api.post('/Booking/cancel', { pnrCode, cancelReason: reason })
  }
}
