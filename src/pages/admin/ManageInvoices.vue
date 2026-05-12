<script setup>
import { ref, onMounted } from 'vue'
import billingService from '@/services/billing'
import BaseButton from '@/components/common/BaseButton.vue'
import { 
  DocumentTextIcon, 
  MagnifyingGlassIcon, 
  EyeIcon, 
  ArrowDownTrayIcon,
  FunnelIcon
} from '@heroicons/vue/24/outline'
import Swal from 'sweetalert2'

const invoices = ref([])
const loading = ref(true)
const searchQuery = ref('')
const selectedInvoice = ref(null)
const showDetail = ref(false)

const fetchInvoices = async () => {
  loading.value = true
  try {
    const data = await billingService.getManagementList()
    invoices.value = data || []
  } catch (error) {
    console.error(error)
    Swal.fire('Error', 'No se pudieron cargar las facturas', 'error')
  } finally {
    loading.value = false
  }
}

const openDetail = (invoice) => {
  selectedInvoice.value = invoice
  showDetail.value = true
}

const downloadPdf = (invoice) => {
  if (!invoice) return
  // Usamos el bookingId que es lo que requiere el nuevo endpoint del back
  const url = billingService.getDownloadUrl(invoice.bookingId || invoice.id)
  window.open(url, '_blank')
}

const getStatusClass = (status) => {
  const map = {
    'paid': 'bg-green-100 text-green-700',
    'pending': 'bg-yellow-100 text-yellow-700',
    'cancelled': 'bg-red-100 text-red-700'
  }
  return map[status?.toLowerCase()] || 'bg-gray-100 text-gray-700'
}

