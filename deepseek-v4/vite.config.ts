import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/deepseek-v4/',
  server: {
    port: 5300,
    hmr: { host: 'localhost', port: 5300 },
  },
  build: {
    outDir: '../portal/public/deepseek-v4',
    emptyOutDir: true,
  },
});
