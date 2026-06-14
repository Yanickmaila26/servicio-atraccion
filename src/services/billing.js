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

  // Generar URL de descarga para el PDF usando el ID de la factura
  getDownloadUrl(invoiceId) {
    return `${baseUrl}/billing/invoice/${invoiceId}/pdf`
  },

  // Descargar el archivo PDF autenticado usando axios
  async downloadPdfFile(invoiceId, invoiceNumber = 'factura') {
    try {
      const response = await api.get(`/billing/invoice/${invoiceId}/pdf`, { responseType: 'blob' })
      const blob = new Blob([response], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Factura-${invoiceNumber}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      return true
    } catch (error) {
      console.error('Error al descargar PDF:', error)
      throw error
    }
  }
}
