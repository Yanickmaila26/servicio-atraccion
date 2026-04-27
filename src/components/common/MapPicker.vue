<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const props = defineProps({
  lat: { type: Number, default: -0.180653 }, // Centro de Ecuador por defecto (Quito)
  lng: { type: Number, default: -78.467838 },
  zoom: { type: Number, default: 13 },
  label: { type: String, default: 'Selecciona la ubicación en el mapa' }
})

const emit = defineEmits(['update:lat', 'update:lng'])

const mapContainer = ref(null)
let map = null
let marker = null

// Arreglo para el ícono de Leaflet con Webpack/Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

onMounted(() => {
  map = L.map(mapContainer.value).setView([props.lat || -0.180653, props.lng || -78.467838], props.zoom)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map)

  if (props.lat && props.lng) {
    marker = L.marker([props.lat, props.lng]).addTo(map)
  }

  map.on('click', (e) => {
    const { lat, lng } = e.latlng
    if (marker) {
      marker.setLatLng([lat, lng])
    } else {
      marker = L.marker([lat, lng]).addTo(map)
    }
    emit('update:lat', lat)
    emit('update:lng', lng)
  })
})

onBeforeUnmount(() => {
  if (map) map.remove()
})

// Para cuando las props cambian desde afuera (ej: carga inicial de datos)
watch(() => [props.lat, props.lng], ([newLat, newLng]) => {
  if (newLat && newLng && map) {
    if (marker) {
      marker.setLatLng([newLat, newLng])
    } else {
      marker = L.marker([newLat, newLng]).addTo(map)
    }
    map.setView([newLat, newLng])
  }
})

// Workaround para un bug visual cuando el mapa inicia dentro de un div con v-show
const invalidateMapSize = () => {
  setTimeout(() => {
    if (map) map.invalidateSize()
  }, 300)
}
defineExpose({ invalidateMapSize })
</script>

<template>
  <div class="space-y-2">
    <label class="text-xs font-black uppercase text-text-secondary ml-1">{{ label }}</label>
    <div ref="mapContainer" class="h-[300px] w-full rounded-2xl border border-border z-0"></div>
    <p class="text-[10px] text-text-secondary italic">Haz clic en el mapa para colocar o mover el pin.</p>
  </div>
</template>

<style scoped>
.leaflet-container {
  z-index: 1 !important;
}
</style>
