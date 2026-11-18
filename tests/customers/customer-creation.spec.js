
'use strict';

require('dotenv').config();

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// ==========================================
// CUSTOMER CREATION + VALIDATION AUTOMATION
// 100 DATASETS - ONE / ALL / RANGE
// ==========================================

const customers = require('../../test-data/customer-data-100');

const BASE_URL = (process.env.BASE_URL || '').replace(/\/+$/, '');
const CUSTOMER_URL = `${BASE_URL}/customer-menu`;
const ADD_URL = `${CUSTOMER_URL}/add-customer`;

const BRANCH_NAME = process.env.BRANCH_NAME;
const ADMIN_ID = process.env.ADMIN_ID;
const OTP = process.env.OTP;
const PASSWORD = process.env.TEST_CUSTOMER_PASSWORD;

const MODE = (process.env.CUSTOMER_MODE || 'ONE').toUpperCase();
const CUSTOMER_NUMBER = Number(process.env.CUSTOMER_NUMBER || 1);
const START = Number(process.env.CUSTOMER_START || 1);
const END = Number(process.env.CUSTOMER_END || 10);

// Defaults to validation testing without saving customers.
// Set CUSTOMER_TEST_TYPE=CREATE to test actual customer creation.
const TEST_TYPE = (process.env.CUSTOMER_TEST_TYPE || 'VALIDATE')
  .toUpperCase();

// Negative validation tests are selected using a field name.
// Example: INVALID_FIELD=firstName
const INVALID_FIELD = process.env.INVALID_FIELD || 'firstName';
const INVALID_VALUE = process.env.INVALID_VALUE || '12345';

const RESULTS_DIR = path.resolve(
  process.cwd(),
  'customer-creation-results'
);

fs.mkdirSync(RESULTS_DIR, { recursive: true });

if (!BASE_URL || !BRANCH_NAME || !ADMIN_ID || !OTP) {
  throw new Error(
    'Set BASE_URL, BRANCH_NAME, ADMIN_ID and OTP in .env'
  );
}

if (!Array.isArray(customers) || customers.length === 0) {
  throw new Error('Customer test data must export an array');
}

function selectedData() {
  if (MODE === 'ALL') {
    return customers.map((customer, index) => ({
      customer,
      number: index + 1
    }));
  }

  if (MODE === 'ONE') {
    if (
      !Number.isInteger(CUSTOMER_NUMBER) ||
      CUSTOMER_NUMBER < 1 ||
      CUSTOMER_NUMBER > customers.length
    ) {
      throw new Error('Invalid CUSTOMER_NUMBER');
    }

    return [{
      customer: customers[CUSTOMER_NUMBER - 1],
      number: CUSTOMER_NUMBER
    }];
  }

  if (MODE === 'RANGE') {
    if (
      !Number.isInteger(START) ||
      !Number.isInteger(END) ||
      START < 1 ||
      START > END ||
      END > customers.length
    ) {
      throw new Error('Invalid CUSTOMER_START / CUSTOMER_END');
    }

    return customers
      .slice(START - 1, END)
      .map((customer, index) => ({
        customer,
        number: START + index
      }));
  }

  throw new Error(`Unsupported CUSTOMER_MODE: ${MODE}`);
}

const selected = selectedData();

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function visible(locator) {
  return locator.first().isVisible().catch(() => false);
}

async function fill(page, pattern, value, required = true) {
  const locator = page.getByPlaceholder(pattern).first();

  if (value === undefined || value === null || value === '') {
    if (required) {
      throw new Error(`Missing value for ${pattern}`);
    }
    return;
  }

  if (!required && !await visible(locator)) return;

  await expect(locator).toBeVisible({ timeout: 10000 });
  await locator.fill(String(value));
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
// LOGIN ONCE
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
    const branch = page.locator('select').first();

    await expect(branch).toBeVisible({ timeout: 20000 });
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
  console.log('[Login] Successful');
}

async function openCustomerManagement(page) {
  await page.goto(CUSTOMER_URL, {
    waitUntil: 'domcontentloaded',
    timeout: 45000
  });

  await closePopup(page);


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

    await fill(page, 'XXX-XX-XXXX', process.env.ADMIN_ID);

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
}

