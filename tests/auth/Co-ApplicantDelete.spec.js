
const { test, expect } = require('@playwright/test');
const path = require('path');

test.use({
  storageState: path.resolve(__dirname, '../../auth-state.json')
});

test('Delete My Created Co-Applicants', async ({ page }) => {

  test.setTimeout(300000);

  const baseURL =
    'http://purple-development-mychits-admin.s3-website.eu-north-1.amazonaws.com/';

  const customerNames = [
    'Testyogananda P',
    'Testmanju V',
    'Testrajesh V',
    'Testvasundara A N',
    'Testgopinathe Rao',
    'Testbalaji Prasad'
  ];

  // Open website using saved login session
  await page.goto(baseURL);
  await page.waitForTimeout(3000);

  // Open Co-Applicant page
  await page.goto(baseURL + 'legals-menu/co-applicant');
  await page.waitForTimeout(5000);

  // Check login session
  if (await page.getByText('Admin Login', { exact: true }).isVisible().catch(() => false)) {
    throw new Error('Login session expired. Please run LoginAutomation.spec.js first.');
  }

  // Wait for Co-Applicant table
  await expect(page.locator('table tbody tr').first()).toBeVisible({
    timeout: 30000
  });

  await page.waitForTimeout(3000);

  for (const customerName of customerNames) {

    console.log(`Searching Customer: ${customerName}`);

    // Find matching Co-Applicant rows
    const rows = page.locator('table tbody tr').filter({
      hasText: customerName
    });

    const rowCount = await rows.count();

    if (rowCount === 0) {
      console.log(`Customer not found: ${customerName}`);
      await page.waitForTimeout(2000);
      continue;
    }

    // Delete only one matching record
    const row = rows.first();

    console.log(`Found ${rowCount} matching record(s).`);

    // Click three-dot action menu
    const actionCell = row.locator('td').last();

    await actionCell.locator('svg').last().click();

    await page.waitForTimeout(1500);

    // Click Delete
    const menu = page.locator(
      '.ant-dropdown:visible, .ant-dropdown-menu:visible, [role="menu"]:visible'
    );

    await menu.getByText('Delete', { exact: true }).click();

    await page.waitForTimeout(1500);

    // Confirmation modal
    const modal = page.locator(
      '.ant-modal:visible, [role="dialog"]:visible'
    ).last();

    await expect(modal).toBeVisible();

    // Enter exact Customer Name
    const confirmationInput = modal.locator('input').last();

    await confirmationInput.fill(customerName);

    await page.waitForTimeout(1500);

    // Confirm deletion
    await modal.getByRole('button', { name: /^Delete$/i }).click();

    console.log(`Delete confirmed for: ${customerName}`);

    // Wait for page/table refresh
    await page.waitForTimeout(4000);

    // Verify one record was deleted
    await expect(rows).toHaveCount(rowCount - 1, {
      timeout: 30000
    });

    console.log(`Successfully deleted: ${customerName}`);

    // Allow page to settle before next customer
    await page.waitForTimeout(3000);
  }

  console.log('All Co-Applicant deletion operations completed.');

});
