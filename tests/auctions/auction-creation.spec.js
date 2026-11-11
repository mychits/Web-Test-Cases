
require('dotenv').config();

const { test, expect } = require('@playwright/test');

// ==========================================
// ENVIRONMENT CONFIGURATION
// ==========================================

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

if (!BASE_URL || !ADMIN_ID || !OTP || !BRANCH_NAME) {
  throw new Error(
    'Missing login configuration in .env'
  );
}

if (
  !AUCTION_GROUP ||
  !AUCTION_DATE ||
  !AUCTION_TIME ||
  !NEXT_AUCTION_DATE ||
  !NEXT_AUCTION_TIME
) {
  throw new Error(
    'Missing auction configuration in .env'
  );
}

const ROOT_URL = BASE_URL.replace(/\/+$/, '') + '/';

const AUCTION_URL = new URL(
  'auction',
  ROOT_URL
).href;

test.setTimeout(180000);

// ==========================================
// GENERAL HELPER
// ==========================================

async function isVisible(locator) {
  return locator.first().isVisible().catch(() => false);
}

// ==========================================
// STEP 1: ADMIN LOGIN
// ==========================================

async function login(page) {
  console.log('Opening MyChits Admin');

  await page.goto(ROOT_URL, {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });

  const loginHeading = page.getByRole('heading', {
    name: /admin login/i
  });

  if (!(await isVisible(loginHeading))) {
    console.log(
      'Login form not displayed; checking session'
    );

    await page.goto(AUCTION_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    const auctionButton = page.getByRole('button', {
      name: /add auction/i
    });

    if (await isVisible(auctionButton)) {
      console.log('Existing login session detected');
      return;
    }

    throw new Error(
      'Admin login form and Auctions page are not visible. ' +
      'Check the current page and authentication state.'
    );
  }

  console.log('Admin Login page opened');

  // Select branch.
  await page.locator('select').first().selectOption({
    label: BRANCH_NAME
  });

  console.log(`Branch selected: ${BRANCH_NAME}`);

  // Enter Admin ID.
  await page.getByPlaceholder('XXX-XX-XXXX')
    .fill(ADMIN_ID);

  // Request OTP.
  await page.getByRole('button', {
    name: /send otp/i
  }).click();

  console.log('OTP requested');

  // Locate OTP inputs.
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
      throw new Error(
        'OTP must contain exactly six digits'
      );
    }

    for (let i = 0; i < 6; i++) {
      await otpInputs.nth(i).fill(String(OTP)[i]);
    }
  } else {
    throw new Error(
      `Unexpected OTP input count: ${count}`
    );
  }

  // Complete login.
  await page.getByRole('button', {
    name: /verify otp|verify|login|submit/i
  }).last().click();

  await expect(loginHeading).toBeHidden({
    timeout: 30000
  });

  console.log('Admin login successful');
}

// ==========================================
// STEP 2: OPEN AUCTIONS PAGE
// ==========================================

async function openAuctions(page) {
  await page.goto(AUCTION_URL, {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });

  const addAuctionButton = page.getByRole('button', {
    name: /add auction/i
  });

  await expect(addAuctionButton).toBeVisible({
    timeout: 30000
  });

  console.log('Auctions page opened');
}

// ==========================================
// STEP 3: OPEN ADD AUCTION FORM
// ==========================================

async function openAddAuction(page) {
  const addAuctionButton = page.getByRole('button', {
    name: /add auction/i
  });

  await addAuctionButton.click();

  const saveButton = page.getByRole('button', {
    name: /^save auction$/i
  });

  await expect(saveButton).toBeVisible({
    timeout: 15000
  });

  // Scope to the closest container holding
  // the Save Auction button and Add Auction title.
  const modal = saveButton.locator(
    'xpath=ancestor::div[' +
    './/*[normalize-space(text())="Add Auction"]' +
    '][1]'
  );

  await expect(modal).toBeVisible({
    timeout: 15000
  });

  console.log('Add Auction form opened');

  return modal;
}

// ==========================================
// STEP 4: SELECT AUCTION GROUP
// ==========================================

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

  const option = page.getByText(
    AUCTION_GROUP,
    { exact: true }
  ).filter({
    visible: true
  }).last();

  await expect(option).toBeVisible({
    timeout: 15000
  });

  await option.click();

  console.log(
    `Group selected successfully: ${AUCTION_GROUP}`
  );

  // Check auto-populated fields.
  const groupValue = modal.getByText(
    /group value/i
  ).first();

  const groupInstallment = modal.getByText(
    /group installment/i
  ).first();

  await expect(groupValue).toBeVisible();
  await expect(groupInstallment).toBeVisible();

  console.log(
    'Group Value and Group Installment fields displayed'
  );
}

