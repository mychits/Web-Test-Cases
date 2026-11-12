
require('dotenv').config();

const { test, expect } = require('@playwright/test');

// =======================================
// VISITOR AUTOMATION CONFIGURATION
// =======================================

const BASE_URL = (process.env.BASE_URL || '')
  .trim()
  .replace(/\/+$/, '');

const VISITOR_URL = `${BASE_URL}/visitor-list`;

const VISITOR_TYPE =
  (process.env.VISITOR_TYPE || 'Guest').trim();

const VISITOR_NAME =
  (process.env.VISITOR_NAME || '').trim();

const VISITOR_EMAIL =
  (process.env.VISITOR_EMAIL || '').trim();

const VISITOR_PHONE =
  (process.env.VISITOR_PHONE || '').trim();

const VISITOR_PURPOSE =
  (process.env.VISITOR_PURPOSE || 'Pigmy Information').trim();

const VISITOR_DESCRIPTION =
  (process.env.VISITOR_DESCRIPTION || '').trim();

const VISITOR_MEET =
  (process.env.VISITOR_MEET || '').trim();

const VISITOR_DATE_TIME =
  (process.env.VISITOR_DATE_TIME || '').trim();

const ENABLE_SUBMIT =
  process.env.ENABLE_VISITOR_SUBMIT === 'true';

test.setTimeout(180000);

// =======================================
// VALIDATE CONFIGURATION
// =======================================

function validateConfig() {
  const required = [
    'BASE_URL',
    'ADMIN_ID',
    'OTP',
    'BRANCH_NAME',
    'VISITOR_NAME',
    'VISITOR_PHONE',
    'VISITOR_MEET'
  ];

  for (const key of required) {
    if (!String(process.env[key] || '').trim()) {
      throw new Error(`Missing .env variable: ${key}`);
    }
  }

  if (!/^\d{10}$/.test(VISITOR_PHONE)) {
    throw new Error(
      'VISITOR_PHONE must contain exactly 10 digits.'
    );
  }

  if (
    VISITOR_EMAIL &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(VISITOR_EMAIL)
  ) {
    throw new Error('Invalid VISITOR_EMAIL.');
  }

  if (
    VISITOR_DATE_TIME &&
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(
      VISITOR_DATE_TIME
    )
  ) {
    throw new Error(
      'VISITOR_DATE_TIME must be YYYY-MM-DDTHH:mm'
    );
  }
}

// =======================================
// ADMIN LOGIN
// =======================================

