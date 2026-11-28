import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    proxy: {
      '/archive-api': { target: 'http://127.0.0.1:8000', rewrite: path => path.replace(/^\/archive-api/, '/api') },
    },
  },
});
