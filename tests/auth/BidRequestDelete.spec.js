
const { test, expect } = require('@playwright/test');
const path = require('path');

test.use({
  storageState: path.resolve(__dirname, '../../auth-state.json')
});

test('Delete Bid Request', async ({ page }) => {

  test.setTimeout(300000);

  const baseURL =
    'http://purple-development-mychits-admin.s3-website.eu-north-1.amazonaws.com';

  const customerName = 'Blr-kholi';

  // Step 1: Open Dashboard
  await page.goto(`${baseURL}/dashboard`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(3000);

  console.log('Dashboard opened successfully');

  // Step 2: Verify login session
  if (await page.getByText('Admin Login').isVisible().catch(() => false)) {
    throw new Error('Login session expired. Please update auth-state.json');
  }

  // Step 3: Open Bid Request Report
  await page.goto(`${baseURL}/reports/bid-request-report`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(5000);

  console.log('Bid Request Report page opened successfully');

  // Step 4: Find the required customer row
  const customerRow = page
    .getByRole('row')
    .filter({ hasText: customerName })
    .first();

  await expect(customerRow).toBeVisible({
    timeout: 15000
  });

  console.log(`Customer row located: ${customerName}`);

  // Step 5: Click three-dot Action menu
  const actionButton = customerRow
    .locator('td')
    .last()
    .locator('button, [role="button"]')
    .last();

  await expect(actionButton).toBeVisible();
  await actionButton.click();

  await page.waitForTimeout(1000);

  console.log('Action menu opened');

  // Step 6: Click Delete
  const deleteButton = page.getByText('Delete', {
    exact: true
  }).last();

  await expect(deleteButton).toBeVisible();
  await deleteButton.click();

  await page.waitForTimeout(1500);

  console.log('Delete option clicked');

  // Step 7: Confirm Delete
  const yesButton = page.getByRole('button', {
    name: 'Yes',
    exact: true
  }).last();

  await expect(yesButton).toBeVisible({
    timeout: 10000
  });

  await yesButton.click();

  console.log('Delete confirmed by clicking Yes');

  // Step 8: Wait for deletion to complete
  await page.waitForTimeout(5000);

  // Step 9: Refresh Bid Request Report
  await page.reload();
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(5000);

  console.log('Bid Request Report page refreshed');

  // Step 10: Verify customer request is deleted
  const deletedCustomerRow = page
    .getByRole('row')
    .filter({ hasText: customerName });

  await expect(deletedCustomerRow).toHaveCount(0, {
    timeout: 15000
  });

  console.log('================================');
  console.log('BID REQUEST DELETED SUCCESSFULLY');
  console.log(`Customer: ${customerName}`);
  console.log('================================');

  // Step 11: Keep browser open
  await page.pause();

});
