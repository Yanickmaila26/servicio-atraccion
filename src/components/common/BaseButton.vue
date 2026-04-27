<script setup>
defineProps({
  variant: { 
    type: String, 
    default: 'primary',
    validator: (value) => ['primary', 'secondary', 'outline', 'danger'].includes(value)
  },
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  type: { type: String, default: 'button' }
})
</script>

<template>
  <button 
    :type="type"
    class="px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-light dark:focus:ring-offset-surface"
    :class="{
      'bg-primary text-white hover:bg-primary-dark shadow-soft': variant === 'primary',
      'bg-surface text-text-primary hover:bg-gray-200 dark:hover:bg-gray-700': variant === 'secondary',
      'bg-transparent border border-border text-text-primary hover:border-text-secondary': variant === 'outline',
      'bg-red-500 text-white hover:bg-red-600 shadow-soft': variant === 'danger',
    }"
    :disabled="loading || disabled"
  >
    <!-- SVG Spinner -->
    <svg v-if="loading" class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <slot></slot>
  </button>
</template>
