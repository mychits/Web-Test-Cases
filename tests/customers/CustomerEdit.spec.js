
'use strict';

require('dotenv').config();

const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

// ==========================================
// CUSTOMER EDIT AUTOMATION
// LOGIN -> CUSTOMERS -> EDIT -> VERIFY
// ==========================================

// Same data file as Customer Creation
const customers = require('../../test-data/customer-data-100');

const BASE_URL = (process.env.BASE_URL || '').replace(/\/+$/, '');
const CUSTOMER_URL = `${BASE_URL}/customer-menu`;

const BRANCH_NAME = process.env.BRANCH_NAME;
const ADMIN_ID = process.env.ADMIN_ID;
const OTP = process.env.OTP;

// Existing customer in MyChits
const CUSTOMER_ID = process.env.EDIT_CUSTOMER_ID || 'CUS2712';
const TEST_ID = process.env.EDIT_TEST_ID || 'TC001';
const NEW_PHONE = process.env.EDIT_NEW_PHONE || '9999999997';

const RESULTS_DIR = path.resolve(
  process.cwd(),
  'customer-edit-results'
);

fs.mkdirSync(RESULTS_DIR, { recursive: true });

// ==========================================
// VALIDATE CONFIGURATION
// ==========================================

if (!BASE_URL || !BRANCH_NAME || !ADMIN_ID || !OTP) {
  throw new Error(
    'Set BASE_URL, BRANCH_NAME, ADMIN_ID and OTP in .env'
  );
}

if (!Array.isArray(customers)) {
  throw new Error(
    'customer-data-100.js must export a customer array'
  );
}

const customerData = customers.find(
  customer => customer.testId === TEST_ID
);

if (!customerData) {
  throw new Error(
    `Customer ${TEST_ID} not found in customer-data-100.js`
  );
}

if (!/^\d{10}$/.test(NEW_PHONE)) {
  throw new Error('EDIT_NEW_PHONE must contain 10 digits');
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

async function visible(locator) {
  return locator.first().isVisible().catch(() => false);
}

async function closePopup(page) {
  const popup = page.locator(
    'div.fixed.inset-0.z-\\[9999\\]'
  ).first();

  if (await visible(popup)) {
    const dismiss = popup.getByRole('button', {
      name: /remind me later|close|cancel|okay|^ok$/i
    }).first();

    if (await visible(dismiss)) {
      await dismiss.click();
    }
  }
}

// ==========================================
// STEP 1: LOGIN
// Same login flow as Customer Creation
// ==========================================

async function login(page) {

  await page.goto(BASE_URL, {
    waitUntil: 'domcontentloaded',
    timeout: 45000
  });

  const heading = page.getByRole('heading', {
    name: /admin login/i
  });

  if (await visible(heading)) {

    console.log('[Login] Admin Login page opened.');

    const branch = page.locator('select').first();

    await expect(branch).toBeVisible({
      timeout: 20000
    });

    await branch.selectOption({
      label: BRANCH_NAME
    });

    console.log('[Login] Branch selected:', BRANCH_NAME);

    await page.getByPlaceholder('XXX-XX-XXXX')
      .fill(ADMIN_ID);

    await page.getByRole('button', {
      name: /send otp/i
    }).click();

    console.log('[Login] OTP requested.');

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

    } else if (
      count === 6 &&
      String(OTP).length === 6
    ) {

      for (let i = 0; i < 6; i++) {
        await otpInputs.nth(i).fill(String(OTP)[i]);
      }

    } else {
      throw new Error(
        `Unsupported OTP layout: ${count}`
      );
    }

    await page.getByRole('button', {
      name: /verify otp|verify|login|submit/i
    }).last().click();

    await expect(heading).toBeHidden({
      timeout: 45000
    });
  }

  await closePopup(page);

  console.log('[Step 1] Admin login successful.');
}

// ==========================================
// STEP 2: OPEN CUSTOMER MANAGEMENT
// ==========================================

async function openCustomerManagement(page) {

  await page.goto(CUSTOMER_URL, {
    waitUntil: 'domcontentloaded',
    timeout: 45000
  });

  await closePopup(page);

  await expect(
    page.getByRole('heading', {
      name: 'Customer Management',
      exact: true
    })
  ).toBeVisible({
    timeout: 20000
  });

  await expect(
    page.getByPlaceholder('Search...', {
      exact: true
    })
  ).toBeVisible({
    timeout: 20000
  });

  console.log('[Step 2] Customer Management opened.');
  console.log('[Step 3] Customers page opened.');
}

// ==========================================
// STEP 4: SEARCH CUSTOMER
// ==========================================

async function searchCustomer(page) {

  const searchField = page.getByPlaceholder('Search...', {
    exact: true
  });

  await expect(searchField).toBeVisible({
    timeout: 15000
  });

  await searchField.fill(CUSTOMER_ID);

  const customerRow = page.locator('table tbody tr').filter({
    has: page.getByRole('cell', {
      name: CUSTOMER_ID,
      exact: true
    })
  });

  await expect(customerRow).toHaveCount(1, {
    timeout: 20000
  });

  await expect(
    customerRow.getByRole('cell', {
      name: customerData.name,
      exact: true
    })
  ).toBeVisible();

  console.log(
    '[Step 4] Customer found:',
    CUSTOMER_ID,
    customerData.name
  );

  return customerRow;
}

