
require('dotenv').config();

const { test, expect } = require('@playwright/test');

// =====================================
// ENVIRONMENT CONFIGURATION
// =====================================

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

// Must explicitly specify the ticket to delete.
const DELETE_TICKET =
  process.env.DELETE_ENROLLMENT_TICKET;

const DELETE_REASON =
  process.env.DELETE_ENROLLMENT_REASON || 'Others';

const DELETE_CONFIRM =
  process.env.DELETE_ENROLLMENT_CONFIRM === 'YES';

if (!BASE_URL || !ADMIN_ID || !OTP || !BRANCH_NAME) {
  throw new Error('Missing login details in .env');
}

if (!GROUP_NAME || !CUSTOMER_NAME) {
  throw new Error('Missing Group or Customer in .env');
}

if (!DELETE_TICKET) {
  throw new Error(
    'Set DELETE_ENROLLMENT_TICKET in .env. ' +
    'Deletion will not run without an exact ticket.'
  );
}

const ROOT_URL = BASE_URL.replace(/\/+$/, '') + '/';

const ENROLLMENT_URL = new URL(
  'enroll-menu/enrollment',
  ROOT_URL
).href;

test.setTimeout(180000);

// =====================================
// GENERAL HELPERS
// =====================================

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

// =====================================
// LOGIN ONCE
// =====================================