onMounted(fetchInvoices)
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-black text-text-primary flex items-center gap-3">
          <DocumentTextIcon class="h-10 w-10 text-primary" /> Gestión de Facturas
        </h1>
        <p class="text-text-secondary mt-1">Monitorea y descarga los comprobantes de venta emitidos.</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-surface p-4 rounded-3xl border border-border flex flex-wrap gap-4 items-center">
      <div class="relative flex-1 min-w-[250px]">
        <MagnifyingGlassIcon class="h-5 w-5 text-text-secondary absolute left-4 top-1/2 -translate-y-1/2" />
        <input 
          v-model="searchQuery"
          type="text" 
          placeholder="Buscar por cliente, RUC o # factura..." 
          class="w-full bg-background border border-border rounded-2xl py-3 pl-12 pr-4 outline-none focus:border-primary transition-all"
        />
      </div>
      <BaseButton variant="outline" class="gap-2">
        <FunnelIcon class="h-5 w-5" /> Filtros
      </BaseButton>
    </div>

    <!-- Table -->
    <div class="bg-surface rounded-3xl border border-border overflow-hidden shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-background/50 border-b border-border">
              <th class="px-6 py-4 text-xs font-black uppercase tracking-wider text-text-secondary">Factura #</th>
              <th class="px-6 py-4 text-xs font-black uppercase tracking-wider text-text-secondary">Fecha</th>
              <th class="px-6 py-4 text-xs font-black uppercase tracking-wider text-text-secondary">Cliente</th>
              <th class="px-6 py-4 text-xs font-black uppercase tracking-wider text-text-secondary">RUC / Cédula</th>
              <th class="px-6 py-4 text-xs font-black uppercase tracking-wider text-text-secondary text-right">Total</th>
              <th class="px-6 py-4 text-xs font-black uppercase tracking-wider text-text-secondary text-center">Estado</th>
              <th class="px-6 py-4 text-xs font-black uppercase tracking-wider text-text-secondary text-center">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border">
            <tr v-if="loading" v-for="i in 5" :key="i" class="animate-pulse">
              <td colspan="7" class="px-6 py-4"><div class="h-6 bg-background rounded w-full"></div></td>
            </tr>
            <tr v-else-if="invoices.length === 0">
              <td colspan="7" class="px-6 py-12 text-center text-text-secondary italic">No se encontraron registros de facturación.</td>
            </tr>
            <tr v-for="inv in invoices" :key="inv.id" class="hover:bg-background/40 transition-colors">
              <td class="px-6 py-4 font-bold text-primary">{{ inv.invoiceNumber || 'F-000' + inv.id }}</td>
              <td class="px-6 py-4 text-sm">{{ new Date(inv.createdAt).toLocaleDateString() }}</td>
              <td class="px-6 py-4">
                <div class="font-bold text-sm text-text-primary">{{ inv.customerName }}</div>
                <div class="text-xs text-text-secondary">{{ inv.email }}</div>
              </td>
              <td class="px-6 py-4 text-sm font-mono">{{ inv.taxId }}</td>
              <td class="px-6 py-4 text-right font-black text-text-primary">${{ inv.totalAmount.toFixed(2) }}</td>
              <td class="px-6 py-4 text-center">
                <span :class="getStatusClass(inv.status)" class="px-3 py-1 rounded-full text-[10px] font-black uppercase">
                  {{ inv.status || 'Emitida' }}
                </span>
              </td>
              <td class="px-6 py-4 text-center">
                <div class="flex justify-center gap-2">
                  <button @click="openDetail(inv)" class="p-2 hover:bg-primary/10 text-primary rounded-lg transition-all" title="Ver Detalle">
                    <EyeIcon class="h-5 w-5" />
                  </button>
                  <button @click="downloadPdf(inv)" class="p-2 hover:bg-green-50 text-green-600 rounded-lg transition-all" title="Descargar PDF">
                    <ArrowDownTrayIcon class="h-5 w-5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Detail Modal -->
    <div v-if="showDetail" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div class="bg-surface w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in">
        <div class="p-6 border-b border-border flex justify-between items-center bg-primary text-white">
          <h3 class="text-xl font-black uppercase tracking-tight">Detalle de Factura</h3>
          <button @click="showDetail = false" class="p-2 hover:bg-white/20 rounded-full">✕</button>
        </div>
        <div class="p-8 space-y-6">
          <div class="grid grid-cols-2 gap-8">
            <div class="space-y-1">
              <p class="text-[10px] font-black uppercase text-text-secondary">Emisor</p>
              <p class="font-bold text-text-primary">Sistema de Atracciones S.A.</p>
              <p class="text-xs text-text-secondary">Quito, Ecuador</p>
            </div>
            <div class="space-y-1 text-right">
              <p class="text-[10px] font-black uppercase text-text-secondary">Factura N°</p>
              <p class="text-xl font-black text-primary">{{ selectedInvoice.invoiceNumber || 'F-001' }}</p>
              <p class="text-xs text-text-secondary italic">Fecha: {{ new Date(selectedInvoice.createdAt).toLocaleString() }}</p>
            </div>
          </div>

          <div class="bg-background rounded-2xl p-4 border border-border">
            <p class="text-[10px] font-black uppercase text-text-secondary mb-2">Datos del Cliente</p>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-xs font-bold text-text-secondary">Nombre / Razón Social</p>
                <p class="text-sm font-black">{{ selectedInvoice.customerName }}</p>
              </div>
              <div>
                <p class="text-xs font-bold text-text-secondary">RUC / Cédula</p>
                <p class="text-sm font-black font-mono">{{ selectedInvoice.taxId }}</p>
              </div>
              <div>
                <p class="text-xs font-bold text-text-secondary">Email</p>
                <p class="text-sm font-medium">{{ selectedInvoice.email }}</p>
              </div>
              <div>
                <p class="text-xs font-bold text-text-secondary">Dirección</p>
                <p class="text-sm font-medium">{{ selectedInvoice.address || 'N/A' }}</p>
              </div>
            </div>
          </div>

          <div class="space-y-4">
            <p class="text-[10px] font-black uppercase text-text-secondary">Detalle de Productos</p>
            <div class="space-y-2">
              <div v-for="item in selectedInvoice.items" :key="item.id" class="flex justify-between items-center text-sm py-2 border-b border-border border-dashed">
                <div>
                  <span class="font-black mr-2">{{ item.quantity }}x</span>
                  <span class="text-text-primary font-medium">{{ item.description }}</span>
                </div>
                <span class="font-bold">${{ (item.unitPrice * item.quantity).toFixed(2) }}</span>
              </div>
            </div>
          </div>

          <div class="pt-4 flex flex-col items-end gap-1">
            <div class="flex justify-between w-48 text-sm">
              <span class="text-text-secondary">Subtotal</span>
              <span class="font-bold">${{ (selectedInvoice.totalAmount / 1.15).toFixed(2) }}</span>
            </div>
            <div class="flex justify-between w-48 text-sm">
              <span class="text-text-secondary">IVA (15%)</span>
              <span class="font-bold">${{ (selectedInvoice.totalAmount - (selectedInvoice.totalAmount / 1.15)).toFixed(2) }}</span>
            </div>
            <div class="flex justify-between w-48 text-xl border-t border-primary pt-2 mt-2">
              <span class="font-black text-primary">TOTAL</span>
              <span class="font-black text-primary">${{ selectedInvoice.totalAmount.toFixed(2) }}</span>
            </div>
          </div>
        </div>
        <div class="p-6 bg-background/50 flex justify-end gap-3">
          <BaseButton variant="outline" @click="showDetail = false">Cerrar</BaseButton>
          <BaseButton class="gap-2" @click="downloadPdf(selectedInvoice)">
            <ArrowDownTrayIcon class="h-5 w-5" /> Descargar PDF
          </BaseButton>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-in {
  animation: fadeIn 0.3s ease-out;
}
.zoom-in {
  animation: zoomIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes zoomIn {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
</style>
