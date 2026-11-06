const { test, expect } = require('@playwright/test');
const path = require('path');

test.use({
  storageState: path.resolve(__dirname, '../../auth-state.json')
});

test('Add Loan for Blr-gayle', async ({ page }) => {
  test.setTimeout(120000);

  const baseURL =
    'http://purple-development-mychits-admin.s3-website.eu-north-1.amazonaws.com';

  // Open dashboard using saved login session
  await page.goto(`${baseURL}/dashboard`);
  await page.waitForLoadState('domcontentloaded');

  console.log('Dashboard opened:', page.url());

  // Navigate to Loan page
  await page.goto(
    'http://purple-development-mychits-admin.s3-website.eu-north-1.amazonaws.com/other-service-menu/loan'
  );

  await page.waitForLoadState('domcontentloaded');

  console.log('Loan page opened:', page.url());

  // Click + Add Loan
  const addLoanButton = page.getByRole('button', {
    name: /add loan/i
  });

  await expect(addLoanButton).toBeVisible({ timeout: 20000 });
  await addLoanButton.click();

  console.log('Add Loan form opened');

  // Select Borrower Name: Blr-gayle
  const borrowerField = page.getByText('Borrower Name', {
    exact: false
  }).first();

  await expect(borrowerField).toBeVisible({ timeout: 15000 });

  await borrowerField.click();

  const borrowerOption = page.getByText('Blr-gayle', {
    exact: true
  }).last();

  await expect(borrowerOption).toBeVisible({ timeout: 15000 });
  await borrowerOption.click();

  console.log('Borrower selected: Blr-gayle');

  // Enter Loan Amount: 50000
  const loanAmountInput = page.getByPlaceholder(/loan amount/i);

  await loanAmountInput.fill('50000');

  console.log('Loan Amount entered: 50000');

  // Enter Tenure in Days: 30
  const tenureInput = page.getByPlaceholder(/tenure in days/i);

  await tenureInput.fill('30');

  console.log('Tenure entered: 30 days');

  // Select Status: Approved
  const statusField = page.getByText('Status', {
    exact: true
  }).last();

  await statusField.click();

  const approvedOption = page.getByText('Approved', {
    exact: true
  }).last();

  await expect(approvedOption).toBeVisible({ timeout: 15000 });
  await approvedOption.click();

  console.log('Status selected: Approved');

  // Wait for remaining fields to auto-populate
  await page.waitForTimeout(2000);

  // Click Save Loan
  const saveLoanButton = page.getByRole('button', {
    name: /save loan/i
  });

  await expect(saveLoanButton).toBeVisible({ timeout: 15000 });
  await saveLoanButton.click();

  console.log('Save Loan clicked');

  // Wait for the form to submit
  await page.waitForTimeout(3000);

  console.log('Loan creation flow completed');
});