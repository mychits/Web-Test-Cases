
'use strict';

require('dotenv').config();

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const enrollmentData = require('../../test-data/enrollment-data');

const BASE_URL = (process.env.BASE_URL || '').replace(/\/+$/, '');
const ENROLLMENT_URL = `${BASE_URL}/enroll-menu/enrollment`;

const BRANCH_NAME = process.env.BRANCH_NAME;
const ADMIN_ID = process.env.ADMIN_ID;
const OTP = process.env.OTP;

const TEST_ID = process.env.EDIT_ENROLLMENT_TEST_ID || 'ENR001';

if (!Array.isArray(enrollmentData)) {
  throw new Error('enrollment-data.js must export an array');
}

const selectedEnrollment = enrollmentData.find(
  item => item.testId === TEST_ID
);

if (!selectedEnrollment) {
  throw new Error(`Enrollment ${TEST_ID} not found`);
}

const TARGET_GROUP = selectedEnrollment.groupName;
const TARGET_CUSTOMER = selectedEnrollment.customerName;
const TARGET_TICKET = selectedEnrollment.ticketName;

const NEW_PAYMENT_TYPE =
  selectedEnrollment.updatedPaymentType || 'Weekly';

const NEW_REFERRED_TYPE =
  selectedEnrollment.updatedReferredType || 'Others';

if (!BASE_URL || !BRANCH_NAME || !ADMIN_ID || !OTP) {
  throw new Error('Missing login values in .env');
}

if (!TARGET_GROUP || !TARGET_CUSTOMER || !TARGET_TICKET) {
  throw new Error(`Incomplete enrollment data for ${TEST_ID}`);
}

const RESULTS_DIR = path.resolve(
  process.cwd(),
  'enrollment-edit-results'
);

fs.mkdirSync(RESULTS_DIR, { recursive: true });

// ========================================
// HELPERS
// ========================================

async function visible(locator) {
  return locator.first().isVisible().catch(() => false);
}

function normalize(value) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function ticketNumber(value) {
  return String(value)
    .replace(/^Ticket\s*/i, '')
    .trim();
}

async function closePopup(page) {
  const popup = page.locator(
    'div.fixed.inset-0.z-\\[9999\\]'
  ).first();

  if (await visible(popup)) {
    const close = popup.getByRole('button', {
      name: /remind me later|close|cancel/i
    }).first();

    if (await visible(close)) {
      await close.click();
    }
  }
}

// ========================================
// STEP 1: LOGIN
// ========================================

async function login(page) {
  console.log('[Step 1] Opening Admin application');

  await page.goto(BASE_URL, {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });

  const heading = page.getByRole('heading', {
    name: /admin login/i
  });

  if (await visible(heading)) {
    const branch = page.locator('select').first();

    await expect(branch).toBeVisible();
    await branch.selectOption({ label: BRANCH_NAME });

    await page.getByPlaceholder('XXX-XX-XXXX')
      .fill(ADMIN_ID);

    await page.getByRole('button', {
      name: /send otp/i
    }).click();

    const otpInputs = page.locator(
      'input[autocomplete="one-time-code"]:visible, ' +
      'input[name*="otp" i]:visible, ' +
      'input[placeholder*="otp" i]:visible, ' +
      'input[inputmode="numeric"]:visible, ' +
      'input[maxlength="6"]:visible'
    );

    await expect(otpInputs.first()).toBeVisible({
      timeout: 30000
    });

    const count = await otpInputs.count();

    if (count === 1) {
      await otpInputs.first().fill(String(OTP));
    } else if (count === 6 && String(OTP).length === 6) {
      for (let i = 0; i < 6; i++) {
        await otpInputs.nth(i).fill(String(OTP)[i]);
      }
    } else {
      throw new Error(`Unsupported OTP layout: ${count}`);
    }

    await page.getByRole('button', {
      name: /verify otp|verify|login|submit/i
    }).last().click();

    await expect(heading).toBeHidden({
      timeout: 45000
    });
  }

  await closePopup(page);

  console.log('[Step 1] Login successful');
}

