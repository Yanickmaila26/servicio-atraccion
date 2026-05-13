import api from './api'

export default {
  // Admin: listado de reservas (si existe un endpoint admin)
  getManagementList(params) {
    return api.get('/admin-booking/management', { params })
  },

  // Cliente: historial de reservas propias
  getCustomerBookings() {
    return api.get('/booking/mis-reservas')
  },

  getById(id) {
    return api.get(`/admin-booking/detail/${id}`)
  },

  getByPnr(pnr) {
    return api.get(`/admin-booking/${pnr}`)
  },

  // Crear reserva → POST /booking
  create(data) {
    return api.post('/booking', data)
  },

  // Cancelar → POST /booking/{id}/cancel
  cancel(id, reason = '') {
    return api.post(`/booking/${id}/cancel`, { cancelReason: reason })
  }
}

