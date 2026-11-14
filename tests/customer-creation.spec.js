
'use strict';

const { test, expect } = require('@playwright/test');
require('dotenv').config();

const customersModule = require('../../test-data/customers');
const customers = Array.isArray(customersModule)
  ? customersModule
  : customersModule.customers;

const BASE_URL = (
  process.env.BASE_URL ||
  'http://purple-development-mychits-admin.s3-website.eu-north-1.amazonaws.com'
).replace(/\/+$/, '');

const CUSTOMER_URL = `${BASE_URL}/customer-menu`;
const ADD_URL = `${CUSTOMER_URL}/add-customer`;
const TIMEOUT = 10000;

function exact(value) {
  const escaped = String(value).replace(
    /[.*+?^${}()|[\]\\]/g,
    '\\$&'
  );
  return new RegExp(`^\\s*${escaped}\\s*$`, 'i');
}

async function visible(locator) {
  return locator.isVisible().catch(() => false);
}

async function fill(page, placeholder, value, required = true) {
  if (value === undefined || value === null || value === '') {
    if (required) {
      throw new Error(`Missing value: ${placeholder}`);
    }
    return;
  }

  const input = page.getByPlaceholder(placeholder).first();

  if (!required && !(await visible(input))) return;

  await expect(input).toBeVisible({ timeout: TIMEOUT });
  await input.fill(String(value));
}

// =====================================
// LOGIN ONCE
// =====================================

async function login(page) {
  console.log('[Login] Opening website');

  await page.goto(BASE_URL, {
    waitUntil: 'domcontentloaded'
  });

  const loginHeading = page.getByRole('heading', {
    name: /admin login/i
  });

  if (await visible(loginHeading)) {
    const branch = page.locator('select').first();

    await branch.selectOption({
      label: process.env.BRANCH_NAME ||
        'Main Branch (CF-BR-1)'
    });

    if (!process.env.ADMIN_ID || !process.env.OTP) {
      throw new Error('ADMIN_ID or OTP missing in .env');
    }

    await fill(
      page,
      'XXX-XX-XXXX',
      process.env.ADMIN_ID
    );

    await page.getByRole('button', {
      name: /send otp/i
    }).click();

    const otpInputs = page.locator(
      'input[autocomplete="one-time-code"], ' +
      'input[name*="otp" i], ' +
      'input[placeholder*="otp" i], ' +
      'input[inputmode="numeric"], ' +
      'input[maxlength="6"]:visible'
    );

    await expect(otpInputs.first()).toBeVisible({
      timeout: 30000
    });

    const code = process.env.OTP;
    const count = await otpInputs.count();

    if (count === 1) {
      await otpInputs.first().fill(code);
    } else if (count === code.length) {
      for (let i = 0; i < count; i++) {
        await otpInputs.nth(i).fill(code[i]);
      }
    } else {
      throw new Error(
        `Unexpected OTP input count: ${count}`
      );
    }

    await page.getByRole('button', {
      name: /verify otp|verify|login|submit/i
    }).last().click();

    await page.waitForURL(
      /\/(dashboard|customer-menu)\/?(?:\?.*)?$/,
      { timeout: 30000 }
    );
  }

  console.log('[Login] Successful');
}

// =====================================
// CUSTOMER MANAGEMENT
// =====================================

async function openCustomers(page) {
  if (
    new URL(page.url()).pathname.replace(/\/$/, '') !==
    '/customer-menu'
  ) {
    await page.goto(CUSTOMER_URL, {
      waitUntil: 'domcontentloaded'
    });
  }

  await expect(
    page.getByRole('button', {
      name: /add customer/i
    }).first()
  ).toBeVisible({ timeout: 20000 });

  console.log('[Navigation] Customers list opened');
}

async function openAddCustomer(page) {
  await openCustomers(page);

  await page.getByRole('button', {
    name: /add customer/i
  }).first().click();

  const nameField = page.getByPlaceholder(
    /first\s*name|enter the full name/i
  ).first();

  try {
    await expect(nameField).toBeVisible({
      timeout: 5000
    });
  } catch {
    await page.goto(ADD_URL, {
      waitUntil: 'domcontentloaded'
    });

    await expect(nameField).toBeVisible({
      timeout: TIMEOUT
    });
  }

  console.log('[Navigation] Add Customer opened');
}

// =====================================
// STEP 1: BASIC DETAILS
// =====================================

async function basicDetails(page, customer) {
  console.log('[Step 1] Basic Details');

  const firstName = page.getByPlaceholder(
    /first\s*name/i
  ).first();

  if (await visible(firstName)) {
    await firstName.fill(customer.firstName);

    await fill(
      page,
      /middle\s*name/i,
      customer.middleName,
      false
    );

    await fill(
      page,
      /last\s*name/i,
      customer.lastName
    );
  } else {
    await fill(
      page,
      /enter the full name/i,
      customer.name
    );
  }

  await fill(
    page,
    /enter email/i,
    customer.email,
    false
  );

  await fill(
    page,
    /enter phone number/i,
    customer.phone
  );

  // Password is auto-generated in this form.

  await fill(
    page,
    /enter pincode/i,
    customer.pincode
  );

  await fill(
    page,
    /enter (adhaar|aadhaar) number/i,
    customer.aadhaar
  );

  await fill(
    page,
    /enter pan number/i,
    customer.pan,
    false
  );

  await page.getByRole('button', {
    name: /save\s*&\s*continue/i
  }).click();

  await expect(
    page.getByText('Communication Address', {
      exact: true
    })
  ).toBeVisible({ timeout: 15000 });

  console.log('[Step 1] Completed');
}

