import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      // En desarrollo, redirige las llamadas al gateway en la nube evitando CORS y bloqueos de red
      '/api/v1/yanick-maila': {
        target: 'https://gateway-api.graysky-7ca4a726.southcentralus.azurecontainerapps.io',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
