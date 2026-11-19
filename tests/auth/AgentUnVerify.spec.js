
const { test, expect } = require('@playwright/test');
const path = require('path');
require('dotenv').config();

test.use({
  storageState: path.resolve(__dirname, '../../auth-state.json')
});

test('Un-Verify Agent - Test rakesh', async ({ page }) => {

  test.setTimeout(120000);

  const baseURL = process.env.BASE_URL.replace(/\/+$/, '');
  const agentName = 'Test rakesh';

  // Open Agent page
  await page.goto(
    `${baseURL}/staff-menu/agent-menu/agent`,
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

  console.log('Agent page opened successfully.');

  // Find agent row
  const agentRow = page.locator('tr').filter({
    has: page.getByText(agentName, { exact: true })
  }).first();

  await expect(agentRow).toBeVisible({
    timeout: 15000
  });

  console.log(`Agent found: ${agentName}`);

  // Click three-dot menu in ACTION column
  const actionCell = agentRow.locator('td').last();
  const actionIcon = actionCell.locator('svg').last();

  await actionIcon.click({ timeout: 15000 });

  await page.waitForTimeout(1000);

  console.log('Action menu opened.');

  // Find Un-Verify option with flexible spelling
  const unVerifyOption = page.getByText(
    /un[\s-]?verify/i
  ).last();

  await expect(unVerifyOption).toBeVisible({
    timeout: 10000
  });

  console.log('Un-Verify option found.');

  // Click Un-Verify
  await unVerifyOption.click();

  await page.waitForTimeout(1000);

  console.log('Un-Verify option clicked.');

  // Find Yes-Verify confirmation button
  const confirmButton = page.getByRole('button', {
    name: /Yes\s*[-,]?\s*Verify/i
  }).last();

  await expect(confirmButton).toBeVisible({
    timeout: 10000
  });

  console.log('Confirmation button found: Yes-Verify');

  // Click Yes-Verify
  await confirmButton.click();

  console.log('Yes-Verify clicked.');

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
  console.log('AGENT UN-VERIFY COMPLETED');
  console.log(`Agent: ${agentName}`);
  console.log('Action: Un-Verify');
  console.log('Confirmation: Yes-Verify clicked');
  console.log('====================================');

  // No logout.
  // Playwright closes the browser automatically.

});