// =====================================
// ADDRESS SELECT - DECLARED ONLY ONCE
// =====================================

async function addressSelect(page, index, expected, label) {
  // Use only outer Ant Design select containers.
  // Internal combobox inputs are deliberately excluded.
  const dropdowns = page.locator('.ant-select:visible');

  const dropdown = dropdowns.nth(index);

  await expect(dropdown).toBeVisible({
    timeout: TIMEOUT
  });

  const selectedItem = dropdown.locator(
    '.ant-select-selection-item'
  ).first();

  const current = (
    await selectedItem.textContent().catch(() => '')
  ).trim();

  // Skip dropdowns that already have the required value.
  if (current.toLowerCase() === expected.toLowerCase()) {
    console.log(
      `[Address] ${label}: ${expected} (already selected)`
    );
    return;
  }

  console.log(
    `[Address] Selecting ${label}: ${expected}`
  );

  await dropdown.locator(
    '.ant-select-selector'
  ).click({ timeout: 5000 });

  const popup = page.locator(
    '.ant-select-dropdown:visible'
  ).last();

  await expect(popup).toBeVisible({
    timeout: 5000
  });

  // Search only when the select permits typing.
  const search = dropdown.locator(
    'input.ant-select-selection-search-input'
  ).first();

  if (await visible(search)) {
    const readOnly = await search.getAttribute('readonly');

    if (readOnly === null) {
      await search.fill(expected);
    }
  }

  const option = popup.locator(
    '.ant-select-item-option:not(.ant-select-item-option-disabled)'
  ).filter({
    hasText: exact(expected)
  }).first();

  await expect(option).toBeVisible({
    timeout: 5000
  });

  await option.click({ timeout: 5000 });

  await expect(selectedItem).toHaveText(
    exact(expected),
    { timeout: 5000 }
  );

  console.log(`[Address] ${label}: ${expected}`);
}

// =====================================
// STEP 2: ADDRESS DETAILS
// =====================================

async function addressDetails(page, customer) {
  console.log('[Step 2] Address Details');

  const addressLabel = page.getByText(
    /address line/i
  ).first();

  await expect(addressLabel).toBeVisible({
    timeout: TIMEOUT
  });

  // Find the input belonging to the Address Line label.
  const formItem = addressLabel.locator(
    'xpath=ancestor::*[contains(@class,"ant-form-item")][1]'
  );

  let address = formItem.locator(
    'input:not([type="checkbox"]), textarea'
  ).first();

  if (!(await visible(address))) {
    const nearby = addressLabel.locator(
      'xpath=parent::*'
    );

    address = nearby.locator(
      'input:not([type="checkbox"]), textarea'
    ).first();
  }

  await expect(address).toBeVisible({
    timeout: TIMEOUT
  });

  await address.fill(
    customer.communicationAddress ||
    customer.address
  );

  console.log('[Address] Communication Address filled');

  // The first three Ant Design selects must be
  // Country, State and District in that order.
  await addressSelect(
    page,
    0,
    customer.country || 'India',
    'Country'
  );

  await addressSelect(
    page,
    1,
    customer.state || 'Karnataka',
    'State'
  );

  await addressSelect(
    page,
    2,
    customer.district || 'Bengaluru Urban',
    'District'
  );

  const sameAddress = page.getByRole('checkbox', {
    name: /same as communication address/i
  });

  if (customer.sameAsCommunicationAddress !== false) {
    if (!(await sameAddress.isChecked())) {
      await sameAddress.check();
    }
  } else {
    if (await sameAddress.isChecked()) {
      await sameAddress.uncheck();
    }

    const permanentLabel = page.getByText(
      /address line/i
    ).last();

    const permanentInput = permanentLabel.locator(
      'xpath=ancestor::*[contains(@class,"ant-form-item")][1]'
    ).locator('input, textarea').first();

    await permanentInput.fill(
      customer.permanentAddress
    );
  }

  await page.getByRole('button', {
    name: /save\s*&\s*continue/i
  }).click();

  await expect(
    page.getByText(/payment frequency/i).first()
  ).toBeVisible({ timeout: 15000 });

  console.log('[Step 2] Completed');
}

// =====================================
// STEP 3: ADDITIONAL & PAYMENT
// =====================================

