
require('dotenv').config();

const { test, expect } = require('@playwright/test');

// ========================================
// CONFIGURATION
// ========================================

const BASE_URL = (process.env.BASE_URL || '')
  .trim()
  .replace(/\/+$/, '');

const VISITOR_URL = `${BASE_URL}/visitor-list`;

const VISITOR_NAME = (
  process.env.VISITOR_DELETE_NAME || ''
).trim();

const VISITOR_PHONE = (
  process.env.VISITOR_DELETE_PHONE || ''
).trim();

const ENABLE_DELETE =
  process.env.ENABLE_VISITOR_DELETE === 'true';

test.setTimeout(180000);

// ========================================
// VALIDATE ENVIRONMENT VARIABLES
// ========================================

function validateConfig() {
  const required = [
    'BASE_URL',
    'ADMIN_ID',
    'OTP',
    'BRANCH_NAME',
    'VISITOR_DELETE_NAME',
    'VISITOR_DELETE_PHONE'
  ];

  for (const key of required) {
    if (!String(process.env[key] || '').trim()) {
      throw new Error(
        `Missing .env variable: ${key}`
      );
    }
  }

  if (!/^\d{10}$/.test(VISITOR_PHONE)) {
    throw new Error(
      'VISITOR_DELETE_PHONE must contain 10 digits'
    );
  }

  console.log('Environment configuration validated');
  console.log('Target Visitor:', VISITOR_NAME);
  console.log('Target Phone:', VISITOR_PHONE);
  console.log(
    'Deletion Enabled:',
    ENABLE_DELETE
  );
}

// ========================================
// ADMIN LOGIN
// ========================================

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

// ========================================
// OPEN VISITOR MANAGEMENT
// ========================================

async function openVisitorPage(page) {
  console.log('Opening Visitor Management');

  await page.goto(VISITOR_URL, {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });

  await expect(
    page.getByText('Visitor Management', {
      exact: true
    }).first()
  ).toBeVisible({
    timeout: 30000
  });

  await expect(
    page.getByRole('button', {
      name: /add details/i
    }).first()
  ).toBeVisible({
    timeout: 30000
  });

  console.log('Visitor Management opened');
}

// ========================================
// IDENTIFY VISITOR TABLE
// ========================================

async function getVisitorTable(page) {
  const tables = page.locator('table');

  await expect.poll(
    async () => tables.count(),
    { timeout: 30000 }
  ).toBeGreaterThan(0);

  for (
    let i = 0;
    i < await tables.count();
    i++
  ) {
    const table = tables.nth(i);

    const headers = await table
      .locator('thead tr')
      .first()
      .locator('th')
      .allTextContents();

    const normalized = headers.map(
      h => h.trim().toLowerCase()
    );

    if (
      normalized.includes('visitor code') &&
      normalized.includes('visitor name')
    ) {
      console.log('Visitor table found');
      return table;
    }
  }

  throw new Error(
    'Could not identify Visitor table'
  );
}

// ========================================
// GET COLUMN INDEX
// ========================================

async function getColumnIndex(table, columnName) {
  const headers = await table
    .locator('thead tr')
    .first()
    .locator('th')
    .allTextContents();

  const index = headers.findIndex(
    h =>
      h.trim().toLowerCase() ===
      columnName.toLowerCase()
  );

  if (index === -1) {
    throw new Error(
      `Column not found: ${columnName}`
    );
  }

  return index;
}

// ========================================
// FIND AUTOMATED VISITOR
// ========================================


async function findVisitorRow(page) {
  console.log(
    `Searching automated visitor: ${VISITOR_NAME}`
  );

  const table = await getVisitorTable(page);

  const search = page.getByPlaceholder(
    /search/i
  ).filter({
    visible: true
  }).first();

  await expect(search).toBeVisible();

  // Search by the visitor's phone number.
  await search.fill(VISITOR_PHONE);

  console.log(
    'Searching by phone:',
    VISITOR_PHONE
  );

  const rows = table.locator('tbody tr');

  // Match both visitor name and phone number.
  const matchingRows = rows
    .filter({ hasText: VISITOR_NAME })
    .filter({ hasText: VISITOR_PHONE });

  await expect.poll(
    async () => matchingRows.count(),
    {
      timeout: 15000,
      message:
        `Waiting for ${VISITOR_NAME} (${VISITOR_PHONE})`
    }
  ).toBe(1);

  const count = await matchingRows.count();

  if (count !== 1) {
    throw new Error(
      `Expected one visitor, found ${count}`
    );
  }

  const row = matchingRows.first();

  const codeIndex = await getColumnIndex(
    table,
    'Visitor Code'
  );

  const generatedCode = (
    await row.locator('td')
      .nth(codeIndex)
      .innerText()
  ).trim();

  if (!generatedCode) {
    throw new Error(
      'Visitor code was not found'
    );
  }

  console.log('Automated visitor found');
  console.log('Visitor Code:', generatedCode);
  console.log('Visitor Name:', VISITOR_NAME);
  console.log('Phone Number:', VISITOR_PHONE);

  return {
    row,
    table,
    generatedCode
  };
}
// ========================================
// OPEN THREE-DOT ACTIONS MENU
// ========================================