// ==========================================
// STEP 5: OPEN CUSTOMER ACTION MENU
// ==========================================

async function openActionMenu(customerRow) {

  const actionCell = customerRow.getByRole('cell').last();

  await expect(actionCell).toBeVisible();

  const actionButton = actionCell.locator('button');

  if (await actionButton.count() === 1) {

    await actionButton.click();

  } else {

    const actionIcon = actionCell.locator(
      'svg, img'
    ).first();

    await expect(actionIcon).toBeVisible({
      timeout: 10000
    });

    await actionIcon.click();
  }

  console.log('[Step 5] Customer action opened.');
}

// ==========================================
// STEP 6: CLICK EDIT
// ==========================================

async function openEditForm(page) {

  const editMenuItem = page.getByRole('menuitem', {
    name: /^edit$/i
  });

  const editButton = page.getByRole('button', {
    name: /^edit$/i
  });

  const editText = page.getByText('Edit', {
    exact: true
  });

  if (await visible(editMenuItem)) {

    await editMenuItem.click();

  } else if (await visible(editButton)) {

    await editButton.click();

  } else {

    await expect(editText.first()).toBeVisible({
      timeout: 10000
    });

    await editText.first().click();
  }

  const dialog = page.getByRole('dialog').filter({
    has: page.getByRole('heading', {
      name: 'Update Customer',
      exact: true
    })
  });

  await expect(dialog).toBeVisible({
    timeout: 15000
  });

  console.log('[Step 6] Update Customer form opened.');

  return dialog;
}

// ==========================================
// STEP 7: EDIT PHONE NUMBER
// ==========================================

async function editCustomerPhone(dialog) {

  // Actual application field is a spinbutton.
  const phoneField = dialog.getByRole('spinbutton', {
    name: 'Phone Number *',
    exact: true
  });

  await expect(phoneField).toBeVisible({
    timeout: 15000
  });

  const oldPhone = await phoneField.inputValue();

  console.log('[Step 7] Existing Phone:', oldPhone);

  if (oldPhone === NEW_PHONE) {

    console.log(
      '[Step 7] Phone already matches expected value.'
    );

    return {
      oldPhone,
      changed: false
    };
  }

  await phoneField.fill(NEW_PHONE);

  await expect(phoneField).toHaveValue(NEW_PHONE);

  console.log(
    '[Step 7] Phone changed:',
    oldPhone,
    '->',
    NEW_PHONE
  );

  return {
    oldPhone,
    changed: true
  };
}

// ==========================================
// STEP 8: SAVE CUSTOMER UPDATE
// ==========================================

async function saveCustomerUpdate(dialog) {

  const updateButton = dialog.getByRole('button', {
    name: 'Update',
    exact: true
  });

  await updateButton.scrollIntoViewIfNeeded();

  await expect(updateButton).toBeVisible({
    timeout: 15000
  });

  await expect(updateButton).toBeEnabled();

  // Submit only once
  await updateButton.click();

  console.log('[Step 8] Update button clicked.');

  // Wait for the form to close after submitting.
  await expect(dialog).toBeHidden({
    timeout: 20000
  });

  console.log('[Step 8] Update form closed.');
}

// ==========================================
// STEP 9: VERIFY UPDATED CUSTOMER
// ==========================================

async function verifyCustomerUpdate(page) {

  // Reopen the list to check saved data.
  await openCustomerManagement(page);

  const customerRow = await searchCustomer(page);

  const updatedPhoneCell = customerRow.getByRole('cell', {
    name: NEW_PHONE,
    exact: true
  });

  await expect(updatedPhoneCell).toBeVisible({
    timeout: 20000
  });

  await expect(
    customerRow.getByRole('cell', {
      name: customerData.name,
      exact: true
    })
  ).toBeVisible();

  console.log(
    '[Step 9] Updated phone verified:',
    NEW_PHONE
  );
}

// ==========================================
// MAIN TEST
// ==========================================

test(
  'Edit Customer Phone Number and Verify Update',
  async ({ page }) => {

    test.setTimeout(180000);

    page.setDefaultTimeout(10000);
    page.setDefaultNavigationTimeout(45000);

    try {

      await login(page);

      await openCustomerManagement(page);

      const customerRow = await searchCustomer(page);

      await openActionMenu(customerRow);

      const dialog = await openEditForm(page);

      const result = await editCustomerPhone(dialog);

      if (result.changed) {
        await saveCustomerUpdate(dialog);
      }

      await verifyCustomerUpdate(page);

      console.log('================================');
      console.log('CUSTOMER EDIT TEST PASSED');
      console.log('Customer ID:', CUSTOMER_ID);
      console.log('Customer Name:', customerData.name);
      console.log('Previous Phone:', result.oldPhone);
      console.log('Updated Phone:', NEW_PHONE);
      console.log('================================');

    } catch (error) {

      const screenshot = path.join(
        RESULTS_DIR,
        'customer-edit-failure.png'
      );

      await page.screenshot({
        path: screenshot,
        fullPage: true
      }).catch(() => {});

      console.error(
        '[ERROR] Customer Edit failed:',
        error.message
      );

      throw error;
    }
  }
);
