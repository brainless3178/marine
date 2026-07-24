import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Separate admin panel into its own chunk (only loads on /admin)
          if (id.includes('/pages/admin/') || id.includes('/components/admin/')) {
            return 'admin'
          }
          // Vendor chunk for heavy libraries
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react-router')) {
            return 'vendor'
          }
          // Three.js scene (only loaded on /network)
          if (id.includes('node_modules/three/') || id.includes('node_modules/@react-three/')) {
            return 'three'
          }
        },
      },
    },
    chunkSizeWarningLimit: 400,
  },
})
