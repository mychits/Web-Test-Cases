
const { test, expect } = require('@playwright/test');
const path = require('path');

test.use({
  storageState: path.resolve(__dirname, '../../auth-state.json')
});

test('Delete My Created Guarantors', async ({ page }) => {

  test.setTimeout(300000);

  const baseURL =
    'http://purple-development-mychits-admin.s3-website.eu-north-1.amazonaws.com/';

  const guarantors = [
    'Testraju V',
    'Testrajesh V',
    'Testvasundara A N'
  ];

  // STEP 1: Open Guarantor page
  await page.goto(baseURL, {
    waitUntil: 'domcontentloaded',
    timeout: 45000
  });

  await page.waitForTimeout(2000);

  await page.goto(`${baseURL}legals-menu/guarantor`, {
    waitUntil: 'domcontentloaded',
    timeout: 45000
  });

  await page.waitForTimeout(3000);

  console.log('Guarantor page opened successfully');

  // STEP 2: Check login session
  const loginVisible = await page.getByText('Admin Login', {
    exact: true
  }).isVisible().catch(() => false);

  if (loginVisible) {
    throw new Error(
      'Login session expired. Run LoginAutomation.spec.js first.'
    );
  }

  // STEP 3: Delete each guarantor
  for (const guarantorName of guarantors) {

    console.log(`Starting deletion: ${guarantorName}`);

    // Find the exact guarantor row
    const row = page.locator('table tbody tr').filter({
      hasText: guarantorName
    });

    await expect(row).toHaveCount(1, {
      timeout: 15000
    });

    await expect(row).toBeVisible();

    console.log(`Guarantor found: ${guarantorName}`);

    // Find the last action cell
    const actionCell = row.locator('td').last();

    // Click the three-dot action menu
    await actionCell.locator('svg').last().click();

    await page.waitForTimeout(1000);

    console.log('Three-dot action menu opened');

    // STEP 4: Click Delete from the menu
    const deleteMenu = page.locator(
      '.ant-dropdown:visible, .ant-dropdown-menu:visible, [role="menu"]:visible'
    );

    await expect(deleteMenu.last()).toBeVisible({
      timeout: 10000
    });

    await deleteMenu.last().getByText('Delete', {
      exact: true
    }).click();

    await page.waitForTimeout(1000);

    console.log('Delete option selected');

    // STEP 5: Enter guarantor name in confirmation
    const confirmation = page.locator(
      '.ant-modal:visible, [role="dialog"]:visible'
    ).last();

    await expect(confirmation).toBeVisible({
      timeout: 10000
    });

    const confirmationInput = confirmation.locator('input').last();

    await expect(confirmationInput).toBeVisible();

    await confirmationInput.fill(guarantorName);

    console.log(`Confirmation name entered: ${guarantorName}`);

    await page.waitForTimeout(1000);

    // STEP 6: Confirm deletion
    await confirmation.getByRole('button', {
      name: 'Delete',
      exact: true
    }).last().click();

    console.log(`Confirming deletion: ${guarantorName}`);

    // STEP 7: Verify deletion
    await expect(row).toHaveCount(0, {
      timeout: 20000
    });

    console.log(`Successfully deleted: ${guarantorName}`);

    await page.waitForTimeout(2000);
  }

  console.log('All three guarantors deleted successfully');

  await page.waitForTimeout(3000);

});
