import api from './api'

export default {
  // Registrar una venta directa (POS)
  registerSale(data) {
    // Usamos el flujo de booking para registrar la venta
    // El backend identificará que es un Partner quien la realiza por el Token
    return api.post('/Booking/create', {
      ...data,
      paymentMethod: data.paymentMethod || 'cash', // cash, card, transfer
      isPosSale: true,
      billing: data.billing || null
    })
  }
}
