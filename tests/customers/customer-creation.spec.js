
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

  await openAddCustomer(page);

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
  }
);
