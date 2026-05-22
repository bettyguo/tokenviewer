import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// Relative base so the static build works on a GitHub Pages project site
// (https://user.github.io/<repo>/) without hard-coding the repo name.
export default defineConfig({
  base: './',
  plugins: [svelte()],
  worker: {
    format: 'es',
  },
  build: {
    target: 'es2022',
    sourcemap: false,
    chunkSizeWarningLimit: 1024,
  },
});
