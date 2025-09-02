import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Base path for GitHub Pages deployment: https://<user>.github.io/<repo>/
  // Adjust to repository name to ensure asset URLs resolve correctly on Pages
  base: '/gerador_sinal/',
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
