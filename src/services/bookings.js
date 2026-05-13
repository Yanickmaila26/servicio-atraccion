import api from './api'

export default {
  // Admin: listado de reservas (si existe un endpoint admin)
  getManagementList(params) {
    return api.get('/admin-booking/management', { params })
  },

  // Cliente: historial de reservas propias
  getCustomerBookings(page = 1) {
    return api.get('/admin-booking/user/history', { params: { page } })
  },

  getById(id) {
    return api.get(`/admin-booking/detail/${id}`)
  },

  getByPnr(pnr) {
    return api.get(`/admin-booking/${pnr}`)
  },

  // Crear reserva → POST /admin-booking
  create(data) {
    return api.post('/admin-booking', data)
  },

  // Cancelar → POST /admin-booking/cancel
  cancel(pnr, reason = '') {
    return api.post(`/admin-booking/cancel`, { pnrCode: pnr, cancelReason: reason })
  }
}