async function openAddCustomer(page) {
  await page.goto(ADD_URL, {
    waitUntil: 'domcontentloaded',
    timeout: 45000
  });

  await closePopup(page);

  await expect(
    page.getByPlaceholder(
      /first\s*name|enter the full name/i
    ).first()
  ).toBeVisible({ timeout: 20000 });
}

async function nextStep(page) {
  const next = page.getByRole('button', {
    name: /save\s*&\s*continue/i
  }).first();

  await expect(next).toBeEnabled({ timeout: 10000 });
  await next.click();
}

// ==========================================
// STEP 1 - BASIC DETAILS
// ==========================================

async function basicDetails(page, customer) {
  const full = page.getByPlaceholder(
    /enter the full name/i
  ).first();

  if (await visible(full)) {
    await full.fill(String(customer.name));
  } else {
    await fill(page, /first\s*name/i, customer.firstName);
    await fill(
      page,
      /middle\s*name/i,
      customer.middleName,
      false
    );
    await fill(page, /last\s*name/i, customer.lastName);
  }

  await fill(page, /enter email/i, customer.email, false);
  await fill(page, /enter phone number/i, customer.phone);

  const password = page.getByPlaceholder(
    /auto generated password|enter password/i
  ).first();

  if (
    PASSWORD &&
    await visible(password) &&
    await password.isEditable()
  ) {
    await password.fill(PASSWORD);
  }

  await fill(page, /enter pincode/i, customer.pincode);
  await fill(
    page,
    /enter\s+ad(?:h)?aar\s+number/i,
    customer.aadhaar
  );
  await fill(
    page,
    /enter\s+pan\s+number/i,
    customer.pan,
    false
  );
}

// ==========================================
// ANT DESIGN DROPDOWN
// ==========================================

async function chooseAntOption(page, select, value) {
  await expect(select).toBeVisible({ timeout: 10000 });

  const selectedItem = select.locator(
    '.ant-select-selection-item'
  ).first();

  const selectedValue = async () => {
    const title = await selectedItem.getAttribute('title')
      .catch(() => null);

    return (
      title ||
      await selectedItem.textContent().catch(() => '')
    ).trim();
  };

  if (
    (await selectedValue()).toLowerCase() ===
    String(value).toLowerCase()
  ) {
    return;
  }

  await select.locator('.ant-select-selector').click();

  const popup = page.locator(
    '.ant-select-dropdown:visible'
  ).last();

  await expect(popup).toBeVisible({ timeout: 10000 });

  const option = popup.locator(
    '.ant-select-item-option:not(.ant-select-item-option-disabled)'
  ).filter({
    hasText: new RegExp(
      `^\\s*${escapeRegex(value)}\\s*$`,
      'i'
    )
  }).first();

  if (!await visible(option)) {
    const holder = popup.locator(
      '.rc-virtual-list-holder'
    ).first();

    if (await visible(holder)) {
      for (let i = 0; i < 30; i++) {
        if (await visible(option)) break;

        const moved = await holder.evaluate(el => {
          const old = el.scrollTop;
          el.scrollTop += Math.max(
            100,
            el.clientHeight * 0.8
          );
          return el.scrollTop > old;
        });

        if (!moved) break;
      }
    }
  }

  await expect(option).toBeVisible({ timeout: 10000 });
  await option.click();

  await expect.poll(
    selectedValue,
    { timeout: 10000 }
  ).toMatch(
    new RegExp(
      `^\\s*${escapeRegex(value)}\\s*$`,
      'i'
    )
  );
}

// ==========================================
// STEP 2 - ADDRESS DETAILS
// ==========================================

async function addressDetails(page, customer) {
  await fill(
    page,
    /enter street, building, area/i,
    customer.communicationAddress || customer.address
  );

  const selects = page.locator('main .ant-select');

  await chooseAntOption(
    page,
    selects.nth(0),
    customer.country || 'India'
  );

  await chooseAntOption(
    page,
    selects.nth(1),
    customer.state || 'Karnataka'
  );

  await chooseAntOption(
    page,
    selects.nth(2),
    customer.district || 'Bengaluru Urban'
  );

  const same = page.getByRole('checkbox', {
    name: /same as communication address/i
  }).first();

  if (await visible(same)) {
    if (customer.sameAsCommunicationAddress !== false) {
      await same.check();
    } else {
      await same.uncheck();
    }
  }

  if (
    !await visible(same) ||
    customer.sameAsCommunicationAddress === false
  ) {
    await fill(
      page,
      /permanent address/i,
      customer.permanentAddress || customer.address,
      false
    );
  }
}