async function openDeleteMenu(page, row, table) {
  console.log('Opening three-dot Actions menu');

  const actionIndex = await getColumnIndex(
    table,
    'Action'
  );

  const actionCell = row
    .locator('td')
    .nth(actionIndex);

  await expect(actionCell).toBeVisible();

  const svg = actionCell.locator(
    'svg.ant-dropdown-trigger'
  );

  if (await svg.count() === 1) {
    await svg.click();
  } else {
    const button = actionCell.locator(
      'button, [role="button"]'
    );

    if (await button.count() === 1) {
      await button.click();
    } else {
      const clickable = actionCell.locator(
        'svg, button, [role="button"]'
      ).first();

      await expect(clickable).toBeVisible();
      await clickable.click();
    }
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

  console.log('Delete option found');

  return deleteOption;
}

// ========================================
// DELETE VISITOR
// HANDLE BROWSER CONFIRMATION
// ========================================

async function deleteVisitor(page, deleteOption) {
  console.log('Preparing visitor deletion');

  const dialogPromise = page.waitForEvent(
    'dialog',
    { timeout: 15000 }
  );

  console.log('Clicking Delete option');

  // Do not await click before handling dialog:
  // browser dialogs block the click until handled.
  const clickPromise = deleteOption.click();

  const dialog = await dialogPromise;

  const message = dialog.message();

  console.log(
    'Browser confirmation:',
    message
  );

  if (
    !/are you sure you want to delete this visitor/i
      .test(message)
  ) {
    await dialog.dismiss();
    await clickPromise;

    throw new Error(
      `Unexpected confirmation message: ${message}`
    );
  }

  if (!ENABLE_DELETE) {
    console.log(
      '[DRY RUN] Clicking Cancel'
    );

    await dialog.dismiss();
    await clickPromise;

    console.log(
      '[DRY RUN] Visitor was not deleted'
    );

    return;
  }

  console.log(
    'Clicking OK to delete visitor'
  );

  await dialog.accept();
  await clickPromise;

  console.log(
    'Delete confirmation accepted'
  );
}

// ========================================
// VERIFY VISITOR DELETION
// ========================================

async function verifyDeletion(
  page,
  generatedCode
) {
  console.log(
    'Verifying automated visitor deletion'
  );

  await page.reload({
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });

  await expect(
    page.getByText('Visitor Management', {
      exact: true
    }).first()
  ).toBeVisible({
    timeout: 30000
  });

  const table = await getVisitorTable(page);

  const search = page.getByPlaceholder(
    /search/i
  ).filter({
    visible: true
  }).first();

  await expect(search).toBeVisible();

  await search.fill(generatedCode);

  const codeIndex = await getColumnIndex(
    table,
    'Visitor Code'
  );

  const remaining = table.locator('tbody tr')
    .filter({
      has: page.locator('td')
        .nth(codeIndex)
        .getByText(generatedCode, {
          exact: true
        })
    });

  await expect(remaining).toHaveCount(0, {
    timeout: 15000
  });

  console.log(
    'Automated visitor deleted successfully'
  );
}

// ========================================
// MAIN TEST
// ========================================

test(
  'Delete Visitor in MyChits Admin',
  async ({ page }) => {
    page.setDefaultTimeout(15000);

    validateConfig();

    await login(page);

    await openVisitorPage(page);

    const {
      row,
      table,
      generatedCode
    } = await findVisitorRow(page);

    const deleteOption =
      await openDeleteMenu(
        page,
        row,
        table
      );

    await deleteVisitor(
      page,
      deleteOption
    );

    if (ENABLE_DELETE) {
      await verifyDeletion(
        page,
        generatedCode
      );
    }

    console.log(
      'Visitor deletion automation completed'
    );
  }
);
