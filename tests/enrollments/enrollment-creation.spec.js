
require('dotenv').config();

const { test, expect } = require('@playwright/test');

// ==========================================
// ENVIRONMENT CONFIGURATION
// ==========================================

const BASE_URL = process.env.BASE_URL;
const ADMIN_ID = process.env.ADMIN_ID;
const OTP = process.env.OTP;
const BRANCH_NAME = process.env.BRANCH_NAME;

const GROUP_NAME = process.env.ENROLLMENT_GROUP;
const CUSTOMER_NAME = process.env.ENROLLMENT_CUSTOMER;

const PAYMENT_TYPE =
  process.env.ENROLLMENT_PAYMENT_TYPE || 'Daily';

const ASKING_MONTH =
  process.env.ENROLLMENT_MONTH || '2026-12';

const REFERRED_TYPE =
  process.env.ENROLLMENT_REFERRED_TYPE || 'Self Joining';

const TICKET_NAME =
  process.env.ENROLLMENT_TICKET || 'Ticket 6';

const ENABLE_SUBMIT =
  process.env.ENABLE_ENROLLMENT_SUBMIT === 'true';

if (!BASE_URL || !ADMIN_ID || !OTP || !BRANCH_NAME) {
  throw new Error('Missing login configuration in .env');
}

if (!GROUP_NAME || !CUSTOMER_NAME) {
  throw new Error('Missing enrollment Group or Customer');
}

if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(ASKING_MONTH)) {
  throw new Error('ENROLLMENT_MONTH must be YYYY-MM');
}

const ROOT_URL = BASE_URL.replace(/\/+$/, '') + '/';

const ENROLLMENT_URL = new URL(
  'enroll-menu/enrollment',
  ROOT_URL
).href;

test.setTimeout(300000);

// ==========================================
// HELPERS
// ==========================================

async function isVisible(locator) {
  return locator.first().isVisible().catch(() => false);
}

function escapeRegex(value) {
  return String(value).replace(
    /[.*+?^${}()|[\]\\]/g,
    '\\$&'
  );
}

function exactPattern(value) {
  return new RegExp(
    `^\\s*${escapeRegex(value)}\\s*$`,
    'i'
  );
}

function labelPattern(label) {
  return new RegExp(
    `^\\s*${escapeRegex(label)}\\s*\\*?\\s*$`,
    'i'
  );
}

async function closePopup(page) {
  const popup = page.locator(
    'div.fixed.inset-0.z-\\[9999\\]'
  ).first();

  if (!(await isVisible(popup))) return;

  const later = popup.getByRole('button', {
    name: /remind me later/i
  });

  if (await isVisible(later)) {
    await later.click();
    await expect(popup).toBeHidden();
  }
}

// ==========================================
// LOGIN ONCE
// ==========================================

async function login(page) {
  await page.goto(ROOT_URL, {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });

  const heading = page.getByRole('heading', {
    name: /admin login/i
  });

  if (!(await isVisible(heading))) {
    console.log('Existing login session detected');
    return;
  }

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
    await otpInputs.first().fill(String(OTP));
  } else if (count === 6) {
    if (String(OTP).length !== 6) {
      throw new Error('OTP must contain six digits');
    }

    for (let i = 0; i < 6; i++) {
      await otpInputs.nth(i).fill(String(OTP)[i]);
    }
  } else {
    throw new Error(`Unexpected OTP input count: ${count}`);
  }

  await page.getByRole('button', {
    name: /verify otp|verify|login|submit/i
  }).last().click();

  await expect(heading).toBeHidden({
    timeout: 30000
  });

  console.log('Login successful');
}

// ==========================================
// OPEN ENROLLMENTS
// ==========================================

async function openEnrollments(page) {
  await page.goto(ENROLLMENT_URL, {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });

  await closePopup(page);

  await expect(
    page.getByRole('button', {
      name: /add enrollment/i
    })
  ).toBeVisible({
    timeout: 30000
  });

  console.log('Enrollments page opened');
}

// ==========================================
// OPEN ADD ENROLLMENT MODAL
// ==========================================

