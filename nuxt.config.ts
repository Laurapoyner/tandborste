import { fileURLToPath } from 'node:url'

export default defineNuxtConfig({
  ssr: false,
  compatibilityDate: '2026-09-29',
  devtools: { enabled: true },

  alias: {
    // MongoDB's Zstandard compression package is a native Node addon.
    // Tandtid does not use zstd compression, so on Cloudflare Workers
    // we resolve the optional package to a small non-native stub.
    '@mongodb-js/zstd': fileURLToPath(
      new URL('./server/stubs/mongodb-zstd.ts', import.meta.url)
    )
  },

  css: ['~/assets/css/main.css'],
  modules: ['@vite-pwa/nuxt'],

  app: {
    head: {
      title: 'Tandtid',
      meta: [
        { name: 'theme-color', content: '#ffd966' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
        { name: 'apple-mobile-web-app-title', content: 'Tandtid' },
        { name: 'mobile-web-app-capable', content: 'yes' }
      ],
      link: [
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'icon', type: 'image/png', sizes: '192x192', href: '/icon-192.png' },
        { rel: 'icon', type: 'image/png', sizes: '512x512', href: '/icon-512.png' }
      ]
    }
  },

  runtimeConfig: {
    mongodbUri: '',
    mongodbDbName: 'tandtid',
    parentPin: '',
    public: { appName: 'Tandtid' }
  },

  pwa: {
    registerType: 'autoUpdate',
    strategies: 'generateSW',
    includeAssets: ['apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'],
    manifest: {
      id: '/',
      name: 'Tandtid',
      short_name: 'Tandtid',
      description: 'Børnevenlig tandbørstningsapp med timer, tandguide, belønninger og forældreoverblik',
      lang: 'da',
      start_url: '/',
      scope: '/',
      theme_color: '#ffd966',
      background_color: '#fff9ef',
      display: 'standalone',
      orientation: 'portrait-primary',
      categories: ['lifestyle', 'kids'],
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
      ]
    },
    workbox: {
      cleanupOutdatedCaches: true,
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      runtimeCaching: [
        {
          urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
          handler: 'NetworkOnly',
          method: 'GET'
        }
      ]
    },
    devOptions: { enabled: false }
  },

  typescript: { strict: true }
})
