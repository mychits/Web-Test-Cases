
require('dotenv').config();

const { expect } = require('@playwright/test');

const BASE_URL = (process.env.BASE_URL || '').replace(/\/+$/, '');
const LOANS_URL = `${BASE_URL}/other-service-menu/loan`;

const PHONE = (process.env.LOAN_CUSTOMER_PHONE || '').trim();
const CUSTOMER = (process.env.LOAN_CUSTOMER_NAME || '').trim();
const LOAN_ID = (process.env.LOAN_TARGET_ID || '').trim();

const ENABLE_UPDATE =
  process.env.ENABLE_LOAN_STATUS_UPDATE === 'true';

// -------------------------------------
// Validate environment variables
// -------------------------------------
function validateConfig() {
  const required = [
    'BASE_URL',
    'ADMIN_ID',
    'OTP',
    'BRANCH_NAME',
    'LOAN_CUSTOMER_PHONE',
    'LOAN_CUSTOMER_NAME'
  ];

  for (const key of required) {
    if (!String(process.env[key] || '').trim()) {
      throw new Error(`Missing .env variable: ${key}`);
    }
  }
}

// -------------------------------------
// Login
// -------------------------------------
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

    await page.locator('select').first().selectOption({
      label: process.env.BRANCH_NAME
    });

    await page.getByPlaceholder('XXX-XX-XXXX')
      .fill(process.env.ADMIN_ID);

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

// -------------------------------------
// Open Loans page
// -------------------------------------
async function openLoans(page) {
  await page.goto(LOANS_URL, {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });

  await expect(
    page.getByRole('button', {
      name: /add loan/i
    })
  ).toBeVisible({ timeout: 30000 });

  console.log('Loans page opened');
}

// -------------------------------------
// Select status tab
// -------------------------------------
async function selectTab(page, status) {
  const patterns = {
    Requested: /^Requests\b/i,
    Pending: /^Pending\b/i,
    Rejected: /^Rejected\b/i
  };

  const pattern = patterns[status];

  if (!pattern) {
    throw new Error(`Unsupported status: ${status}`);
  }

  const tab = page.getByRole('tab', {
    name: pattern
  });

  if (await tab.count() === 1) {
    await tab.click();
  } else {
    const matches = page.getByText(pattern)
      .filter({ visible: true });

    await expect(matches).toHaveCount(1, {
      timeout: 10000
    });

    await matches.click();
  }

  console.log(`${status} tab selected`);
}

// -------------------------------------
// Find correct loan table
// -------------------------------------

