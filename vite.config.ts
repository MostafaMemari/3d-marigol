import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Relative asset paths: the same dist/ works at a domain root
  // (Cloudflare Pages) and under a sub-path (GitHub Pages project sites).
  base: './',
  plugins: [react(), tailwindcss()],
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/three')) return 'three';
          if (id.includes('@react-three')) return 'fiber';
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) return 'react';
          return undefined;
        },
      },
    },
  },
  server: {
    headers: {
      'X-Robots-Tag': 'noindex, nofollow',
    },
  },
})
