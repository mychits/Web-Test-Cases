
'use strict';

const { test, expect } = require('@playwright/test');
require('dotenv').config();

const data = require('../../test-data/customers');
const customers = Array.isArray(data) ? data : data.customers;

const BASE_URL = (
  process.env.BASE_URL ||
  'http://purple-development-mychits-admin.s3-website.eu-north-1.amazonaws.com'
).replace(/\/+$/, '');

const CUSTOMER_URL = `${BASE_URL}/customer-menu`;
const ADD_URL = `${CUSTOMER_URL}/add-customer`;
const TIMEOUT = 12000;

const shown = locator =>
  locator.isVisible().catch(() => false);

function exact(value) {
  return new RegExp(
    `^\\s*${String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`,
    'i'
  );
}

async function fill(page, placeholder, value, required = true) {
  if (value === undefined || value === null || value === '') {
    if (required) {
      throw new Error(`Missing value for ${placeholder}`);
    }
    return;
  }

  const field = page.getByPlaceholder(placeholder).first();

  if (!required && !(await shown(field))) return;

  await expect(field).toBeVisible({ timeout: TIMEOUT });
  await field.fill(String(value));
}

// =====================================
// LOGIN ONCE
// =====================================

async function login(page) {
  await page.goto(BASE_URL, {
    waitUntil: 'domcontentloaded'
  });

  if (await shown(
    page.getByRole('heading', { name: /admin login/i })
  )) {
    const branch = page.locator('select').first();

    if (await shown(branch)) {
      await branch.selectOption({
        label: process.env.BRANCH_NAME ||
          'Main Branch (CF-BR-1)'
      });
    }

    if (!process.env.ADMIN_ID || !process.env.OTP) {
      throw new Error('Set ADMIN_ID and OTP in .env');
    }

    await fill(
      page,
      'XXX-XX-XXXX',
      process.env.ADMIN_ID
    );

    await page.getByRole('button', {
      name: /send otp/i
    }).click();

    const otp = page.locator(
      'input[autocomplete="one-time-code"], ' +
      'input[name*="otp" i], ' +
      'input[placeholder*="otp" i], ' +
      'input[inputmode="numeric"], ' +
      'input[maxlength="6"]:visible'
    );

    await expect(otp.first()).toBeVisible({
      timeout: 30000
    });

    const count = await otp.count();

    if (count === 1) {
      await otp.first().fill(process.env.OTP);
    } else if (count === process.env.OTP.length) {
      for (let i = 0; i < count; i++) {
        await otp.nth(i).fill(process.env.OTP[i]);
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

async function customersPage(page) {
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

  console.log('[Navigation] Customers');
}

async function addCustomerPage(page) {
  await customersPage(page);

  await page.getByRole('button', {
    name: /add customer/i
  }).first().click();

  const name = page.getByPlaceholder(
    /first\s*name|enter the full name/i
  ).first();

  try {
    await expect(name).toBeVisible({
      timeout: 5000
    });
  } catch {
    await page.goto(ADD_URL, {
      waitUntil: 'domcontentloaded'
    });

    await expect(name).toBeVisible({
      timeout: TIMEOUT
    });
  }

  console.log('[Navigation] Add Customer');
}

// =====================================
// STEP 1: BASIC DETAILS
// =====================================

async function basicDetails(page, c) {
  console.log('[Step 1] Basic Details');

  const first = page.getByPlaceholder(
    /first\s*name/i
  ).first();

  if (await shown(first)) {
    await first.fill(
      c.firstName || c.name.split(/\s+/)[0]
    );

    await fill(
      page,
      /middle\s*name/i,
      c.middleName,
      false
    );

    await fill(
      page,
      /last\s*name/i,
      c.lastName ||
        c.name.split(/\s+/).slice(1).join(' ')
    );
  } else {
    await fill(
      page,
      /enter the full name/i,
      c.name
    );
  }

  await fill(
    page,
    /enter email/i,
    c.email,
    false
  );

  await fill(
    page,
    /enter phone number/i,
    c.phone
  );

  await fill(
    page,
    /enter pincode/i,
    c.pincode
  );

  await fill(
    page,
    /enter (adhaar|aadhaar) number/i,
    c.aadhaar
  );

  await fill(
    page,
    /enter pan number/i,
    c.pan,
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
// ADDRESS DROPDOWN HELPER
// DECLARED ONLY ONCE
// =====================================

async function addressSelect(page, index, expected, label) {
  const dropdown = page.locator(
    '.ant-select:visible'
  ).nth(index);

  await expect(dropdown).toBeVisible({
    timeout: TIMEOUT
  });

  const selected = dropdown.locator(
    '.ant-select-selection-item'
  ).first();

  const current = (
    await selected.textContent().catch(() => '')
  ).trim();

  if (
    current.toLowerCase() === expected.toLowerCase()
  ) {
    console.log(
      `[Address] ${label}: ${expected} (already selected)`
    );
    return;
  }

  await dropdown.locator(
    '.ant-select-selector'
  ).click();

  const popup = page.locator(
    '.ant-select-dropdown:visible'
  ).last();

  await expect(popup).toBeVisible({
    timeout: TIMEOUT
  });

  const search = dropdown.locator(
    'input.ant-select-selection-search-input'
  ).first();

  if (
    (await shown(search)) &&
    (await search.getAttribute('readonly')) === null
  ) {
    await search.fill(expected);
  }

  const option = popup.locator(
    '.ant-select-item-option:not(.ant-select-item-option-disabled)'
  ).filter({
    hasText: exact(expected)
  }).first();

  await expect(option).toBeVisible({
    timeout: TIMEOUT
  });

  await option.click();

  await expect(selected).toHaveText(
    exact(expected),
    { timeout: TIMEOUT }
  );

  console.log(`[Address] ${label}: ${expected}`);
}

// =====================================
// STEP 2: ADDRESS DETAILS
// =====================================

async function addressDetails(page, c) {
  console.log('[Step 2] Address Details');

  const addressValue = c.communicationAddress || c.address;

  if (!addressValue) {
    throw new Error(
      `Communication address missing for ${c.name}`
    );
  }

  const byLabel = page.getByRole('textbox', {
    name: /address line/i
  }).first();

  const byPlaceholder = page.getByPlaceholder(
    /address/i
  ).first();

  let communicationAddress;

  if (await byLabel.isVisible().catch(() => false)) {
    communicationAddress = byLabel;
  } else if (
    await byPlaceholder.isVisible().catch(() => false)
  ) {
    communicationAddress = byPlaceholder;
  } else {
    const inputs = await page.locator(
      'input:visible, textarea:visible'
    ).evaluateAll(elements =>
      elements.map(el => ({
        tag: el.tagName,
        placeholder: el.getAttribute('placeholder'),
        name: el.getAttribute('name'),
        id: el.id
      }))
    );

    console.log('[Step 2] Visible inputs:', inputs);

    throw new Error(
      'Address Line input not found. Check terminal.'
    );
  }

  await communicationAddress.fill(addressValue);

  await expect(communicationAddress).toHaveValue(
    addressValue
  );

  console.log('[Address] Communication Address filled:', addressValue);



  

  await addressSelect(
    page, 0, c.country || 'India', 'Country'
  );

  await addressSelect(
    page, 1, c.state || 'Karnataka', 'State'
  );

  await addressSelect(
    page, 2, c.district || 'Bengaluru Urban', 'District'
  );

  // Copy Communication Address to Permanent Address.
  const sameAddress = page.getByRole('checkbox', {
    name: /same as communication address/i
  });

  await expect(sameAddress).toBeVisible({
    timeout: TIMEOUT
  });

  if (!(await sameAddress.isChecked())) {
    await sameAddress.check();
  }

  console.log('[Address] Same as Communication Address checked');

  // Save Address Details.
  await page.getByRole('button', {
    name: /save\s*&\s*continue/i
  }).click();

  // Check whether the application reports validation errors.
  const addressError = page.getByText(
    /address line is required/i
  );

  if (await addressError.isVisible().catch(() => false)) {
    throw new Error(
      'Address Line is still required after filling the field'
    );
  }

  // Wait for Step 3.
  await expect(
    page.getByText('Additional & Payment', {
      exact: true
    }).last()
  ).toBeVisible({ timeout: 15000 });

  console.log('[Step 2] Completed');
}
// =====================================
// STEP 3: ADDITIONAL & PAYMENT
// =====================================

async function additionalDetails(page, c) {
  console.log('[Step 3] Additional & Payment');

  await fill(
    page,
    /enter family code/i,
    c.familyCode,
    false
  );

  const referred = c.referredType || 'Self Joining';

  const selected = page.locator(
    '.ant-select-selection-item:visible'
  ).filter({
    hasText: exact(referred)
  }).first();

  if (!(await shown(selected))) {
    const label = page.getByText(
      /referred type/i
    ).first();

    const item = label.locator(
      'xpath=ancestor::*[contains(@class,"ant-form-item")][1]'
    );

    const native = item.locator('select').first();

    if (await shown(native)) {
      await native.selectOption({
        label: referred
      });
    } else {
      const ant = item.locator(
        '.ant-select'
      ).first();

      await expect(ant).toBeVisible({
        timeout: TIMEOUT
      });

      await ant.locator(
        '.ant-select-selector'
      ).click();

      await page.locator(
        '.ant-select-dropdown:visible .ant-select-item-option'
      ).filter({
        hasText: exact(referred)
      }).first().click();
    }
  }

  if (
    c.collectionArea ||
    c.crm ||
    c.relationshipManager
  ) {
    throw new Error(
      'Optional Collection Area / CRM selectors need verification against the live form'
    );
  }

  const frequency = c.paymentFrequency || 'Daily';

  const radio = page.getByRole('radio', {
    name: exact(frequency)
  });

  if (await shown(radio)) {
    if (!(await radio.isChecked())) {
      await radio.check();
    }
  } else {
    await page.getByText(
      exact(frequency)
    ).filter({
      visible: true
    }).last().click();
  }

  const amount = String(
    c.installmentAmount ?? 200
  );

  const installment = page.locator(
    'input[placeholder*="installment" i]:visible, ' +
    'input[name="installment_amount"]:visible'
  ).first();

  if (await shown(installment)) {
    await installment.fill(amount);
  } else {
    await page.getByLabel(
      /installment amount/i
    ).fill(amount);
  }

  console.log('[Step 3] Completed');
}

// =====================================
// SAVE CUSTOMER
// =====================================

async function saveCustomer(page, c) {
  console.log(`[Save] ${c.name}`);

  await page.getByRole('button', {
    name: /^save customer$/i
  }).click();

  const dialog = page.locator(
    '[role="dialog"]:visible, .ant-modal:visible'
  ).last();

  if (await shown(dialog)) {
    const confirm = dialog.getByRole('button', {
      name: /^(confirm|yes|save|proceed|ok)$/i
    }).first();

    if (await shown(confirm)) {
      await confirm.click();
    }
  }

  const deadline = Date.now() + 20000;

  while (Date.now() < deadline) {
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
      await customersPage(page);
      return 'existing';
    }

    if (errors.trim()) {
      throw new Error(
        `Save failed for ${c.name}: ${errors}`
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
      await customersPage(page);
      return 'created';
    }

    if (
      !new URL(page.url()).pathname
        .includes('/add-customer')
    ) {
      await customersPage(page);
      return 'unverified';
    }

    await page.waitForTimeout(200);
  }

  throw new Error(
    `Save outcome not confirmed for ${c.name}`
  );
}

// =====================================
// MAIN TEST: EXACTLY 10 CUSTOMERS
// =====================================

test(
  'Login once and create 10 customers sequentially',
  async ({ page }) => {
    test.setTimeout(900000);
    page.setDefaultTimeout(TIMEOUT);

    expect(
      customers,
      'Customer data must contain exactly 10 records'
    ).toHaveLength(10);

    const totals = {
      created: 0,
      existing: 0,
      unverified: 0
    };

    await login(page);

    for (const [index, customer] of customers.entries()) {
      console.log(
        `\n========== ${index + 1}/10: ${customer.name} ==========`
      );

      try {
        await addCustomerPage(page);
        await basicDetails(page, customer);
        await addressDetails(page, customer);
        await additionalDetails(page, customer);

        const outcome = await saveCustomer(
          page,
          customer
        );

        totals[outcome]++;

        console.log(
          `[Progress] ${index + 1}/10: ${outcome}`
        );
      } catch (error) {
        console.error(
          `[Failed] ${customer.name}: ${error.message}`
        );

        console.error(`[URL] ${page.url()}`);
        throw error;
      }
    }

    await customersPage(page);

    console.log('[Final results]', totals);

    expect(
      totals.unverified,
      'Save outcomes require verification'
    ).toBe(0);
  }
);
