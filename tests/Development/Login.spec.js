import { test, expect } from '@playwright/test';

test('MyChits login automation in Chromium', async ({ page }) => {
    // Step 1: Open the local website
    await page.goto('http://localhost:5174/');

    await page.waitForLoadState('domcontentloaded');

    // Step 2: Display the page title
    console.log('Page title:', await page.title());

    // Step 3: Inspect the page so we can identify the login fields
    console.log('Page URL:', page.url());

    // Step 4: Take a screenshot of the login page
    await page.screenshot({
        path: 'mychits-login-page.png',
        fullPage: true
    });

    // Step 5: Print visible text to help identify the correct selectors
    console.log((await page.locator('body').innerText()).slice(0, 3000));

    // Keep Chromium open briefly for inspection
    await page.waitForTimeout(5000);
});