
require('dotenv').config();

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// =====================================
// TEST DATA CONFIGURATION
// =====================================

const branches = require('../../test-data/branches.js');

if (!Array.isArray(branches)) {
  throw new Error('branches.js must export an array');
}

const TEST_ID = String(process.env.TEST_ID || 'TC001')
  .trim()
  .toUpperCase();

const selectedBranches = TEST_ID === 'ALL'
  ? branches
  : branches.filter(
      b => String(b.testId || '').trim().toUpperCase() === TEST_ID
    );

console.log('Total datasets:', branches.length);
console.log('Selected TEST_ID:', TEST_ID);
console.log('Available IDs:', branches.map(b => b.testId));

if (selectedBranches.length === 0) {
  throw new Error(`No branch dataset found for ${TEST_ID}`);
}

// =====================================
// ENVIRONMENT CONFIGURATION
// =====================================

const BASE_URL = process.env.BASE_URL;
const ADMIN_ID = process.env.ADMIN_ID;
const OTP = process.env.OTP;
const BRANCH_NAME = process.env.BRANCH_NAME;

if (!BASE_URL || !ADMIN_ID || !OTP || !BRANCH_NAME) {
  throw new Error('Missing required .env values');
}

test.setTimeout(180000);

// =====================================
// RESULT FOLDER
// =====================================

const RESULTS_DIR = path.join(
  process.cwd(),
  'branch-validation-results'
);

fs.mkdirSync(RESULTS_DIR, { recursive: true });

// =====================================
// LOGIN
// =====================================

async function login(page) {
  await page.goto(BASE_URL, {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });

  const loginHeading = page.getByRole('heading', {
    name: /admin login/i
  });

  await expect(loginHeading).toBeVisible({
    timeout: 30000
  });

  await page.locator('select').first().selectOption({
    label: BRANCH_NAME
  });

  await page.getByPlaceholder('XXX-XX-XXXX').fill(ADMIN_ID);

  await page.getByRole('button', {
    name: /send otp/i
  }).click();

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
    await otpInputs.first().fill(OTP);
  } else if (count === 6) {
    for (let i = 0; i < 6; i++) {
      await otpInputs.nth(i).fill(OTP[i]);
    }
  } else {
    throw new Error(`Unexpected OTP input count: ${count}`);
  }

  await page.getByRole('button', {
    name: /verify otp|verify|login|submit/i
  }).last().click();

  await expect(loginHeading).toBeHidden({
    timeout: 30000
  });

  console.log('Login successful');
}

// =====================================
// OPTIONAL POPUP
// =====================================

async function closePopup(page) {
  const popup = page.locator(
    'div.fixed.inset-0.z-\\[9999\\]'
  ).first();

  if (!(await popup.isVisible().catch(() => false))) {
    return;
  }

  const remindLater = popup.getByRole('button', {
    name: /remind me later/i
  });

  if (await remindLater.isVisible().catch(() => false)) {
    await remindLater.click();
    await expect(popup).toBeHidden();
  }
}

// =====================================
// FIELD HELPERS
// =====================================

const placeholders = {
  'Branch Name': 'e.g. Downtown Branch',
  'Phone Number': 'Enter phone number',
  'Email Address': 'Enter email address',
  'City': 'Enter city',
  'District': 'Enter district',
  'State': 'Enter state',
  'Country': 'Enter country',
  'Pincode': 'Enter pincode',
  'Manager Name': 'Enter manager name',
  'Manager Phone': 'Enter manager phone',
  'GST Number': 'Enter GST number',
  'PAN Number': 'Enter PAN number'
};

async function fillField(page, label, value) {
  if (value === undefined || value === null) {
    throw new Error(`Missing data for field: ${label}`);
  }

  let field;

  if (placeholders[label]) {
    field = page.getByPlaceholder(placeholders[label], {
      exact: true
    });
  } else {
    // For fields without input placeholders.
    field = page.getByLabel(label, {
      exact: true
    });
  }

  await expect(field).toBeVisible({
    timeout: 15000
  });

  await field.fill(String(value));

  console.log(`Filled ${label}: ${value}`);
}

