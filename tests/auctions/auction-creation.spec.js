
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
const AUCTION_TIME = process.env.AUCTION_TIME;
const NEXT_AUCTION_DATE = process.env.NEXT_AUCTION_DATE;
const NEXT_AUCTION_TIME = process.env.NEXT_AUCTION_TIME;

const ENABLE_SUBMIT =
  process.env.ENABLE_AUCTION_SUBMIT === 'true';

test.setTimeout(180000);

const ROOT_URL = (BASE_URL || '').replace(/\/+$/, '');
const AUCTION_URL = `${ROOT_URL}/auction`;

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
    AUCTION_DATE,
    AUCTION_TIME,
    NEXT_AUCTION_DATE,
    NEXT_AUCTION_TIME
  };

  const missing = Object.entries(required)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length) {
    throw new Error(
      `Missing .env values: ${missing.join(', ')}`
    );
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
    console.log('Login page not displayed');
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

  const addAuction = page.getByRole('button', {
    name: /add auction/i
  });

  await expect(addAuction).toBeVisible({
    timeout: 30000
  });

  console.log('Auctions page opened');
}

// ======================================
// OPEN ADD AUCTION
// ======================================

async function openAddAuction(page) {
  await page.getByRole('button', {
    name: /add auction/i
  }).click();

  const modal = page.locator('#modal-wrapper');

  await expect(modal).toBeVisible({
    timeout: 15000
  });

  await expect(
    modal.getByRole('button', {
      name: /save auction/i
    })
  ).toBeVisible();

  console.log('Add Auction form opened');

  return modal;
}

// ======================================
// SELECT AUCTION GROUP
// ======================================
async function selectAuctionGroup(page, modal) {
  console.log(`Selecting Group: ${AUCTION_GROUP}`);

  const groupInput = modal.locator(
    'input:not([type="date"]):not([type="time"])'
  ).first();

  await expect(groupInput).toBeVisible({
    timeout: 15000
  });

  await groupInput.click();
  await groupInput.fill(AUCTION_GROUP);

  console.log('Group search text entered');

  // Search inside common dropdown containers.
  // Do not click a matching group in the background table.
  const dropdownOptions = page.locator(
    '.ant-select-dropdown:visible .ant-select-item-option, ' +
    '[role="listbox"]:visible [role="option"], ' +
    '[cmdk-item]:visible, ' +
    '[data-radix-popper-content-wrapper] [role="option"]'
  ).filter({
    hasText: AUCTION_GROUP
  });

  // Wait for the options to load.
  try {
    await expect(dropdownOptions.first()).toBeVisible({
      timeout: 10000
    });
  } catch {
    console.log(
      'Standard dropdown option not found. ' +
      'Inspecting visible modal elements.'
    );

    const details = await modal.evaluate(element => {
      return Array.from(
        element.querySelectorAll('*')
      )
        .filter(node => {
          const text = node.textContent?.trim() || '';

          return (
            text.includes('QA-AUTO-GROUP') &&
            node.getClientRects().length > 0
          );
        })
        .slice(-15)
        .map(node => ({
          tag: node.tagName,
          className:
            typeof node.className === 'string'
              ? node.className
              : '',
          text: node.textContent?.trim().slice(0, 150),
          html: node.outerHTML.slice(0, 500)
        }));
    });

    console.log(
      'GROUP DROPDOWN HTML:',
      JSON.stringify(details, null, 2)
    );

    throw new Error(
      'Group dropdown structure is not supported by ' +
      'the current locator. See GROUP DROPDOWN HTML.'
    );
  }

  const matchingCount = await dropdownOptions.count();

  if (matchingCount !== 1) {
    throw new Error(
      `Expected one matching Group option, ` +
      `found ${matchingCount}.`
    );
  }

  await dropdownOptions.first().click();

  console.log(
    `Group selected successfully: ${AUCTION_GROUP}`
  );

  await expect(
    modal.getByText(/group value/i).first()
  ).toBeVisible();

  await expect(
    modal.getByText(/group installment/i).first()
  ).toBeVisible();
}

