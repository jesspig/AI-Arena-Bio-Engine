import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/glm-5.1/',
  server: {
    port: 5200,
    hmr: { host: 'localhost', port: 5200 },
  },
  build: {
    outDir: '../portal/public/glm-5.1',
    emptyOutDir: true,
  },
})
