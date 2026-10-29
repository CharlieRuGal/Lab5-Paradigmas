var { defineConfig, devices } = require('@playwright/test');
var support = require('./test/support');

var PORT = 4173;

module.exports = defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  timeout: 30000,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'evidencias-laboratorio5/reporte-playwright' }]
  ],
  use: {
    baseURL: 'http://127.0.0.1:' + PORT,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // El instalador de Chromium de Playwright no descargo el binario. Se usa el Chrome instalado.
        channel: 'chrome',
        headless: true
      }
    }
  ],
  webServer: {
    command: 'node server.js',
    url: 'http://127.0.0.1:' + PORT,
    timeout: 20000,
    reuseExistingServer: false,
    env: Object.assign({}, process.env, support.testEnv(PORT))
  }
});