// ========================================
// STEP 2: ENROLLMENT PAGE
// ========================================

async function openEnrollmentPage(page) {
  console.log('[Step 2] Opening Enrollment Management');

  const enrollmentsMenu = page.getByText('Enrollments', {
    exact: true
  }).first();

  if (await visible(enrollmentsMenu)) {
    await enrollmentsMenu.click();
  }

  const managementMenu = page.getByText(
    'Enrollment Management',
    { exact: true }
  ).first();

  if (await visible(managementMenu)) {
    await managementMenu.click();
  }

  const enrollmentLink = page.getByRole('link', {
    name: /^enrollment$/i
  });

  if (await visible(enrollmentLink)) {
    await enrollmentLink.click();
  } else {
    await page.goto(ENROLLMENT_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });
  }

  await closePopup(page);

  await expect(page).toHaveURL(
    /\/enroll-menu\/enrollment/
  );

  await expect(
    page.getByRole('button', {
      name: /add enrollment/i
    })
  ).toBeVisible({ timeout: 30000 });

  console.log('[Step 2] Enrollment page opened');
}

// ========================================
// STEP 3: FIND ENROLLMENT
// ========================================

async function findEnrollment(page) {
  const customerName = TARGET_CUSTOMER
    .split('|')[0]
    .trim();

  console.log('[Step 3] Finding enrollment:', TEST_ID);
  console.log('[Step 3] Group:', TARGET_GROUP);
  console.log('[Step 3] Customer:', customerName);
  console.log('[Step 3] Ticket:', TARGET_TICKET);

  const search = page.getByPlaceholder(/search/i).first();

  if (await visible(search)) {
    await search.fill(customerName);
  }

  const rows = page.locator('table tbody tr');

  const ticket = ticketNumber(TARGET_TICKET);

  const matchingRows = rows.filter({
    hasText: TARGET_GROUP
  }).filter({
    hasText: customerName
  }).filter({
    hasText: new RegExp(
      `(?:^|\\D)${escapeRegex(ticket)}(?:\\D|$)`,
      'i'
    )
  });

  await expect(matchingRows).toHaveCount(1, {
    timeout: 20000
  });

  console.log('[Step 3] Enrollment found');

  return matchingRows.first();
}

// ========================================
// STEP 4: ACTION -> EDIT
// ========================================

async function openEditForm(page, row) {
  console.log('[Step 4] Opening Action -> Edit');

  await expect(row).toBeVisible();

  const directEdit = row.getByRole('button', {
    name: /^edit$/i
  });

  if (await visible(directEdit)) {
    await directEdit.click();
  } else {
    const cells = row.locator('td');

    const table = row.locator(
      'xpath=ancestor::table[1]'
    );

    const headers = await table.locator('thead th')
      .allTextContents();

    const actionIndex = headers.findIndex(
      text => /^actions?$/i.test(text.trim())
    );

    const actionCell = actionIndex >= 0
      ? cells.nth(actionIndex)
      : cells.last();

    const candidates = [
      actionCell.locator('button'),
      actionCell.locator('[role="button"]'),
      actionCell.locator('[aria-haspopup]'),
      actionCell.locator('a'),
      actionCell.locator('svg'),
      actionCell.locator('img')
    ];

    let trigger = null;

    for (const candidate of candidates) {
      if (await visible(candidate)) {
        trigger = candidate.first();
        break;
      }
    }

    if (!trigger) {
      throw new Error(
        'Action control not found. HTML: ' +
        (await actionCell.innerHTML()).slice(0, 2000)
      );
    }

    await trigger.click();

    const alreadyOpen = page.getByRole('dialog')
      .filter({ hasText: 'Update Enrollment' });

    const alreadyOpenWrapper = page.locator(
      '#modal-wrapper'
    ).filter({ hasText: 'Update Enrollment' });

    if (
      !(await visible(alreadyOpen)) &&
      !(await visible(alreadyOpenWrapper))
    ) {
      const menuItem = page.getByRole('menuitem', {
        name: /^edit$/i
      });

      const editButton = page.getByRole('button', {
        name: /^edit$/i
      });

      const editText = page.getByText('Edit', {
        exact: true
      });

      if (await visible(menuItem)) {
        await menuItem.click();
      } else if (await visible(editButton)) {
        await editButton.click();
      } else {
        await expect(editText.first()).toBeVisible();
        await editText.first().click();
      }
    }
  }

  const dialog = page.getByRole('dialog').filter({
    hasText: 'Update Enrollment'
  });

  const wrapper = page.locator('#modal-wrapper').filter({
    hasText: 'Update Enrollment'
  });

  const modal = await visible(dialog)
    ? dialog
    : wrapper;

  await expect(modal).toBeVisible({
    timeout: 15000
  });

  console.log('[Step 4] Update Enrollment form opened');

  return modal;
}

