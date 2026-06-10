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

  // Crear reserva del cliente (checkout) → POST /admin-booking
  // Nota: /booking (AtraccionesBookingController) está reservado para el
  // contrato de integración externa con sistemas tipo Booking.com; el flujo
  // interno del checkout/cliente usa /admin-booking (BookingController).
  create(data, idempotencyKey) {
    const config = {}
    if (idempotencyKey) {
      config.headers = {
        'X-Idempotency-Key': idempotencyKey
      }
    }
    return api.post('/admin-booking', data, config)
  },

  // Cancelar → POST /admin-booking/cancel
  cancel(pnr, reason = '') {
    return api.post(`/admin-booking/cancel`, { pnrCode: pnr, cancelReason: reason })
  }
}