// ==========================================
// REFERRED TYPE
// ==========================================

async function selectReferredType(page, value) {
  const target = value || 'Self Joining';

  const native = page.getByLabel(/referred type/i).first();

  if (await visible(native)) {
    const tag = await native.evaluate(el => el.tagName);

    if (tag === 'SELECT') {
      await native.selectOption({ label: target });
      return;
    }
  }

  const selects = page.locator('main .ant-select');

  const placeholder = selects.filter({
    has: page.locator(
      '.ant-select-selection-placeholder',
      { hasText: /select referred type/i }
    )
  });

  const count = await placeholder.count();

  if (count === 0) {
    const selected = selects.filter({
      has: page.locator(
        '.ant-select-selection-item',
        {
          hasText: new RegExp(
            `^\\s*${escapeRegex(target)}\\s*$`,
            'i'
          )
        }
      )
    });

    if (await selected.count() === 1) return;

    throw new Error('Referred Type dropdown not found');
  }

  if (count !== 1) {
    throw new Error(`Found ${count} Referred Type dropdowns`);
  }

  const index = await placeholder.evaluate(el =>
    Array.from(
      document.querySelectorAll('main .ant-select')
    ).indexOf(el)
  );

  if (index < 0) {
    throw new Error('Invalid Referred Type index');
  }

  await chooseAntOption(page, selects.nth(index), target);
}

// ==========================================
// STEP 3 - ADDITIONAL DETAILS
// ==========================================

async function additionalDetails(page, customer) {
  await fill(
    page,
    /enter family code/i,
    customer.familyCode,
    false
  );

  await selectReferredType(
    page,
    customer.referredType || 'Self Joining'
  );

  const frequency =
    customer.paymentFrequency || 'Daily';

  const radio = page.getByRole('radio', {
    name: new RegExp(
      `^${escapeRegex(frequency)}$`,
      'i'
    )
  }).first();

  await expect(radio).toBeVisible({ timeout: 10000 });
  await radio.check();

  const amount = page.locator(
    'input[name="installment_amount"]'
  );

  await expect(amount).toBeVisible({ timeout: 10000 });

  await amount.fill(
    String(customer.installmentAmount || '200')
  );
}

// ==========================================
// SAVE CUSTOMER
// ==========================================

async function saveCustomer(page) {
  const save = page.getByRole('button', {
    name: /^save customer$/i
  }).first();

  await expect(save).toBeEnabled({ timeout: 10000 });
  await save.click();

  const heading = page.getByRole('heading', {
    name: /confirm details/i
  });

  await expect(heading).toBeVisible({ timeout: 15000 });

  const popup = page.locator(
    '[role="dialog"], .ant-modal, .fixed, .modal'
  ).filter({ has: heading }).last();

  const container = await popup.count() === 1
    ? popup
    : heading.locator('xpath=..');

  const confirm = container.getByRole('button', {
    name: /^(confirm|yes|submit|save|create customer|confirm & save|confirm and save)$/i
  }).last();

  if (!await visible(confirm)) {
    throw new Error(
      'Confirm Details popup button not identified'
    );
  }

  await confirm.click();

  const error = page.getByText(
    /failed to (create|save)|already exists|something went wrong/i
  ).first();

  const success = page.getByText(
    /customer (created|added|saved) successfully|successfully (created|added|saved) customer/i
  ).first();

  await expect.poll(
    async () => {
      if (await visible(error)) return 'error';
      if (await visible(success)) return 'success';

      if (
        new URL(page.url()).pathname === '/customer-menu'
      ) {
        return 'redirected';
      }

      return 'pending';
    },
    {
      timeout: 30000,
      intervals: [200, 500, 1000]
    }
  ).not.toBe('pending');

  if (await visible(error)) {
    throw new Error(await error.innerText());
  }

  if (await visible(success)) {
    return 'success-message';
  }

  return 'submitted-unverified';
}

// ==========================================
// POSITIVE TEST - CUSTOMER CREATION
// ==========================================

