
require('dotenv').config();

const { test, expect } = require('@playwright/test');

// =====================================
// CONFIGURATION
// =====================================

const BASE_URL = (process.env.BASE_URL || '')
  .trim()
  .replace(/\/+$/, '');

const PIGMY_URL =
  `${BASE_URL}/other-service-menu/pigmy`;

const CUSTOMER = (
  process.env.PIGMY_CUSTOMER || ''
).trim();

const PAYMENT_TYPE = (
  process.env.PIGMY_PAYMENT_TYPE || 'Daily'
).trim();

const REFERRED_TYPE = (
  process.env.PIGMY_REFERRED_TYPE || 'Self Joining'
).trim();

const INTEREST = (
  process.env.PIGMY_INTEREST || '6'
).trim();

const START_DATE = (
  process.env.PIGMY_START_DATE || ''
).trim();

const DURATION = (
  process.env.PIGMY_DURATION || '12 months'
).trim();

const PAYABLE_AMOUNT = (
  process.env.PIGMY_PAYABLE_AMOUNT || ''
).trim();

const NOTE = (
  process.env.PIGMY_NOTE ||
  'Created by Playwright automation'
).trim();

const ENABLE_WHATSAPP =
  process.env.PIGMY_ENABLE_WHATSAPP === 'true';

const ENABLE_SUBMIT =
  process.env.ENABLE_PIGMY_SUBMIT === 'true';

test.setTimeout(180000);

// =====================================
// VALIDATE CONFIGURATION
// =====================================

function validateConfig() {
  const required = [
    'BASE_URL',
    'ADMIN_ID',
    'OTP',
    'BRANCH_NAME',
    'PIGMY_CUSTOMER',
    'PIGMY_START_DATE',
    'PIGMY_PAYABLE_AMOUNT'
  ];

  for (const key of required) {
    if (!String(process.env[key] || '').trim()) {
      throw new Error(
        `Missing .env variable: ${key}`
      );
    }
  }

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(START_DATE) ||
    Number.isNaN(Date.parse(START_DATE))
  ) {
    throw new Error(
      'PIGMY_START_DATE must use YYYY-MM-DD'
    );
  }

  if (
    !Number.isFinite(Number(PAYABLE_AMOUNT)) ||
    Number(PAYABLE_AMOUNT) <= 0
  ) {
    throw new Error(
      'PIGMY_PAYABLE_AMOUNT must be positive'
    );
  }
}

