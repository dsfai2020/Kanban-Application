import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    host: '0.0.0.0',
    open: false,
    strictPort: false,
    cors: true,
    hmr: {
      overlay: false,
    }
  },
  build: {
    target: 'es2020',
    modulePreload: {
      polyfill: true
    }
  },
  define: {
    global: 'globalThis'
  }
})
