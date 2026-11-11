
require('dotenv').config();

const { test, expect } = require('@playwright/test');

// ======================================
// ENVIRONMENT VARIABLES
// ======================================

const BASE_URL = process.env.BASE_URL;
const ADMIN_ID = process.env.ADMIN_ID;
const OTP = process.env.OTP;
const BRANCH_NAME = process.env.BRANCH_NAME;

const AUCTION_GROUP = process.env.AUCTION_GROUP;
const AUCTION_DATE = process.env.AUCTION_DATE;

const DELETE_CONFIRM =
  process.env.DELETE_AUCTION_CONFIRM === 'YES';

const ROOT_URL = (BASE_URL || '').replace(/\/+$/, '');
const AUCTION_URL = `${ROOT_URL}/auction`;

test.setTimeout(180000);

// ======================================
// VALIDATE CONFIGURATION
// ======================================

function validateConfig() {
  const required = {
    BASE_URL,
    ADMIN_ID,
    OTP,
    BRANCH_NAME,
    AUCTION_GROUP,
    AUCTION_DATE
  };

  const missing = Object.entries(required)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length) {
    throw new Error(
      `Missing .env values: ${missing.join(', ')}`
    );
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(AUCTION_DATE)) {
    throw new Error('Invalid AUCTION_DATE format');
  }
}

// ======================================
// LOGIN
// ======================================

