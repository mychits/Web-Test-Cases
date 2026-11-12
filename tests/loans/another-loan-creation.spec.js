
require('dotenv').config();

const { test, expect } = require('@playwright/test');

const {
  validateConfig,
  login,
  openLoans
} = require('./loan-status-update');

test.setTimeout(180000);

// -------------------------------------
// Environment variables
// -------------------------------------

const borrower = (
  process.env.NEW_LOAN_BORROWER || ''
).trim();

const amount = process.env.NEW_LOAN_AMOUNT || '';
const tenure = process.env.NEW_LOAN_TENURE || '';

const serviceCharges =
  process.env.NEW_LOAN_SERVICE_CHARGES || '';

const documentCharges =
  process.env.NEW_LOAN_DOCUMENT_CHARGES || '';

const dailyPayment =
  process.env.NEW_LOAN_DAILY_PAYMENT || '';

const status =
  process.env.NEW_LOAN_STATUS || 'Requested';

const submitEnabled =
  process.env.ENABLE_NEW_LOAN_SUBMIT === 'true';

// -------------------------------------
// Validate new loan data
// -------------------------------------

function validateLoanData() {
  const required = {
    NEW_LOAN_BORROWER: borrower,
    NEW_LOAN_AMOUNT: amount,
    NEW_LOAN_TENURE: tenure,
    NEW_LOAN_SERVICE_CHARGES: serviceCharges,
    NEW_LOAN_DOCUMENT_CHARGES: documentCharges,
    NEW_LOAN_DAILY_PAYMENT: dailyPayment
  };

  for (const [key, value] of Object.entries(required)) {
    if (!String(value).trim()) {
      throw new Error(`Missing .env variable: ${key}`);
    }
  }

  const borrowerParts = borrower
    .split('|')
    .map(part => part.trim());

  if (borrowerParts.length !== 3) {
    throw new Error(
      'NEW_LOAN_BORROWER must use: ' +
      'Customer ID | Customer Name | Phone Number'
    );
  }

  if (!/^CUS\d+$/i.test(borrowerParts[0])) {
    throw new Error('Invalid borrower Customer ID');
  }

  if (!/^\d{10}$/.test(borrowerParts[2])) {
    throw new Error('Invalid borrower phone number');
  }

  for (const [key, value] of Object.entries({
    NEW_LOAN_AMOUNT: amount,
    NEW_LOAN_TENURE: tenure,
    NEW_LOAN_SERVICE_CHARGES: serviceCharges,
    NEW_LOAN_DOCUMENT_CHARGES: documentCharges,
    NEW_LOAN_DAILY_PAYMENT: dailyPayment
  })) {
    if (!Number.isFinite(Number(value)) || Number(value) < 0) {
      throw new Error(`Invalid numeric value for ${key}`);
    }
  }

  if (status.toLowerCase() !== 'requested') {
    throw new Error(
      'This test is intended to create a Requested loan. ' +
      'Set NEW_LOAN_STATUS=Requested.'
    );
  }
}

// -------------------------------------
// Select Ant Design dropdown option
// -------------------------------------

async function selectAntOption(page, select, optionText) {
  await expect(select).toBeVisible({
    timeout: 15000
  });

  await select.click();

  const dropdown = page.locator(
    '.ant-select-dropdown:visible'
  ).last();

  await expect(dropdown).toBeVisible({
    timeout: 15000
  });

  const option = dropdown.locator(
    '.ant-select-item-option'
  ).filter({
    hasText: new RegExp(
      `^\\s*${optionText.replace(
        /[.*+?^${}()|[\]\\]/g,
        '\\$&'
      )}\\s*$`,
      'i'
    )
  });

  await expect(option).toHaveCount(1, {
    timeout: 15000
  });

  await option.click();
}

// -------------------------------------
// Select exact borrower
// -------------------------------------

async function selectBorrower(page, modal, borrowerText) {
  console.log('Selecting borrower:', borrowerText);

  const borrowerId = borrowerText
    .split('|')[0]
    .trim();

  const borrowerSelect = modal.locator(
    '.ant-select'
  ).first();

  await expect(borrowerSelect).toBeVisible({
    timeout: 15000
  });

  await borrowerSelect.click();

  const searchInput = borrowerSelect.locator(
    'input[role="combobox"]'
  );

  await expect(searchInput).toBeVisible({
    timeout: 10000
  });

  // Search using Customer ID only.
  await searchInput.fill(borrowerId);

  console.log('Searching Customer ID:', borrowerId);

  const dropdown = page.locator(
    '.ant-select-dropdown:visible'
  ).last();

  await expect(dropdown).toBeVisible({
    timeout: 15000
  });

  // Match the exact customer details.
  const borrowerOption = dropdown.locator(
    '.ant-select-item-option'
  ).filter({
    hasText: borrowerText
  });

  await expect(borrowerOption).toHaveCount(1, {
    timeout: 15000
  });

  await borrowerOption.click();

  console.log('Borrower selected:', borrowerText);
}