// ========================================
// STEP 5: DROPDOWN HELPERS
// ========================================

async function getField(modal, label) {
  const labelElement = modal.getByText(
    new RegExp(
      `^\\s*${escapeRegex(label)}\\s*\\*?\\s*$`,
      'i'
    )
  ).first();

  await expect(labelElement).toBeVisible();

  const field = labelElement.locator(
    'xpath=ancestor::div[' +
    './/select or ' +
    './/div[contains(@class,"ant-select")]' +
    '][1]'
  );

  await expect(field).toBeVisible();

  return field;
}

async function getValue(modal, label) {
  const field = await getField(modal, label);

  const nativeSelect = field.locator('select').first();

  if (await visible(nativeSelect)) {
    return (
      await nativeSelect.locator('option:checked')
        .textContent() || ''
    ).trim();
  }

  const selected = field.locator(
    '.ant-select-selection-item'
  ).first();

  await expect(selected).toBeVisible();

  return (await selected.textContent() || '').trim();
}

async function changeDropdown(page, modal, label, newValue) {
  const oldValue = await getValue(modal, label);

  console.log(`[Step 5] ${label}: ${oldValue} -> ${newValue}`);

  if (normalize(oldValue) === normalize(newValue)) {
    console.log(`[Step 5] ${label} already updated`);
    return false;
  }

  const field = await getField(modal, label);
  const nativeSelect = field.locator('select').first();

  if (await visible(nativeSelect)) {
    await nativeSelect.selectOption({
      label: newValue
    });
  } else {
    const dropdown = field.locator('.ant-select').first();

    await expect(dropdown).toBeVisible();

    await dropdown.locator(
      '.ant-select-selector'
    ).first().click();

    const popup = page.locator(
      '.ant-select-dropdown:visible'
    ).last();

    await expect(popup).toBeVisible();

    const option = popup.locator(
      '.ant-select-item-option:not(.ant-select-item-option-disabled)'
    ).filter({
      hasText: new RegExp(
        `^\\s*${escapeRegex(newValue)}\\s*$`,
        'i'
      )
    });

    await expect(option).toHaveCount(1);
    await option.click();
  }

  await expect.poll(
    () => getValue(modal, label)
  ).toBe(newValue);

  return true;
}

// ========================================
// STEP 6: VERIFY EXISTING TICKET
// ========================================

async function verifyTicketUnchanged(modal) {
  console.log('[Step 6] Verifying existing ticket');

  const field = await getField(modal, 'Tickets');

  const chips = field.locator(
    '.ant-select-selection-item'
  );

  const selectedTickets = await chips.allTextContents();

  console.log(
    '[Step 6] Selected tickets:',
    selectedTickets
  );

  const expectedTicket = ticketNumber(TARGET_TICKET);

  expect(
    selectedTickets.map(ticketNumber)
  ).toContain(expectedTicket);

  console.log(
    '[Step 6] Ticket preserved:',
    TARGET_TICKET
  );
}

// ========================================
// STEP 7: UPDATE ENROLLMENT
// ========================================