// =====================================
// ANT DESIGN DROPDOWN HELPER
// =====================================

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
async function selectField(page, label, value) {
  if (value === undefined || value === null) {
    throw new Error(`Missing dropdown data for ${label}`);
  }

  // Dropdown positions based on the form HTML
  const dropdownIndexes = {
    'Branch Type': 0,
    'Status': 1,
    'Is Head Office?': 2
  };

  const index = dropdownIndexes[label];

  if (index === undefined) {
    throw new Error(`Unknown dropdown field: ${label}`);
  }

  const dropdowns = page.locator('.ant-select');

  const count = await dropdowns.count();

  console.log(`Ant Design dropdowns found: ${count}`);

  if (count !== 3) {
    throw new Error(
      `Expected 3 dropdowns, found ${count}. Check form structure.`
    );
  }

  const dropdown = dropdowns.nth(index);

  await expect(dropdown).toBeVisible({
    timeout: 15000
  });

  await dropdown.click();

  console.log(`Opened dropdown: ${label}`);

  // Ant Design renders options in a popup.
  const option = page.locator(
    '.ant-select-dropdown:visible .ant-select-item-option'
  ).filter({
    hasText: new RegExp(
      `^\\s*${escapeRegex(value)}\\s*$`,
      'i'
    )
  }).first();

  await expect(option).toBeVisible({
    timeout: 15000
  });

  await option.click();

  console.log(`Selected ${label}: ${value}`);
}
// =====================================
// STREET ADDRESS HELPER
// =====================================

async function fillAddress(page, label, value, index) {
  if (value === undefined || value === null) {
    throw new Error(`Missing address data for ${label}`);
  }

  // First try accessible label.
  const labelledField = page.getByLabel(label, {
    exact: true
  });

  if (await labelledField.isVisible().catch(() => false)) {
    await labelledField.fill(String(value));
    console.log(`Filled ${label}: ${value}`);
    return;
  }

  // Address inputs may be textareas.
  const textareas = page.locator('textarea');

  const count = await textareas.count();

  console.log('Total textareas found:', count);

  if (count > index) {
    const field = textareas.nth(index);

    await expect(field).toBeVisible();
    await field.fill(String(value));

    console.log(`Filled ${label}: ${value}`);
    return;
  }

  // Print textarea HTML to help diagnose unexpected structure.
  const details = await textareas.evaluateAll(elements =>
    elements.map(element => ({
      placeholder: element.placeholder,
      outerHTML: element.outerHTML.slice(0, 400)
    }))
  );

  console.log('TEXTAREAS:', JSON.stringify(details, null, 2));

  throw new Error(
    `Could not locate ${label}. Check textarea HTML above.`
  );
}

// =====================================
// OPEN CREATE BRANCH FORM
// =====================================

async function openCreateBranch(page) {
  await closePopup(page);

  const branchesMenu = page.getByText('Branches', {
    exact: true
  }).first();

  await expect(branchesMenu).toBeVisible({
    timeout: 30000
  });

  await branchesMenu.click();

  console.log('Branches menu clicked');
  console.log('Current URL:', page.url());

  await closePopup(page);

  const createButton = page.getByRole('button', {
    name: /create branch|add branch|new branch/i
  }).first();

  await expect(createButton).toBeVisible({
    timeout: 30000
  });

  await createButton.click();

  console.log('Create Branch button clicked');

  const branchName = page.getByPlaceholder(
    'e.g. Downtown Branch',
    { exact: true }
  );

  await expect(branchName).toBeVisible({
    timeout: 15000
  });

  console.log('Create Branch form opened successfully');
}

// =====================================
// FILL BRANCH FORM
// =====================================

async function fillBranchForm(page, branch) {
  console.log(`Filling ${branch.testId}: ${branch.scenario}`);

  // BASIC INFORMATION
  await fillField(page, 'Branch Name', branch.branchName);

  await selectField(page, 'Branch Type', branch.branchType);
  await selectField(page, 'Status', branch.status);
  await selectField(page, 'Is Head Office?', branch.isHeadOffice);

  // OPENING DATE
  const openingDate = page.getByPlaceholder(
    'Select opening date',
    { exact: true }
  );

  await expect(openingDate).toBeVisible({
    timeout: 15000
  });

  await openingDate.fill(branch.openingDate);
  await openingDate.press('Tab');

  console.log('Opening Date entered:', branch.openingDate);

  // CONTACT INFORMATION
  await fillField(page, 'Phone Number', branch.phoneNumber);
  await fillField(page, 'Email Address', branch.emailAddress);

  // ADDRESS INFORMATION
  await fillAddress(
    page,
    'Street Address Line 1',
    branch.streetAddress1,
    0
  );

  await fillAddress(
    page,
    'Street Address Line 2',
    branch.streetAddress2,
    1
  );

  await fillField(page, 'City', branch.city);
  await fillField(page, 'District', branch.district);
  await fillField(page, 'State', branch.state);
  await fillField(page, 'Country', branch.country);
  await fillField(page, 'Pincode', branch.pincode);

  // MANAGER INFORMATION
  await fillField(page, 'Manager Name', branch.managerName);
  await fillField(page, 'Manager Phone', branch.managerPhone);

  // TAX INFORMATION
  await fillField(page, 'GST Number', branch.gstNumber);
  await fillField(page, 'PAN Number', branch.panNumber);

  console.log('All branch fields filled successfully');
}

