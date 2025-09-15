// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,
    port: 5173,
    open: false,
    // If you prefer a dev proxy instead of VITE_API_URL, uncomment:
    // proxy: {
    //   '/api': {
    //     target: 'http://localhost:5001',
    //     changeOrigin: true,
    //   },
    // },
  },
});