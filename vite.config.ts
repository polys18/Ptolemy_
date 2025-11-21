import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/Ptolemy_/',   // 👈 important
})




// import { defineConfig } from 'vite';
// import react from '@vitejs/plugin-react';

// // https://vitejs.dev/config/
// export default defineConfig({
//   plugins: [react()],
//   base: '/Ptolemy_/', // Ensures assets are loaded correctly on GitHub Pages
//   build: {
//     outDir: 'dist',
//   },
// });