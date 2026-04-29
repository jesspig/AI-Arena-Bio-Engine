import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/kimi-k2.6/',
  server: {
    port: 5100,
    host: true,
    hmr: { host: 'localhost', port: 5100 },
  },
  build: {
    outDir: '../portal/public/kimi-k2.6',
    emptyOutDir: true,
  },
});
