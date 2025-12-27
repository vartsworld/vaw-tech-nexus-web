import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['lovable-uploads/0d3e4545-c80e-401b-82f1-3319db5155b4.png'],
      manifest: {
        name: 'VAW Technologies',
        short_name: 'VAW Tech',
        description: 'Premium Tech Solutions - Website Development, AI, AR/VR & Digital Marketing',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/staff/login',
        icons: [
          {
            src: '/lovable-uploads/0d3e4545-c80e-401b-82f1-3319db5155b4.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/lovable-uploads/0d3e4545-c80e-401b-82f1-3319db5155b4.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/lovable-uploads/0d3e4545-c80e-401b-82f1-3319db5155b4.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB limit
        globPatterns: ['**/*.{js,css,html,ico,svg,woff2}'],
        globIgnores: ['**/lovable-uploads/**'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\/lovable-uploads\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
