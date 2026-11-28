const { defineConfig } = require('@playwright/test');
const { randomBytes } = require('node:crypto');
const path = require('node:path');

process.env.EBD_E2E_TOKEN ||= randomBytes(32).toString('hex');

module.exports = defineConfig({
  testDir: './e2e',
  workers: 1,
  use: { baseURL: 'http://127.0.0.1:5173', viewport: { width: 1440, height: 1100 }, trace: 'retain-on-failure' },
  webServer: [
    {
      command: 'node -e "require(\'node:fs\').writeFileSync(\'laravel/database/e2e.sqlite\', \'\')" && cd laravel && php artisan migrate --force && php artisan serve --host=127.0.0.1 --port=8000',
      url: 'http://127.0.0.1:8000/up',
      env: {
        ...process.env, APP_ENV: 'testing', APP_DEBUG: 'false', CACHE_STORE: 'file',
        DB_CONNECTION: 'sqlite', DB_DATABASE: path.resolve('laravel/database/e2e.sqlite'),
        LOCAL_API_TOKEN: process.env.EBD_E2E_TOKEN,
      },
      reuseExistingServer: false,
    },
    { command: 'npm run dev -- --port 5173 --strictPort', url: 'http://127.0.0.1:5173', reuseExistingServer: false },
  ],
});