async function createValidCustomer(page, customer) {
  await openAddCustomer(page);

  await basicDetails(page, customer);
  await nextStep(page);

  await expect(
    page.getByPlaceholder(
      /enter street, building, area/i
    ).first()
  ).toBeVisible({ timeout: 15000 });

  await addressDetails(page, customer);
  await nextStep(page);

  await expect(
    page.getByPlaceholder(/enter family code/i).first()
  ).toBeVisible({ timeout: 15000 });

  await additionalDetails(page, customer);

  return await saveCustomer(page);
}

// ==========================================
// NEGATIVE TEST - FIELD VALIDATION
// ==========================================

const fieldConfig = {
  firstName: {
    placeholder: /first\s*name|enter the full name/i,
    invalid: '12345',
    expectedError: /name|alphabet|letters|invalid/i
  },
  lastName: {
    placeholder: /last\s*name/i,
    invalid: '67890',
    expectedError: /name|alphabet|letters|invalid/i
  },
  email: {
    placeholder: /enter email/i,
    invalid: 'invalidemail',
    expectedError: /email|invalid|valid/i
  },
  phone: {
    placeholder: /enter phone number/i,
    invalid: '123',
    expectedError: /phone|mobile|digits|invalid/i
  },
  pincode: {
    placeholder: /enter pincode/i,
    invalid: 'ABCDEF',
    expectedError: /pincode|postal|digits|invalid/i
  },
  aadhaar: {
    placeholder: /enter\s+ad(?:h)?aar\s+number/i,
    invalid: '12345',
    expectedError: /aadhaar|adhaar|invalid|digits/i
  },
  pan: {
    placeholder: /enter\s+pan\s+number/i,
    invalid: '123456',
    expectedError: /pan|invalid|format/i
  }
};