async function openAddEnrollment(page) {
  await page.getByRole('button', {
    name: /add enrollment/i
  }).click();

  const modal = page.locator('#modal-wrapper');

  await expect(modal).toBeVisible({
    timeout: 15000
  });

  await expect(
    modal.getByText('Add Enrollment', {
      exact: true
    })
  ).toBeVisible({
    timeout: 15000
  });

  console.log('Add Enrollment modal opened');

  // Return the actual modal, not the entire page.
  return modal;
}

// ==========================================
// FIND FIELD CONTAINER
// ==========================================

async function findFieldContainer(modal, label) {
  const labelElement = modal.getByText(
    labelPattern(label)
  ).first();

  await expect(labelElement).toBeVisible({
    timeout: 15000
  });

  // Find the closest container containing a control.
  // All searches are restricted to the popup.
  const container = labelElement.locator(
    'xpath=ancestor::div[' +
    './/input or .//select or ' +
    './/div[contains(@class,"ant-select")]' +
    '][1]'
  );

  await expect(container).toBeVisible({
    timeout: 15000
  });

  return container;
}

// ==========================================
// FIND VISIBLE OPTION
// ==========================================

async function findOption(page, value) {
  const pattern = exactPattern(value);

  const option = page.locator(
    '.ant-select-dropdown:visible .ant-select-item-option, ' +
    '[role="listbox"] [role="option"], ' +
    '[cmdk-item], ' +
    '[data-radix-popper-content-wrapper] [role="option"]'
  ).filter({
    hasText: pattern
  }).filter({
    visible: true
  }).first();

  try {
    await expect(option).toBeVisible({
      timeout: 10000
    });

    return option;
  } catch {
    const fallback = page.getByText(pattern)
      .filter({ visible: true })
      .last();

    await expect(fallback).toBeVisible({
      timeout: 10000
    });

    return fallback;
  }
}

// ==========================================
// SELECT STANDARD DROPDOWN
// ==========================================

async function selectDropdown(page, modal, label, value) {
  console.log(`Selecting ${label}: ${value}`);

  const field = await findFieldContainer(
    modal,
    label
  );

  const nativeSelect = field.locator('select').first();

  if (await isVisible(nativeSelect)) {
    await nativeSelect.selectOption({
      label: value
    });

    console.log(`${label} selected: ${value}`);
    return;
  }

  const dropdown = field.locator(
    '.ant-select'
  ).first();

  await expect(dropdown).toBeVisible({
    timeout: 15000
  });

  const selector = dropdown.locator(
    '.ant-select-selector'
  ).first();

  if (await isVisible(selector)) {
    await selector.click();
  } else {
    await dropdown.click();
  }

  console.log(`${label} dropdown opened`);

  const option = await findOption(page, value);

  await option.click();

  console.log(
    `${label} selected successfully: ${value}`
  );
}

// ==========================================
// SELECT CUSTOMER
// ==========================================

async function selectCustomer(page, modal) {
  console.log(`Selecting Customer: ${CUSTOMER_NAME}`);

  await expect(
    modal.getByText(labelPattern('Customer')).first()
  ).toBeVisible({
    timeout: 15000
  });

  let customerInput = modal.locator(
    'input[placeholder*="customer" i], ' +
    'input[aria-label*="customer" i]'
  ).filter({
    visible: true
  }).last();

  if (!(await isVisible(customerInput))) {
    const field = await findFieldContainer(
      modal,
      'Customer'
    );

    customerInput = field.locator(
      'input'
    ).filter({
      visible: true
    }).first();
  }

  await expect(customerInput).toBeVisible({
    timeout: 15000
  });

  await customerInput.click();

  let option;

  try {
    option = await findOption(page, CUSTOMER_NAME);
  } catch {
    await customerInput.fill(CUSTOMER_NAME);

    option = await findOption(page, CUSTOMER_NAME);
  }

  await option.click();

  console.log(
    `Customer selected successfully: ${CUSTOMER_NAME}`
  );
}

// ==========================================
// PAYMENT TYPE - CORRECTED
// ==========================================

