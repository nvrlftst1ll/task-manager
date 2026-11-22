import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

// Unit- и integration-тесты выполняются в Node-окружении.
// E2E-тесты (tests/e2e) запускаются отдельно через Playwright.
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  css: {
    postcss: {
      plugins: [],
    },
  },
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.spec.ts', 'tests/integration/**/*.spec.ts'],
  },
});
