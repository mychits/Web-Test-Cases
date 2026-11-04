
require('dotenv').config();

const { test, expect } = require('@playwright/test');
const customers = require('../../test-data/customers');

// =====================================
// ENVIRONMENT CONFIGURATION
// =====================================

const BASE_URL = process.env.BASE_URL;
const ADMIN_ID = process.env.ADMIN_ID;
const OTP = process.env.OTP;
const BRANCH_NAME = process.env.BRANCH_NAME;

// Safety: this version is preview-only.
// Even if DELETE_TEST_CUSTOMERS=true, no deletion occurs.
const DELETE_ENABLED = false;

if (!BASE_URL || !ADMIN_ID || !OTP || !BRANCH_NAME) {
  throw new Error('Missing environment variables. Check .env');
}

const CUSTOMER_URL = new URL('customer-menu', BASE_URL).href;

// =====================================
// CUSTOMER DATA VALIDATION
// =====================================

if (!Array.isArray(customers) || customers.length !== 10) {
  throw new Error(
    'Expected exactly 10 customers in test-data/customers.js'
  );
}

const normalize = value =>
  String(value || '').trim().replace(/\s+/g, ' ').toLowerCase();

const emails = customers.map(c => normalize(c.email));

if (
  emails.some(email => !email) ||
  new Set(emails).size !== 10
) {
  throw new Error(
    'All 10 customers must have unique, nonempty emails.'
  );
}

if (customers.some(c => !normalize(c.name))) {
  throw new Error('Every customer must have a name.');
}

test.setTimeout(600000);

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

  await expect(loginHeading).toBeVisible({
    timeout: 30000
  });

  await page.locator('select').first().selectOption({
    label: BRANCH_NAME
  });

  await page.getByPlaceholder('XXX-XX-XXXX')
    .fill(ADMIN_ID);

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
// CLOSE OPTIONAL POPUP
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

    console.log('Optional popup closed');
  }
}

// =====================================
// OPEN CUSTOMER MANAGEMENT
// =====================================

async function openCustomerManagement(page) {
  await page.goto(CUSTOMER_URL, {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });

  await closePopup(page);

  await expect(page).toHaveURL(/customer-menu/, {
    timeout: 30000
  });

  await expect(
    page.getByRole('button', {
      name: /add customer/i
    })
  ).toBeVisible({
    timeout: 30000
  });

  await expect(
    page.getByPlaceholder('Search...', { exact: true })
  ).toBeVisible({
    timeout: 30000
  });

  console.log('Customer Management opened');
}

// =====================================
// SEARCH CUSTOMER
// =====================================

async function searchCustomer(page, value) {
  const search = page.getByPlaceholder('Search...', {
    exact: true
  });

  await search.fill('');

  // Wait for the input to clear
  await expect(search).toHaveValue('');

  await search.fill(value);

  await expect(search).toHaveValue(value);

  // Allow the application's debounced search to run.
  // This is a short wait, not proof that results loaded.
  await page.waitForTimeout(700);

  return page.locator('tbody tr');
}

// =====================================
// READ SEARCH RESULTS
// =====================================

async function getMatchingRows(page, value) {
  const rows = await searchCustomer(page, value);
  const count = await rows.count();
  const results = [];

  for (let i = 0; i < count; i++) {
    const row = rows.nth(i);
    const text = await row.innerText();

    if (normalize(text).includes(normalize(value))) {
      results.push({
        index: i,
        text
      });
    }
  }

  return results;
}

// =====================================
// FIND CUSTOMER BY EMAIL OR NAME
// =====================================