async function selectPaymentType(page, modal) {
  console.log(`Selecting Payment Type: ${PAYMENT_TYPE}`);

  // Search only inside Add Enrollment.
  // Never match the enrollment table heading.
  const label = modal.getByText(
    labelPattern('Payment Type')
  ).first();

  await expect(label).toBeVisible({
    timeout: 15000
  });

  const field = await findFieldContainer(
    modal,
    'Payment Type'
  );

  const nativeSelect = field.locator(
    'select'
  ).first();

  if (await isVisible(nativeSelect)) {
    await nativeSelect.selectOption({
      label: PAYMENT_TYPE
    });

    console.log(
      `Payment Type selected successfully: ${PAYMENT_TYPE}`
    );
    return;
  }

  const dropdown = field.locator(
    '.ant-select'
  ).first();

  await expect(dropdown).toBeVisible({
    timeout: 15000
  });

  const selector = dropdown.locator(
    '.ant-select-selector'
  ).first();

  await expect(selector).toBeVisible({
    timeout: 15000
  });

  await selector.click();

  console.log('Payment Type dropdown opened');

  const option = await findOption(
    page,
    PAYMENT_TYPE
  );

  await option.click();

  console.log(
    `Payment Type selected successfully: ${PAYMENT_TYPE}`
  );
}

// ==========================================
// CHIT ASKING MONTH
// ==========================================

async function fillAskingMonth(modal) {
  const field = await findFieldContainer(
    modal,
    'Chit Asking Month'
  );

  const input = field.locator('input').first();

  await expect(input).toBeVisible({
    timeout: 15000
  });

  const type = await input.getAttribute('type');

  if (type === 'month') {
    await input.fill(ASKING_MONTH);
  } else if (type === 'date') {
    await input.fill(`${ASKING_MONTH}-01`);
  } else {
    const [year, month] = ASKING_MONTH.split('-');

    const formatted = new Date(
      Number(year),
      Number(month) - 1,
      1
    ).toLocaleString('en-US', {
      month: 'long',
      year: 'numeric'
    });

    await input.fill(formatted);
    await input.press('Tab');
  }

  console.log(
    `Chit Asking Month entered: ${ASKING_MONTH}`
  );
}

// ==========================================
// REFERRED TYPE
// ==========================================

async function selectReferredType(page, modal) {
  await selectDropdown(
    page,
    modal,
    'Referred Type',
    REFERRED_TYPE
  );
}

// ==========================================
// SELECT TICKET BEFORE VERIFY
// ==========================================
async function selectTicket(page, modal) {
  console.log(`Selecting ticket: ${TICKET_NAME}`);

  const field = await findFieldContainer(
    modal,
    'Select Tickets'
  );

  // Check native select first.
  const nativeSelect = field.locator('select').first();

  if (await isVisible(nativeSelect)) {
    const available = await nativeSelect.locator('option')
      .allTextContents();

    console.log('Available tickets:', available);

    if (!available.some(
      text => text.trim().toLowerCase() ===
        TICKET_NAME.toLowerCase()
    )) {
      throw new Error(
        `${TICKET_NAME} is not available. ` +
        `Available tickets: ${available.join(', ')}`
      );
    }

    await nativeSelect.selectOption({
      label: TICKET_NAME
    });

    console.log(`Ticket selected: ${TICKET_NAME}`);
    return;
  }

  // Open the ticket dropdown.
  const dropdown = field.locator('.ant-select').first();

  await expect(dropdown).toBeVisible({
    timeout: 15000
  });

  const selector = dropdown.locator(
    '.ant-select-selector'
  ).first();

  await selector.click();

  console.log('Ticket dropdown opened');

  // Read the visible ticket options.
  const options = page.locator(
    '.ant-select-dropdown:visible .ant-select-item-option'
  );

  await expect(options.first()).toBeVisible({
    timeout: 10000
  });

  const availableTickets = (
    await options.allTextContents()
  ).map(text => text.trim());

  console.log('Available tickets:', availableTickets);

  // Search Ticket 6 if the dropdown supports searching.
  const searchInput = page.locator(
    '.ant-select-dropdown:visible input'
  ).first();

  if (await isVisible(searchInput)) {
    await searchInput.fill(TICKET_NAME);
  }

  const matchingTicket = options.filter({
    hasText: exactPattern(TICKET_NAME)
  }).first();

  if (!(await isVisible(matchingTicket))) {
    throw new Error(
      `Requested ticket "${TICKET_NAME}" is not available. ` +
      `Available tickets: ${availableTickets.join(', ')}`
    );
  }

  await matchingTicket.click();

  console.log(
    `Ticket selected successfully: ${TICKET_NAME}`
  );
}
// ==========================================
// VERIFY ENROLLMENT
// ==========================================

