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

  // Generar factura manual (desacoplada)
  // El backend espera bookingId en el body como parte de CreateInvoiceRequest,
  // no en la URL. POST /billing/invoice
  createInvoice(bookingId, payload) {
    return api.post('/billing/invoice', { bookingId, ...payload })
  },

  // Generar URL de descarga para el PDF
  getDownloadUrl(bookingId) {
    // IMPORTANTE: El endpoint real está en /booking/{id}/invoice/pdf (según AtraccionesBookingController)
    return `${baseUrl}/booking/${bookingId}/invoice/pdf`
  }
}
