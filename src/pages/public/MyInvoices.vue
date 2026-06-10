<script setup>
import { ref, onMounted } from 'vue'
import billingService from '@/services/billing'
import { 
  DocumentTextIcon, 
  ArrowDownTrayIcon,
  EyeIcon,
  CalendarDaysIcon
} from '@heroicons/vue/24/outline'

const invoices = ref([])
const loading = ref(true)
const selectedInvoice = ref(null)
const showDetail = ref(false)

const fetchMyInvoices = async () => {
  loading.value = true
  try {
    const data = await billingService.getMyInvoices()
    // Si viene de user/history es PagedResult (data.items), si no es un array directo
    invoices.value = data?.items ? data.items : (Array.isArray(data) ? data : [])
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const fetchingDetail = ref(false)
const openDetail = async (invoice) => {
  fetchingDetail.value = true
  selectedInvoice.value = invoice
  showDetail.value = true
  try {
    const fullInvoice = await billingService.getById(invoice.id)
    selectedInvoice.value = fullInvoice
  } catch (error) {
    console.error("Error al obtener detalle de factura:", error)
  } finally {
    fetchingDetail.value = false
  }
}

const downloadPdf = (invoice) => {
  if (!invoice) return
  const url = billingService.getDownloadUrl(invoice.id)
  window.open(url, '_blank')
}

onMounted(fetchMyInvoices)
</script>

<template>
  <div class="max-w-5xl mx-auto py-10 px-4 space-y-10">
    <!-- Hero Header -->
    <div class="text-center space-y-4">
      <div class="inline-flex p-4 rounded-3xl bg-primary/10 text-primary mb-2">
        <DocumentTextIcon class="h-12 w-12" />
      </div>
      <h1 class="text-4xl font-black text-text-primary tracking-tight">Mis Facturas</h1>
      <p class="text-text-secondary max-w-xl mx-auto">
        Aquí puedes consultar y descargar todos los comprobantes electrónicos de tus compras.
      </p>
    </div>

    <!-- Empty State -->
    <div v-if="!loading && invoices.length === 0" class="bg-surface rounded-3xl border-2 border-dashed border-border py-20 text-center space-y-6">
      <div class="flex justify-center">
        <DocumentTextIcon class="h-20 w-20 text-border" />
      </div>
      <div class="space-y-2">
        <h3 class="text-xl font-bold text-text-primary">No tienes facturas emitidas</h3>
        <p class="text-text-secondary">Tus comprobantes aparecerán aquí una vez que realices una reserva.</p>
      </div>
      <router-link to="/attractions" class="inline-flex items-center px-6 py-3 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
        Explorar Atracciones
      </router-link>
    </div>

    <!-- Invoices List -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div v-if="loading" v-for="i in 4" :key="i" class="h-48 bg-surface rounded-3xl animate-pulse"></div>
      
      <div v-for="inv in invoices" :key="inv.id" 
        class="bg-surface rounded-3xl border border-border p-6 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
        <div class="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
          <DocumentTextIcon class="h-24 w-24 text-primary" />
        </div>

        <div class="flex justify-between items-start mb-6">
          <div class="space-y-1">
            <span class="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded">Factura</span>
            <h4 class="text-xl font-black text-text-primary">{{ inv.invoiceNumber || inv.invoice_number || 'F-001' }}</h4>
          </div>
          <div class="text-right">
            <p class="text-2xl font-black text-primary">${{ (inv.total || inv.totalAmount || 0).toFixed(2) }}</p>
            <p class="text-[10px] font-bold text-text-secondary uppercase">Total Pagado</p>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border pt-4 mt-4">
          <div class="flex items-center gap-2">
            <CalendarDaysIcon class="h-4 w-4 text-text-secondary" />
            <span class="text-sm font-medium text-text-secondary">{{ inv.createdAt || inv.created_at ? new Date(inv.createdAt || inv.created_at).toLocaleDateString() : 'N/A' }}</span>
          </div>
          <div class="flex justify-end gap-2">
            <button @click="openDetail(inv)" class="p-2 hover:bg-primary/10 text-primary rounded-xl transition-all">
              <EyeIcon class="h-5 w-5" />
            </button>
            <button @click="downloadPdf(inv)" class="flex items-center gap-2 px-4 py-2 bg-background border border-border rounded-xl text-xs font-bold text-text-primary hover:bg-surface transition-all">
              <ArrowDownTrayIcon class="h-4 w-4" /> PDF
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Detail Modal -->
    <div v-if="showDetail" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div class="bg-surface w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in">
        <div class="p-8 space-y-6">
          <div class="flex justify-between items-center">
            <h3 class="text-2xl font-black text-text-primary">Detalle de Cobro</h3>
            <button @click="showDetail = false" class="text-text-secondary hover:text-primary">✕</button>
          </div>

          <div class="space-y-4">
            <!-- Loading State -->
            <div v-if="fetchingDetail" class="flex flex-col items-center justify-center py-10 space-y-4">
              <div class="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
              <p class="text-xs font-bold text-text-secondary animate-pulse uppercase tracking-widest">Cargando detalles...</p>
            </div>

            <template v-else>
              <div class="flex justify-between text-sm py-3 border-b border-border border-dashed" v-for="item in (selectedInvoice.items || selectedInvoice.details || [])" :key="item.id">
                <span class="text-text-secondary">{{ item.quantity }}x {{ item.description }}</span>
                <span class="font-bold text-text-primary">${{ ( (item.unitPrice || item.unit_price || 0) * item.quantity).toFixed(2) }}</span>
              </div>
              <div v-if="!(selectedInvoice.items || selectedInvoice.details)?.length" class="text-center py-4 italic text-text-secondary text-xs">
                Detalle no disponible (Solo visualización de reserva)
              </div>
            </template>
          </div>

          <div class="bg-background rounded-2xl p-6 space-y-3">
            <div class="flex justify-between text-sm">
              <span class="text-text-secondary">Subtotal</span>
              <span class="font-medium text-text-primary">${{ (selectedInvoice.subtotal || (selectedInvoice.total / 1.15) || 0).toFixed(2) }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-text-secondary">IVA (15%)</span>
              <span class="font-medium text-text-primary">${{ (selectedInvoice.taxAmount || selectedInvoice.tax_amount || 0).toFixed(2) }}</span>
            </div>
            <div class="flex justify-between text-2xl font-black pt-3 border-t border-border">
              <span class="text-text-primary">Total</span>
              <span class="text-primary">${{ (selectedInvoice.total || selectedInvoice.totalAmount || 0).toFixed(2) }}</span>
            </div>
          </div>

          <div class="flex flex-col gap-3 pt-4">
            <button @click="downloadPdf(selectedInvoice)" class="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform flex items-center justify-center gap-3">
              <ArrowDownTrayIcon class="h-6 w-6" /> Descargar Factura PDF
            </button>
            <p class="text-[10px] text-center text-text-secondary px-6">
              Este comprobante tiene validez legal y ha sido emitido de acuerdo a las regulaciones del SRI.
            </p>
          </div>
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
