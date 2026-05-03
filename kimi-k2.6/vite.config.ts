import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/kimi-k2.6/',
  server: {
    port: 5100,
    host: true,
    hmr: { host: 'localhost', port: 5100 },
  },
  build: {
    outDir: '../portal/public/kimi-k2.6',
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
});
