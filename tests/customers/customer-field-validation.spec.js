
const { test, expect } = require('@playwright/test');
require('dotenv').config();

const fs = require('fs');
const path = require('path');

// ==========================================
// CONFIGURATION
// ==========================================

const BASE_URL = (
  process.env.BASE_URL || 'http://13.48.10.236/'
).replace(/\/+$/, '');

const BRANCH_NAME =
  process.env.BRANCH_NAME || 'Main Branch (CF-BR-1)';

const OUTPUT = path.join(
  process.cwd(),
  'customer-validation-results'
);

const results = [];

// ==========================================
// REPORT HELPERS
// ==========================================

function record(field, testName, input, observed, detail = '') {
  const row = {
    field,
    test: testName,
    input,
    observed,
    detail
  };

  results.push(row);

  console.log(
    `[${field}] ${testName}: ${observed}` +
    (detail ? ` | ${detail}` : '')
  );
}

function labelRx(label) {
  const escaped = label.replace(
    /[.*+?^${}()|[\]\\]/g,
    '\\$&'
  );

  return new RegExp(
    `^\\s*${escaped}\\s*\\*?\\s*$`,
    'i'
  );
}

// ==========================================
// LOGIN AND OPEN ADD CUSTOMER
// ==========================================

async function login(page) {
  await page.goto(BASE_URL, {
    waitUntil: 'domcontentloaded',
    timeout: 30000
  });

  if (!/dashboard/i.test(page.url())) {
    const branch = page.locator('select').first();

    await expect(branch).toBeVisible({
      timeout: 30000
    });

    await branch.selectOption({
      label: BRANCH_NAME
    });

    const admin = process.env.ADMIN_ID;
    const otp = process.env.OTP;

    if (!admin || !otp) {
      throw new Error(
        'ADMIN_ID and OTP must be set in .env'
      );
    }

    await page.getByPlaceholder(
      'XXX-XX-XXXX'
    ).fill(admin);

    await page.getByRole('button', {
      name: /send otp|request otp|continue|login/i
    }).first().click();

    const otpInputs = page.locator([
      'input[autocomplete="one-time-code"]:visible',
      'input[placeholder*="otp" i]:visible',
      'input[name*="otp" i]:visible',
      'input[id*="otp" i]:visible',
      'input[maxlength="1"]:visible',
      'input[inputmode="numeric"]:visible'
    ].join(', '));

    await expect.poll(
      async () => {
        return /dashboard/i.test(page.url()) ||
          (await otpInputs.count()) > 0;
      },
      { timeout: 30000 }
    ).toBe(true);

    if (!/dashboard/i.test(page.url())) {
      const split = page.locator(
        'input[maxlength="1"]:visible'
      );

      if (await split.count() === otp.length) {
        for (let i = 0; i < otp.length; i++) {
          await split.nth(i).fill(otp[i]);
        }
      } else {
        await otpInputs.first().fill(otp);
      }

      const verify = page.getByRole('button', {
        name: /verify otp|verify|submit|login|sign in/i
      }).first();

      if (
        await verify.isVisible().catch(() => false)
      ) {
        await verify.click();
      }
    }

    await expect(page).toHaveURL(
      /dashboard/i,
      { timeout: 30000 }
    );
  }

  console.log('Admin login successful');

  await page.goto(
    `${BASE_URL}/customer-menu`,
    { waitUntil: 'domcontentloaded' }
  );

  await page.getByRole('button', {
    name: /add customer/i
  }).first().click();

  await expect(
    page.locator('#modal-wrapper')
  ).toBeVisible();

  console.log('Add Customer form opened');
}

// ==========================================
// FIND INPUT BY FIELD LABEL
// ==========================================

async function findInput(page, label) {
  const modal = page.locator('#modal-wrapper');

  const name = modal.getByText(
    labelRx(label)
  ).first();

  if (
    !(await name.isVisible().catch(() => false))
  ) {
    return null;
  }

  const field = name
    .locator('xpath=..')
    .locator(
      'input:not([type="checkbox"]):not([type="radio"]), textarea'
    )
    .first();

  return await field.count() ? field : null;
}

