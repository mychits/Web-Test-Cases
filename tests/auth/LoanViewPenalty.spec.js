require('dotenv').config();

const { test, expect } = require('@playwright/test');
const path = require('path');

test.use({
  storageState: path.resolve(__dirname, '../../auth-state.json')
});

test('View Loan Penalty', async ({ page }) => {

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

  // Step 8: Click View Penalty
  const viewPenaltyOption = page.getByText('View Penalty', {
    exact: true
  }).last();

  await expect(viewPenaltyOption).toBeVisible({
    timeout: 10000
  });

  await viewPenaltyOption.click();

  await page.waitForTimeout(1500);

  console.log('View Penalty opened successfully');

  // Step 9: Locate penalty details panel
  const detailsPanel = page.locator(
    '.ant-drawer-content:visible, .ant-modal-content:visible'
  ).last();

  await expect(detailsPanel).toBeVisible({
    timeout: 10000
  });

  console.log('Loan penalty details displayed');

  // Step 10: View details for 3 seconds
  await page.waitForTimeout(3000);

  console.log('Viewed loan penalty details for 3 seconds');

  // Step 11: Close details and return to table
  const closeButton = detailsPanel.locator(
    '.ant-drawer-close, .ant-modal-close'
  );

  if (await closeButton.isVisible().catch(() => false)) {
    await closeButton.click();
  } else {
    await page.keyboard.press('Escape');
  }

  await page.waitForTimeout(1500);

  console.log('Returned to Loan Penalties table');

  // Step 12: Verify test completion
  console.log('====================================');
  console.log('LOAN PENALTY VIEWED SUCCESSFULLY');
  console.log(`Customer: ${customerName}`);
  console.log('====================================');

  // No logout.
  // Playwright automatically closes the browser after the test.

});