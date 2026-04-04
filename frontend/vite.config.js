import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  base: '/',
  server: {
    port: 5173,
    host: '0.0.0.0', // Ensure address binding for Windows networking
    strictPort: true,
    allowedHosts: ['.trycloudflare.com'],
    proxy: {
      '/predict_diabetes': 'http://127.0.0.1:5000',
      '/predict_heart': 'http://127.0.0.1:5000',
      '/predict_lung': 'http://127.0.0.1:5000',
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
