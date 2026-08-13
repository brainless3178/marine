import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Guarantee VITE_DEFAULT_THEME always resolves for the index.html
  // %VITE_DEFAULT_THEME% replacement (and import.meta.env). .env files are
  // gitignored, so production builds have no env file — without this seed,
  // Vite leaves the literal %VAR% token in the shipped HTML and warns.
  // A real env var (Hostinger dashboard) or local .env still takes priority.
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  process.env.VITE_DEFAULT_THEME ??= env.VITE_DEFAULT_THEME || 'light'

  return {
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
        // Serve the cached app shell for SPA navigations. Once the service
        // worker controls the page, deep-link refreshes (e.g. /en/shop while
        // the Hostinger Node process is cold-starting) resolve from the
        // precached shell instead of waiting on the network. First-time
        // visitors without the SW are covered by the prerendered static
        // locale pages (frontend/dist/en/...), which are separate files.
        navigateFallback: 'index.html',
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
          // Animation library — big, and shared by many pages; own chunk = one
          // long-lived cached file instead of re-fetching per page bundle.
          if (id.includes('node_modules/framer-motion')) {
            return 'anim'
          }
          // Icon library — huge source, tree-shaken at build; isolated so its
          // cache never invalidates other app code.
          if (id.includes('node_modules/lucide-react')) {
            return 'icons'
          }
          // NOTE: i18next stays in the entry chunk on purpose — main.tsx
          // initializes it synchronously at boot, so it's on the critical path.

          // Three.js scene (only loaded on /network)
          if (id.includes('node_modules/three/') || id.includes('node_modules/@react-three/')) {
            return 'three'
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  }
})
