
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

const CUSTOMER_NAME = (
  process.env.PIGMY_DELETE_CUSTOMER_NAME || ''
).trim();

const CUSTOMER_PHONE = (
  process.env.PIGMY_DELETE_CUSTOMER_PHONE || ''
).trim();

const PIGMY_ID = (
  process.env.PIGMY_DELETE_ID || ''
).trim();

const ENABLE_DELETE =
  process.env.ENABLE_PIGMY_DELETE === 'true';

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
    'PIGMY_DELETE_CUSTOMER_NAME',
    'PIGMY_DELETE_CUSTOMER_PHONE',
    'PIGMY_DELETE_ID'
  ];

  for (const key of required) {
    if (!String(process.env[key] || '').trim()) {
      throw new Error(
        `Missing .env variable: ${key}`
      );
    }
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
// FIND PIGMY TABLE
// =====================================

async function getPigmyTable(page) {
  const tables = page.locator('table');

  await expect.poll(
    async () => tables.count(),
    { timeout: 30000 }
  ).toBeGreaterThan(0);

  for (let i = 0; i < await tables.count(); i++) {
    const table = tables.nth(i);

    const headers = await table
      .locator('thead tr')
      .first()
      .locator('th')
      .allTextContents();

    const normalized = headers.map(
      text => text.trim().toLowerCase()
    );

    if (
      normalized.includes('pigme id') ||
      normalized.includes('pigmy id') ||
      normalized.includes('pigme id')
    ) {
      console.log('Pigmy table found');
      return table;
    }
  }

  throw new Error(
    'Could not identify Pigmy table'
  );
}

// =====================================
// FIND EXACT PIGMY RECORD
// =====================================

async function findPigmyRow(page) {
  console.log(
    `Searching Pigmy: ${CUSTOMER_NAME}`
  );

  const table = await getPigmyTable(page);

  const search = page.getByPlaceholder(
    /search/i
  ).filter({
    visible: true
  });

  if (await search.count() === 1) {
    await search.fill(CUSTOMER_PHONE);
    await search.press('Enter');

    console.log(
      'Search submitted:',
      CUSTOMER_PHONE
    );
  }

  const rows = table.locator('tbody tr');

  await expect.poll(
    async () => rows.count(),
    { timeout: 15000 }
  ).toBeGreaterThan(0);

  const matchingRows = rows
    .filter({ hasText: PIGMY_ID })
    .filter({ hasText: CUSTOMER_NAME })
    .filter({ hasText: CUSTOMER_PHONE });

  const count = await matchingRows.count();

  console.log('Matching Pigmy rows:', count);

  if (count === 0) {
    throw new Error(
      `Pigmy not found: ${PIGMY_ID}, ` +
      `${CUSTOMER_NAME}, ${CUSTOMER_PHONE}`
    );
  }

  if (count > 1) {
    throw new Error(
      'Multiple Pigmy records matched. ' +
      'Deletion stopped for safety.'
    );
  }

  const row = matchingRows.first();

  console.log(
    'Target Pigmy record:',
    await row.innerText()
  );

  return { row, table };
}

// =====================================
// OPEN THREE-DOT ACTION MENU
// =====================================

async function openActionMenu(page, row, table) {
  console.log('Opening Pigmy Actions menu');

  const headers = await table
    .locator('thead tr')
    .first()
    .locator('th')
    .allTextContents();

  const actionIndex = headers.findIndex(
    header =>
      header.trim().toLowerCase() === 'action' ||
      header.trim().toLowerCase() === 'actions'
  );

  if (actionIndex === -1) {
    throw new Error(
      'Action column not found'
    );
  }

  const actionCell = row
    .locator('td')
    .nth(actionIndex);

  await expect(actionCell).toBeVisible();

  // Try the Ant Design three-dot trigger.
  const svgTrigger = actionCell.locator(
    'svg.ant-dropdown-trigger'
  );

  if (await svgTrigger.count() === 1) {
    await svgTrigger.click();
  } else {
    // Alternative if the application uses a button.
    const button = actionCell.locator(
      'button, [role="button"]'
    );

    await expect(button).toHaveCount(1);
    await button.click();
  }

  console.log('Actions menu opened');

  const deleteOption = page.getByText(
    'Delete',
    { exact: true }
  ).filter({
    visible: true
  });

  await expect(deleteOption).toHaveCount(1, {
    timeout: 10000
  });

  await deleteOption.click();

  console.log('Delete option selected');
}

// =====================================
// CONFIRM DELETE DIALOG
// =====================================
async function confirmDeletion(page) {
  console.log('Delete confirmation opened');

  // Select only the actual dialog.
  // Do not include #modal-wrapper because
  // it contains the dialog and causes
  // a strict mode violation.
  const dialog = page.locator(
    '#modal-wrapper [role="dialog"]'
  ).filter({
    hasText: 'Delete Pigmy Customer'
  });

  await expect(dialog).toHaveCount(1, {
    timeout: 15000
  });

  await expect(dialog).toBeVisible({
    timeout: 15000
  });

  console.log('Delete dialog identified');

  // Verify the application is asking
  // for the correct customer name.
  const instruction = dialog.getByText(
    'Please enter',
    { exact: false }
  );

  await expect(instruction).toContainText(
    CUSTOMER_NAME
  );

  console.log(
    'Customer name verified:',
    CUSTOMER_NAME
  );

  // Enter the exact customer name.
  const nameInput = dialog.getByPlaceholder(
    'Enter the Pigmy Customer Name'
  );

  await expect(nameInput).toBeVisible({
    timeout: 10000
  });

  await nameInput.fill(CUSTOMER_NAME);

  await expect(nameInput).toHaveValue(
    CUSTOMER_NAME
  );

  console.log(
    'Confirmation name entered:',
    CUSTOMER_NAME
  );

  // Locate only the final Delete button
  // inside the confirmation dialog.
  const deleteButton = dialog.getByRole(
    'button',
    {
      name: 'Delete',
      exact: true
    }
  );

  await expect(deleteButton).toBeVisible();

  await expect(deleteButton).toBeEnabled();

  // Safety: Dry run
  if (!ENABLE_DELETE) {
    console.log(
      '[DRY RUN] Pigmy deletion prepared'
    );

    console.log(
      'ENABLE_PIGMY_DELETE=false'
    );

    console.log(
      'Final Delete button was not clicked'
    );

    return;
  }

  // Actual deletion
  console.log(
    'Clicking final Delete button'
  );

  await deleteButton.click();

  await expect(dialog).toBeHidden({
    timeout: 30000
  });

  console.log(
    'Delete confirmation dialog closed'
  );
}
// =====================================
// VERIFY DELETION
// =====================================

async function verifyDeletion(page) {
  console.log('Verifying Pigmy deletion');

  await page.reload({
    waitUntil: 'domcontentloaded'
  });

  const table = await getPigmyTable(page);

  const remaining = table.locator('tbody tr')
    .filter({ hasText: PIGMY_ID })
    .filter({ hasText: CUSTOMER_PHONE });

  await expect(remaining).toHaveCount(0, {
    timeout: 15000
  });

  console.log(
    'Target Pigmy record no longer visible'
  );
}

// =====================================
// MAIN TEST
// =====================================

test(
  'Delete Pigmy in MyChits Admin',
  async ({ page }) => {
    page.setDefaultTimeout(15000);

    validateConfig();

    await login(page);

    await openPigmy(page);

    const { row, table } =
      await findPigmyRow(page);

    await openActionMenu(
      page,
      row,
      table
    );

    await confirmDeletion(page);

    if (ENABLE_DELETE) {
      await verifyDeletion(page);
    }

    console.log(
      'Pigmy deletion test completed'
    );
  }
);
