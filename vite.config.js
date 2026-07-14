import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig(() => ({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Portal Animes',
        short_name: 'PortalAnimes',
        description: 'O seu portal definitivo de animes! Organizador, lista de favoritos, lançamentos e estatísticas.',
        theme_color: '#7c3aed',
        background_color: '#0a0a0f',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        categories: ['entertainment', 'lifestyle'],
        icons: [
          {
            src: '/pwa-192x192.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: '/pwa-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          },
          {
            src: '/pwa-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        cleanupOutdatedCaches: true,
        navigateFallbackDenylist: [/^\/api\//],
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        runtimeCaching: [
          {
            // Cache the same-origin Vercel proxy used in production.
            urlPattern: ({ url }) => url.pathname.startsWith('/api/jikan/'),
            handler: 'NetworkFirst',
            options: {
              networkTimeoutSeconds: 3,
              cacheName: 'jikan-api-cache-v2',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 // 1 hora
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Cache de imagens do MAL CDN (CacheFirst - imagens mudam raramente)
            urlPattern: /^https:\/\/cdn\.myanimelist\.net\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'mal-images-cache',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 dias
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Google Fonts
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 ano
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  base: "/",
  server: {
    proxy: {
      '/api/jikan': {
        target: 'https://api.jikan.moe',
        changeOrigin: true,
        rewrite: (requestPath) => requestPath.replace(/^\/api\/jikan/, '/v4'),
      },
    },
  },
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.{js,jsx}'],
    setupFiles: ['./tests/setup.js'],
    clearMocks: true,
    css: true,
  },
  build: {    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          'ui': ['lucide-react', 'clsx', 'tailwind-merge']
        }
      }
    }
  }
}))
