require('dotenv').config();
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',

  fullyParallel: false,

  retries: 0,

  reporter: 'html',

  use: {
    baseURL: 'http://localhost:3000',
    browserName: 'chromium',
    headless: false,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry'
  },

  projects: [
    {
  name: 'chromium',
  use: {
    ...devices['Desktop Chrome'],
    channel: 'chrome',
    headless: false,

  launchOptions: {
    slowMo: 300
  }
  },
}
  ]
});