async function login(page) {
  console.log('Opening MyChits Admin');

  await page.goto(ROOT_URL, {
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
      throw new Error('OTP must contain 6 digits');
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

// ======================================
// OPEN AUCTIONS
// ======================================

async function openAuctions(page) {
  await page.goto(AUCTION_URL, {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });

  await expect(
    page.getByRole('button', {
      name: /add auction/i
    })
  ).toBeVisible({
    timeout: 30000
  });

  console.log('Auctions page opened');
}

// ======================================
// DATE MATCHING
// ======================================

function dateMatches(text, isoDate) {
  const [year, month, day] = isoDate.split('-');

  const formats = [
    `${year}-${month}-${day}`,
    `${day}/${month}/${year}`,
    `${month}/${day}/${year}`,
    `${day}-${month}-${year}`,
    `${month}-${day}-${year}`
  ];

  return formats.some(format => text.includes(format));
}

// ======================================
// FIND AUTOMATION AUCTION
// ======================================

async function findAuctionRow(page) {
  console.log(`Searching Group: ${AUCTION_GROUP}`);
  console.log(`Auction Date: ${AUCTION_DATE}`);

  const table = page.locator('table').first();

  await expect(table).toBeVisible({
    timeout: 30000
  });

  // Search when a search box is available.
  const searchInput = page.getByPlaceholder(
    /search/i
  ).filter({
    visible: true
  }).first();

  if (await searchInput.count()) {
    await searchInput.fill(AUCTION_GROUP);
  }

  const rows = table.locator('tbody tr');

  await expect.poll(
    async () => rows.count(),
    { timeout: 15000 }
  ).toBeGreaterThan(0);

  const count = await rows.count();

  console.log(`Visible rows: ${count}`);

  const matchingIndexes = [];

  for (let i = 0; i < count; i++) {
    const text = await rows.nth(i).innerText();

    if (
      text.includes(AUCTION_GROUP) &&
      dateMatches(text, AUCTION_DATE)
    ) {
      matchingIndexes.push(i);
    }
  }

  if (matchingIndexes.length === 0) {
    throw new Error(
      'No matching auction found in the displayed ' +
      'table. Check the full auction list, search ' +
      'filters, and pagination before retrying.'
    );
  }

  if (matchingIndexes.length > 1) {
    throw new Error(
      `${matchingIndexes.length} auctions match ` +
      'the group and date. Deletion stopped to ' +
      'avoid removing the wrong record.'
    );
  }

  const row = rows.nth(matchingIndexes[0]);

  console.log('Matching auction:', await row.innerText());

  return row;
}

// ======================================
// OPEN THREE-DOT ACTION MENU
// ======================================

async function openAuctionActions(row) {
  console.log('Opening auction action menu');

  const cells = row.locator('td');
  const lastCell = cells.last();

  const actionButton = lastCell.locator(
    'button, [role="button"]'
  ).first();

  if (await actionButton.count()) {
    await actionButton.click();
  } else {
    const clickable = lastCell.locator(
      '[class*="cursor-pointer"], svg'
    ).first();

    if (!(await clickable.count())) {
      throw new Error(
        'Auction three-dot action control not found'
      );
    }

    await clickable.click();
  }

  console.log('Auction action menu opened');
}

// ======================================
// DELETE AUCTION
// ======================================

async function deleteAuction(page, row) {
  await openAuctionActions(row);

  const deleteOption = page.getByText(
    'Delete',
    { exact: true }
  ).filter({
    visible: true
  }).first();

  await expect(deleteOption).toBeVisible({
    timeout: 10000
  });

  if (!DELETE_CONFIRM) {
    console.log(
      '[DRY RUN] Matching auction found. ' +
      'Delete option is available.'
    );

    console.log(
      'Set DELETE_AUCTION_CONFIRM=YES to delete.'
    );

    return false;
  }

  await deleteOption.click();

  console.log('Delete confirmation opened');

  const confirmationText = page.getByText(
    /sure want to delete this auction/i
  );

  await expect(confirmationText).toBeVisible({
    timeout: 15000
  });

  const confirmationContainer = page.locator(
    '#modal-wrapper, [role="dialog"]'
  ).filter({
    has: confirmationText
  }).first();

  await expect(confirmationContainer).toBeVisible();

  const confirmButton =
    confirmationContainer.getByRole('button', {
      name: /^delete$/i
    });

  await expect(confirmButton).toBeVisible();

  await confirmButton.click();

  console.log('Delete confirmation submitted');

  await expect(confirmationText).toBeHidden({
    timeout: 30000
  });

  return true;
}

// ======================================
// VERIFY DELETION
// ======================================

async function verifyDeletion(page) {
  console.log('Verifying auction deletion');

  await openAuctions(page);

  const table = page.locator('table').first();

  await expect(table).toBeVisible({
    timeout: 30000
  });

  const searchInput = page.getByPlaceholder(
    /search/i
  ).filter({
    visible: true
  }).first();

  if (await searchInput.count()) {
    await searchInput.fill(AUCTION_GROUP);
  }

  const rows = table.locator('tbody tr');
  const count = await rows.count();

  for (let i = 0; i < count; i++) {
    const text = await rows.nth(i).innerText();

    if (
      text.includes(AUCTION_GROUP) &&
      dateMatches(text, AUCTION_DATE)
    ) {
      throw new Error(
        'Matching auction still appears in ' +
        'the displayed list after deletion.'
      );
    }
  }

  console.log(
    'Auction no longer appears in displayed list'
  );
}

// ======================================
// MAIN TEST
// ======================================

test('Delete Automation Auction in MyChits Admin',
  async ({ page }) => {

    page.setDefaultTimeout(15000);
    page.setDefaultNavigationTimeout(60000);

    validateConfig();

    try {
      await login(page);

      await openAuctions(page);

      const auctionRow = await findAuctionRow(page);

      const deleted = await deleteAuction(
        page,
        auctionRow
      );

      if (deleted) {
        await verifyDeletion(page);
        console.log('Auction deletion completed');
      } else {
        console.log(
          'Auction deletion dry run completed'
        );
      }

    } catch (error) {
      console.error(
        'Auction deletion failed:',
        error.message
      );

      console.error('Current URL:', page.url());

      await page.screenshot({
        path: 'auction-deletion-error.png',
        fullPage: true
      }).catch(() => {});

      throw error;
    }
  }
);
