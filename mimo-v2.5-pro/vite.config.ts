import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/mimo-v2.5-pro/',
  build: {
    outDir: '../portal/public/mimo-v2.5-pro',
    emptyOutDir: true,
  },
  server: {
    port: 5400,
  },
})
