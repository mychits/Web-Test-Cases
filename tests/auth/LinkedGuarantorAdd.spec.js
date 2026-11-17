
const { test, expect } = require('@playwright/test');
const path = require('path');

test.use({
  storageState: path.resolve(__dirname, '../../auth-state.json')
});

test('Add Linked Guarantor', async ({ page }) => {

  test.setTimeout(300000);

  const baseURL =
    'http://purple-development-mychits-admin.s3-website.eu-north-1.amazonaws.com/';

  await page.goto(baseURL);
  await page.waitForTimeout(3000);

  await page.goto(baseURL + 'legals-menu/linked-guarantor');
  await page.waitForTimeout(7000);

  if (await page.getByText('Admin Login', { exact: true }).isVisible().catch(() => false)) {
    throw new Error('Login session expired. Please run LoginAutomation.spec.js first.');
  }

  console.log('Current URL:', page.url());

  // Click +Link Guarantor
  const linkButton = page.getByRole('button', {
    name: /link guarantor/i
  });

  await expect(linkButton).toBeVisible({ timeout: 30000 });
  await linkButton.click();

  console.log('Clicked +Link Guarantor');
  await page.waitForTimeout(2000);

  const modal = page.locator('.ant-modal:visible, [role="dialog"]:visible').last();

  await expect(modal).toBeVisible({ timeout: 15000 });

  const dropdowns = modal.locator('.ant-select-selector');

  // Select Customer
  await dropdowns.nth(0).click();
  await page.waitForTimeout(1000);

  let options = page.locator(
    '.ant-select-dropdown:visible .ant-select-item-option:not(.ant-select-item-option-disabled)'
  );

  await expect(options.first()).toBeVisible({ timeout: 15000 });
  await options.first().click();

  console.log('Selected Customer');
  await page.waitForTimeout(2000);

  // Select Customer to Link
  await dropdowns.nth(1).click();
  await page.waitForTimeout(1000);

  options = page.locator(
    '.ant-select-dropdown:visible .ant-select-item-option:not(.ant-select-item-option-disabled)'
  );

  await expect(options.first()).toBeVisible({ timeout: 15000 });
  await options.first().click();

  console.log('Selected Customer to Link');

  // Close the dropdown and wait 2 seconds
  await page.keyboard.press('Escape');
  await page.waitForTimeout(2000);

  // Click Link Guarantor
  await modal.getByRole('button', {
    name: /link guarantor/i
  }).click();

  console.log('Clicked Link Guarantor');

  await page.waitForTimeout(5000);

  console.log('Linked Guarantor operation completed');

});
