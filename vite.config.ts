import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

// ============================================================
// [START: Конфигурация Vite для renderer-процесса]
// base: './' критичен для Electron: в проде index.html
// загружается по file:// и абсолютные пути ("/assets/...") не работают.
// ============================================================
export default defineConfig({
  plugins: [react()],
  base: './',
  // Приложение использует чистый CSS без плагинов; явная установка
  // postcss отключает поиск конфига вверх по дереву каталогов
  // (иначе подхватывается postcss.config соседних проектов)
  css: {
    postcss: {
      plugins: [],
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
// [END: Конфигурация Vite для renderer-процесса]
