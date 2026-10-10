import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
    ...(mode === 'https' ? [basicSsl()] : []),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'media/*'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2,png,webp,mp3}'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/media/'),
            handler: 'CacheFirst',
            options: { cacheName: 'maad-media', rangeRequests: true },
          },
        ],
      },
      manifest: {
        name: 'مَعاد',
        short_name: 'مَعاد',
        description: 'رجّع علاقاتك، وخلّها تكمل دورتها',
        lang: 'ar',
        dir: 'rtl',
        theme_color: '#0F1714',
        background_color: '#F6F2EA',
        display: 'standalone',
        icons: [{ src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
    }),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: { host: true },
  test: { include: ['src/**/*.test.ts'] },
}))
