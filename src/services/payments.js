import api from './api'

export default {
  create(data) {
    return api.post('/Payment', data)
  },

  updateStatus(paymentId, data) {
    return api.put(`/Payment/${paymentId}/status`, data)
  }
}