async function getLoanTable(page) {
  console.log('Finding Loans table...');

  const tables = page.locator('table');

  await expect.poll(
    async () => tables.count(),
    { timeout: 30000 }
  ).toBeGreaterThan(0);

  const count = await tables.count();

  console.log('Total tables found:', count);

  for (let i = 0; i < count; i++) {
    const table = tables.nth(i);

    const headers = await table.locator('thead th')
      .allTextContents();

    console.log(
      `Table ${i} headers:`,
      headers
    );

    const headerText = headers
      .join(' ')
      .toLowerCase();

    if (
      headerText.includes('customer name') &&
      headerText.includes('phone number')
    ) {
      console.log(`Loans table found: table ${i}`);

      await expect(table).toBeVisible({
        timeout: 15000
      });

      return table;
    }
  }

  throw new Error(
    'Could not identify Loans table. ' +
    'Check the table headers printed above.'
  );
}
// -------------------------------------
// Search for the loan
// -------------------------------------
async function findLoanRow(page) {
  console.log(`Searching loan: ${CUSTOMER} (${PHONE})`);

  const search = page.getByPlaceholder(
    /search by customer name or phone number/i
  );

  await expect(search).toBeVisible({
    timeout: 15000
  });

  await search.fill(PHONE);

  const searchButton = page.locator('button')
    .filter({ hasText: /search/i })
    .filter({ visible: true });

  if (await searchButton.count() === 1) {
    await searchButton.click();
    console.log('Search button clicked');
  } else {
    await search.press('Enter');
    console.log('Search submitted with Enter');
  }

  const table = await getLoanTable(page);

  await expect(table).toBeVisible({
    timeout: 30000
  });

  const rows = table.locator('tbody tr');

  const matchingRows = rows
    .filter({ hasText: PHONE })
    .filter({ hasText: CUSTOMER });

  
const rowTexts = await rows.allInnerTexts();

console.log(
  'LOANS CURRENTLY DISPLAYED:',
  JSON.stringify(rowTexts, null, 2)
);

const matchingCount = await matchingRows.count();

console.log('Matching loans found:', matchingCount);

if (matchingCount === 0) {
  throw new Error(
    `Loan not found in Requests tab for ` +
    `${CUSTOMER} (${PHONE}). ` +
    `Check whether the new loan was saved ` +
    `and whether its status is Requested.`
  );
}

if (matchingCount > 1) {
  throw new Error(
    `Found ${matchingCount} loans for ` +
    `${CUSTOMER} (${PHONE}). ` +
    `Cannot safely choose which loan to update.`
  );
}


  const row = matchingRows.first();
  const rowText = await row.innerText();

  console.log('Matching loan:', rowText);

  // An optional loan ID can be verified if it is
  // actually displayed in the table row.
  if (LOAN_ID && !rowText.includes(LOAN_ID)) {
    throw new Error(
      `Loan ID ${LOAN_ID} is not visible in the row. ` +
      'The exact loan could not be verified. ' +
      'No status will be changed.'
    );
  }

  return { row, table };
}

// -------------------------------------
// Open Actions -> Update Status
// -------------------------------------
async function openStatusMenu(page, row, table) {
  console.log('Finding Actions control...');

  const headers = await table
    .locator('thead tr')
    .first()
    .locator('th')
    .allTextContents();

  const actionsIndex = headers.findIndex(
    header => header.trim().toLowerCase() === 'actions'
  );

  if (actionsIndex === -1) {
    throw new Error('Actions column not found');
  }

  const actionsCell = row.locator('td').nth(actionsIndex);

  await expect(actionsCell).toBeVisible({
    timeout: 10000
  });

  // Actual Actions control from your application's HTML.
  const actionsTrigger = actionsCell.locator(
    'svg.ant-dropdown-trigger'
  );

  await expect(actionsTrigger).toHaveCount(1, {
    timeout: 10000
  });

  await actionsTrigger.scrollIntoViewIfNeeded();

  await actionsTrigger.click();

  console.log('Three-dot Actions menu clicked');

  // Ant Design dropdown menu.
  const updateStatus = page
    .locator('.ant-dropdown:visible')
    .getByText('Update Status', { exact: true });

  await expect(updateStatus).toHaveCount(1, {
    timeout: 10000
  });

  await updateStatus.click();

  console.log('Update Status menu opened');
}

// -------------------------------------
// Change status
// -------------------------------------
async function changeStatus(page, source, target) {
  console.log(`Preparing ${source} -> ${target}`);

  await selectTab(page, source);

  const { row, table } = await findLoanRow(page);

  await openStatusMenu(page, row, table);

  const option = page.getByText(target, {
    exact: true
  }).filter({ visible: true });

  await expect(option).toHaveCount(1, {
    timeout: 10000
  });

  if (!ENABLE_UPDATE) {
    console.log(
      `[DRY RUN] Would change ${source} -> ${target}`
    );
    console.log('No status has been changed');
    return;
  }

  await option.click();

  console.log(`Clicked status: ${target}`);

  const destination =
    target === 'Reject' ? 'Rejected' : target;

  await selectTab(page, destination);

  const updated = await findLoanRow(page);

  console.log(
    `Loan verified under ${destination}:`,
    await updated.row.innerText()
  );
}

// -------------------------------------
// Export functions
// -------------------------------------
module.exports = {
  validateConfig,
  login,
  openLoans,
  changeStatus
};
