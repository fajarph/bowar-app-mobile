import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'robots.txt'],
      manifest: {
        name: 'Booking Warnet',
        short_name: 'Bowar',
        description: 'Aplikasi Booking Warnet - RPL',
        theme_color: '#0d6efd',
        background_color: '#020618',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '200x200',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '520x520',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  server: {
    host: '0.0.0.0',
    allowedHosts: true, // ✅ FIX
    fs: {
      strict: false,
    },
  },
  preview: {
    allowedHosts: true
  },
  build: {
    chunkSizeWarningLimit: 1000, // kB
  }
})
