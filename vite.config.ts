import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
const APP_VERSION = `${Date.now()}`;

export default defineConfig(({ mode }) => ({
  define: {
    __APP_VERSION__: JSON.stringify(APP_VERSION),
  },
  server: {
    host: "::",
    port: 8080,
  },
  build: {
    // Don't ship source maps to production (exposes source, adds ~16 MB of output)
    sourcemap: false,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-supabase": ["@supabase/supabase-js"],
          "vendor-motion": ["framer-motion"],
          "vendor-charts": ["recharts"],
        },
      },
    },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
    {
      name: 'emit-version-json',
      apply: 'build' as const,
      generateBundle(this: { emitFile: (opts: { type: 'asset'; fileName: string; source: string }) => void }) {
        this.emitFile({
          type: 'asset',
          fileName: 'version.json',
          source: JSON.stringify({ version: APP_VERSION, builtAt: new Date().toISOString() }),
        });
      },
    } as never,
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
        orientation: 'any',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/lovable-uploads/0d3e4545-c80e-401b-82f1-3319db5155b4.png',
            sizes: '192x192 512x512 any',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024, // 8 MB limit
        // Precache only the app shell. Route chunks are cached on first use (see runtimeCaching below)
        // so first-time visitors don't download the staff/HR dashboards in the background.
        globPatterns: ['index.html', 'assets/index-*.{js,css}', 'assets/vendor-react-*.js', 'assets/vendor-supabase-*.js', 'fonts/*.woff2'],
        globIgnores: ['**/lovable-uploads/**'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/lovable-uploads/],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        runtimeCaching: [
          {
            // Content-hashed build output is immutable, so cache-first is safe
            urlPattern: ({ url }: { url: URL }) => url.pathname.startsWith('/assets/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'app-chunks',
              expiration: { maxEntries: 150, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /.*\.html$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'html-cache',
            }
          },
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
            handler: 'NetworkFirst',
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
    dedupe: ["react", "react-dom", "react/jsx-runtime"],
  },
}));
