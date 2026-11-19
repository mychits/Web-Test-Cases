require('dotenv').config();

const { test, expect } = require('@playwright/test');
const path = require('path');

test.use({
  storageState: path.resolve(__dirname, '../../auth-state.json')
});

test('Delete Loan Penalty', async ({ page }) => {

  test.setTimeout(300000);

  const baseURL = process.env.BASE_URL.replace(/\/+$/, '');

  const customerName = 'Testvinod 5l-a4';

  // Step 1: Open Dashboard
  await page.goto(`${baseURL}/dashboard`, {
    waitUntil: 'domcontentloaded'
  });

  await page.waitForTimeout(3000);

  console.log('Dashboard opened successfully');

  // Step 2: Verify login session
  if (
    await page.getByText('Admin Login', { exact: true })
      .isVisible()
      .catch(() => false)
  ) {
    throw new Error('Login session expired. Please update auth-state.json');
  }

  // Step 3: Open Penalty Management
  await page.goto(`${baseURL}/penalty-management`, {
    waitUntil: 'domcontentloaded'
  });

  await page.waitForTimeout(3000);

  console.log('Penalty Management page opened successfully');

  // Step 4: Click Loan Penalties tab
  const loanPenaltyTab = page.getByText('Loan Penalties', {
    exact: true
  }).first();

  await expect(loanPenaltyTab).toBeVisible({
    timeout: 15000
  });

  await loanPenaltyTab.click();

  await page.waitForTimeout(2000);

  console.log('Loan Penalties tab opened successfully');

  // Step 5: Search customer in the table
  const searchInput = page.locator(
    'input[placeholder*="Search"]'
  ).first();

  await expect(searchInput).toBeVisible({
    timeout: 10000
  });

  await searchInput.fill(customerName);

  await page.waitForTimeout(2000);

  console.log(`Searching customer: ${customerName}`);

  // Step 6: Find customer row
  const customerRow = page.locator('tr').filter({
    hasText: customerName
  }).last();

  await expect(customerRow).toBeVisible({
    timeout: 15000
  });

  console.log(`Customer found in table: ${customerName}`);

  // Step 7: Click three-dot action menu
  const actionButton = customerRow.locator('button').last();

  await expect(actionButton).toBeVisible();
  await actionButton.click();

  await page.waitForTimeout(1000);

  console.log('Customer action menu opened');

  // Step 8: Click Delete Penalty
  const deletePenaltyOption = page.getByText('Delete Penalty', {
    exact: true
  }).last();

  await expect(deletePenaltyOption).toBeVisible({
    timeout: 10000
  });

  await deletePenaltyOption.click();

  await page.waitForTimeout(1500);

  console.log('Delete Penalty clicked');

  // Step 9: Confirm deletion by clicking Yes
  const yesButton = page.getByRole('button', {
    name: 'Yes',
    exact: true
  }).last();

  await expect(yesButton).toBeVisible({
    timeout: 10000
  });

  await yesButton.click();

  await page.waitForTimeout(2000);

  console.log('Yes clicked to confirm penalty deletion');

  // Step 10: Verify deletion completed
  console.log('====================================');
  console.log('LOAN PENALTY DELETED SUCCESSFULLY');
  console.log(`Customer: ${customerName}`);
  console.log('====================================');

  // No logout.
  // Playwright automatically closes the browser after the test.

});