
const { test, expect } = require('@playwright/test');
const path = require('path');

test.use({
  storageState: path.resolve(__dirname, '../../auth-state.json')
});

test('Delete Five Sub Admins - MyChits', async ({ page }) => {
  test.setTimeout(240000);

  const baseURL =
    'http://purple-development-mychits-admin.s3-website.eu-north-1.amazonaws.com';

  const subAdmins = [
    'Jack Rahul',
    'Jack Kiran',
    'Jack Arjun',
    'Jack Vikram',
    'Jack Sanjay'
  ];

  console.log('Opening Administrative Privileges page...');

  await page.goto(`${baseURL}/administrative-privileges`, {
    waitUntil: 'domcontentloaded'
  });

  await page.waitForTimeout(3000);

  await expect(page).not.toHaveURL(/login/i);

  for (const adminName of subAdmins) {
    console.log(`\nSearching for Sub Admin: ${adminName}`);

    // Search for the Sub Admin
    const searchInput = page.getByPlaceholder(/search/i).last();

    await expect(searchInput).toBeVisible();
    await searchInput.fill(adminName);
    await page.waitForTimeout(2000);

    // Find the matching row
    const adminRow = page.getByRole('row').filter({
      hasText: new RegExp(
        adminName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        'i'
      )
    });

    await expect(
      adminRow.first(),
      `${adminName} should appear in search results`
    ).toBeVisible({ timeout: 15000 });

    console.log(`${adminName} found in search results.`);

    // Locate the ACTION column
    const actionCell = adminRow.first().locator('td').last();

    await expect(actionCell).toBeVisible();

    console.log('Opening ACTION menu...');

    // Click the three-dot icon in the ACTION column
    await actionCell.locator('svg').last().click();

    await page.waitForTimeout(1000);

    console.log('Three-dot menu opened.');

    // Click Delete in the action menu
    await page.getByText('Delete', { exact: true }).last().click();

    await page.waitForTimeout(1000);

    console.log('Delete confirmation opened.');

    // Enter the exact Sub Admin name
    const confirmationInput = page.locator('input:visible').last();

    await expect(confirmationInput).toBeVisible();
    await confirmationInput.fill(adminName);

    await page.waitForTimeout(1000);

    console.log(`Entered confirmation name: ${adminName}`);

    // Click the final Delete button
    await page.getByRole('button', { name: /^Delete$/i }).last().click();

    console.log(`Confirming deletion of ${adminName}...`);

    await page.waitForTimeout(3000);

    // Search again to verify that the Sub Admin was deleted
    await searchInput.fill('');
    await page.waitForTimeout(1000);

    await searchInput.fill(adminName);
    await page.waitForTimeout(2000);

    await expect(
      adminRow,
      `${adminName} should no longer appear after deletion`
    ).toHaveCount(0, { timeout: 15000 });

    console.log(`${adminName} deleted and verified successfully.`);

    await searchInput.fill('');
    await page.waitForTimeout(1000);
  }

  console.log('\nAll five Sub Admins deleted successfully.');

  // Logout
  console.log('Logging out from MyChits...');

  await page.evaluate(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('admin');
    localStorage.removeItem('branch');
  });

  await page.goto(baseURL, {
    waitUntil: 'domcontentloaded'
  });

  await page.waitForTimeout(2000);

  await expect(page.getByText(/Admin Login/i).first()).toBeVisible();

  console.log('Logout successful.');
  console.log('Admin Login page displayed successfully.');
  console.log('Sub Admin Delete test completed successfully.');
});