// ==========================================
// INSPECT FIELD VALIDATION
// ==========================================

async function inspectInput(page, label, samples) {
  const input = await findInput(page, label);

  if (!input) {
    record(
      label,
      'Field discovery',
      '',
      'NOT FOUND',
      'Check label or custom control'
    );
    return;
  }

  const attrs = await input.evaluate(el => ({
    tag: el.tagName,
    type: el.type || '',
    name: el.name || '',
    required: el.required,
    minLength: el.minLength,
    maxLength: el.maxLength,
    min: el.min || '',
    max: el.max || '',
    pattern: el.pattern || '',
    placeholder: el.placeholder || '',
    inputMode: el.inputMode || ''
  }));

  record(
    label,
    'HTML constraints',
    '',
    'INSPECTED',
    JSON.stringify(attrs)
  );

  for (const [caseName, value] of samples) {
    try {
      await input.fill(value, {
        timeout: 5000
      });

      await input.blur();

      const result = await input.evaluate(el => ({
        value: el.value,
        length: el.value.length,
        valid: el.validity.valid,
        validity: {
          valueMissing: el.validity.valueMissing,
          tooShort: el.validity.tooShort,
          tooLong: el.validity.tooLong,
          typeMismatch: el.validity.typeMismatch,
          patternMismatch: el.validity.patternMismatch,
          rangeUnderflow: el.validity.rangeUnderflow,
          rangeOverflow: el.validity.rangeOverflow,
          badInput: el.validity.badInput
        },
        message: el.validationMessage
      }));

      const accepted = result.value === value;

      const displayValue =
        label === 'Password'
          ? `[REDACTED: ${value.length} chars]`
          : value.length > 100
            ? `${value.slice(0, 30)}... (${value.length} chars)`
            : value;

      const detail =
        label === 'Password'
          ? JSON.stringify({
              length: result.length,
              valid: result.valid,
              validity: result.validity,
              message: result.message
            })
          : JSON.stringify(result);

      record(
        label,
        caseName,
        displayValue,
        accepted
          ? 'ACCEPTED IN INPUT'
          : 'TRUNCATED / TRANSFORMED',
        detail
      );
    } catch (error) {
      record(
        label,
        caseName,
        label === 'Password'
          ? '[REDACTED]'
          : value,
        'FILL ERROR',
        error.message.slice(0, 180)
      );
    }
  }

  await input.fill('');
}

// ==========================================
// INSPECT DROPDOWN OPTIONS
// ==========================================

async function inspectSelect(page, label, name) {
  const select = page.locator(
    `#modal-wrapper .ant-select[name="${name}"]`
  );

  if (!(await select.count())) {
    record(
      label,
      'Dropdown discovery',
      '',
      'NOT FOUND'
    );
    return;
  }

  await select.locator(
    '.ant-select-selector'
  ).click();

  const popup = page.locator(
    '.ant-select-dropdown:visible'
  ).last();

  await expect(popup).toBeVisible({
    timeout: 10000
  });

  const choices = await popup.locator(
    '.ant-select-item-option'
  ).allTextContents();

  record(
    label,
    'Available dropdown choices',
    '',
    'OBSERVED',
    JSON.stringify(choices)
  );

  await page.keyboard.press('Escape');
}

// ==========================================
// INSPECT PAYMENT FREQUENCY
// ==========================================

async function inspectRadio(page) {
  const radios = await page.locator(
    '#modal-wrapper input[name="installment_type"]'
  ).evaluateAll(elements =>
    elements.map(el => ({
      value: el.value,
      disabled: el.disabled,
      checked: el.checked
    }))
  );

  record(
    'Payment Frequency',
    'Radio options',
    '',
    'OBSERVED',
    JSON.stringify(radios)
  );
}

// ==========================================
// TEST DATA FOR EACH FIELD
// ==========================================