async function additionalDetails(page, customer) {
  console.log('[Step 3] Additional & Payment');

  await fill(
    page,
    /enter family code/i,
    customer.familyCode,
    false
  );

  const referred = customer.referredType || 'Self Joining';

  // Do not open Referred Type if already selected.
  const selected = page.locator(
    '.ant-select-selection-item:visible'
  ).filter({
    hasText: exact(referred)
  }).first();

  if (!(await visible(selected))) {
    const label = page.getByText(
      /referred type/i
    ).first();

    const formItem = label.locator(
      'xpath=ancestor::*[contains(@class,"ant-form-item")][1]'
    );

    const dropdown = formItem.locator(
      '.ant-select'
    ).first();

    await expect(dropdown).toBeVisible({
      timeout: TIMEOUT
    });

    await dropdown.locator(
      '.ant-select-selector'
    ).click();

    const option = page.locator(
      '.ant-select-dropdown:visible .ant-select-item-option'
    ).filter({
      hasText: exact(referred)
    }).first();

    await option.click({ timeout: 5000 });
  }

  // Collection Area and CRM are optional.
  // All ten supplied customer records leave them blank.
  if (customer.collectionArea || customer.crm) {
    throw new Error(
      'Collection Area or CRM has a value but no verified selector'
    );
  }

  const frequency = customer.paymentFrequency || 'Daily';

  const radio = page.getByRole('radio', {
    name: exact(frequency)
  });

  if (await visible(radio)) {
    if (!(await radio.isChecked())) {
      await radio.check();
    }
  } else {
    await page.getByText(
      exact(frequency)
    ).filter({ visible: true }).last().click();
  }

  await fill(
    page,
    /enter (daily|weekly|monthly) amount/i,
    customer.installmentAmount || '200'
  );

  console.log('[Step 3] Completed');
}

// =====================================
// SAVE CUSTOMER
// =====================================

async function saveCustomer(page, customer) {
  console.log(`[Save] ${customer.name}`);

  await page.getByRole('button', {
    name: /^save customer$/i
  }).click();

  const modal = page.locator(
    '[role="dialog"]:visible, .ant-modal:visible'
  ).last();

  if (await visible(modal)) {
    const confirm = modal.getByRole('button', {
      name: /^(confirm|yes|save|proceed|ok)$/i
    }).first();

    if (await visible(confirm)) {
      await confirm.click();
    }
  }

  const started = Date.now();

  while (Date.now() - started < 15000) {
    const errors = (
      await page.locator(
        '.ant-message-error, ' +
        '.ant-notification-notice-error, ' +
        '.ant-form-item-explain-error, ' +
        '[role="alert"]'
      ).allTextContents().catch(() => [])
    ).join(' ');

    if (
      /phone number already exists|already registered|already exists/i
        .test(errors)
    ) {
      console.log(`[Existing] ${customer.name}`);
      await openCustomers(page);
      return 'existing';
    }

    if (errors.trim()) {
      throw new Error(
        `Save failed for ${customer.name}: ${errors}`
      );
    }

    const success = (
      await page.locator(
        '.ant-message-success, ' +
        '.ant-notification-notice-success, ' +
        '[role="status"]'
      ).allTextContents().catch(() => [])
    ).join(' ');

    if (
      /customer.*(created|saved|added)|successfully/i
        .test(success)
    ) {
      console.log(`[Created] ${customer.name}`);
      await openCustomers(page);
      return 'created';
    }

    if (
      !new URL(page.url()).pathname
        .includes('/add-customer')
    ) {
      await openCustomers(page);

      console.log(
        `[Unverified] ${customer.name}: save redirected`
      );

      return 'unverified';
    }

    await page.waitForTimeout(200);
  }

  throw new Error(
    `No save confirmation received for ${customer.name}`
  );
}

// =====================================
// MAIN TEST - 10 CUSTOMERS
// =====================================

test(
  'Login once and create 10 customers sequentially',
  async ({ page }) => {
    test.setTimeout(900000);
    page.setDefaultTimeout(TIMEOUT);

    expect(customers).toHaveLength(10);

    let created = 0;
    let existing = 0;
    let unverified = 0;
    let processed = 0;

    await login(page);

    for (let i = 0; i < customers.length; i++) {
      const customer = customers[i];

      console.log(
        `\n========== ${i + 1}/10: ${customer.name} ==========`
      );

      try {
        await openAddCustomer(page);
        await basicDetails(page, customer);
        await addressDetails(page, customer);
        await additionalDetails(page, customer);

        const result = await saveCustomer(
          page,
          customer
        );

        if (result === 'created') created++;
        if (result === 'existing') existing++;
        if (result === 'unverified') unverified++;

        processed++;

        console.log(
          `[Progress] ${processed}/10 processed`
        );
      } catch (error) {
        console.error(
          `[Failed] ${customer.name}: ${error.message}`
        );

        console.error(`[URL] ${page.url()}`);

        throw error;
      }
    }

    await openCustomers(page);

    console.log('\n===== FINAL RESULT =====');
    console.log(`Processed: ${processed}/10`);
    console.log(`Created: ${created}`);
    console.log(`Existing: ${existing}`);
    console.log(`Unverified: ${unverified}`);
    console.log(`Final URL: ${page.url()}`);

    expect(processed).toBe(10);
    expect(unverified).toBe(0);
  }
);
