import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    globals: true,
  },
  server: {
    port: 5173,
    proxy: {
      '/api/v1/workflow': { target: 'http://localhost:8881', changeOrigin: true },
      '/api/v1/read': { target: 'http://localhost:8882', changeOrigin: true },
      '/api': { target: 'http://localhost:8880', changeOrigin: true },
      '/oauth2': { target: 'http://localhost:8880', changeOrigin: true },
      '/ws': { target: 'http://localhost:8881', ws: true, changeOrigin: true },
    },
  },
})