async function findCustomerRow(page, customer) {
  const name = String(customer.name || '').trim();
  const email = normalize(customer.email);

  if (!name || !email) {
    throw new Error('Customer name or email is missing');
  }

  console.log('====================================');
  console.log('EXPECTED CUSTOMER NAME:', name);
  console.log('EXPECTED EMAIL:', email);
  console.log('====================================');

  // =====================================
  // STEP 1: SEARCH BY EMAIL
  // =====================================

  console.log(`Searching by email: ${email}`);

  let matches = await getMatchingRows(page, email);
  let method = 'email';

  // =====================================
  // STEP 2: FALLBACK TO NAME
  // =====================================

  if (matches.length === 0) {
    console.log('Email not found in visible results.');
    console.log(`Searching by name: ${name}`);

    matches = await getMatchingRows(page, name);
    method = 'name';
  }

  console.log('MATCHED USING:', method);
  console.log('MATCHING ROW COUNT:', matches.length);

  for (let i = 0; i < matches.length; i++) {
    console.log(
      `MATCHING ROW ${i + 1}:`,
      JSON.stringify(matches[i].text)
    );
  }

  // =====================================
  // VERIFY UNIQUE MATCH
  // =====================================

  if (matches.length === 0) {
    console.log(`[NOT FOUND] ${name}`);
    return {
      status: 'not_found',
      method,
      rowText: null
    };
  }

  if (matches.length > 1) {
    console.log(
      `[AMBIGUOUS] ${name}: ${matches.length} matching rows`
    );

    return {
      status: 'ambiguous',
      method,
      rowText: null
    };
  }

  const rowText = matches[0].text;

  console.log('ACTUAL CUSTOMER ROW:', JSON.stringify(rowText));

  const emailMatches = normalize(rowText).includes(email);
  const nameMatches = normalize(rowText).includes(normalize(name));

  if (method === 'email' && !emailMatches) {
    return {
      status: 'mismatch',
      method,
      rowText
    };
  }

  if (method === 'name' && !nameMatches) {
    return {
      status: 'mismatch',
      method,
      rowText
    };
  }

  // Email uniquely visible in the row is stronger evidence.
  // A unique name alone is not proof of identity.
  const status = emailMatches && nameMatches
    ? 'verified_name_and_email'
    : emailMatches
      ? 'email_match_name_unverified'
      : 'name_only';

  console.log('CUSTOMER MATCH STATUS:', status);

  return {
    status,
    method,
    rowText
  };
}

// =====================================
// PREVIEW CUSTOMER DELETION
// =====================================

async function deleteCustomer(page, customer) {
  const name = String(customer.name || '').trim();
  const email = normalize(customer.email);

  console.log('=====================================');
  console.log(`Finding customer: ${name}`);
  console.log('=====================================');

  const result = await findCustomerRow(page, customer);

  if (result.status === 'verified_name_and_email') {
    console.log(
      `[VERIFIED PREVIEW] ${name} (${email})`
    );
  } else {
    console.log(
      `[REVIEW REQUIRED] ${name} (${email}) - ${result.status}`
    );
  }

  if (!DELETE_ENABLED) {
    console.log(
      '[PREVIEW] No deletion performed.'
    );
    return result;
  }

  // Deliberately no live deletion logic in this version.
  throw new Error(
    'Deletion is disabled until identity checks and UI selectors are verified.'
  );
}

// =====================================
// MAIN PLAYWRIGHT TEST
// =====================================

test('Preview 10 automation customers for deletion', async ({ page }) => {
  page.setDefaultTimeout(15000);
  page.setDefaultNavigationTimeout(60000);

  console.log('PREVIEW MODE - No customers will be deleted');

  await test.step('Login to MyChits Admin', async () => {
    await login(page);
  });

  await test.step('Open Customer Management', async () => {
    await openCustomerManagement(page);
  });

  const summary = [];

  // Process all 10 customers sequentially
  for (let i = 0; i < customers.length; i++) {
    const customer = customers[i];

    await test.step(
      `Customer ${i + 1}: ${customer.name}`,
      async () => {
        const result = await deleteCustomer(page, customer);

        summary.push({
          name: customer.name,
          email: customer.email,
          status: result.status,
          matchedUsing: result.method
        });
      }
    );
  }

  console.log('====================================');
  console.log('CUSTOMER IDENTIFICATION SUMMARY');
  console.log('====================================');

  console.table(summary);

  const verified = summary.filter(
    item => item.status === 'verified_name_and_email'
  ).length;

  console.log(`Verified name + email: ${verified}/10`);
  console.log(`Require review: ${10 - verified}/10`);
  console.log('No customers were deleted.');
});
