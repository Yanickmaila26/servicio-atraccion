import api from './api'

export default {
  // Admin: listado de reservas (si existe un endpoint admin)
  getManagementList(params) {
    return api.get('/Booking', { params })
  },

  // Cliente: historial de reservas propias
  getCustomerBookings() {
    return api.get('/Booking/mis-reservas')
  },

  getById(id) {
    return api.get(`/Booking/${id}`)
  },

  getByPnr(pnr) {
    return api.get(`/Booking/${pnr}`)
  },

  // Crear reserva → POST /booking (sin subruta /create)
  create(data) {
    return api.post('/Booking', data)
  },

  // Cancelar → POST /booking/{id}/cancel
  cancel(id, reason = '') {
    return api.post(`/Booking/${id}/cancel`, { cancelReason: reason })
  }
}

