import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { readFileSync } from 'fs'

// Ler versão do package.json
const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'))

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Base path configurado via VITE_BASE_PATH
  // - Para leads.internut.com.br: VITE_BASE_PATH=/
  // - Para dev.office.internut.com.br/leads/modern: VITE_BASE_PATH=/leads/modern/
  const base = process.env.VITE_BASE_PATH || '/'

  return {
    plugins: [
      react(),
      VitePWA({
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'sw.js',
        registerType: 'autoUpdate',
        devOptions: {
          enabled: true
        },
        manifest: {
          name: 'Leads Agent',
          short_name: 'Leads',
          description: 'Gestão de Leads Offline-First',
          theme_color: '#1976d2',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,wasm}'],
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024 // 5MB limit
        }
      })
    ],
    base: base,
    // Expor versão do package.json para o frontend
    define: {
      'import.meta.env.PACKAGE_VERSION': JSON.stringify(packageJson.version)
    },
    server: {
      host: '0.0.0.0', // Permite acesso de qualquer IP (incluindo 18.229.23.153)
      port: 5173,
      strictPort: true, // Forçar porta 5173
      hmr: {
        // Hot Module Replacement configurado para funcionar em ambiente remoto
        // Usar o IP público para HMR funcionar corretamente
        host: process.env.VITE_HMR_HOST || '18.229.23.153',
        port: 5173,
        protocol: 'ws',
        clientPort: 5173
      },
      watch: {
        // Melhorar performance do watch em arquivos grandes
        usePolling: false,
        interval: 100
      },
      cors: true, // Habilitar CORS para permitir acesso externo
      proxy: {
        '/api': {
          target: process.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, '/api')
        }
      }
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      // Q3.1 Performance: Otimizações de build
      sourcemap: false,
      minify: 'esbuild',
      target: 'es2020',
      // Dividir chunks para melhor caching
      chunkSizeWarningLimit: 500,
      rollupOptions: {
        output: {
          assetFileNames: 'assets/[name]-[hash][extname]',
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          // Code splitting: separar vendors grandes
          manualChunks: (id) => {
            // React e React-DOM em chunk separado (muda raramente)
            if (id.includes('node_modules/react') ||
              id.includes('node_modules/react-dom') ||
              id.includes('node_modules/scheduler')) {
              return 'react-vendor';
            }
            // MUI em chunk separado (grande, muda pouco)
            if (id.includes('@mui/material') ||
              id.includes('@mui/icons-material') ||
              id.includes('@emotion')) {
              return 'mui-vendor';
            }
            // Charts em chunk separado (grande, usado só em analytics)
            if (id.includes('recharts') ||
              id.includes('chart.js') ||
              id.includes('d3')) {
              return 'charts-vendor';
            }
            // Redux em chunk separado
            if (id.includes('redux') ||
              id.includes('@reduxjs')) {
              return 'redux-vendor';
            }
            // Outras libs de terceiros
            if (id.includes('node_modules')) {
              return 'vendor';
            }
          }
        }
      }
    }
  }
})

