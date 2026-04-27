<script setup>
// Configuración global si es necesaria (ej: inicializar dark mode)
import { useDark } from '@vueuse/core'

// Inicializar el modo oscuro
const isDark = useDark({
  selector: 'html',
  attribute: 'class',
  valueDark: 'dark',
  valueLight: 'light',
})
</script>

<template>
  <router-view></router-view>
</template>

<style>
/* Los estilos globales están en src/assets/styles/index.css */
</style>
