<script>
export default {
  inheritAttrs: false
}
</script>

<script setup>
defineProps({
  label: String,
  modelValue: [String, Number],
  type: { type: String, default: 'text' },
  placeholder: String,
  error: String,
  icon: Object
})

defineEmits(['update:modelValue'])
</script>

<template>
  <div class="space-y-1.5 w-full">
    <label v-if="label" class="text-sm font-semibold text-text-primary ml-1">
      {{ label }}
    </label>
    <div class="relative group">
      <div v-if="icon" class="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-primary transition-colors">
        <component :is="icon" class="h-5 w-5" />
      </div>
      <input
        v-bind="$attrs"
        :type="type"
        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value)"
        class="w-full bg-surface border border-border rounded-xl py-2.5 px-4 transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-text-secondary/50 text-text-primary"
        :class="{ 'pl-10': icon, 'border-red-500 focus:ring-red-500/20 focus:border-red-500': error }"
        :placeholder="placeholder"
      />
    </div>
    <p v-if="error" class="text-xs text-red-500 mt-1 ml-1">{{ error }}</p>
  </div>
</template>