function samplesFor(label) {
  const common = [
    ['Empty', ''],
    ['One character', 'A'],
    ['Two characters', 'Ab'],
    ['10 characters', 'A'.repeat(10)],
    ['50 characters', 'A'.repeat(50)],
    ['100 characters', 'A'.repeat(100)],
    ['255 characters', 'A'.repeat(255)],
    ['256 characters', 'A'.repeat(256)]
  ];

  if (label === 'Full Name') {
    return [
      ...common,
      ['Numbers only', '123456'],
      ['Letters and numbers', 'Arun123'],
      ['Special characters', '@#$%'],
      ['Spaces only', '   '],
      ['Leading/trailing spaces', '  Arun Kumar  '],
      ['Unicode letters', 'தமிழ் பெயர்']
    ];
  }

  if (label === 'Email') {
    return [
      ['Empty', ''],
      ['Valid email', 'qa.validation@example.com'],
      ['Missing @', 'testexample.com'],
      ['Missing domain', 'test@'],
      ['Spaces', 'test user@example.com'],
      [
        'Long email',
        `${'a'.repeat(100)}@example.com`
      ]
    ];
  }

  if (label === 'Phone Number') {
    return [
      ['Empty', ''],
      ['9 digits', '987654321'],
      ['10 digits', '9876543210'],
      ['11 digits', '98765432101'],
      ['Letters', 'abcdefghij'],
      ['Mixed characters', '98765abcde'],
      ['Special characters', '+91-9876543210']
    ];
  }

  if (label === 'Password') {
    return [
      ['Empty', ''],
      ['One character', 'A'],
      ['7 characters', 'Abc@123'],
      ['8 characters', 'Abc@1234'],
      ['16 characters', 'Abcd@12345678901'],
      ['64 characters', 'A'.repeat(64)],
      ['128 characters', 'A'.repeat(128)],
      ['Numbers only', '12345678'],
      ['Letters only', 'abcdefgh'],
      ['Special characters', '@#$%^&*!']
    ];
  }

  if (label === 'Pincode') {
    return [
      ['Empty', ''],
      ['5 digits', '56000'],
      ['6 digits', '560001'],
      ['7 digits', '5600012'],
      ['Letters', 'abcdef'],
      ['Mixed characters', '560ab1'],
      ['Leading zero', '012345']
    ];
  }

  if (label === 'Family Code') {
    return [
      ['Empty', ''],
      ['Letters', 'FAMILY'],
      ['Numbers', '123456'],
      ['Alphanumeric', 'FAM123'],
      ['Special characters', '@#$%'],
      ['100 characters', 'F'.repeat(100)],
      ['256 characters', 'F'.repeat(256)]
    ];
  }

  if (label === 'Installment Amount') {
    return [
      ['Empty', ''],
      ['Zero', '0'],
      ['Negative', '-1'],
      ['One', '1'],
      ['100', '100'],
      ['Decimal', '100.50'],
      ['Very large', '999999999999'],
      ['Letters', 'abc']
    ];
  }

  return [
    ['Empty', ''],
    ['One character', 'A'],
    ['10 characters', 'A'.repeat(10)],
    ['100 characters', 'A'.repeat(100)],
    ['256 characters', 'A'.repeat(256)],
    ['Numbers only', '123456'],
    ['Special characters', '@#$%']
  ];
}

// ==========================================
// MAIN VALIDATION TEST
// ==========================================

