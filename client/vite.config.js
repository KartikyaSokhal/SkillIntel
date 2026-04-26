import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        // Use IPv4 loopback to avoid occasional localhost/IPv6 (::1) ECONNREFUSED
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
    },
  },
})
