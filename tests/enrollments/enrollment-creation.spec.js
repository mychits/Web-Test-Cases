
require('dotenv').config();

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const enrollmentData = require('../../test-data/enrollment-data');

// ==========================================
// ENVIRONMENT CONFIGURATION
// ==========================================

const BASE_URL = process.env.BASE_URL;
const ADMIN_ID = process.env.ADMIN_ID;
const OTP = process.env.OTP;
const BRANCH_NAME = process.env.BRANCH_NAME;

if (!BASE_URL || !ADMIN_ID || !OTP || !BRANCH_NAME) {
  throw new Error('Missing login configuration in .env');
}

const ROOT_URL = BASE_URL.replace(/\/+$/, '') + '/';

const ENROLLMENT_URL = new URL(
  'enroll-menu/enrollment',
  ROOT_URL
).href;

// ==========================================
// ENROLLMENT SELECTION
// ==========================================

const MODE = (
  process.env.ENROLLMENT_MODE || 'ONE'
).trim().toUpperCase();

function getSelectedEnrollments() {
  if (!Array.isArray(enrollmentData)) {
    throw new Error(
      'enrollment-data.js must export an array of enrollments'
    );
  }

  if (enrollmentData.length === 0) {
    throw new Error('Enrollment dataset is empty');
  }

  if (MODE === 'ALL') {
    return enrollmentData;
  }

  if (MODE === 'ONE') {
    const number = Number(
      process.env.ENROLLMENT_NUMBER || 1
    );

    if (
      !Number.isInteger(number) ||
      number < 1 ||
      number > enrollmentData.length
    ) {
      throw new Error(
        `Invalid ENROLLMENT_NUMBER: ${number}. ` +
        `Available records: 1-${enrollmentData.length}`
      );
    }

    return [enrollmentData[number - 1]];
  }

  if (MODE === 'RANGE') {
    const start = Number(process.env.ENROLLMENT_START);
    const end = Number(process.env.ENROLLMENT_END);

    if (
      !Number.isInteger(start) ||
      !Number.isInteger(end) ||
      start < 1 ||
      end < start ||
      end > enrollmentData.length
    ) {
      throw new Error(
        `Invalid enrollment range: ${start}-${end}. ` +
        `Available records: 1-${enrollmentData.length}`
      );
    }

    return enrollmentData.slice(start - 1, end);
  }

  throw new Error(
    `Unsupported ENROLLMENT_MODE: ${MODE}. ` +
    'Use ONE, RANGE, or ALL.'
  );
}

const selectedEnrollments = getSelectedEnrollments();

// ==========================================
// DATA VALIDATION
// ==========================================

function validateEnrollmentData(data, index) {
  if (!data || typeof data !== 'object') {
    throw new Error(
      `Enrollment ${index} must be an object`
    );
  }

  const requiredFields = [
    'testId',
    'groupName',
    'customerName',
    'paymentType',
    'askingMonth',
    'referredType',
    'ticketName'
  ];

  for (const field of requiredFields) {
    if (
      typeof data[field] !== 'string' ||
      !data[field].trim()
    ) {
      throw new Error(
        `Enrollment ${index}: Missing or invalid ${field}`
      );
    }
  }

  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(data.askingMonth)) {
    throw new Error(
      `${data.testId}: askingMonth must use YYYY-MM`
    );
  }

  if (typeof data.enableSubmit !== 'boolean') {
    throw new Error(
      `${data.testId}: enableSubmit must be true or false`
    );
  }
}

selectedEnrollments.forEach((data, index) => {
  validateEnrollmentData(data, index + 1);
});

const testIds = selectedEnrollments.map(data => data.testId);

if (new Set(testIds).size !== testIds.length) {
  throw new Error('Duplicate enrollment test IDs detected');
}

// ==========================================
// REPORT CONFIGURATION
// ==========================================

const REPORT_DIR = path.join(
  process.cwd(),
  'enrollment-creation-results'
);

fs.mkdirSync(REPORT_DIR, { recursive: true });

const results = [];

function addResult(data, status, message) {
  results.push({
    testId: data.testId,
    groupName: data.groupName,
    customerName: data.customerName,
    ticketName: data.ticketName,
    status,
    message
  });
}