async function verifyEnrollment(modal) {
  const verifyButton = modal.getByRole('button', {
    name: /^verify$/i
  });

  await expect(verifyButton).toBeVisible({
    timeout: 15000
  });

  await expect(verifyButton).toBeEnabled();

  await verifyButton.click();

  console.log('Verify button clicked');

  const submitButton = modal.getByRole('button', {
    name: /^submit$/i
  });

  await expect(submitButton).toBeVisible({
    timeout: 30000
  });

  console.log('Enrollment verified');
}

// ==========================================
// SUBMIT ENROLLMENT
// ==========================================

async function submitEnrollment(page, modal) {
  const submitButton = modal.getByRole('button', {
    name: /^submit$/i
  });

  await expect(submitButton).toBeVisible({
    timeout: 15000
  });

  await expect(submitButton).toBeEnabled();

  if (!ENABLE_SUBMIT) {
    console.log('[DRY RUN] Submit is disabled.');
    return;
  }

  const successMessage = page.locator(
    '.ant-message-success, ' +
    '.ant-notification-notice-success, ' +
    '[data-sonner-toast][data-type="success"]'
  ).first();

  const errorMessage = page.locator(
    '.ant-message-error, ' +
    '.ant-notification-notice-error, ' +
    '.ant-form-item-explain-error, ' +
    '[data-sonner-toast][data-type="error"]'
  ).filter({
    visible: true
  }).first();

  console.log('Clicking Submit');

  await submitButton.click();

  console.log('Submit button clicked');

  let result = 'pending';

  try {
    await expect.poll(async () => {
      if (await isVisible(errorMessage)) {
        result = 'error';
      } else if (await isVisible(successMessage)) {
        result = 'success';
      } else if (!(await isVisible(modal))) {
        result = 'closed';
      } else {
        result = 'pending';
      }

      return result;
    }, {
      timeout: 20000,
      intervals: [500, 1000, 2000]
    }).not.toBe('pending');
  } catch {
    await page.screenshot({
      path: 'enrollment-submit-unconfirmed.png',
      fullPage: true
    });

    throw new Error(
      'Submit result is unconfirmed. ' +
      'Check the enrollment list before rerunning.'
    );
  }

  if (result === 'error') {
    throw new Error(
      'Enrollment submission error: ' +
      await errorMessage.innerText()
    );
  }

  if (result === 'success') {
    console.log(
      'Enrollment success notification detected'
    );
    return;
  }

  if (result === 'closed') {
    console.log(
      'Enrollment modal closed after Submit.'
    );

    console.log(
      'Check the enrollment list to confirm the record was saved.'
    );

    return;
  }

  throw new Error(
    'Enrollment submission was not confirmed.'
  );
}

// ==========================================
// COMPLETE ENROLLMENT WORKFLOW
// ==========================================

async function createEnrollment(page) {
  await openEnrollments(page);

  const modal = await openAddEnrollment(page);

  // STEP 1 - GROUP
  await selectDropdown(
    page,
    modal,
    'Group',
    GROUP_NAME
  );

  // STEP 2 - CUSTOMER
  await selectCustomer(page, modal);

  // STEP 3 - PAYMENT TYPE
  await selectPaymentType(page, modal);

  // STEP 4 - CHIT ASKING MONTH
  await fillAskingMonth(modal);

  // STEP 5 - REFERRED TYPE
  await selectReferredType(page, modal);

  // STEP 6 - TICKET BEFORE VERIFY
  await selectTicket(page, modal);

  // STEP 7 - VERIFY
  await verifyEnrollment(modal);

  // STEP 8 - SUBMIT
  await submitEnrollment(page, modal);
}

// ==========================================
// MAIN PLAYWRIGHT TEST
// ==========================================

test('Create one enrollment in MyChits Admin', async ({
  page
}) => {
  page.setDefaultTimeout(15000);
  page.setDefaultNavigationTimeout(60000);

  try {
    await login(page);

    await closePopup(page);

    await createEnrollment(page);

    console.log(
      'Enrollment automation flow completed'
    );
  } catch (error) {
    console.error(
      'Enrollment creation failed:',
      error.message
    );

    console.error('Current URL:', page.url());

    await page.screenshot({
      path: 'enrollment-creation-error.png',
      fullPage: true
    }).catch(() => {});

    throw error;
  }
});
