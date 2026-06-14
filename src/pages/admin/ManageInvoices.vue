<script setup>
import { ref, onMounted } from 'vue'
import billingService from '@/services/billing'
import BaseButton from '@/components/common/BaseButton.vue'
import { 
  DocumentTextIcon, 
  MagnifyingGlassIcon, 
  EyeIcon, 
  ArrowDownTrayIcon,
  FunnelIcon,
  PrinterIcon
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
    Swal.fire('Error', 'No se pudo cargar el detalle de la factura', 'error')
  } finally {
    fetchingDetail.value = false
  }
}

const downloadPdf = async (invoice) => {
  if (!invoice) return
  Swal.fire({
    title: 'Descargando...',
    text: 'Preparando tu factura en PDF',
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading()
    }
  })
  try {
    await billingService.downloadPdfFile(invoice.id, invoice.invoiceNumber || 'factura')
    Swal.close()
  } catch (error) {
    console.error(error)
    Swal.fire('Error', 'No se pudo descargar la factura. Inténtalo de nuevo.', 'error')
  }
}

const printInvoice = () => {
  window.print()
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
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 print-hidden">
      <div>
        <h1 class="text-3xl font-black text-text-primary flex items-center gap-3">
          <DocumentTextIcon class="h-10 w-10 text-primary" /> Gestión de Facturas
        </h1>
        <p class="text-text-secondary mt-1">Monitorea y descarga los comprobantes de venta emitidos.</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-surface p-4 rounded-3xl border border-border flex flex-wrap gap-4 items-center print-hidden">
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
    <div class="bg-surface rounded-3xl border border-border overflow-hidden shadow-sm print-hidden">
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
              <td class="px-6 py-4 font-bold text-primary">{{ inv.invoiceNumber || inv.invoice_number || 'F-001' }}</td>
              <td class="px-6 py-4 text-sm">{{ new Date(inv.createdAt || inv.created_at).toLocaleDateString() }}</td>
              <td class="px-6 py-4">
                <div class="font-bold text-sm text-text-primary">{{ inv.customerName || inv.customer_name }}</div>
                <div class="text-xs text-text-secondary">{{ inv.email }}</div>
              </td>
              <td class="px-6 py-4 text-sm font-mono">{{ inv.taxId || inv.tax_id }}</td>
              <td class="px-6 py-4 text-right font-black text-text-primary">${{ (inv.total || inv.totalAmount || 0).toFixed(2) }}</td>
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
    <div v-if="showDetail" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print-overlay">
      <div class="bg-surface w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in flex flex-col max-h-[90vh] print-modal-content">
        <div class="p-6 border-b border-border flex justify-between items-center bg-primary text-white shrink-0 print-hidden">
          <h3 class="text-xl font-black uppercase tracking-tight">Detalle de Factura</h3>
          <button @click="showDetail = false" class="p-2 hover:bg-white/20 rounded-full transition-colors">✕</button>
        </div>
        
        <!-- Printable Invoice Container -->
        <div id="printable-invoice" class="p-8 space-y-6 overflow-y-auto flex-1">
          <!-- Header print-only logo & name -->
          <div class="hidden print-block border-b-2 border-primary pb-6 justify-between items-start mb-6">
            <div>
              <h1 class="text-2xl font-black text-primary">TerraQuest Experiences</h1>
              <p class="text-xs text-text-secondary">Quito, Ecuador</p>
            </div>
            <div class="text-right">
              <h2 class="text-xl font-bold uppercase tracking-wider text-text-primary">Factura Comercial</h2>
              <p class="text-sm font-black text-primary">{{ selectedInvoice.invoiceNumber || selectedInvoice.invoice_number }}</p>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-8 border-b border-border pb-6">
            <div class="space-y-1">
              <p class="text-[10px] font-black uppercase text-text-secondary">Emisor</p>
              <p class="font-bold text-text-primary">TerraQuest Experiences S.A.</p>
              <p class="text-xs text-text-secondary">Quito, Ecuador</p>
            </div>
            <div class="space-y-1 sm:text-right">
              <p class="text-[10px] font-black uppercase text-text-secondary">Factura N°</p>
              <p class="text-xl font-black text-primary">{{ selectedInvoice.invoiceNumber || selectedInvoice.invoice_number || 'F-001' }}</p>
              <p class="text-xs text-text-secondary italic">Fecha: {{ new Date(selectedInvoice.createdAt || selectedInvoice.created_at).toLocaleString() }}</p>
            </div>
          </div>

          <div class="bg-background rounded-2xl p-4 border border-border">
            <p class="text-[10px] font-black uppercase text-text-secondary mb-2">Datos del Cliente</p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p class="text-xs font-bold text-text-secondary">Nombre / Razón Social</p>
                <p class="text-sm font-black text-text-primary">{{ selectedInvoice.customerName || selectedInvoice.customer_name }}</p>
              </div>
              <div>
                <p class="text-xs font-bold text-text-secondary">RUC / Cédula</p>
                <p class="text-sm font-black font-mono text-text-primary">{{ selectedInvoice.taxId || selectedInvoice.tax_id }}</p>
              </div>
              <div>
                <p class="text-xs font-bold text-text-secondary">Email</p>
                <p class="text-sm font-medium text-text-primary">{{ selectedInvoice.email || 'N/A' }}</p>
              </div>
              <div>
                <p class="text-xs font-bold text-text-secondary">Dirección</p>
                <p class="text-sm font-medium text-text-primary">{{ selectedInvoice.address || 'N/A' }}</p>
              </div>
            </div>
          </div>

          <div class="space-y-4">
            <!-- Loading State -->
            <div v-if="fetchingDetail" class="flex flex-col items-center justify-center py-10 space-y-4 print-hidden">
              <div class="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
              <p class="text-xs font-bold text-text-secondary animate-pulse uppercase tracking-widest">Cargando detalles...</p>
            </div>

            <template v-else>
              <p class="text-[10px] font-black uppercase text-text-secondary">Detalle de Productos</p>
              <div class="space-y-2">
                <div v-for="item in (selectedInvoice.items || selectedInvoice.details || [])" :key="item.id" class="flex justify-between items-center text-sm py-2 border-b border-border border-dashed">
                  <div>
                    <span class="font-black mr-2 text-primary">{{ item.quantity }}x</span>
                    <span class="text-text-primary font-medium">{{ item.description }}</span>
                  </div>
                  <span class="font-bold text-text-primary">${{ ((item.unitPrice || item.unit_price || 0) * item.quantity).toFixed(2) }}</span>
                </div>
                <div v-if="!(selectedInvoice.items || selectedInvoice.details)?.length" class="text-center py-4 italic text-text-secondary text-xs">
                  Detalle no disponible (Solo visualización de reserva)
                </div>
              </div>
            </template>
          </div>

          <div class="pt-4 flex flex-col items-end gap-1">
            <div class="flex justify-between w-48 text-sm">
              <span class="text-text-secondary">Subtotal</span>
              <span class="font-bold text-text-primary">${{ (selectedInvoice.subtotal || (selectedInvoice.total / 1.15) || 0).toFixed(2) }}</span>
            </div>
            <div class="flex justify-between w-48 text-sm">
              <span class="text-text-secondary">IVA (15%)</span>
              <span class="font-bold text-text-primary">${{ (selectedInvoice.taxAmount || selectedInvoice.tax_amount || 0).toFixed(2) }}</span>
            </div>
            <div class="flex justify-between w-48 text-xl border-t border-primary pt-2 mt-2">
              <span class="font-black text-primary">TOTAL</span>
              <span class="font-black text-primary">${{ (selectedInvoice.total || selectedInvoice.totalAmount || 0).toFixed(2) }}</span>
            </div>
          </div>
        </div>
        
        <div class="p-6 bg-background/50 border-t border-border flex justify-end gap-3 print-hidden shrink-0">
          <BaseButton variant="outline" @click="showDetail = false">Cerrar</BaseButton>
          <button @click="printInvoice" class="px-6 py-3 bg-yellow-400 text-yellow-950 font-black rounded-2xl shadow-lg shadow-yellow-400/20 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2">
            <PrinterIcon class="h-5 w-5" /> Imprimir
          </button>
          <BaseButton class="gap-2" @click="downloadPdf(selectedInvoice)">
            <ArrowDownTrayIcon class="h-5 w-5" /> Descargar PDF
          </BaseButton>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
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

@media print {
  /* Ocultar el resto del sitio web */
  body * {
    visibility: hidden !important;
  }
  /* Ocultar overlays y bordes oscuros del modal en impresión */
  .print-overlay, .print-modal-content {
    background: transparent !important;
    box-shadow: none !important;
    position: static !important;
    display: block !important;
    max-height: none !important;
    overflow: visible !important;
  }
  /* Mostrar solo el contenedor imprimible de la factura */
  #printable-invoice, #printable-invoice * {
    visibility: visible !important;
  }
  #printable-invoice {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    margin: 0;
    padding: 0;
    background: white;
    color: black;
  }
  .print-hidden {
    display: none !important;
  }
  .print-block {
    display: flex !important;
  }
}
</style>