async function validateField(page, customer, field, invalidValue) {
  const config = fieldConfig[field];

  if (!config) {
    throw new Error(
      `Unsupported validation field: ${field}`
    );
  }

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

  await fill(page, /enter email/i, c.email, false);
  await fill(page, /enter phone number/i, c.phone);
  await fill(page, /enter pincode/i, c.pincode);

  await fill(
    page,
    /enter (adhaar|aadhaar) number/i,
    c.aadhaar
  );

  await fill(page, /enter pan number/i, c.pan, false);

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

  if (current.toLowerCase() === expected.toLowerCase()) {
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
      `Communication Address missing for ${c.name}`
    );
  }

  // Confirmed selector from browser inspection
  const communicationAddress = page.locator(
    'input[name="address_line"]'
  );

  await expect(communicationAddress).toBeVisible({
    timeout: TIMEOUT
  });

  await communicationAddress.fill(String(addressValue));

  await expect(communicationAddress).toHaveValue(
    String(addressValue)
  );

  console.log(
    '[Address] Communication Address filled:',
    addressValue
  );

  await addressSelect(
    page, 0, c.country || 'India', 'Country'
  );

  await addressSelect(
    page, 1, c.state || 'Karnataka', 'State'
  );

  await addressSelect(
    page, 2, c.district || 'Bengaluru Urban', 'District'
  );

  const sameAddress = page.getByRole('checkbox', {
    name: /same as communication address/i
  });

  await expect(sameAddress).toBeVisible({
    timeout: TIMEOUT
  });

  if (!(await sameAddress.isChecked())) {
    await sameAddress.check();
  }

  console.log(
    '[Address] Same as Communication Address checked'
  );

  await page.getByRole('button', {
    name: /save\s*&\s*continue/i
  }).click();

  const addressError = page.getByText(
    /address line is required/i
  );

  if (await addressError.isVisible().catch(() => false)) {
    throw new Error(
      'Address Line is still required after filling the field'
    );
  }

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

  const referred = String(
    c.referredType || 'Self Joining'
  );

  const selected = page.locator(
    '.ant-select-selection-item:visible'
  ).filter({
    hasText: exact(referred)
  }).first();

  if (!(await shown(selected))) {
    // Try a native dropdown with an accessible label.
    const labeledNative = page.getByLabel(
      /referred type/i
    ).first();

    if (
      await shown(labeledNative) &&
      (await labeledNative.evaluate(
        el => el.tagName.toLowerCase()
      )) === 'select'
    ) {
      await labeledNative.selectOption({
        label: referred
      });
    } else {
      // Find dropdown near the Referred Type label.
      // Do not assume it uses an ant-form-item wrapper.
      const label = page.getByText(
        /referred type/i
      ).first();

      const near = label.locator(
        'xpath=ancestor::*[.//*[contains(@class,"ant-select")]][1]'
      ).locator(
        '.ant-select:visible'
      ).first();

      const allAnt = page.locator(
        '.ant-select:visible'
      );

      const allNative = page.locator(
        'select:visible'
      );

  // Fill valid baseline details first.
  await basicDetails(page, customer);

  const target = page.getByPlaceholder(
    config.placeholder
  ).first();

  await expect(target).toBeVisible();

  await target.fill(String(invalidValue));
  await target.blur();

  const addressStep = page.getByPlaceholder(
    /enter street, building, area/i
  ).first();

  const validation = page.getByText(
    config.expectedError
  ).first();

  const next = page.getByRole('button', {
    name: /save\s*&\s*continue/i
  }).first();

  const errorVisible = await visible(validation);

  if (errorVisible) {
    return {
      status: 'PASS',
      actualResult: 'Validation message displayed'
    };
  }

  if (await next.isEnabled()) {
    await next.click();
  }

  if (await visible(addressStep)) {
    return {
      status: 'BUG',
      actualResult:
        `Invalid ${field} value "${invalidValue}" was accepted`
    };
  }

  // The form did not advance, but this alone does
  // not prove that the tested field caused the block.
  return {
    status: 'NEEDS_REVIEW',
    actualResult:
      'Form did not advance; field-specific validation not confirmed'
  };
}

// ==========================================
// CSV REPORT
// ==========================================
      let ant = near;

      if (!(await shown(ant))) {
        const antCount = await allAnt.count();
        const nativeCount = await allNative.count();

        if (antCount === 1) {
          ant = allAnt.first();
        } else if (
          nativeCount === 1 &&
          antCount === 0
        ) {
          await allNative.first().selectOption({
            label: referred
          });

          ant = null;
        } else {
          const fields = await page.locator(
            'select:visible, .ant-select:visible, input:visible'
          ).evaluateAll(elements =>
            elements.map(el => ({
              tag: el.tagName,
              className:
                typeof el.className === 'string'
                  ? el.className
                  : '',
              name: el.getAttribute('name'),
              placeholder: el.getAttribute('placeholder'),
              text: (el.innerText || '').slice(0, 100)
            }))
          );

          console.log(
            '[Step 3] Available fields:',
            JSON.stringify(fields, null, 2)
          );

          throw new Error(
            'Referred Type control not identified; see Step 3 available fields'
          );
        }
      }

      if (ant) {
        await ant.locator(
          '.ant-select-selector'
        ).click();

        const popup = page.locator(
          '.ant-select-dropdown:visible'
        ).last();

        await expect(popup).toBeVisible({
          timeout: TIMEOUT
        });

        const option = popup.locator(
          '.ant-select-item-option'
        ).filter({
          hasText: exact(referred)
        }).first();

        await expect(option).toBeVisible({
          timeout: TIMEOUT
        });

        await option.click();
      }
    }
  }

  console.log('[Step 3] Referred Type:', referred);

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
    const textOption = page.getByText(
      exact(frequency)
    ).last();

    await expect(textOption).toBeVisible({
      timeout: TIMEOUT
    });

    await textOption.click();
  }

  console.log(
    '[Step 3] Payment Frequency:',
    frequency
  );

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

function csvEscape(value) {
  const text = String(value ?? '');

  return `"${text.replace(/"/g, '""')}"`;
}

function saveReport(results) {
  const jsonPath = path.join(
    RESULTS_DIR,
    'customer-test-results.json'
  );

  const csvPath = path.join(
    RESULTS_DIR,
    'customer-bug-report.csv'
  );

  fs.writeFileSync(
    jsonPath,
    JSON.stringify(results, null, 2)
  );

  const headers = [
    'Test ID',
    'Customer',
    'Field',
    'Test Value',
    'Status',
    'Actual Result'
  ];

  const rows = results.map(result => [
    result.testId,
    result.name,
    result.field || '',
    result.testValue || '',
    result.status,
    result.actualResult || ''
  ]);

  fs.writeFileSync(
    csvPath,
    [
      headers.map(csvEscape).join(','),
      ...rows.map(row => row.map(csvEscape).join(','))
    ].join('\n')
  );

  console.log(`[Report] ${jsonPath}`);
  console.log(`[Report] ${csvPath}`);
}

