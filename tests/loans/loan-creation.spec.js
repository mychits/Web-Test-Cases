
require('dotenv').config();

const { test, expect } = require('@playwright/test');

const fs = require('fs');
const path = require('path');

// =====================================
// ENVIRONMENT VARIABLES
// =====================================

const BASE_URL = (process.env.BASE_URL || '').replace(/\/+$/, '');
const ADMIN_ID = process.env.ADMIN_ID;
const OTP = process.env.OTP;
const BRANCH_NAME = process.env.BRANCH_NAME;

const LOAN_BORROWER = process.env.LOAN_BORROWER;
const LOAN_AMOUNT = process.env.LOAN_AMOUNT;
const LOAN_TENURE_DAYS = process.env.LOAN_TENURE_DAYS;
const LOAN_SERVICE_CHARGES = process.env.LOAN_SERVICE_CHARGES;
const LOAN_DOCUMENTATION_CHARGES =
  process.env.LOAN_DOCUMENTATION_CHARGES;
const LOAN_DAILY_PAYMENT = process.env.LOAN_DAILY_PAYMENT;

const LOAN_REFERRED_TYPE =
  process.env.LOAN_REFERRED_TYPE || 'Self Joining';

const LOAN_STATUS =
  process.env.LOAN_STATUS || 'approved';

const LOAN_NOTE =
  process.env.LOAN_NOTE || 'QA automation test loan';

const ENABLE_SUBMIT =
  process.env.ENABLE_LOAN_SUBMIT === 'true';

const LOANS_URL =
  `${BASE_URL}/other-service-menu/loan`;

const SCREENSHOT_DIR = path.resolve(
  process.cwd(),
  'test-results',
  'loan-creation'
);

// =====================================
// VALIDATE CONFIGURATION
// =====================================

function validateConfig() {
  const required = {
    BASE_URL,
    ADMIN_ID,
    OTP,
    BRANCH_NAME,
    LOAN_BORROWER,
    LOAN_AMOUNT,
    LOAN_TENURE_DAYS,
    LOAN_SERVICE_CHARGES,
    LOAN_DOCUMENTATION_CHARGES,
    LOAN_DAILY_PAYMENT
  };

  const missing = Object.entries(required)
    .filter(([, value]) => !String(value || '').trim())
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(
      `Missing .env values: ${missing.join(', ')}`
    );
  }

  const numericFields = {
    LOAN_AMOUNT,
    LOAN_TENURE_DAYS,
    LOAN_SERVICE_CHARGES,
    LOAN_DOCUMENTATION_CHARGES,
    LOAN_DAILY_PAYMENT
  };

  for (const [name, value] of Object.entries(numericFields)) {
    if (!Number.isFinite(Number(value)) || Number(value) < 0) {
      throw new Error(`Invalid numeric value for ${name}`);
    }
  }

  if (Number(LOAN_AMOUNT) <= 0) {
    throw new Error('LOAN_AMOUNT must be greater than zero');
  }

  if (
    !Number.isInteger(Number(LOAN_TENURE_DAYS)) ||
    Number(LOAN_TENURE_DAYS) <= 0
  ) {
    throw new Error(
      'LOAN_TENURE_DAYS must be a positive integer'
    );
  }

  if (Number(LOAN_DAILY_PAYMENT) <= 0) {
    throw new Error(
      'LOAN_DAILY_PAYMENT must be greater than zero'
    );
  }
}

// =====================================
// LOGIN
// =====================================

async function login(page) {
  console.log('Opening MyChits Admin');

  await page.goto(BASE_URL, {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });

  const loginHeading = page.getByRole('heading', {
    name: /admin login/i
  });

  if (!(await loginHeading.isVisible().catch(() => false))) {
    console.log('Existing login session detected');
    return;
  }

  console.log('Admin Login page opened');

  await page.locator('select').first().selectOption({
    label: BRANCH_NAME
  });

  console.log(`Branch selected: ${BRANCH_NAME}`);

  await page.getByPlaceholder('XXX-XX-XXXX')
    .fill(ADMIN_ID);

  await page.getByRole('button', {
    name: /send otp/i
  }).click();

  console.log('OTP requested');

  const otpInputs = page.locator(
    'input[autocomplete="one-time-code"], ' +
    'input[name*="otp" i], ' +
    'input[placeholder*="otp" i], ' +
    'input[inputmode="numeric"], ' +
    'input[maxlength="6"]'
  );

  await expect(otpInputs.first()).toBeVisible({
    timeout: 30000
  });

  const count = await otpInputs.count();

  if (count === 1) {
    await otpInputs.first().fill(String(OTP));
  } else if (count === 6) {
    if (String(OTP).length !== 6) {
      throw new Error('OTP must contain exactly 6 digits');
    }

    for (let i = 0; i < 6; i++) {
      await otpInputs.nth(i).fill(String(OTP)[i]);
    }
  } else {
    throw new Error(
      `Unexpected OTP input count: ${count}`
    );
  }

  await page.getByRole('button', {
    name: /verify otp|verify|login|submit/i
  }).last().click();

  await expect(loginHeading).toBeHidden({
    timeout: 30000
  });

  console.log('Admin login successful');
}

