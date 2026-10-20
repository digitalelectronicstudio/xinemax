import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    hmr: {
      host: 'localhost',
    },
    // allow all preview hosts (E2B proxy)
    // @ts-ignore
    allowedHosts: true,
    headers: {
      "X-Frame-Options": "ALLOWALL"
    }
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    // @ts-ignore
    allowedHosts: true,
  }
})
