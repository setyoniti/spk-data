import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Untuk development lengkap (frontend + API) jalankan: `vercel dev`
// Jika hanya `npm run dev`, request /api diteruskan ke vercel dev di port 3000.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:3000' },
  },
});
