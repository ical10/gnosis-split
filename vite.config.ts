import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: { enabled: true },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,svg,png}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.(?:png|jpg|jpeg|svg|gif)$/,
            handler: 'CacheFirst',
            options: { cacheName: 'images' }
          }
        ]
      },
      manifest: {
        name: 'Gnosis Split',
        short_name: 'GnoSplit',
        icons: [
          {
            src: '/gnosis-split-meta.jpg',
            sizes: 'any',
            type: 'image/jpeg'
          }
        ]
      }
    })
  ]
});
