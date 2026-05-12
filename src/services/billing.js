import api from './api'

export default {
  // Obtener todas las facturas (Admin)
  getManagementList(params) {
    return api.get('/billing/management', { params })
  },

  // Obtener facturas del cliente autenticado
  getMyInvoices() {
    // Si no existe un endpoint de "my-invoices" en Billing, podemos intentar obtenerlo de Booking
    return api.get('/billing/my-invoices').catch(() => api.get('/booking/user/history'))
  },

  // Obtener detalle de una factura específica
  getById(id) {
    return api.get(`/billing/management/${id}`)
  },

  // Generar URL de descarga para el PDF
  getDownloadUrl(bookingId) {
    const baseUrl = (import.meta.env.VITE_API_BASE_URL && import.meta.env.VITE_API_BASE_URL.startsWith('http'))
      ? import.meta.env.VITE_API_BASE_URL 
      : 'https://servicioatraccionapi20260428073304-c5fpe4fja8hvetc0.canadacentral-01.azurewebsites.net/api/v1/yanick-maila'
    
    // IMPORTANTE: El endpoint real está en /booking/{id}/invoice/pdf (según AtraccionesBookingController)
    return `${baseUrl}/booking/${bookingId}/invoice/pdf`
  }
}
