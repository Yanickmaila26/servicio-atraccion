import api from './api'

/**
 * Servicio para gestión de Modalidades (ProductOption) y sus Horarios/Slots.
 * BASE: /api/v1/ProductOption
 */
export default {
  // ── MODALIDADES ──────────────────────────────────────────────────────────

  /** GET /api/v1/ProductOption/by-attraction/{attractionId} */
  getByAttraction(attractionId) {
    return api.get(`/ProductOption/by-attraction/${attractionId}`)
  },

  /** GET /api/v1/ProductOption/{id} */
  getById(productId) {
    return api.get(`/ProductOption/${productId}`)
  },

  /** POST /api/v1/ProductOption */
  createProduct(data) {
    return api.post('/ProductOption', data)
  },

  /** PUT /api/v1/ProductOption/{id} */
  updateProduct(productId, data) {
    return api.put(`/ProductOption/${productId}`, data)
  },

  /** PATCH /api/v1/ProductOption/{id}/toggle */
  toggleProduct(productId) {
    return api.patch(`/ProductOption/${productId}/toggle`)
  },

  /** DELETE /api/v1/ProductOption/{id} */
  deleteProduct(productId) {
    return api.delete(`/ProductOption/${productId}`)
  },

  // ── DISPONIBILIDAD (Plantilla + Slots en un solo paso) ───────────────────

  /**
   * POST /api/v1/ProductOption/{productId}/schedules
   * Crea la plantilla Y genera los slots automáticamente.
   * body: { name, validFrom, validTo, monday-sunday, defaultCapacity, times: [{startTime}] }
   * response: { id, message }
   */
  createSchedule(productId, data) {
    return api.post(`/ProductOption/${productId}/schedules`, data)
  },

  // ── SLOTS ─────────────────────────────────────────────────────────────────

  /**
   * GET /api/v1/ProductOption/{productId}/slots?fromDate=&toDate=
   * Devuelve array de slots con fecha, hora, capacidad y estado.
   */
  getSlots(productId, { fromDate, toDate } = {}) {
    return api.get(`/ProductOption/${productId}/slots`, {
      params: { fromDate, toDate }
    })
  },

  /**
   * DELETE /api/v1/ProductOption/{productId}/slots/{slotId}
   * Elimina un slot individual.
   */
  deleteSlot(productId, slotId) {
    return api.delete(`/ProductOption/${productId}/slots/${slotId}`)
  },

  /**
   * DELETE /api/v1/ProductOption/{productId}/slots
   * Eliminación masiva. Body puede contener:
   *   { exactDate }                       → un día específico
   *   { fromDate, toDate }                → rango completo
   *   { fromDate, toDate, dayOfWeek }     → solo ciertos días de la semana
   * response: { slotsDeleted, slotsSkipped, message }
   */
  bulkDeleteSlots(productId, data) {
    return api.delete(`/ProductOption/${productId}/slots`, { data })
  }
}
