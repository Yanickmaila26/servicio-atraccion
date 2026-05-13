import api, { baseUrl } from './api'

export default {
  // Obtener todas las facturas (Admin)
  getManagementList(params) {
    return api.get('/billing/management', { params })
  },

  // Obtener facturas del cliente autenticado
  getMyInvoices() {
    return api.get('/billing/my-invoices')
  },

  // Obtener detalle de una factura específica
  getById(id) {
    return api.get(`/billing/management/${id}`)
  },

  // Generar URL de descarga para el PDF
  getDownloadUrl(bookingId) {
    // IMPORTANTE: El endpoint real está en /booking/{id}/invoice/pdf (según AtraccionesBookingController)
    return `${baseUrl}/booking/${bookingId}/invoice/pdf`
  }
}