async function login(page) {
  await page.goto(ROOT_URL, {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });

  const loginHeading = page.getByRole('heading', {
    name: /admin login/i
  });

  if (!(await isVisible(loginHeading))) {
    console.log('Existing login session detected');
    return;
  }

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
    await otpInputs.first().fill(String(OTP));
  } else if (count === 6) {
    if (String(OTP).length !== 6) {
      throw new Error('Expected six-digit OTP');
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

  console.log('Login successful');
}

// =====================================
// OPEN ENROLLMENTS
// =====================================

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

// =====================================
// FIND EXACT ENROLLMENT ROW
// =====================================

async function findEnrollmentRow(page) {
  console.log('Searching for target enrollment');

  const customerParts = CUSTOMER_NAME.split('|');

  const customerName = customerParts[0].trim();
  const customerPhone = (
    customerParts[1] || ''
  ).trim();

  if (!customerPhone) {
    throw new Error(
      'ENROLLMENT_CUSTOMER must contain name and phone, ' +
      'for example: Name | 9898987897'
    );
  }

  const ticketNumber = DELETE_TICKET.replace(
    /^Ticket\s*/i,
    ''
  ).trim();

  if (!/^\d+$/.test(ticketNumber)) {
    throw new Error(
      'DELETE_ENROLLMENT_TICKET must be like Ticket 7'
    );
  }

  const table = page.locator('table').filter({
    has: page.getByRole('columnheader', {
      name: /customer name/i
    })
  }).first();

  await expect(table).toBeVisible({
    timeout: 30000
  });

  // Read the displayed column headings to avoid
  // relying on hardcoded column positions.
  const headings = await table.locator(
    'thead tr'
  ).first().locator('th').allTextContents();

  const normalized = headings.map(text =>
    text.replace(/\s+/g, ' ').trim().toLowerCase()
  );

  function columnIndex(name) {
    const index = normalized.findIndex(
      heading => heading === name
    );

    if (index === -1) {
      throw new Error(
        `Enrollment table column not found: ${name}. ` +
        `Columns: ${normalized.join(', ')}`
      );
    }

    return index;
  }

  const columns = {
    customer: columnIndex('customer name'),
    phone: columnIndex('customer phone number'),
    group: columnIndex('enrolled group'),
    ticket: columnIndex('ticket number'),
    payment: columnIndex('payment type'),
    month: columnIndex('chit asking month'),
    action: columnIndex('action')
  };

  const rows = table.locator('tbody tr');

  await expect(rows.first()).toBeVisible({
    timeout: 30000
  });

  const count = await rows.count();
  const matches = [];

  for (let i = 0; i < count; i++) {
    const row = rows.nth(i);
    const cells = row.locator('td');

    const values = await cells.allTextContents();

    const clean = values.map(value =>
      value.replace(/\s+/g, ' ').trim()
    );

    const sameCustomer =
      clean[columns.customer]?.toLowerCase() ===
      customerName.toLowerCase();

    const samePhone =
      clean[columns.phone] === customerPhone;

    const sameGroup =
      clean[columns.group]?.toLowerCase() ===
      GROUP_NAME.toLowerCase();

    const sameTicket =
      clean[columns.ticket] === ticketNumber;

    const samePayment =
      clean[columns.payment]?.toLowerCase() ===
      PAYMENT_TYPE.toLowerCase();

    const sameMonth =
      clean[columns.month] === ASKING_MONTH;

    if (
      sameCustomer &&
      samePhone &&
      sameGroup &&
      sameTicket &&
      samePayment &&
      sameMonth
    ) {
      matches.push({
        index: i,
        values: clean
      });
    }
  }

  if (matches.length === 0) {
    throw new Error(
      `No exact enrollment found for ${CUSTOMER_NAME}, ` +
      `${GROUP_NAME}, ${DELETE_TICKET}, ` +
      `${PAYMENT_TYPE}, ${ASKING_MONTH}. ` +
      'Nothing was deleted.'
    );
  }

  if (matches.length > 1) {
    throw new Error(
      `Found ${matches.length} matching enrollments. ` +
      'Deletion stopped because the target is ambiguous.'
    );
  }

  const match = matches[0];

  console.log('Exact enrollment found:');
  console.log(match.values.join(' | '));

  return {
    table,
    row: rows.nth(match.index),
    columns,
    customerName,
    customerPhone,
    ticketNumber
  };
}

// =====================================
// OPEN THREE-DOT ACTION MENU
// =====================================

async function openActionMenu(page, target) {
  const { row, columns } = target;

  const actionCell = row.locator(
    'td'
  ).nth(columns.action);

  await expect(actionCell).toBeVisible();

  // The screenshot shows a vertical three-dot menu
  // in the final Action column.
  let menuTrigger = actionCell.getByRole('button')
    .first();

  if (!(await isVisible(menuTrigger)) &&
      await isVisible(actionCell.locator('svg'))) {
    menuTrigger = actionCell.locator('svg').first();
  }

  if (!(await isVisible(menuTrigger))) {
    menuTrigger = actionCell.locator(
      '[role="button"], [aria-haspopup], ' +
      '[class*="cursor-pointer"]'
    ).first();
  }

  await expect(menuTrigger).toBeVisible({
    timeout: 10000
  });

  await menuTrigger.click();

  console.log('Action menu opened');

  const removeOption = page.getByText(
    exactPattern('Remove')
  ).filter({
    visible: true
  }).first();

  await expect(removeOption).toBeVisible({
    timeout: 10000
  });

  await removeOption.click();

  console.log('Remove option clicked');
}

// =====================================
// SELECT REMOVAL REASON
// =====================================
async function selectRemovalReason(page) {
  console.log('Opening Removal Reason dropdown');

  const heading = page.getByText(
    /Please Select a Reason for Removal/i
  );

  await expect(heading).toBeVisible({
    timeout: 15000
  });

  // Locate the removal popup.
  const dialog = heading.locator(
    'xpath=ancestor::div[.//select and .//button][1]'
  );

  await expect(dialog).toBeVisible({
    timeout: 15000
  });

  const reasonDropdown = dialog.locator('select').first();

  await expect(reasonDropdown).toBeVisible({
    timeout: 15000
  });

  // Check the available dropdown options.
  const availableReasons = await reasonDropdown
    .locator('option')
    .allTextContents();

  console.log('Available reasons:', availableReasons);

  // Select the required removal reason.
  await reasonDropdown.selectOption({
    label: DELETE_REASON
  });

  // Verify that the correct reason is selected.
  await expect(reasonDropdown).toHaveValue(
    await reasonDropdown.locator('option', {
      hasText: exactPattern(DELETE_REASON)
    }).first().getAttribute('value')
  );

  console.log(
    `Removal reason selected successfully: ${DELETE_REASON}`
  );

  return dialog;
}

// =====================================
// CONFIRM REMOVAL
// =====================================

async function confirmRemoval(page, dialog, target) {
  const removeButton = dialog.getByRole('button', {
    name: /^remove$/i
  });

  await expect(removeButton).toBeVisible({
    timeout: 10000
  });

  await expect(removeButton).toBeEnabled();

  if (!DELETE_CONFIRM) {
    console.log(
      '[DRY RUN] Deletion confirmation is disabled.'
    );
    console.log(
      'Set DELETE_ENROLLMENT_CONFIRM=YES ' +
      'to enable actual removal.'
    );
    return false;
  }

  console.log(
    `Removing enrollment: ${DELETE_TICKET}`
  );

  await removeButton.click();

  console.log('Remove button clicked');

  // The popup should close after a successful action.
  await expect(dialog).toBeHidden({
    timeout: 30000
  });

  // Reload and check the current enrollment list.
  await openEnrollments(page);

  try {
    await findEnrollmentRow(page);
  } catch (error) {
    if (error.message.startsWith('No exact enrollment found')) {
      console.log(
        '[SUCCESS] Target enrollment is no longer in the displayed list.'
      );
      return true;
    }

    throw error;
  }

  throw new Error(
    'The target enrollment is still present after removal.'
  );
}

// =====================================
// COMPLETE ENROLLMENT DELETION WORKFLOW
// =====================================

async function deleteEnrollment(page) {
  await openEnrollments(page);

  // Step 1: Find only the requested enrollment.
  const target = await findEnrollmentRow(page);

  // Step 2: Open three-dot menu and click Remove.
  await openActionMenu(page, target);

  // Step 3: Choose removal reason.
  const dialog = await selectRemovalReason(page);

  // Step 4: Confirm removal.
  const deleted = await confirmRemoval(
    page,
    dialog,
    target
  );

  if (deleted) {
    console.log(
      'Enrollment deletion workflow completed'
    );
  }
}

// =====================================
// MAIN PLAYWRIGHT TEST
// =====================================

test('Delete one selected automation enrollment', async ({
  page
}) => {
  page.setDefaultTimeout(15000);
  page.setDefaultNavigationTimeout(60000);

  try {
    await login(page);

    await closePopup(page);

    await deleteEnrollment(page);

  } catch (error) {
    console.error(
      'Enrollment deletion failed:',
      error.message
    );

    console.error('Current URL:', page.url());

    await page.screenshot({
      path: 'enrollment-deletion-error.png',
      fullPage: true
    }).catch(() => {});

    throw error;
  }
});
