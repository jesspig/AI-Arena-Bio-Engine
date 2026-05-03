import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/mimo-v2.5-pro/',
  build: {
    outDir: '../portal/public/mimo-v2.5-pro',
    emptyOutDir: true,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/p5')) {
            return 'p5';
          }
        },
      },
    },
  },
  server: {
    port: 5400,
  },
})