function printSummary() {
  const passed = results.filter(
    item => item.status === 'PASS'
  ).length;

  const errors = results.filter(
    item => item.status === 'ERROR'
  ).length;

  const needsReview = results.filter(
    item => item.status === 'NEEDS_REVIEW'
  ).length;

  const bugs = results.filter(
    item => item.status === 'BUG'
  ).length;

  console.log('\n========== FINAL SUMMARY ==========');
  console.log(`Total: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Potential Bugs: ${bugs}`);
  console.log(`Needs Review: ${needsReview}`);
  console.log(`Errors: ${errors}`);
  console.log('===================================\n');

  fs.writeFileSync(
    path.join(REPORT_DIR, 'enrollment-results.json'),
    JSON.stringify(results, null, 2)
  );
}

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
    throw new Error(
      `Unexpected OTP input count: ${count}`
    );
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
  const existingModal = page.locator('#modal-wrapper');

  if (await isVisible(existingModal)) {
    throw new Error(
      'Previous enrollment modal is still open'
    );
  }

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

  const option = await findOption(page, value);

  await option.click();

  console.log(
    `${label} selected successfully: ${value}`
  );
}

// ==========================================
// SELECT CUSTOMER
// ==========================================

async function selectCustomer(page, modal, data) {
  const CUSTOMER_NAME = data.customerName;

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
// PAYMENT TYPE
// ==========================================

async function selectPaymentType(page, modal, data) {
  console.log(
    `Selecting Payment Type: ${data.paymentType}`
  );

  await selectDropdown(
    page,
    modal,
    'Payment Type',
    data.paymentType
  );
}

// ==========================================
// CHIT ASKING MONTH
// ==========================================

async function fillAskingMonth(modal, data) {
  const ASKING_MONTH = data.askingMonth;

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

async function selectReferredType(page, modal, data) {
  await selectDropdown(
    page,
    modal,
    'Referred Type',
    data.referredType
  );
}

// ==========================================
// SELECT TICKET BEFORE VERIFY
// ==========================================

async function selectTicket(page, modal, data) {
  const TICKET_NAME = data.ticketName;

  console.log(`Selecting ticket: ${TICKET_NAME}`);

  const field = await findFieldContainer(
    modal,
    'Select Tickets'
  );

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

  const dropdown = field.locator('.ant-select').first();

  await expect(dropdown).toBeVisible({
    timeout: 15000
  });

  const selector = dropdown.locator(
    '.ant-select-selector'
  ).first();

  await selector.click();

  console.log('Ticket dropdown opened');

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

  await expect(submitButton).toBeEnabled();

  console.log('Enrollment verified');
}

// ==========================================
// SUBMIT ENROLLMENT
// ==========================================

async function submitEnrollment(page, modal, data) {
  const ENABLE_SUBMIT = data.enableSubmit === true;

  const submitButton = modal.getByRole('button', {
    name: /^submit$/i
  });

  await expect(submitButton).toBeVisible({
    timeout: 15000
  });

  await expect(submitButton).toBeEnabled();

  if (!ENABLE_SUBMIT) {
    console.log(
      `[DRY RUN] ${data.testId}: Submit is disabled`
    );

    return 'DRY_RUN';
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

  console.log(`Submitting enrollment: ${data.testId}`);

  await submitButton.click();

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

    return 'SUBMITTED';
  }

  if (result === 'closed') {
    console.log(
      'Enrollment modal closed after Submit'
    );

    return 'UNCONFIRMED';
  }

  throw new Error(
    'Enrollment submission was not confirmed'
  );
}

// ==========================================
// CLOSE MODAL AFTER DRY RUN
// ==========================================

async function closeEnrollmentModal(page, modal) {
  if (!(await isVisible(modal))) {
    return;
  }

  const closeButton = modal.getByRole('button', {
    name: /^(close|cancel)$/i
  }).first();

  if (await isVisible(closeButton)) {
    await closeButton.click();

    await expect(modal).toBeHidden({
      timeout: 15000
    });

    console.log('Enrollment modal closed');
    return;
  }

  const iconClose = modal.locator(
    '.ant-modal-close, ' +
    'button[aria-label="Close"], ' +
    'button[title="Close"]'
  ).first();

  if (await isVisible(iconClose)) {
    await iconClose.click();

    await expect(modal).toBeHidden({
      timeout: 15000
    });

    console.log('Enrollment modal closed');
    return;
  }

  // Use the enrollment page to reset the form
  // if the modal has no accessible close button.
  console.log(
    'Modal close control not found. Returning to enrollment page.'
  );

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
}

// ==========================================
// COMPLETE ENROLLMENT WORKFLOW
// ==========================================

async function createEnrollment(page, data) {
  await openEnrollments(page);

  const modal = await openAddEnrollment(page);

  console.log(`Test ID: ${data.testId}`);
  console.log(`Group: ${data.groupName}`);
  console.log(`Customer: ${data.customerName}`);

  // STEP 1 - GROUP
  await selectDropdown(
    page,
    modal,
    'Group',
    data.groupName
  );

  // STEP 2 - CUSTOMER
  await selectCustomer(page, modal, data);

  // STEP 3 - PAYMENT TYPE
  await selectPaymentType(page, modal, data);

  // STEP 4 - CHIT ASKING MONTH
  await fillAskingMonth(modal, data);

  // STEP 5 - REFERRED TYPE
  await selectReferredType(page, modal, data);

  // STEP 6 - TICKET BEFORE VERIFY
  await selectTicket(page, modal, data);

  // STEP 7 - VERIFY
  await verifyEnrollment(modal);

  // STEP 8 - SUBMIT
  const result = await submitEnrollment(
    page,
    modal,
    data
  );

  if (result === 'DRY_RUN') {
    await closeEnrollmentModal(page, modal);
  }

  if (result === 'SUBMITTED') {
    await closeEnrollmentModal(page, modal);
  }

  return result;
}

// ==========================================
// MAIN PLAYWRIGHT TEST
// ==========================================

test('Create selected enrollments in MyChits Admin', async ({
  page
}) => {
  test.setTimeout(
    Math.max(
      300000,
      selectedEnrollments.length * 180000
    )
  );

  page.setDefaultTimeout(15000);
  page.setDefaultNavigationTimeout(60000);

  console.log('\n===================================');
  console.log('MYCHITS ENROLLMENT AUTOMATION');
  console.log(`Mode: ${MODE}`);
  console.log(`Selected Enrollments: ${selectedEnrollments.length}`);
  console.log('===================================\n');

  let currentData = null;

  try {
    await login(page);
    await closePopup(page);

    for (const [index, data] of selectedEnrollments.entries()) {
      currentData = data;

      console.log(
        `\nStarting enrollment ${index + 1}/` +
        `${selectedEnrollments.length}: ${data.testId}`
      );

      try {
        const result = await createEnrollment(page, data);

        if (result === 'UNCONFIRMED') {
          addResult(
            data,
            'NEEDS_REVIEW',
            'Submit closed the modal, but saving is not confirmed'
          );

          console.log(
            `[NEEDS REVIEW] ${data.testId}: Submission unconfirmed`
          );

          // Do not continue when the result may have saved
          // an enrollment but has not been verified.
          break;
        }

        addResult(
          data,
          'PASS',
          result === 'DRY_RUN'
            ? 'Enrollment verified; submission intentionally skipped'
            : 'Success notification detected after submission'
        );

        console.log(
          `[PASS] ${data.testId}: ${result}`
        );
      } catch (error) {
        console.error(
          `[ERROR] ${data.testId}: ${error.message}`
        );

        addResult(
          data,
          'ERROR',
          error.message
        );

        await page.screenshot({
          path: path.join(
            REPORT_DIR,
            `${data.testId}-error.png`
          ),
          fullPage: true
        }).catch(() => {});

        // Stop to avoid incorrect selections or duplicate submissions.
        break;
      }
    }
  } catch (error) {
    console.error(
      'Enrollment automation failed:',
      error.message
    );

    if (currentData === null) {
      console.error(
        'Login or initial setup failed before enrollment execution'
      );
    }

    throw error;
  } finally {
    printSummary();
  }

  const hasErrors = results.some(
    item => item.status === 'ERROR'
  );

  const hasNeedsReview = results.some(
    item => item.status === 'NEEDS_REVIEW'
  );

  if (hasErrors || hasNeedsReview) {
    throw new Error(
      'Enrollment automation contains errors or unconfirmed submissions. ' +
      'Review enrollment-creation-results/enrollment-results.json'
    );
  }

  console.log(
    'Enrollment automation flow completed'
  );
});