async function login(page) {
  console.log('Opening MyChits Admin');

  await page.goto(BASE_URL, {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });

  const loginHeading = page.getByRole('heading', {
    name: /admin login/i
  });

  if (await loginHeading.isVisible().catch(() => false)) {
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

    await expect(otpInputs.first()).toBeVisible({
      timeout: 30000
    });

    const count = await otpInputs.count();
    const otp = String(process.env.OTP);

    if (count === 1) {
      await otpInputs.first().fill(otp);
    } else if (count === 6 && otp.length === 6) {
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

// =======================================
// OPEN VISITOR MANAGEMENT
// =======================================

async function openVisitorPage(page) {
  console.log('Opening Visitor Details page');

  // Step 1: Open Visitor Details
  await page.goto(`${BASE_URL}/visitorsection`, {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });

  await expect(
    page.getByRole('heading', {
      name: 'Visitor Details',
      exact: true
    })
  ).toBeVisible({
    timeout: 30000
  });

  console.log('Visitor Details page opened');

  // Step 2: Open Visitor List using its known URL.
  await page.goto(`${BASE_URL}/visitor-list`, {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });

  await expect(page).toHaveURL(
    /\/visitor-list(?:[/?#]|$)/,
    { timeout: 30000 }
  );

  // Step 3: Verify Visitor Management loaded.
  await expect(
    page.getByText('Visitor Management', {
      exact: true
    }).first()
  ).toBeVisible({
    timeout: 30000
  });

  console.log('Visitor Management page opened');

  // Step 4: Find the Add Details button.
  const addDetailsButton = page.getByRole(
    'button',
    { name: /add details/i }
  );

  await expect(addDetailsButton).toBeVisible({
    timeout: 30000
  });

  console.log('Add Details button found');
}
// =======================================
// OPEN ADD VISITOR FORM
// =======================================
async function openAddVisitor(page) {
  console.log('Clicking Add Details');

  // Match both "Add Details" and "+ Add Details".
  const addButton = page.getByRole('button', {
    name: /add details/i
  });

  await expect(addButton).toBeVisible({
    timeout: 15000
  });

  await addButton.click();

  // Select only the actual dialog,
  // not its outer modal wrapper.
  const dialog = page.getByRole('dialog')
    .filter({
      hasText: 'Add Visitor'
    });

  await expect(dialog).toBeVisible({
    timeout: 15000
  });

  console.log('Add Visitor form opened');

  return dialog;
}
// =======================================
// LABEL HELPER
// =======================================

function fieldLabel(dialog, name) {
  return dialog.locator('label').filter({
    hasText: new RegExp(
      '^\\s*' +
      name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
      '\\s*\\*?\\s*$',
      'i'
    )
  }).first();
}

// =======================================
// ANT DESIGN DROPDOWN
// =======================================
async function selectDropdown(page, dialog, labelName, optionText) {
  console.log(`Selecting ${labelName}: ${optionText}`);

  const label = dialog.locator('label').filter({
    hasText: new RegExp(
      '^\\s*' +
      labelName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
      '\\s*\\*?\\s*$',
      'i'
    )
  }).first();

  await expect(label).toBeVisible();

  const select = label.locator(
    'xpath=following::*[contains(concat(" ", normalize-space(@class), " "), " ant-select ")][1]'
  );

  await expect(select).toBeVisible();

  // Click the visible dropdown container.
  await select.locator('.ant-select-selector').click();

  const dropdown = page.locator(
    '.ant-select-dropdown:visible'
  ).last();

  await expect(dropdown).toBeVisible();

  const searchInput = select.locator(
    'input.ant-select-selection-search-input'
  );

  if (await searchInput.count()) {
    const readOnly = await searchInput.getAttribute('readonly');

    if (readOnly === null) {
      await searchInput.fill(optionText);
    }
  }

  const option = dropdown.locator(
    '.ant-select-item-option'
  ).filter({
    has: page.locator('.ant-select-item-option-content')
      .getByText(optionText, { exact: true })
  });

  await expect(option).toHaveCount(1, {
    timeout: 15000
  });

  await option.click();

  console.log(`${labelName} selected successfully`);
}

// =======================================
// DATE & TIME
// =======================================

async function setDateTime(dialog) {
  const label = fieldLabel(dialog, 'Date & Time');

  await expect(label).toBeVisible();

  const input = label.locator(
    'xpath=following::input[1]'
  );

  await expect(input).toBeVisible();

  if (VISITOR_DATE_TIME) {
    await input.fill(VISITOR_DATE_TIME);
  } else {
    // The application supplies a default date/time.
    // Keep it rather than overwriting it.
    const currentValue = await input.inputValue();

    if (!currentValue) {
      throw new Error(
        'Date & Time is empty. Set VISITOR_DATE_TIME.'
      );
    }
  }

  console.log(
    'Date & Time:',
    await input.inputValue()
  );
}

// =======================================
// FILL VISITOR FORM
// =======================================
async function fillVisitorForm(page, dialog) {
  console.log('Starting Visitor form entry');

  // 1. Visitor Type
  await selectDropdown(
    page,
    dialog,
    'Visitor Type',
    VISITOR_TYPE
  );

  // 2. Visitor Name
  await dialog.getByPlaceholder(
    'Enter the Full Name'
  ).fill(VISITOR_NAME);

  console.log('Visitor Name:', VISITOR_NAME);

  // 3. Email
  if (VISITOR_EMAIL) {
    await dialog.getByPlaceholder(
      'Enter Email'
    ).fill(VISITOR_EMAIL);
  }

  // 4. Phone Number
  await dialog.getByPlaceholder(
    'Enter 10 digit Phone Number'
  ).fill(VISITOR_PHONE);

  console.log('Phone Number:', VISITOR_PHONE);

  // 5. Purpose of Visit
  await selectDropdown(
    page,
    dialog,
    'Purpose of Visit',
    VISITOR_PURPOSE
  );

  // 6. Description
  if (VISITOR_DESCRIPTION) {
    await dialog.getByPlaceholder(
      'Enter Description'
    ).fill(VISITOR_DESCRIPTION);
  }

  // 7. Date and Time
  await setDateTime(dialog);

  // 8. Whom to Meet
  await selectDropdown(
    page,
    dialog,
    'Whom to Meet',
    VISITOR_MEET
  );

  console.log('All Visitor details entered');
}
// =======================================
// SUBMIT VISITOR
// =======================================

async function submitVisitor(page, dialog) {
  const submitButton = dialog.getByRole(
    'button',
    {
      name: 'Submit Details',
      exact: true
    }
  );

  await expect(submitButton).toBeVisible();
  await expect(submitButton).toBeEnabled();

  if (!ENABLE_SUBMIT) {
    console.log('[DRY RUN] Visitor form completed');
    console.log('ENABLE_VISITOR_SUBMIT=false');
    console.log('Submit Details was not clicked');
    return;
  }

  console.log('Clicking Submit Details');

  await submitButton.click();

  await expect(dialog).toBeHidden({
    timeout: 30000
  });

  console.log('Visitor form closed after submission');
}

// =======================================
// MAIN TEST
// =======================================

test(
  'Add Visitor Details in MyChits Admin',
  async ({ page }) => {
    page.setDefaultTimeout(15000);

    validateConfig();

    await login(page);

    await openVisitorPage(page);

    const dialog = await openAddVisitor(page);

    await fillVisitorForm(page, dialog);

    await submitVisitor(page, dialog);

    console.log(
      'Visitor creation automation completed'
    );
  }
);
