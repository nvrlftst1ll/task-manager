# Testlog — журнал тестирования Task Manager

Все прогоны ниже выполнены реально в песочнице (Node 24, npm 11, Linux).
E2E-тесты Playwright требуют дисплей и Electron-бинарник — запускаются
локально по инструкции из readme (раздел «Тесты»).

Формат: Дата | Тип | Компонент | Вводные данные | Ожидание | Факт | Статус

| Дата | Тип | Компонент | Вводные данные | Ожидание | Факт | Статус |
|---|---|---|---|---|---|---|
| 2026-11-22 | Unit (раунд 1) | тест-раннер vitest | `npx vitest run tests/unit` | тесты выполняются | падение раннера: подхватился родительский postcss.config.mjs (Invalid PostCSS Plugin) | FAIL |
| 2026-11-22 | Unit (раунд 2) | тест-раннер vitest | фикс: `css.postcss.plugins: []` в vitest.config.ts | тесты выполняются | раннер работает | PASS |
| 2026-11-22 | Unit | `src/lib/validation.ts` — validateTaskForm, assertTaskInput, normalizeTags, toTaskInput | 25 параметризованных проверок: корректные входы, границы (ровно/больше 200 символов; 10/11 тегов), некорректные входы (null, число, массив, пустое название, неверные enum, сломанная дата, дубли тегов) | ошибки полей формируются, некорректный вход отклоняется с русским сообщением | 25/25 прошли | PASS |
| 2026-11-22 | Unit | `src/lib/filters.ts` — filterTasks, sortTasks, collectTags, hasActiveFilters | 23 проверки: поиск по названию/описанию/тегам без учёта регистра, фильтры статус/приоритет/тег/дата (сегодня/7 дней/просроченные, даты генерируются относительно «сейчас»), сортировка (nulls-last, tie-break по createdAt, без мутации) | фильтрация и сортировка соответствуют правилам | 23/23 прошли | PASS |
| 2026-11-22 | Unit | `src/lib/localStorageApi.ts` | 13 проверок: CRUD, частичный update, удаление отсутствующей, отклонение некорректных входов, persistence между «перезапусками», дефолты и валидация настроек, ensureSeed однократно (хранилище — Map-заглушка) | полный контракт TaskApi на фолбэке | 13/13 прошли | PASS |
| 2026-11-22 | Typecheck (раунд 1) | весь проект | `tsc -p tsconfig.json` + `tsc -p tsconfig.electron.json` | 0 ошибок | 8 ошибок: нет типов better-sqlite3 (4), CSS не экспортирован из @dnd-kit/core (1), в KeyboardCodes нет поля end (1), каскадные (2) | FAIL |
| 2026-11-22 | Typecheck (раунд 2) | весь проект | фикс: `@types/better-sqlite3`, импорт CSS из `@dnd-kit/utilities`, добавлен `end` в keyboardCodes | 0 ошибок | renderer: 0, electron: 0 | PASS |
| 2026-11-22 | Lint (раунд 1) | весь проект | `eslint . --ext .ts,.tsx --max-warnings 0` | 0 ошибок/предупреждений | ESLint ушёл в flat-режим из-за родительского конфига: Invalid option '--ext' | FAIL |
| 2026-11-22 | Lint (раунд 2) | весь проект | фикс: `cross-env ESLINT_USE_FLAT_CONFIG=false` в скрипте lint | 0 ошибок/предупреждений | exit 0 | PASS |
| 2026-11-22 | Integration (подготовка) | better-sqlite3 (нативный модуль) | `npm rebuild better-sqlite3` (prebuild под локальный Node) | модуль загружается под Node | смоук: `new Database(':memory:')`, CREATE/INSERT/SELECT — ок | PASS |
| 2026-11-22 | Integration (раунд 1) | `electron/ipc/repositories.ts` — TaskRepository, SettingsRepository | 13 проверок на in-memory SQLite: CRUD-цикл, JSON-теги, update отсутствующей, server-side валидация, findWithDeadlines, сортировка list, настройки write/read + валидация патчей | репозитории работают поверх реального SQLite | 12/13: ожидание дубликатов тегов не учло нормализацию в assertTaskInput (дубли убираются — это ожидаемое поведение) | FAIL (дефект теста, не кода) |
| 2026-11-22 | Integration (раунд 2) | `electron/ipc/repositories.ts` | фикс ожидания теста (теги дедуплицируются) | 13/13 | 13/13 прошли | PASS |
| 2026-11-22 | Build | renderer | `npx vite build` | прод-сборка без ошибок | 72 модуля; index 0.63 kB, css 16.25 kB, js 224.04 kB (gzip 72.89 kB) | PASS |
| 2026-11-22 | Build | main/preload | `npm run compile:electron` (esbuild) | бандлы CJS собраны | main.js 25.1 kB, preload.js 1.3 kB | PASS |
| 2026-11-22 | Manual (браузер) | renderer-приложение целиком | vite dev (браузерный режим, localStorage-фолбэк): онбординг → выбор темы → «Начать работу» → Ctrl+N → пустой сабмит → ошибка поля → заполнение (название + тег) → создание → Ctrl+F → поиск → клик по карточке → детали → смена статуса → Esc | каждый шаг отрабатывает, состояние переживает перезагрузку | всё подтверждено: ошибка валидации «Укажите название задачи», задача появилась в To Do, поиск оставил 2 карточки (совпадение в описании другой задачи — корректно), задача переехала в In Progress, данных в localStorage; ошибок консоли нет (agent-browser errors/console чисты) | PASS |
| 2026-11-22 | Manual (браузер) | user-flow.html (Часть 1) | десктоп 1920px и мобильный 390px | читаемая схема; на <900px — одна колонка | VLM-проверка скриншота: ромбы читабельны, стрелки и слияния корректны, наложений нет; mobile: grid = 1 колонка, ветви column. Замечание по подписям обратных петель — исправлено («возврат к форме: …») | PASS |
| 2026-11-22 | E2E | Playwright + Electron | `tests/e2e/app.spec.ts` | запуск приложения, онбординг, создание задачи, поиск | **не запускались в песочнице** (нет дисплея и Electron-бинарника); код готов к локальному запуску: `npm run test:e2e`; каналы сценариев дополнительно закрыты ручной браузерной проверкой renderer и integration-тестами SQL-слоя | LOCAL-ONLY |
| 2026-11-22 | CI-конфиг | `.github/workflows/build.yml` | расширение из одного job до пайплайна из 6 задач (quality → integration → build → e2e/xvfb → package-матрица → release), валидация синтаксиса | YAML синтаксически корректен, схема задач согласована со скриптами package.json | PyYAML safe_load: OK; скрипты из workflow существуют (`lint`, `typecheck`, `test`, `build`) | PASS |
| 2026-11-22 | CI-симуляция (раунд 1) | весь путь jobs quality + integration + build | `npm install --ignore-scripts` → `npm run typecheck` → `npm run lint` → `npm test` → `npm rebuild better-sqlite3` → `npx vitest run tests/integration` → `npm run build` | все шаги зелёные, как будет на CI | typecheck 0/0, ESLint 0, unit 61/61, integration 13/13; esbuild: main.js 25.2 kB + preload.js 1.3 kB; vite: 72 модуля, js 224.04 kB (gzip 72.89), css 16.25 kB | PASS |
| 2026-11-22 | CI-симуляция (раунд 2) | smoke нативного модуля | `node -e` с require('better-sqlite3') после `npm rebuild` | модуль загружается под текущий Node | `:memory:` + CREATE/INSERT/SELECT — ок | PASS |
| 2026-11-22 | E2E (CI-режим) | `tests/e2e/app.spec.ts` + `electron/main.ts` | запуск с `CI=true`: флаги `--no-sandbox --disable-gpu --disable-dev-shm-usage` + `app.disableHardwareAcceleration()` | headless-запуск Electron в xvfb становится возможным | спека собирается (typecheck/lint зелёные); фактический прогон выполнят jobs e2e/package на GitHub Actions — в песочнице нет дисплея и Electron-бинарника | CI-READY |
| 2026-11-22 | CI-диагностика | jobs package/release прогона `workflow_dispatch` | разбор скриншота пользователя (VLM): quality 24s, integration 17s, build 19s, e2e 33s — зелёные; package и release — серые (skipped) | объяснить «остановку на упаковке» | падения нет: ручной запуск с ветки main не проходит if-условие `startsWith(github.ref, 'refs/tags/v')` — упаковка по дизайну теговая. e2e в xvfb подтверждён зелёным на реальном CI | DIAGNOSED |
| 2026-11-22 | CI-конфиг (раунд 2) | `on.workflow_dispatch.inputs.package` + if job package + шаг libfuse2 | чекбокс «Собрать установщики» форсирует упаковку без тега; Linux-шаг ставит libfuse2/libfuse2t64 | YAML валиден, условие срабатывает на dispatch с чекбоксом и на тег, обычный push/PR — пропуск | PyYAML safe_load: OK; проверены условия package.if / release.if; jobs не пострадали | PASS |

## Итог

- Unit: 61/61 (3 файла).
- Integration: 13/13 (реальный SQLite, in-memory).
- Typecheck: 0 ошибок (renderer + electron).
- ESLint: 0 ошибок/предупреждений.
- Прод-сборка renderer и main-процесса: успешна.
- Ручная браузерная проверка UI: все шаги зелёные, консоль чистая.
- E2E Playwright: написаны, требуют локального запуска (см. readme).
- CI: полный путь quality → integration → build подтверждён локально;
  e2e (xvfb) и упаковка (матрица ОС) настроены на GitHub Actions
  (см. context.md, раздел CI/CD).
