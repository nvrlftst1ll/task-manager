// ============================================================
// [START: E2E-тесты (Playwright + Electron)]
// Запускаются ЛОКАЛЬНО (нужен дисплей и собранное приложение):
//   npm run test:e2e   (= npm run build && npx playwright test)
// и НА CI (GitHub Actions, job e2e): приложение стартует в
// виртуальном дисплее xvfb, при этом CI=true добавляет флаги
// --no-sandbox / --disable-gpu (без них headless-запуск падает).
// Покрытие: запуск, онбординг, создание задачи, поиск.
// Drag & drop проверяется вручную (см. readme, раздел «Тесты»).
// ============================================================
import { test, expect } from '@playwright/test';
import { _electron as electron } from 'playwright';
import type { ElectronApplication } from 'playwright';

// На CI Electron работает в xvfb: сандбокс и GPU недоступны
const CI_ARGS = process.env.CI
  ? ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
  : [];

/** Единая точка запуска приложения для всех тестов. */
async function launchApp(): Promise<ElectronApplication> {
  return electron.launch({ args: ['.', ...CI_ARGS] });
}

test('приложение запускается и показывает кастомный title bar', async () => {
  const app = await launchApp();
  const window = await app.firstWindow();
  await window.waitForLoadState('domcontentloaded');

  await expect(window.locator('.titlebar__title')).toHaveText('Task Manager');

  await app.close();
});

test('онбординг (первый запуск) → создание задачи → карточка в To Do', async () => {
  const app = await launchApp();
  const window = await app.firstWindow();
  await window.waitForLoadState('domcontentloaded');

  // Онбординг показывается только при первом запуске (чистый userData)
  const startButton = window.getByRole('button', { name: 'Начать работу' });
  if (await startButton.isVisible({ timeout: 3000 }).catch(() => false)) {
    await startButton.click();
  }

  // Пустое состояние → кнопка создания
  const newTaskButton = window.getByRole('button', { name: 'Новая задача', exact: true });
  if (await newTaskButton.isVisible({ timeout: 3000 }).catch(() => false)) {
    await newTaskButton.click();
  } else {
    // задачи уже есть (повторный прогон) — открываем форму хоткеем
    await window.keyboard.press('Control+n');
  }

  const uniqueTitle = `E2E-задача-${Date.now()}`;
  await window.getByPlaceholder('Что нужно сделать?').fill(uniqueTitle);
  await window.getByRole('button', { name: 'Создать задачу' }).click();

  // Карточка появилась в колонке To Do
  const todoColumn = window.locator('.board-col--todo');
  await expect(todoColumn.getByText(uniqueTitle)).toBeVisible({ timeout: 5000 });

  await app.close();
});

test('поиск фильтрует доску', async () => {
  const app = await launchApp();
  const window = await app.firstWindow();
  await window.waitForLoadState('domcontentloaded');

  const uniqueTitle = `E2E-поиск-${Date.now()}`;
  await window.keyboard.press('Control+n');
  await window.getByPlaceholder('Что нужно сделать?').fill(uniqueTitle);
  await window.getByRole('button', { name: 'Создать задачу' }).click();
  await expect(window.getByText(uniqueTitle).first()).toBeVisible({ timeout: 5000 });

  // Ctrl+F → поиск: находим свою задачу
  await window.keyboard.press('Control+f');
  await window.getByPlaceholder(/Поиск по названию/).fill(uniqueTitle);
  await expect(window.locator('.task-card')).toHaveCount(1, { timeout: 5000 });

  await app.close();
});
// ============================================================
// [END: E2E-тесты]
// ============================================================