// =====================================
// OPEN LOANS PAGE
// =====================================

async function openLoans(page) {
  console.log('Opening Loans page');

  await page.goto(LOANS_URL, {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });

  await expect(
    page.getByRole('button', {
      name: /add loan/i
    })
  ).toBeVisible({
    timeout: 30000
  });

  console.log('Loans page opened');
}

// =====================================
// OPEN ADD LOAN FORM
// =====================================

async function openLoanForm(page) {
  await page.getByRole('button', {
    name: /add loan/i
  }).click();

  const saveButton = page.getByRole('button', {
    name: /^save loan$/i
  });

  await expect(saveButton).toBeVisible({
    timeout: 15000
  });

  const dialog = page.getByRole('dialog').filter({
    has: saveButton
  });

  if (await dialog.count() === 1) {
    console.log('Add Loan dialog opened');
    return dialog;
  }

  // Fallback for a custom modal without role="dialog".
  const modal = page.locator('div.fixed').filter({
    has: saveButton
  }).last();

  if (await modal.count() !== 1) {
    throw new Error(
      'Unable to identify the Add Loan modal uniquely'
    );
  }

  await expect(modal).toBeVisible();

  console.log('Add Loan modal opened');

  return modal;
}

// =====================================
// SELECT ANT DESIGN DROPDOWN
// =====================================
async function selectAntDropdown(page, modal, index, optionText) {
  console.log(`Selecting dropdown ${index}: ${optionText}`);

  const input = modal.locator(`#rc_select_${index}`);

  await expect(input).toBeAttached({
    timeout: 15000
  });

  const select = input.locator(
    'xpath=ancestor::*[contains(concat(" ", normalize-space(@class), " "), " ant-select ")][1]'
  );

  await expect(select).toBeVisible();

  // Open dropdown.
  await select.click();

  const dropdown = page.locator(
    '.ant-select-dropdown:not(.ant-select-dropdown-hidden)'
  ).filter({
    visible: true
  }).last();

  await expect(dropdown).toBeVisible({
    timeout: 15000
  });

  // Borrower is searchable; use the customer code.
  if (index === 0) {
    const customerCode = optionText.split('|')[0].trim();

    await input.fill(customerCode);

    console.log(`Searching borrower code: ${customerCode}`);
  }

  const option = dropdown.locator(
    '.ant-select-item-option'
  ).filter({
    hasText: optionText
  });

  try {
    await expect(option).toHaveCount(1, {
      timeout: 15000
    });
  } catch {
    const availableOptions = await dropdown.locator(
      '.ant-select-item-option'
    ).allTextContents();

    console.log(
      'Available dropdown options:',
      availableOptions
    );

    throw new Error(
      `Unable to find a unique dropdown option: ${optionText}`
    );
  }

  await option.click();

  console.log(`Selected: ${optionText}`);
}
// =====================================
// SELECT BORROWER
// =====================================

async function selectBorrower(page, modal) {
  console.log(`Selecting borrower: ${LOAN_BORROWER}`);

  await selectAntDropdown(
    page,
    modal,
    0,
    LOAN_BORROWER
  );

  console.log('Borrower selected successfully');
}

// =====================================
// FILL LOAN DETAILS
// =====================================

