require('dotenv').config();

const { test, expect } = require('@playwright/test');
const path = require('path');

test.use({
  storageState: path.resolve(__dirname, '../../auth-state.json')
});

test('Add Loan Penalty', async ({ page }) => {

  test.setTimeout(300000);

  const baseURL = process.env.BASE_URL.replace(/\/+$/, '');

  const customerName = 'Testvinod 5l-a4';
  const customerPhone = '1234567894';
  const penaltyAmount = '1000';
  const reason = 'Late loan payment penalty';

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

  // Step 4: Click Add Penalty
  const addPenaltyButton = page.getByRole('button', {
    name: /Add Penalty/i
  }).first();

  await expect(addPenaltyButton).toBeVisible();
  await addPenaltyButton.click();

  await page.waitForTimeout(2000);

  console.log('Add Manual Penalty panel opened');

  // Step 5: Locate drawer
  const drawer = page.locator('.ant-drawer-content:visible').last();

  await expect(drawer).toBeVisible();

  // Step 6: Select Loan Penalty
  const loanPenaltyOption = drawer.getByText('Loan Penalty', {
    exact: true
  });

  await expect(loanPenaltyOption).toBeVisible();
  await loanPenaltyOption.click();

  await page.waitForTimeout(1500);

  console.log('Loan Penalty selected successfully');

  // Step 7: Locate Customer dropdown
  const dropdowns = drawer.locator('.ant-select');

  const customerDropdown = dropdowns.nth(0);

  await customerDropdown.locator('.ant-select-selector').click();

  await page.waitForTimeout(1000);

  console.log('Customer dropdown opened');

  // Step 8: Search complete customer name
  const customerSearchInput = customerDropdown.locator(
    'input.ant-select-selection-search-input'
  );

  await expect(customerSearchInput).toBeVisible({
    timeout: 10000
  });

  await customerSearchInput.fill(customerName);

  await page.waitForTimeout(2000);

  console.log(`Searching complete customer name: ${customerName}`);

  // Step 9: Select customer using both name and phone number
  const customerOption = page
    .locator('.ant-select-dropdown:visible')
    .last()
    .locator('.ant-select-item-option')
    .filter({ hasText: customerName })
    .filter({ hasText: customerPhone })
    .last();

  await expect(customerOption).toBeVisible({
    timeout: 15000
  });

  await customerOption.click();

  await page.waitForTimeout(1500);

  console.log(
    `Customer selected successfully: ${customerName} - ${customerPhone}`
  );

  // Step 10: Open Select Loan dropdown
  const loanDropdown = dropdowns.nth(1);

  await loanDropdown.locator('.ant-select-selector').click();

  await page.waitForTimeout(1500);

  console.log('Select Loan dropdown opened');

  // Step 11: Select any available loan
  const loanDropdownOptions = page
    .locator('.ant-select-dropdown:visible')
    .last();

  const loanOptions = loanDropdownOptions.locator(
    '.ant-select-item-option'
  );

  await expect(loanOptions.first()).toBeVisible({
    timeout: 15000
  });

  const availableLoanCount = await loanOptions.count();

  console.log(`Available loans found: ${availableLoanCount}`);

  const selectedLoanText = await loanOptions.first().innerText();

  await loanOptions.first().click();

  await page.waitForTimeout(1500);

  console.log(`Loan selected successfully: ${selectedLoanText}`);

  // Step 12: Enter Penalty Charges
  const amountInput = drawer.locator(
    'input[placeholder*="Amount"]'
  ).last();

  await expect(amountInput).toBeVisible();

  await amountInput.fill(penaltyAmount);

  console.log(`Penalty charges entered: ${penaltyAmount}`);

  // Step 13: Enter Reason
  const reasonInput = drawer.locator(
    'input[placeholder*="Reason"]'
  ).last();

  await expect(reasonInput).toBeVisible();

  await reasonInput.fill(reason);

  console.log(`Reason entered: ${reason}`);

  await page.waitForTimeout(1000);

  // Step 14: Save Penalty Charges
  const saveButton = drawer.getByRole('button', {
    name: /Save Penalty Charges/i
  });

  await expect(saveButton).toBeVisible();
  await expect(saveButton).toBeEnabled();

  await saveButton.click();

  console.log('Save Penalty Charges clicked');

  // Step 15: Verify drawer closes after saving
  await expect(drawer).toBeHidden({
    timeout: 20000
  });

  console.log('====================================');
  console.log('LOAN PENALTY ADDED SUCCESSFULLY');
  console.log(`Customer: ${customerName}`);
  console.log(`Phone: ${customerPhone}`);
  console.log(`Selected Loan: ${selectedLoanText}`);
  console.log(`Penalty Amount: ${penaltyAmount}`);
  console.log(`Reason: ${reason}`);
  console.log('====================================');

  // No logout.
  // Playwright automatically closes the browser after the test.

});