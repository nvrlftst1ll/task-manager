/**
 * ESLint-конфигурация проекта Task Manager.
 * Классическая (.eslintrc) схема на ESLint 8 + typescript-eslint + Prettier.
 */
module.exports = {
  root: true,
  env: { browser: true, es2022: true },
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'prettier', // отключает правила, конфликтующие с Prettier
  ],
  ignorePatterns: [
    'dist',
    'dist-electron',
    'release',
    'node_modules',
    'test-results',
    'playwright-report',
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
  },
  overrides: [
    {
      // Main-процесс, конфиги и интеграционные тесты живут в Node, а не в браузере
      files: [
        'electron/**/*.ts',
        'tests/integration/**/*.ts',
        'tests/e2e/**/*.ts',
        '*.config.ts',
      ],
      env: { node: true, browser: false },
    },
  ],
};
