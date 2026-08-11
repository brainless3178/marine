import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'images/*.png', 'images/*.avif'],
      manifest: {
        name: 'Alka Traders — Marine Equipment Supplier',
        short_name: 'Alka Traders',
        description: 'Global marine and industrial equipment supplier',
        theme_color: '#111827',
        background_color: '#f8f9fb',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          { src: '/images/alka-traders-logo-400.png', sizes: '400x400', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,avif,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cloudinary-images',
              expiration: { maxEntries: 50, maxAgeSeconds: 30 * 24 * 60 * 60 },
            },
          },
          {
            urlPattern: /^https?:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts' },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@shared': path.resolve(__dirname, 'shared'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'frontend/dist',
    emptyOutDir: true,
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
    chunkSizeWarningLimit: 1000,
  },
})
