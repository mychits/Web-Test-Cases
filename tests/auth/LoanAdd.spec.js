
const { test, expect } = require('@playwright/test');
const path = require('path');

test.use({
  storageState: path.resolve(__dirname, '../../auth-state.json')
});

test('Add Loan for Blr-gayle', async ({ page }) => {
  test.setTimeout(120000);

  const baseURL =
    'http://purple-development-mychits-admin.s3-website.eu-north-1.amazonaws.com/';

  // STEP 1: Open website using saved login session
  await page.goto(baseURL, {
    waitUntil: 'domcontentloaded',
    timeout: 45000
  });

  console.log('Website opened:', page.url());

  // STEP 2: Check login session
  const loginVisible = await page
    .getByText('Admin Login', { exact: true })
    .isVisible()
    .catch(() => false);

  if (loginVisible) {
    throw new Error(
      'Login session expired. Run LoginAutomation.spec.js first.'
    );
  }

  console.log('Login session active.');

  // STEP 3: Open Dashboard
  await page.goto(`${baseURL}dashboard`, {
    waitUntil: 'domcontentloaded'
  });

  console.log('Dashboard opened:', page.url());

  // STEP 4: Navigate to Other Service Loan page
  await page.goto(`${baseURL}other-service-menu/loan`, {
    waitUntil: 'domcontentloaded',
    timeout: 45000
  });

  console.log('Loan page opened:', page.url());

  // STEP 5: Check login session again
  const redirectedToLogin = await page
    .getByText('Admin Login', { exact: true })
    .isVisible()
    .catch(() => false);

  if (redirectedToLogin) {
    throw new Error('Redirected to Admin Login. Check auth-state.json.');
  }

  console.log('Loan page login verified.');

  // STEP 6: Open Add Loan form
  const addLoanButton = page.getByRole('button', {
    name: /add loan/i
  });

  await expect(addLoanButton).toBeVisible({
    timeout: 15000
  });

  await addLoanButton.click();

  console.log('Add Loan form opened.');

  // Helper: Select Ant Design dropdown using its label
  async function selectField(labelText, valuePattern) {
    const label = page.locator('label').filter({
      hasText: new RegExp(`^${labelText}\\s*\\*?$`, 'i')
    }).last();

    await expect(label).toBeVisible({
      timeout: 10000
    });

    const dropdown = label.locator('xpath=..').locator('.ant-select');

    await expect(dropdown).toBeVisible({
      timeout: 10000
    });

    await dropdown.click();

    // Search inside dropdown if search input is available
    const searchInput = page.locator(
      '.ant-select-dropdown:visible input'
    ).last();

    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill(
        typeof valuePattern === 'string'
          ? valuePattern
          : 'Blr'
      );
    }

    const option = page
      .locator('.ant-select-dropdown:visible')
      .getByText(valuePattern, { exact: false })
      .last();

    await expect(option).toBeVisible({
      timeout: 15000
    });

    await option.click();

    console.log(`${labelText} selected.`);
  }

  // Helper: Fill input using its label
  async function fillField(labelText, value) {
    const label = page.locator('label').filter({
      hasText: new RegExp(`^${labelText}\\s*\\*?$`, 'i')
    }).last();

    await expect(label).toBeVisible({
      timeout: 10000
    });

    const input = label.locator('xpath=..').locator('input').first();

    await expect(input).toBeVisible({
      timeout: 10000
    });

    await input.fill(value);

    console.log(`${labelText} entered: ${value}`);
  }

  // STEP 7: Select Borrower Name
  await selectField(
    'Borrower Name',
    /CUS2614\s*\|\s*Blr-gayle\s*\|\s*7001002445/i
  );

  console.log('Borrower selected: Blr-gayle');

  // STEP 8: Enter Loan Amount
  await fillField('Loan Amount', '500000');

  // STEP 9: Enter Tenure
  await fillField('Tenure in Days', '30');

  // STEP 10: Enter Service Charges
  await fillField('Service Charges', '50000');

  // STEP 11: Enter Documentation Charges
  await fillField('Documentation Charges', '5000');

  // STEP 12: Wait for automatic calculations
  await page.waitForTimeout(2000);

  console.log('Waiting for automatic loan calculations.');

  // STEP 13: Verify Daily Payment Amount
  const dailyPaymentLabel = page.locator('label').filter({
    hasText: /^Daily Payment Amount\s*\*?$/i
  }).last();

  const dailyPaymentInput = dailyPaymentLabel
    .locator('xpath=..')
    .locator('input')
    .first();

  await expect(dailyPaymentInput).toHaveValue('16667');

  console.log('Daily Payment Amount verified: 16667');

  // STEP 14: Verify Disbursement Amount
  const disbursementLabel = page.locator('label').filter({
    hasText: /^Disbursement Amount\s*\*?$/i
  }).last();

  const disbursementInput = disbursementLabel
    .locator('xpath=..')
    .locator('input')
    .first();

  await expect(disbursementInput).toHaveValue('445000');

  console.log('Disbursement Amount verified: 445000');

  // STEP 15: Select Referred Type
  await selectField('Referred Type', 'Customer');

  console.log('Referred Type selected: Customer');

  // STEP 16: Select Referred Customer
  await selectField(
    'Select Referred Customer',
    /Blr-dhoni\s*\|\s*9600976651/i
  );

  console.log('Referred Customer selected: Blr-dhoni');

  // STEP 17: Leave Note empty

  // STEP 18: Select Status
  await selectField('Status', /^approved$/i);

  console.log('Status selected: approved');

  // STEP 19: Save Loan
  const saveLoanButton = page.getByRole('button', {
    name: /^Save Loan$/i
  });

  await expect(saveLoanButton).toBeVisible({
    timeout: 15000
  });

  await expect(saveLoanButton).toBeEnabled({
    timeout: 10000
  });

  await saveLoanButton.click();

  console.log('Save Loan clicked.');

  // STEP 20: Wait for submission
  await page.waitForTimeout(3000);

  console.log('Loan submission completed.');

});
