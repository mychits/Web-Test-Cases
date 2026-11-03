const { test, expect } = require('@playwright/test');

test('User should be able to login', async ({ page }) => {

  await page.goto('/login');

  await page.getByLabel('Email').fill('test@example.com');

  await page.getByLabel('Password').fill('TestPassword123');

  await page.getByRole('button', {
    name: 'Login'
  }).click();

  await expect(page).toHaveURL(/dashboard/);

});