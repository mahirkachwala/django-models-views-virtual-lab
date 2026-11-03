import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
import { defineConfig } from 'vite';

export default defineConfig({
  root: fileURLToPath(new URL('./deploy', import.meta.url)),
  publicDir: fileURLToPath(new URL('./public', import.meta.url)),
  resolve: {
    alias: { '@': fileURLToPath(new URL('.', import.meta.url)) },
  },
  plugins: [react()],
  css: { postcss: { plugins: [tailwindcss()] } },
  build: {
    outDir: fileURLToPath(new URL('./dist-vercel', import.meta.url)),
    emptyOutDir: true,
  },
});