// ======================================
// FILL AUCTION DATE AND TIME
// ======================================

async function fillAuctionSchedule(modal) {
  console.log('Entering auction schedule');

  const dateInputs = modal.locator('input[type="date"]');
  const timeInputs = modal.locator('input[type="time"]');

  await expect(dateInputs).toHaveCount(2);
  await expect(timeInputs).toHaveCount(2);

  await dateInputs.nth(0).fill(AUCTION_DATE);
  await timeInputs.nth(0).fill(AUCTION_TIME);

  await dateInputs.nth(1).fill(NEXT_AUCTION_DATE);
  await timeInputs.nth(1).fill(NEXT_AUCTION_TIME);

  await expect(dateInputs.nth(0))
    .toHaveValue(AUCTION_DATE);

  await expect(timeInputs.nth(0))
    .toHaveValue(AUCTION_TIME);

  await expect(dateInputs.nth(1))
    .toHaveValue(NEXT_AUCTION_DATE);

  await expect(timeInputs.nth(1))
    .toHaveValue(NEXT_AUCTION_TIME);

  console.log('Auction schedule entered successfully');
}

// ======================================
// SAVE AUCTION
// ======================================

async function saveAuction(modal) {
  if (!ENABLE_SUBMIT) {
    console.log('[DRY RUN] Auction form completed');
    console.log(
      'Set ENABLE_AUCTION_SUBMIT=true to save'
    );
    return false;
  }

  console.log('Clicking Save Auction');

  const saveButton = modal.getByRole('button', {
    name: /save auction/i
  });

  await expect(saveButton).toBeEnabled();

  await saveButton.click();

  await expect(modal).toBeHidden({
    timeout: 30000
  });

  console.log('Save Auction completed; form closed');

  return true;
}

// ======================================
// VERIFY AUCTION
// ======================================

async function verifyAuction(page) {
  console.log('Checking auction creation result');

  await openAuctions(page);

  const table = page.locator('table').first();

  await expect(table).toBeVisible({
    timeout: 30000
  });

  const rows = table.locator('tbody tr');
  const count = await rows.count();

  console.log(`Visible auction rows: ${count}`);

  const matchingRows = [];

  for (let i = 0; i < count; i++) {
    const row = rows.nth(i);
    const text = await row.innerText();

    if (
      text.includes(AUCTION_GROUP) &&
      text.includes(AUCTION_DATE)
    ) {
      matchingRows.push(text);
    }
  }

  if (matchingRows.length === 1) {
    console.log(
      'Auction found in the displayed list:',
      matchingRows[0]
    );

    console.log('Auction creation verified');
    return;
  }

  if (matchingRows.length > 1) {
    throw new Error(
      'Multiple auctions match the group and date. ' +
      'An exact Auction Code is required.'
    );
  }

  throw new Error(
    'Auction not found in the currently displayed table. ' +
    'The Save Auction action may have succeeded, ' +
    'but creation is not verified. ' +
    'Check the selected group and full auction list ' +
    'before rerunning.'
  );
}

// ======================================
// COMPLETE AUCTION CREATION WORKFLOW
// ======================================

async function createAuction(page) {
  await openAuctions(page);

  const modal = await openAddAuction(page);

  await selectAuctionGroup(page, modal);

  await fillAuctionSchedule(modal);

  const saved = await saveAuction(modal);

  if (saved) {
    await verifyAuction(page);
  }

  console.log('Auction creation workflow completed');
}

// ======================================
// MAIN TEST
// ======================================

test('Create Auction in MyChits Admin', async ({ page }) => {
  page.setDefaultTimeout(15000);
  page.setDefaultNavigationTimeout(60000);

  validateConfig();

  try {
    await login(page);

    await createAuction(page);
  } catch (error) {
    console.error(
      'Auction creation failed:',
      error.message
    );

    console.error('Current URL:', page.url());

    await page.screenshot({
      path: 'auction-creation-error.png',
      fullPage: true
    }).catch(() => {});

    throw error;
  }
});
