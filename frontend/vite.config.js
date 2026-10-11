import { defineConfig } from 'vite';

export default defineConfig({
  resolve: { preserveSymlinks: true },
  css: { postcss: { plugins: [] } },
  // Avoid recursive dependency call-argument tree-shaking in the bundled SDK.
  build: { rollupOptions: { treeshake: false } },
});
