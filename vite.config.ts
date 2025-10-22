import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    host: true,
    open: false,
    strictPort: false,
    cors: true
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