test(
  'Add Customer - Field Validation Audit (No Save)',
  async ({ page }) => {
    test.setTimeout(10 * 60 * 1000);
    page.setDefaultTimeout(12000);

    fs.mkdirSync(OUTPUT, {
      recursive: true
    });

    try {
      await login(page);

      // ==================================
      // STEP 1 - BASIC DETAILS
      // ==================================

      for (const label of [
        'Full Name',
        'Email',
        'Phone Number',
        'Password',
        'Pincode',
        'Address (Communication)',
        'Address (Permanent)'
      ]) {
        await inspectInput(
          page,
          label,
          samplesFor(label)
        );
      }

      // Enter valid test data to navigate
      // to Step 2. No customer is submitted.

      const stamp = String(
        Date.now()
      ).slice(-8);

      const step1 = {
        'Full Name':
          'QA Validation Sample',

        'Email':
          `qa.audit.${stamp}@example.com`,

        'Phone Number':
          `9${stamp}1`,

        'Password':
          process.env.CUSTOMER_V2_PASSWORD ||
          'Test@12345',

        'Pincode':
          process.env.CUSTOMER_V2_PINCODE ||
          '560001',

        'Address (Communication)':
          'QA Validation Address Bengaluru'
      };

      for (const [label, value] of Object.entries(step1)) {
        const input = await findInput(
          page,
          label
        );

        if (input) {
          await input.fill(value);
        }
      }

      const sameAddress = page.getByRole(
        'checkbox',
        {
          name: /same as communication address/i
        }
      );

      if (
        await sameAddress.isVisible().catch(() => false)
      ) {
        if (!(await sameAddress.isChecked())) {
          await sameAddress.check();
        }
      }

      await page.getByRole('button', {
        name: 'Save & Continue',
        exact: true
      }).click();

      await expect(
        page.getByText(
          'Additional & Payment',
          { exact: true }
        )
      ).toBeVisible({
        timeout: 15000
      });

      console.log(
        'Step 2 Additional & Payment opened'
      );

      // ==================================
      // STEP 2 - ADDITIONAL & PAYMENT
      // ==================================

      await inspectInput(
        page,
        'Family Code',
        samplesFor('Family Code')
      );

      await inspectSelect(
        page,
        'Referred Type',
        'referral_type'
      );

      await inspectSelect(
        page,
        'Collection Area',
        'collection_area'
      );

      await inspectSelect(
        page,
        'Customer Relationship Manager',
        'customer_relationship_manager'
      );

      await inspectRadio(page);

      // INSTALLMENT AMOUNT

      const amount = page.locator(
        '#modal-wrapper input[name="installment_amount"]'
      );

      if (await amount.count()) {
        const attrs = await amount.evaluate(
          el => ({
            type: el.type,
            min: el.min,
            max: el.max,
            step: el.step,
            required: el.required
          })
        );

        record(
          'Installment Amount',
          'HTML constraints',
          '',
          'INSPECTED',
          JSON.stringify(attrs)
        );

        for (const [name, value] of samplesFor(
          'Installment Amount'
        )) {
          try {
            await amount.fill(value);

            const actual =
              await amount.inputValue();

            const valid =
              await amount.evaluate(
                el => el.validity.valid
              );

            record(
              'Installment Amount',
              name,
              value,
              actual === value
                ? 'ACCEPTED IN INPUT'
                : 'REJECTED / TRANSFORMED',
              `actual=${JSON.stringify(actual)}, htmlValid=${valid}`
            );
          } catch (error) {
            record(
              'Installment Amount',
              name,
              value,
              'FILL ERROR',
              error.message.slice(0, 140)
            );
          }
        }
      }

    } finally {
      // ==================================
      // EXPORT REPORT
      // ==================================

      const csvEscape = value =>
        `"${String(value ?? '').replace(/"/g, '""')}"`;

      const columns = [
        'field',
        'test',
        'input',
        'observed',
        'detail'
      ];

      const csvRows = [
        columns.join(','),
        ...results.map(row =>
          columns.map(
            key => csvEscape(row[key])
          ).join(',')
        )
      ];

      fs.writeFileSync(
        path.join(
          OUTPUT,
          'add-customer-validation.csv'
        ),
        csvRows.join('\n'),
        'utf8'
      );

      fs.writeFileSync(
        path.join(
          OUTPUT,
          'add-customer-validation.json'
        ),
        JSON.stringify(results, null, 2),
        'utf8'
      );

      console.log(
        `Validation report saved to ${OUTPUT}`
      );
    }
  }
);
