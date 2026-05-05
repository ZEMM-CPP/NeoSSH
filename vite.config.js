import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'node:path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // This is important for Electron integration
    strictPort: true,
  },
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    assetsDir: 'assets',
  },
});