// =====================================
// ADMIN LOGIN
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

  if (
    await loginHeading.isVisible().catch(() => false)
  ) {
    console.log('Admin Login page opened');

    await page.locator('select')
      .first()
      .selectOption({
        label: process.env.BRANCH_NAME
      });

    await page.getByPlaceholder(
      'XXX-XX-XXXX'
    ).fill(process.env.ADMIN_ID);

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

    await expect(
      otpInputs.first()
    ).toBeVisible({
      timeout: 30000
    });

    const count = await otpInputs.count();
    const otp = String(process.env.OTP);

    if (count === 1) {
      await otpInputs.first().fill(otp);
    } else if (
      count === 6 &&
      otp.length === 6
    ) {
      for (let i = 0; i < 6; i++) {
        await otpInputs.nth(i).fill(otp[i]);
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
  }

  console.log('Admin login successful');
}

// =====================================
// OPEN PIGMY PAGE
// =====================================

async function openPigmy(page) {
  console.log('Opening Pigmy page');

  await page.goto(PIGMY_URL, {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });

  await expect(
    page.getByRole('button', {
      name: /add pigmy/i
    })
  ).toBeVisible({
    timeout: 30000
  });

  console.log('Pigmy page opened');
}

// =====================================
// OPEN ADD PIGMY FORM
// =====================================

async function openAddPigmy(page) {
  await page.getByRole('button', {
    name: /add pigmy/i
  }).click();

  const dialog = page
    .locator('[role="dialog"], .ant-modal')
    .filter({
      hasText: 'Add Pigmy'
    });

  // Some application modals are plain divs.
  if (await dialog.count() === 1) {
    await expect(dialog).toBeVisible({
      timeout: 15000
    });

    console.log('Add Pigmy form opened');

    return dialog;
  }

  const title = page.getByText(
    'Add Pigmy',
    { exact: true }
  );

  await expect(title).toBeVisible({
    timeout: 15000
  });

  // Locate the visible form container.
  const form = title.locator(
    'xpath=ancestor::*[.//button[normalize-space()="Save Pigmy"]][1]'
  );

  await expect(form).toBeVisible();

  console.log('Add Pigmy form opened');

  return form;
}

// =====================================
// FIELD HELPERS
// =====================================

// Find a field by its visible label.
// Supports required-field asterisks.
function fieldLabel(form, name) {
  return form.locator('label').filter({
    hasText: new RegExp(
      '^\\s*' +
      name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
      '\\s*\\*?\\s*$',
      'i'
    )
  }).first();
}

// Find the first input associated with a label.
// This uses the visual field order shown in
// the supplied Add Pigmy screenshots.
function fieldInput(form, name) {
  const label = fieldLabel(form, name);

  return label.locator(
    'xpath=following::input[1]'
  );
}

// =====================================
// SEARCHABLE DROPDOWN HELPER
// =====================================
async function selectDropdown(
  page,
  form,
  labelName,
  optionText
) {
  console.log(
    `Selecting ${labelName}: ${optionText}`
  );

  const label = fieldLabel(form, labelName);

  await expect(label).toBeVisible({
    timeout: 10000
  });

  // Find the Ant Design select container
  // associated with this field label.
  const selectContainer = label.locator(
    'xpath=following::*[contains(concat(" ", normalize-space(@class), " "), " ant-select ")][1]'
  );

  await expect(selectContainer).toBeVisible({
    timeout: 10000
  });

  // Click the visible outer selection area,
  // not the search input underneath it.
  const selector = selectContainer.locator(
    '.ant-select-selector'
  );

  await expect(selector).toBeVisible();

  await selector.click();

  console.log(
    `${labelName} dropdown opened`
  );

  // Search input inside the opened dropdown.
  const searchInput = selectContainer.locator(
    'input.ant-select-selection-search-input'
  );

  await expect(searchInput).toBeAttached();

  // Search using customer ID for customer dropdown.
  const searchText =
    labelName.toLowerCase().includes('customer')
      ? optionText.split('|')[0].trim()
      : optionText;

  await searchInput.fill(searchText);

  console.log(
    `Searching dropdown for: ${searchText}`
  );

  // Ant Design renders dropdown options
  // in a popup outside the form.
  const dropdown = page.locator(
    '.ant-select-dropdown:visible'
  );

  await expect(dropdown).toBeVisible({
    timeout: 10000
  });

  const options = dropdown.locator(
    '.ant-select-item-option'
  );

  const matchingOptions = options.filter({
    hasText: optionText
  });

  await expect(matchingOptions).toHaveCount(1, {
    timeout: 15000
  });

  await matchingOptions.click();

  console.log(
    `${labelName} selected successfully`
  );
}
// =====================================
// FILL INPUT FIELD
// =====================================

async function fillField(
  form,
  labelName,
  value
) {
  const input = fieldInput(form, labelName);

  await expect(input).toBeVisible({
    timeout: 10000
  });

  await input.fill(String(value));

  console.log(
    `${labelName}: ${value}`
  );
}

// =====================================
// SELECT DURATION
// =====================================
async function selectDuration(page, form, value) {
  console.log(`Selecting Duration: ${value}`);

  const label = fieldLabel(form, 'Duration');

  await expect(label).toBeVisible({
    timeout: 10000
  });

  // Locate the Duration dropdown container.
  const selectContainer = label.locator(
    'xpath=following::*[contains(concat(" ", normalize-space(@class), " "), " ant-select ")][1]'
  );

  await expect(selectContainer).toBeVisible({
    timeout: 10000
  });

  // Click the visible dropdown selector.
  const selector = selectContainer.locator(
    '.ant-select-selector'
  );

  await expect(selector).toBeVisible();

  await selector.click();

  console.log('Duration dropdown opened');

  // Select only from the visible dropdown options.
  // This avoids matching the already-selected value.
  const dropdown = page.locator(
    '.ant-select-dropdown:visible'
  );

  await expect(dropdown).toBeVisible({
    timeout: 10000
  });

  const option = dropdown
    .locator('.ant-select-item-option')
    .filter({
      hasText: value
    });

  await expect(option).toHaveCount(1, {
    timeout: 10000
  });

  await option.click();

  console.log(`Duration selected: ${value}`);
}
// =====================================
// SET WHATSAPP CHECKBOX
// =====================================

async function setWhatsApp(form) {
  const checkbox = form
    .locator('input[type="checkbox"]')
    .last();

  await expect(checkbox).toBeAttached();

  await checkbox.setChecked(
    ENABLE_WHATSAPP
  );

  console.log(
    'WhatsApp Sending:',
    ENABLE_WHATSAPP
  );
}

// =====================================
// FILL ADD PIGMY FORM
// =====================================

async function fillPigmyForm(
  page,
  form
) {
  console.log('Starting Pigmy form entry');

  // 1. Customer
  await selectDropdown(
    page,
    form,
    'Select customer Name',
    CUSTOMER
  );

  // 2. Payment type
  await selectDropdown(
    page,
    form,
    'Select Payment Type',
    PAYMENT_TYPE
  );

  // 3. Referred type
  await selectDropdown(
    page,
    form,
    'Referred Type',
    REFERRED_TYPE
  );

  // 4. Interest
  await fillField(
    form,
    'Interest %',
    INTEREST
  );

  // 5. Start date
  await fillField(
    form,
    'Start Date',
    START_DATE
  );

  // 6. Duration
  await selectDuration(
    page,
    form,
    DURATION
  );

  // 7. Payable amount
  await fillField(
    form,
    'Payable Amount',
    PAYABLE_AMOUNT
  );

  // 8. Note
  await fillField(
    form,
    'Note',
    NOTE
  );

  // 9. WhatsApp
  await setWhatsApp(form);

  console.log('All Pigmy details entered');
}

// =====================================
// SAVE PIGMY
// =====================================

async function savePigmy(
  page,
  form
) {
  const saveButton = form.getByRole(
    'button',
    { name: /save pigmy/i }
  );

  await expect(saveButton).toBeVisible({
    timeout: 10000
  });

  await expect(saveButton).toBeEnabled();

  if (!ENABLE_SUBMIT) {
    console.log(
      '[DRY RUN] Pigmy form completed'
    );

    console.log(
      'ENABLE_PIGMY_SUBMIT=false'
    );

    console.log(
      'Save Pigmy was not clicked'
    );

    return;
  }

  console.log('Clicking Save Pigmy');

  await saveButton.click();

  // Wait for a successful close or success alert.
  const successMessage = page
    .locator(
      '.ant-message-success, ' +
      '.ant-notification-notice-success, ' +
      '[role="alert"]'
    )
    .filter({
      hasText: /success|created|saved/i
    });

  const result = await Promise.race([
    form.waitFor({
      state: 'hidden',
      timeout: 30000
    }).then(() => 'closed').catch(() => null),

    successMessage.first().waitFor({
      state: 'visible',
      timeout: 30000
    }).then(() => 'success').catch(() => null)
  ]);

  if (!result) {
    throw new Error(
      'Save Pigmy was clicked, but no ' +
      'success confirmation was detected. ' +
      'Check the application and test report.'
    );
  }

  console.log(
    'Pigmy submission confirmation detected:',
    result
  );
}

// =====================================
// MAIN TEST
// =====================================

test(
  'Create Pigmy in MyChits Admin',
  async ({ page }) => {
    page.setDefaultTimeout(15000);

    validateConfig();

    await login(page);

    await openPigmy(page);

    const form = await openAddPigmy(page);

    await fillPigmyForm(page, form);

    await savePigmy(page, form);

    console.log(
      'Pigmy creation test completed'
    );
  }
);