async function updateEnrollment(modal) {
  const updateButton = modal.getByRole('button', {
    name: /^update enrollment$/i
  });

  await expect(updateButton).toBeVisible();
  await expect(updateButton).toBeEnabled();

  const warning = modal.getByText(
    /no vacant tickets available/i
  );

  if (await visible(warning)) {
    console.warn(
      '[Warning] No vacant tickets available message displayed.'
    );
    console.warn(
      '[Warning] Existing ticket is unchanged; attempting update.'
    );
  }

  // Click only once.
  await updateButton.click();

  console.log('[Step 7] Update Enrollment clicked');

  try {
    await expect(modal).toBeHidden({
      timeout: 20000
    });
  } catch {
    const errors = await modal.locator(
      '[role="alert"], .text-red-500, .text-red-600'
    ).allTextContents();

    throw new Error(
      'Update form did not close. Application may have ' +
      'rejected the update. Messages: ' +
      JSON.stringify(errors)
    );
  }
}

// ========================================
// MAIN TEST
// ========================================

test(
  `Edit Enrollment ${TEST_ID}`,
  async ({ page }) => {
    test.setTimeout(180000);

    page.setDefaultTimeout(15000);
    page.setDefaultNavigationTimeout(60000);

    try {
      await login(page);
      await openEnrollmentPage(page);

      const row = await findEnrollment(page);
      const modal = await openEditForm(page, row);

      const group = await getValue(modal, 'Group');
      const customer = await getValue(modal, 'Customer');

      expect(normalize(group)).toContain(
        normalize(TARGET_GROUP)
      );

      expect(normalize(customer)).toContain(
        normalize(TARGET_CUSTOMER.split('|')[0])
      );

      const oldPayment = await getValue(
        modal,
        'Payment Type'
      );

      const oldReferred = await getValue(
        modal,
        'Referred Type'
      );

      // Change only the requested fields.
      await changeDropdown(
        page,
        modal,
        'Payment Type',
        NEW_PAYMENT_TYPE
      );

      await changeDropdown(
        page,
        modal,
        'Referred Type',
        NEW_REFERRED_TYPE
      );

      // Do not change the ticket.
      await verifyTicketUnchanged(modal);

      const alreadyUpdated =
        normalize(oldPayment) === normalize(NEW_PAYMENT_TYPE) &&
        normalize(oldReferred) === normalize(NEW_REFERRED_TYPE);

      if (!alreadyUpdated) {
        await updateEnrollment(modal);
      } else {
        console.log(
          '[Step 7] Values already updated; skipping submission'
        );
      }

      // Reload and verify saved values.
      await openEnrollmentPage(page);

      const verifiedRow = await findEnrollment(page);
      const verifiedModal = await openEditForm(
        page,
        verifiedRow
      );

      await expect.poll(
        () => getValue(verifiedModal, 'Payment Type')
      ).toBe(NEW_PAYMENT_TYPE);

      await expect.poll(
        () => getValue(verifiedModal, 'Referred Type')
      ).toBe(NEW_REFERRED_TYPE);

      await verifyTicketUnchanged(verifiedModal);

      console.log('================================');
      console.log('ENROLLMENT EDIT TEST PASSED');
      console.log('Test ID:', TEST_ID);
      console.log('Group:', TARGET_GROUP);
      console.log('Customer:', TARGET_CUSTOMER);
      console.log('Ticket:', TARGET_TICKET);
      console.log('Payment:', oldPayment, '->', NEW_PAYMENT_TYPE);
      console.log('Referred:', oldReferred, '->', NEW_REFERRED_TYPE);
      console.log('================================');

    } catch (error) {
      const screenshot = path.join(
        RESULTS_DIR,
        `${TEST_ID}-edit-error.png`
      );

      await page.screenshot({
        path: screenshot,
        fullPage: true
      }).catch(() => {});

      console.error(
        '[ERROR] Enrollment Edit failed:',
        error.message
      );

      throw error;
    }
  }
);
