import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { cloudflare } from '@cloudflare/vite-plugin'

export default defineConfig({
  plugins: [cloudflare(), react()],
  server: {
    port: 5173,
  },
  build: {
    outDir: 'dist',
  },
})