// -------------------------------------
// Fill loan form field
// -------------------------------------

async function fillLoanField(modal, selector, value, label) {
  const field = modal.locator(selector);

  await expect(field).toBeVisible({
    timeout: 15000
  });

  await field.fill(String(value));

  await expect(field).toHaveValue(String(value));

  console.log(`${label}: ${value}`);
}

// -------------------------------------
// Main test
// -------------------------------------

test('Create another Requested loan', async ({ page }) => {
  page.setDefaultTimeout(15000);

  validateConfig();
  validateLoanData();

  // Login only once.
  await login(page);

  // Open Loans page.
  await openLoans(page);

  // Open Add Loan form.
  await page.getByRole('button', {
    name: /add loan/i
  }).click();

  const modal = page.getByRole('dialog').last();

  await expect(modal).toBeVisible({
    timeout: 15000
  });

  console.log('Add Loan form opened');

  // -----------------------------------
  // Step 1: Select borrower
  // -----------------------------------

  await selectBorrower(page, modal, borrower);

  // -----------------------------------
  // Step 2: Fill loan details
  // -----------------------------------

  await fillLoanField(
    modal,
    '#loan_amount',
    amount,
    'Loan Amount'
  );

  await fillLoanField(
    modal,
    '#tenure',
    tenure,
    'Tenure'
  );

  await fillLoanField(
    modal,
    '#service_charges',
    serviceCharges,
    'Service Charges'
  );

  await fillLoanField(
    modal,
    '#document_charges',
    documentCharges,
    'Documentation Charges'
  );

  await fillLoanField(
    modal,
    '#daily_payment_amount',
    dailyPayment,
    'Daily Payment'
  );

  // -----------------------------------
  // Step 3: Referred Type
  // -----------------------------------

  const referredType = modal.locator(
    '.ant-select'
  ).nth(1);

  await expect(referredType).toBeVisible();

  const referredText = (
    await referredType.innerText()
  ).trim();

  if (!/self\s*joining/i.test(referredText)) {
    await selectAntOption(
      page,
      referredType,
      'Self Joining'
    );
  }

  console.log('Referred Type: Self Joining');

  // -----------------------------------
  // Step 4: Select Requested status
  // -----------------------------------

  const statusSelect = modal.locator(
    '.ant-select'
  ).nth(2);

  await selectAntOption(
    page,
    statusSelect,
    status
  );

  await expect(statusSelect).toContainText(
    /requested/i
  );

  console.log('Status selected: Requested');

  // -----------------------------------
  // Step 5: Enter note
  // -----------------------------------

  const note = modal.locator(
    'input[name="note"]'
  );

  if (await note.count()) {
    await note.fill(
      'QA automation - new requested loan'
    );
  }

  // -----------------------------------
  // Step 6: Print loan details
  // -----------------------------------

  console.log('----------------------------');
  console.log('NEW LOAN DETAILS');
  console.log('----------------------------');
  console.log('Borrower:', borrower);
  console.log('Loan Amount:', amount);
  console.log('Tenure:', tenure);
  console.log('Service Charges:', serviceCharges);
  console.log('Documentation Charges:', documentCharges);
  console.log('Daily Payment:', dailyPayment);
  console.log('Status:', status);
  console.log('Submit Enabled:', submitEnabled);
  console.log('----------------------------');

  // -----------------------------------
  // Step 7: Capture screenshot
  // -----------------------------------

  await page.screenshot({
    path: 'another-loan-filled.png',
    fullPage: true
  });

  console.log('Loan form screenshot captured');

  // -----------------------------------
  // Step 8: Dry run or submit
  // -----------------------------------

  if (!submitEnabled) {
    console.log(
      '[DRY RUN] Form filled successfully.'
    );

    console.log(
      '[DRY RUN] No loan has been submitted.'
    );

    return;
  }

  // -----------------------------------
  // Step 9: Save Loan
  // -----------------------------------

  const saveButton = modal.getByRole(
    'button',
    { name: /save loan/i }
  );

  await expect(saveButton).toBeEnabled();

  await saveButton.click();

  console.log('Save Loan clicked');

  await expect(modal).toBeHidden({
    timeout: 30000
  });

  console.log('Loan form closed after submission');

  console.log(
    'Check the Requests tab to confirm ' +
    'that the new loan was saved.'
  );
});
