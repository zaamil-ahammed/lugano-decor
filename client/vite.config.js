import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In development the site runs on :5173 and forwards /api and /uploads to the server on :5000.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:5000',
      '/uploads': 'http://localhost:5000',
    },
  },
});
