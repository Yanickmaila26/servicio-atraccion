<script setup>
import { ref, onMounted } from 'vue'
import clientService from '@/services/clients'
import BaseButton from '@/components/common/BaseButton.vue'
import { UsersIcon, MagnifyingGlassIcon, EnvelopeIcon, PhoneIcon } from '@heroicons/vue/24/outline'

const clients = ref([])
const loading = ref(true)
const searchQuery = ref('')

const fetchClients = async () => {
  loading.value = true
  try {
    const data = await clientService.getList({ searchTerm: searchQuery.value })
    clients.value = data.items || data || []
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

onMounted(fetchClients)
</script>

<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-text-primary">Gestión de Clientes</h1>
        <p class="text-text-secondary text-sm">Administra los perfiles de usuario y sus datos de contacto.</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-surface p-4 rounded-2xl border border-border flex gap-4">
      <div class="flex-1">
        <div class="relative group">
          <MagnifyingGlassIcon class="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary group-focus-within:text-primary transition-colors" />
          <input 
            v-model="searchQuery"
            placeholder="Buscar por nombre, email o documento..."
            class="w-full bg-background border border-border rounded-xl py-2.5 pl-10 pr-4 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            @keyup.enter="fetchClients"
          />
        </div>
      </div>
      <BaseButton @click="fetchClients">Buscar</BaseButton>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="client in clients" :key="client.id" class="bg-surface p-6 rounded-2xl border border-border hover:shadow-soft transition-all group">
        <div class="flex items-center gap-4 mb-4">
          <div class="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
            {{ (client.fullName || client.firstName || '?').charAt(0).toUpperCase() }}
          </div>
          <div>
            <h3 class="text-lg font-bold text-text-primary group-hover:text-primary transition-colors">
              {{ client.fullName || (client.firstName + ' ' + client.lastName) || 'Sin nombre' }}
            </h3>
            <span class="text-xs text-text-secondary font-medium uppercase tracking-wider">
              {{ client.identification || client.documentNumber || 'Sin identificación' }}
            </span>
          </div>
        </div>

        <div class="space-y-2 pt-4 border-t border-border">
          <div class="flex items-center gap-3 text-sm text-text-secondary">
            <EnvelopeIcon class="h-4 w-4" />
            <span class="truncate">{{ client.email || 'Sin email' }}</span>
          </div>
          <div class="flex items-center gap-3 text-sm text-text-secondary">
            <PhoneIcon class="h-4 w-4" />
            <span>{{ client.phone || 'Sin teléfono' }}</span>
          </div>
        </div>
      </div>

      <div v-if="clients.length === 0 && !loading" class="col-span-full py-10 text-center text-text-secondary italic">
        No se encontraron clientes registrados.
      </div>
    </div>
  </div>
</template>
