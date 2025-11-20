import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Ensures assets are loaded correctly on GitHub Pages
  build: {
    outDir: 'dist',
  },
  define: {
    // Prevent "process is not defined" error in browser for code using process.env.API_KEY
    'process.env': {} 
  }
});