// ==========================================
// STEP 5: FILL AUCTION DATES AND TIMES
// ==========================================

async function fillAuctionSchedule(modal) {
  console.log('Entering auction schedule');

  const dateInputs = modal.locator(
    'input[type="date"]'
  );

  const timeInputs = modal.locator(
    'input[type="time"]'
  );

  await expect(dateInputs).toHaveCount(2, {
    timeout: 15000
  });

  await expect(timeInputs).toHaveCount(2, {
    timeout: 15000
  });

  // Current auction date.
  await dateInputs.nth(0).fill(AUCTION_DATE);

  // Current auction time.
  await timeInputs.nth(0).fill(AUCTION_TIME);

  // Next auction date.
  await dateInputs.nth(1).fill(NEXT_AUCTION_DATE);

  // Next auction time.
  await timeInputs.nth(1).fill(NEXT_AUCTION_TIME);

  await expect(dateInputs.nth(0))
    .toHaveValue(AUCTION_DATE);

  await expect(timeInputs.nth(0))
    .toHaveValue(AUCTION_TIME);

  await expect(dateInputs.nth(1))
    .toHaveValue(NEXT_AUCTION_DATE);

  await expect(timeInputs.nth(1))
    .toHaveValue(NEXT_AUCTION_TIME);

  console.log('Auction Date:', AUCTION_DATE);
  console.log('Auction Time:', AUCTION_TIME);
  console.log('Next Auction Date:', NEXT_AUCTION_DATE);
  console.log('Next Auction Time:', NEXT_AUCTION_TIME);

  console.log('Auction schedule entered successfully');
}

// ==========================================
// STEP 6: SAVE AUCTION
// ==========================================

async function saveAuction(page, modal) {
  const saveButton = modal.getByRole('button', {
    name: /^save auction$/i
  });

  await expect(saveButton).toBeVisible({
    timeout: 15000
  });

  await expect(saveButton).toBeEnabled();

  if (!ENABLE_SUBMIT) {
    console.log(
      '[DRY RUN] Auction form completed.'
    );

    console.log(
      'Set ENABLE_AUCTION_SUBMIT=true in .env ' +
      'to save the auction.'
    );

    return false;
  }

  console.log('Clicking Save Auction');

  await saveButton.click();

  await expect(saveButton).toBeHidden({
    timeout: 30000
  });

  console.log(
    'Save Auction completed; form closed'
  );

  return true;
}

// ==========================================
// STEP 7: VERIFY AUCTION
// ==========================================

async function verifyAuction(page) {
  console.log('Verifying created auction');

  // Reload the Auctions page.
  await openAuctions(page);

  // Search the displayed auction list for the group.
  const table = page.locator('table').first();

  await expect(table).toBeVisible({
    timeout: 30000
  });

  const groupCell = table.getByText(
    AUCTION_GROUP,
    { exact: true }
  ).first();

  await expect(groupCell).toBeVisible({
    timeout: 30000
  });

  console.log(
    `Auction group found in list: ${AUCTION_GROUP}`
  );

  console.log('Auction creation verification completed');
}

// ==========================================
// COMPLETE AUCTION CREATION WORKFLOW
// ==========================================

async function createAuction(page) {
  await openAuctions(page);

  const modal = await openAddAuction(page);

  await selectAuctionGroup(page, modal);

  await fillAuctionSchedule(modal);

  const saved = await saveAuction(page, modal);

  if (saved) {
    await verifyAuction(page);
  }
}

// ==========================================
// MAIN PLAYWRIGHT TEST
// ==========================================

test('Create Auction in MyChits Admin', async ({
  page
}) => {
  page.setDefaultTimeout(15000);
  page.setDefaultNavigationTimeout(60000);

  try {
    // Login only once.
    await login(page);

    // Execute auction creation.
    await createAuction(page);

    console.log(
      'Auction creation workflow completed'
    );
  } catch (error) {
    console.error(
      'Auction creation failed:',
      error.message
    );

    console.error(
      'Current URL:',
      page.url()
    );

    await page.screenshot({
      path: 'auction-creation-error.png',
      fullPage: true
    }).catch(() => {});

    throw error;
  }
});
