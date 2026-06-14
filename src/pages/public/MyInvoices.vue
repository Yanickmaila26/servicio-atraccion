<script setup>
import { ref, onMounted } from 'vue'
import billingService from '@/services/billing'
import { 
  DocumentTextIcon, 
  ArrowDownTrayIcon,
  EyeIcon,
  CalendarDaysIcon,
  PrinterIcon
} from '@heroicons/vue/24/outline'
import Swal from 'sweetalert2'

const invoices = ref([])
const loading = ref(true)
const selectedInvoice = ref(null)
const showDetail = ref(false)

const fetchMyInvoices = async () => {
  loading.value = true
  try {
    const data = await billingService.getMyInvoices()
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

onMounted(fetchMyInvoices)
</script>

<template>
  <div class="max-w-5xl mx-auto py-10 px-4 space-y-10">
    <!-- Hero Header -->
    <div class="text-center space-y-4 print-hidden">
      <div class="inline-flex p-4 rounded-3xl bg-primary/10 text-primary mb-2">
        <DocumentTextIcon class="h-12 w-12" />
      </div>
      <h1 class="text-4xl font-black text-text-primary tracking-tight">Mis Facturas</h1>
      <p class="text-text-secondary max-w-xl mx-auto">
        Aquí puedes consultar y descargar todos los comprobantes electrónicos de tus compras.
      </p>
    </div>

    <!-- Empty State -->
    <div v-if="!loading && invoices.length === 0" class="bg-surface rounded-3xl border-2 border-dashed border-border py-20 text-center space-y-6 print-hidden">
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
    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6 print-hidden">
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
            <button @click="openDetail(inv)" class="p-2 hover:bg-primary/10 text-primary rounded-xl transition-all" title="Ver Detalle">
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
    <div v-if="showDetail" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print-overlay">
      <div class="bg-surface w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in flex flex-col max-h-[90vh] print-modal-content">
        <!-- Printable Invoice Container -->
        <div id="printable-invoice" class="flex-1 overflow-y-auto p-8 space-y-6">
          
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

          <div class="flex justify-between items-center print-hidden">
            <h3 class="text-2xl font-black text-text-primary">Detalle de Factura</h3>
            <button @click="showDetail = false" class="text-text-secondary hover:text-primary p-2">✕</button>
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

          <!-- Datos del cliente -->
          <div class="bg-background rounded-2xl p-6 border border-border space-y-3">
            <p class="text-[10px] font-black uppercase text-text-secondary">Datos del Cliente</p>
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
                <div class="flex justify-between items-center text-sm py-2 border-b border-border border-dashed" v-for="item in (selectedInvoice.items || selectedInvoice.details || [])" :key="item.id">
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

        <div class="p-6 bg-background/50 border-t border-border flex flex-col sm:flex-row gap-3 print-hidden shrink-0">
          <button @click="showDetail = false" class="w-full sm:w-auto px-6 py-3 border border-border rounded-2xl text-sm font-bold text-text-secondary hover:bg-surface transition-all">
            Cerrar
          </button>
          <div class="flex-1 flex gap-3">
            <button @click="printInvoice" class="flex-1 py-3 bg-yellow-400 text-yellow-950 font-black rounded-2xl shadow-lg shadow-yellow-400/20 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2">
              <PrinterIcon class="h-5 w-5" /> Imprimir
            </button>
            <button @click="downloadPdf(selectedInvoice)" class="flex-1 py-3 bg-primary text-white font-black rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2">
              <ArrowDownTrayIcon class="h-5 w-5" /> Descargar PDF
            </button>
          </div>
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