async function fillLoanForm(page, modal) {
  await selectBorrower(page, modal);

  console.log('Filling loan details');

  // Actual input IDs confirmed by your terminal output.
  await modal.locator('#loan_amount')
    .fill(String(LOAN_AMOUNT));

  await modal.locator('#tenure')
    .fill(String(LOAN_TENURE_DAYS));

  await modal.locator('#service_charges')
    .fill(String(LOAN_SERVICE_CHARGES));

  await modal.locator('#document_charges')
    .fill(String(LOAN_DOCUMENTATION_CHARGES));

  await modal.locator('#daily_payment_amount')
    .fill(String(LOAN_DAILY_PAYMENT));

  // Disbursement Amount is calculated automatically.
  const disbursement = modal.locator('#disposal_amount');

  await expect(disbursement).toBeVisible();
  await expect(disbursement).toHaveAttribute(
    'readonly',
    ''
  );

  console.log(
    'Calculated Disbursement Amount:',
    await disbursement.inputValue()
  );

  // Referred Type
  await selectAntDropdown(
    page,
    modal,
    1,
    LOAN_REFERRED_TYPE
  );

  // Status
  await selectAntDropdown(
    page,
    modal,
    2,
    LOAN_STATUS
  );

  if (LOAN_NOTE) {
    await modal.locator('input[name="note"]')
      .fill(LOAN_NOTE);
  }

  // Verify all editable numeric fields.
  await expect(modal.locator('#loan_amount'))
    .toHaveValue(String(LOAN_AMOUNT));

  await expect(modal.locator('#tenure'))
    .toHaveValue(String(LOAN_TENURE_DAYS));

  await expect(modal.locator('#service_charges'))
    .toHaveValue(String(LOAN_SERVICE_CHARGES));

  await expect(modal.locator('#document_charges'))
    .toHaveValue(String(LOAN_DOCUMENTATION_CHARGES));

  await expect(modal.locator('#daily_payment_amount'))
    .toHaveValue(String(LOAN_DAILY_PAYMENT));

  console.log('All loan details filled successfully');
}

// =====================================
// SAVE LOAN
// =====================================

async function saveLoan(modal) {
  console.log('Clicking Save Loan');

  const saveButton = modal.getByRole('button', {
    name: /^save loan$/i
  });

  await expect(saveButton).toBeEnabled();

  await saveButton.click();

  await expect(modal).toBeHidden({
    timeout: 30000
  });

  console.log('Save Loan completed; form closed');
}

// =====================================
// MAIN TEST - ONLY ONE TEST BLOCK
// =====================================

test('Create Loan in MyChits Admin', async ({ page }) => {
  // Unlimited timeout for manual inspection.
  test.setTimeout(0);

  page.setDefaultTimeout(15000);
  page.setDefaultNavigationTimeout(60000);

  validateConfig();

  fs.mkdirSync(SCREENSHOT_DIR, {
    recursive: true
  });

  try {
    await login(page);

    await openLoans(page);

    const modal = await openLoanForm(page);

    await fillLoanForm(page, modal);

    console.log('================================');
    console.log('LOAN FORM FILLED SUCCESSFULLY');
    console.log('Borrower:', LOAN_BORROWER);
    console.log('Loan Amount:', LOAN_AMOUNT);
    console.log('Tenure:', LOAN_TENURE_DAYS);
    console.log('Service Charges:', LOAN_SERVICE_CHARGES);
    console.log(
      'Documentation Charges:',
      LOAN_DOCUMENTATION_CHARGES
    );
    console.log('Daily Payment:', LOAN_DAILY_PAYMENT);
    console.log('Referred Type:', LOAN_REFERRED_TYPE);
    console.log('Status:', LOAN_STATUS);
    console.log('================================');

    await page.screenshot({
      path: path.join(
        SCREENSHOT_DIR,
        'loan-form-filled.png'
      ),
      fullPage: true
    });

    console.log('Loan form screenshot captured');

    if (!ENABLE_SUBMIT) {
      console.log(
        '[DRY RUN] No loan will be submitted.'
      );

      console.log(
        'Browser paused. Inspect the filled form.'
      );

      console.log(
        'Dry run completed without saving'
      );

      return;
    }

    console.log(
      'Browser paused before saving the loan.'
    );

    console.log(
      'Click Resume in Playwright Inspector ' +
      'to submit the loan.'
    );

    await page.pause();

    await saveLoan(modal);

    console.log(
      'Loan submitted. Check its status tab ' +
      'to confirm the saved record.'
    );

  } catch (error) {
    console.error(
      'Loan creation failed:',
      error.message
    );

    console.error('Current URL:', page.url());

    await page.screenshot({
      path: path.join(
        SCREENSHOT_DIR,
        'loan-creation-error.png'
      ),
      fullPage: true
    }).catch(() => {});

    throw error;
  }
});
