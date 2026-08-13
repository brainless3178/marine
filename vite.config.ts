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
        // NOTE: HTML is deliberately NOT precached. The old config precached
        // index.html and served it from the cache for every navigation
        // (navigateFallback). After a deploy that was a stale-shell trap: the
        // SW kept serving OLD index.html → OLD chunk hashes, while
        // skipWaiting + cleanupOutdatedCaches had already deleted the old
        // chunks — producing "Failed to fetch dynamically imported module"
        // white screens on refresh, worst on lazy routes (admin, network,
        // checkout). Only immutable, hashed assets belong in the precache.
        globPatterns: ['**/*.{js,css,png,avif,woff2,svg,ico,webmanifest}'],
        cleanupOutdatedCaches: true,
        // vite-plugin-pwa defaults navigateFallback to 'index.html' — that
        // regenerates the stale-shell NavigationRoute we just removed. Null it
        // out so navigations are handled ONLY by the NetworkFirst route below.
        navigateFallback: null,
        runtimeCaching: [
          {
            // Navigations hit the network first, so a refresh after any
            // deploy always gets the NEW index.html (with the new chunk
            // hashes). The last successfully-loaded page is cached as the
            // offline fallback (7 days / 32 entries).
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pages',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 32, maxAgeSeconds: 7 * 24 * 60 * 60 },
            },
          },
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