// ==========================================
// MAIN TEST
// ==========================================

test(
  `Customer ${TEST_TYPE} - ${MODE} - ${selected.length} records`,
  async ({ page }) => {
    test.setTimeout(
      120000 + selected.length * 600000
    );

    page.setDefaultTimeout(10000);
    page.setDefaultNavigationTimeout(45000);

    const results = [];

    try {
      await login(page);

      for (const { customer, number } of selected) {
        console.log(
          `\n========== TC${String(number).padStart(3, '0')} ==========`
        );

        const started = Date.now();

        try {
          let result;

          if (TEST_TYPE === 'CREATE') {
            const status = await createValidCustomer(
              page,
              customer
            );

            result = {
              status: status === 'success-message'
                ? 'PASS'
                : 'NEEDS_REVIEW',
              actualResult: status
            };
          } else if (TEST_TYPE === 'VALIDATE') {
            const field =
              customer.invalidField || INVALID_FIELD;

            const value =
              customer.invalidValue !== undefined
                ? customer.invalidValue
                : INVALID_VALUE;

            result = await validateField(
              page,
              customer,
              field,
              value
            );

            result.field = field;
            result.testValue = value;
          } else {
            throw new Error(
              `Invalid CUSTOMER_TEST_TYPE: ${TEST_TYPE}`
            );
          }

          results.push({
            testId: customer.testId || `TC${number}`,
            name: customer.name,
            ...result,
            durationSeconds: Math.round(
              (Date.now() - started) / 1000
            )
          });

          console.log(
            `[${result.status}] ${customer.name}: ${result.actualResult}`
          );

        } catch (error) {
          const screenshot = path.join(
            RESULTS_DIR,
            `TC${number}-failure.png`
          );

          await page.screenshot({
            path: screenshot,
            fullPage: true
          }).catch(() => {});

          results.push({
            testId: customer.testId || `TC${number}`,
            name: customer.name,
            status: 'ERROR',
            actualResult: error.message,
            screenshot
          });

          console.error(
            `[ERROR] ${customer.name}: ${error.message}`
          );
        }
      }

      await openCustomerManagement(page).catch(() => {});

    } finally {
      saveReport(results);

      console.log('\n========== FINAL SUMMARY ==========');
      console.log(`Total: ${results.length}`);
      console.log(
        `Passed: ${results.filter(r => r.status === 'PASS').length}`
      );
      console.log(
        `Potential Bugs: ${results.filter(r => r.status === 'BUG').length}`
      );
      console.log(
        `Needs Review: ${results.filter(r => r.status === 'NEEDS_REVIEW').length}`
      );
      console.log(
        `Errors: ${results.filter(r => r.status === 'ERROR').length}`
      );
    }

    expect(
      results.filter(
        r => r.status === 'BUG' || r.status === 'ERROR'
      ),
      'Potential bugs or automation errors detected; see CSV report'
    ).toHaveLength(0);
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
  console.log('[Save Debug] Current URL:', page.url());

  console.log(
    '[Save Debug] Visible page text:',
    (await page.locator('body').innerText())
      .slice(0, 5000)
  );

  console.log(
    '[Save Debug] Current step:',
    await page.locator(
      'input[placeholder="First Name"], ' +
      'input[name="address_line"]'
    ).evaluateAll(elements =>
      elements.map(el => ({
        name: el.getAttribute('name'),
        placeholder: el.getAttribute('placeholder'),
        value: el.value
      }))
    )
  );

  await page.screenshot({
    path: 'customer-save-debug.png',
    fullPage: true
  });

  throw new Error(
    `Save outcome not confirmed for ${c.name}. ` +
    'See Save Debug logs and customer-save-debug.png'
  );

}

// =====================================
// MAIN TEST: 10 CUSTOMERS SEQUENTIALLY
// =====================================

// Slow browser actions so you can watch the fields being filled.
test.use({
  launchOptions: {
    slowMo: 450
  }
});

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