// =====================================
// CAPTURE VALIDATION MESSAGES
// =====================================

async function captureValidation(page) {
  const messages = await page.locator(
    '[role="alert"], ' +
    '.text-red-500, ' +
    '.text-red-600, ' +
    '.ant-form-item-explain-error, ' +
    '.invalid-feedback'
  ).allTextContents();

  return [
    ...new Set(
      messages
        .map(text => text.trim())
        .filter(Boolean)
        .filter(text => text !== '*')
    )
  ];
}

// =====================================
// SAVE RESULT
// =====================================

function saveResult(branch, result) {
  const resultPath = path.join(
    RESULTS_DIR,
    `${branch.testId}-result.json`
  );

  fs.writeFileSync(
    resultPath,
    JSON.stringify(result, null, 2)
  );

  console.log('Result saved:', resultPath);
}

// =====================================
// MAIN TEST
// =====================================

for (const branch of selectedBranches) {
  test(`${branch.testId} - ${branch.scenario}`, async ({ page }) => {
    page.setDefaultTimeout(15000);
    page.setDefaultNavigationTimeout(60000);

    console.log(`Starting ${branch.testId}`);

    const result = {
      testId: branch.testId,
      scenario: branch.scenario,
      branchName: branch.branchName,
      status: 'NOT_COMPLETED',
      validationMessages: [],
      checkedAt: new Date().toISOString()
    };

    try {
      // STEP 1: LOGIN
      await login(page);

      // STEP 2: OPEN CREATE BRANCH FORM
      await openCreateBranch(page);

      // STEP 3: FILL SELECTED TEST DATA
      await fillBranchForm(page, branch);

      // STEP 4: SCREENSHOT BEFORE SUBMIT
      await page.screenshot({
        path: path.join(
          RESULTS_DIR,
          `${branch.testId}-before-submit.png`
        ),
        fullPage: true
      });

      // STEP 5: SUBMIT CREATE BRANCH
      const submitButton = page.getByRole('button', {
        name: /^create branch$/i
      }).last();

      await expect(submitButton).toBeVisible();
      await expect(submitButton).toBeEnabled();

      await submitButton.click();

      console.log('Create Branch button submitted');

      // Wait briefly for asynchronous UI feedback.
      await page.waitForTimeout(1500);

      // STEP 6: CAPTURE VALIDATION
      result.validationMessages = await captureValidation(page);

      // STEP 7: OBSERVE APPLICATION RESULT
      const successMessage = page.getByText(
        /branch created successfully|branch added successfully/i
      ).first();

      const successVisible = await successMessage
        .isVisible()
        .catch(() => false);

      const formStillVisible = await page.getByPlaceholder(
        'e.g. Downtown Branch',
        { exact: true }
      ).isVisible().catch(() => false);

      if (successVisible) {
        result.status = 'SUCCESS_MESSAGE_OBSERVED';
      } else if (formStillVisible && result.validationMessages.length > 0) {
        result.status = 'VALIDATION_MESSAGES_OBSERVED';
      } else {
        result.status = 'RESULT_NOT_CONFIRMED';
      }

      result.url = page.url();

      // STEP 8: SCREENSHOT AFTER SUBMIT
      await page.screenshot({
        path: path.join(
          RESULTS_DIR,
          `${branch.testId}-after-submit.png`
        ),
        fullPage: true
      });

      saveResult(branch, result);

      console.log('Observed result:', result.status);
      console.log('Validation messages:', result.validationMessages);

    } catch (error) {
      result.status = 'AUTOMATION_ERROR';
      result.error = error.message;
      result.url = page.url();

      await page.screenshot({
        path: path.join(
          RESULTS_DIR,
          `${branch.testId}-error.png`
        ),
        fullPage: true
      }).catch(() => {});

      saveResult(branch, result);

      console.error(`${branch.testId} failed: ${error.message}`);

      throw error;
    }
  });
}
