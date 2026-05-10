import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useCheckoutStore = defineStore('checkout', () => {
  const attraction = ref(null)
  const product = ref(null)
  const slot = ref(null)
  const cartItems = ref([])
  const passengerForms = ref([])

  function set(data) {
    attraction.value = data.attraction
    product.value = data.product
    slot.value = data.slot
    cartItems.value = data.cartItems
    passengerForms.value = data.passengerForms
  }

  function clear() {
    attraction.value = null
    product.value = null
    slot.value = null
    cartItems.value = []
    passengerForms.value = []
  }

  return { attraction, product, slot, cartItems, passengerForms, set, clear }
}, { persist: { storage: sessionStorage } })
