import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  // logLevel: 'error',
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'), 
    },
  },
  base: '/',
  envDir: './',
  server: {
    host: '0.0.0.0',
    allowedHosts: true,
    port: 5173,
    watch: {
      usePolling: true,
      interval: 100,
    },
    proxy: {
      '/api': 'http://backend:8000'
    }
  },
});