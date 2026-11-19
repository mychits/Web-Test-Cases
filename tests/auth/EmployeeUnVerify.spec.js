
const { test, expect } = require('@playwright/test');
const path = require('path');
require('dotenv').config();

test.use({
  storageState: path.resolve(__dirname, '../../auth-state.json')
});

test('Un-Verify Employee - Madhan', async ({ page }) => {

  test.setTimeout(120000);

  const baseURL = process.env.BASE_URL.replace(/\/+$/, '');
  const employeeName = 'Madhan';

  // Open Employee page
  await page.goto(
    `${baseURL}/staff-menu/employee-menu/employee`,
    {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    }
  );

  await page.waitForTimeout(2000);

  // Check login session
  if (
    await page.getByText('Admin Login', { exact: true })
      .isVisible()
      .catch(() => false)
  ) {
    throw new Error('Login session expired. Generate a fresh auth-state.json.');
  }

  console.log('Employee page opened successfully.');

  // Find employee row
  const employeeRow = page.locator('tr').filter({
    has: page.getByText(employeeName, { exact: true })
  }).first();

  await expect(employeeRow).toBeVisible({
    timeout: 15000
  });

  console.log(`Employee found: ${employeeName}`);

  // Click three-dot menu in ACTION column
  const actionCell = employeeRow.locator('td').last();
  const actionIcon = actionCell.locator('svg').last();

  await actionIcon.click({ timeout: 15000 });

  await page.waitForTimeout(1000);

  console.log('Action menu opened.');

  // Click Un-Verify
  const unVerifyOption = page.getByText('Un-Verify', {
    exact: true
  }).last();

  await expect(unVerifyOption).toBeVisible({
    timeout: 10000
  });

  await unVerifyOption.click();

  await page.waitForTimeout(1000);

  console.log('Un-Verify option clicked.');

  // Find Yes, Verify confirmation button
  const confirmButton = page.getByRole('button', {
    name: /Yes\s*,?\s*Verify/i
  }).last();

  await expect(confirmButton).toBeVisible({
    timeout: 10000
  });

  console.log('Confirmation button found: Yes, Verify');

  // Click Yes, Verify
  await confirmButton.click();

  console.log('Yes, Verify clicked.');

  // Wait for confirmation popup to close
  const confirmationDialog = page.locator(
    '.ant-modal:visible, [role="dialog"]:visible'
  ).last();

  await confirmationDialog.waitFor({
    state: 'hidden',
    timeout: 15000
  }).catch(() => {});

  await page.waitForTimeout(2000);

  console.log('====================================');
  console.log('EMPLOYEE UN-VERIFY COMPLETED');
  console.log(`Employee: ${employeeName}`);
  console.log('Action: Un-Verify');
  console.log('Confirmation: Yes, Verify clicked');
  console.log('====================================');

  // No logout required.
  // Playwright automatically closes the browser after the test.

});
