import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests',

    use: {
        trace: 'on',
        headless: false
    },

    projects: [
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
                browserName: 'chromium'
            }
        }
    ]
});

