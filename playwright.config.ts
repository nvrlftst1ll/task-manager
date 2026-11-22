import { defineConfig } from '@playwright/test';

// E2E-тесты Electron-приложения. Перед запуском нужна прод-сборка:
//   npm run test:e2e   (эквивалент: npm run build && npx playwright test)
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 90_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
});
