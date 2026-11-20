
const { test, expect } = require('@playwright/test');
const path = require('path');
require('dotenv').config();

test.use({
  storageState: path.resolve(__dirname, '../../auth-state.json')
});

test('Edit My Created Co-Applicant', async ({ page }) => {
  test.setTimeout(300000);

  const baseURL = process.env.BASE_URL.replace(/\/+$/, '');
  const customerName = 'Testvenkatesh K S';

  // Open website
  await page.goto(baseURL);
  await page.waitForTimeout(3000);

  // Open Co-Applicant page
  await page.goto(`${baseURL}/legals-menu/co-applicant`);
  await page.waitForTimeout(5000);

  // Check login session
  if (
    await page.getByText('Admin Login', { exact: true })
      .isVisible()
      .catch(() => false)
  ) {
    throw new Error(
      'Login session expired. Please run LoginAutomation.spec.js first.'
    );
  }

  await expect(page.locator('table tbody tr').first()).toBeVisible({
    timeout: 30000
  });

  await page.waitForTimeout(3000);

  // Find Co-Applicant row
  const rows = page.locator('table tbody tr').filter({
    hasText: customerName
  });

  if (await rows.count() === 0) {
    throw new Error(`Co-Applicant not found: ${customerName}`);
  }

  const row = rows.first();

  console.log(`Co-Applicant found: ${customerName}`);

  // Click three-dot menu
  const actionCell = row.locator('td').last();

  await actionCell.locator('svg').last().click();
  await page.waitForTimeout(1500);

  // Click Edit
  const menu = page.locator(
    '.ant-dropdown:visible, .ant-dropdown-menu:visible, [role="menu"]:visible'
  );

  await menu.getByText('Edit', { exact: true }).click();
  await page.waitForTimeout(4000);

  console.log('Edit Co-Applicant page opened');

  // Locate the current Customer Name displayed in the first field
  const currentCustomer = page.getByText(customerName, {
    exact: true
  }).last();

  await expect(currentCustomer).toBeVisible({
    timeout: 15000
  });

  // Open Customer Name dropdown
  await currentCustomer.click();

  await page.waitForTimeout(1500);

  // Find available dropdown options
  const options = page.locator(
    '[role="option"]:visible, .ant-select-item-option:visible'
  );

  await expect(options.first()).toBeVisible({
    timeout: 15000
  });

  // Select a different customer
  const optionCount = await options.count();
  let selectedCustomer = '';

  for (let i = 0; i < optionCount; i++) {
    const option = options.nth(i);
    const optionText = (await option.innerText()).trim();

    if (
      optionText &&
      optionText !== customerName &&
      await option.isVisible()
    ) {
      selectedCustomer = optionText;
      await option.click();
      break;
    }
  }

  if (!selectedCustomer) {
    throw new Error(
      'No different customer found in the Customer Name dropdown.'
    );
  }

  await page.waitForTimeout(2000);

  console.log(`Selected Customer Name: ${selectedCustomer}`);

  // Click Update
  await page.getByRole('button', {
    name: 'Update',
    exact: true
  }).click();

  await page.waitForTimeout(4000);

  console.log('Co-Applicant updated successfully');
});
