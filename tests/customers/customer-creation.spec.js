
require('dotenv').config();

const { test, expect } = require('@playwright/test');
const customers = require('../../test-data/customers');

// =====================================
// CONFIGURATION
// =====================================

const BASE_URL = process.env.BASE_URL;
const ADMIN_ID = process.env.ADMIN_ID;
const OTP = process.env.OTP;
const BRANCH_NAME = process.env.BRANCH_NAME;

const COUNTRY = process.env.CUSTOMER_COUNTRY || 'India';
const STATE = process.env.CUSTOMER_STATE || 'Karnataka';
const DISTRICT = process.env.CUSTOMER_DISTRICT || 'Bengaluru Urban';

const PASSWORD =
  process.env.TEST_CUSTOMER_PASSWORD || 'Test@12345';

const COLLECTION_AREA =
  process.env.CUSTOMER_COLLECTION_AREA || '';

const CRM = process.env.CUSTOMER_CRM || '';

for (const [key, value] of Object.entries({
  BASE_URL,
  ADMIN_ID,
  OTP,
  BRANCH_NAME
})) {
  if (!value) {
    throw new Error(`Missing ${key} in .env`);
  }
}

const ROOT_URL = BASE_URL.replace(/\/+$/, '') + '/';

const CUSTOMER_URL =
  new URL('customer-menu', ROOT_URL).href;

const ADD_URL =
  new URL('customer-menu/add-customer', ROOT_URL).href;

// =====================================
// HELPERS
// =====================================

async function isVisible(locator) {
  return locator.first().isVisible().catch(() => false);
}

function normalizeText(value) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function fillOptional(locator, value) {
  if (value === undefined || value === null || value === '') {
    return;
  }

  await expect(locator.first()).toBeVisible();
  await locator.first().fill(String(value));
}

async function closeBlockingPopup(page) {
  const overlay = page.locator(
    'div.fixed.inset-0.z-\\[9999\\]'
  ).first();

  if (!(await isVisible(overlay))) return;

  const dismiss = overlay.getByRole('button', {
    name: /remind me later|close|cancel|okay|^ok$/i
  }).first();

  if (await isVisible(dismiss)) {
    await dismiss.click();
    await expect(overlay).toBeHidden();
  }
}

async function verifyActiveStep(page, expectedStep) {
  const main = page.locator('main');

  const basic = await isVisible(
    main.getByPlaceholder('First Name')
  );

  const address = await isVisible(
    main.getByPlaceholder('Enter Street, Building, Area')
  );

  const additional = await isVisible(
    main.getByPlaceholder('Enter Family Code')
  );

  const actual = additional
    ? 'Additional & Payment'
    : address
      ? 'Address Details'
      : basic
        ? 'Basic Details'
        : 'Unknown';

  console.log(`[Step] ${actual}`);

  if (actual !== expectedStep) {
    throw new Error(
      `Expected "${expectedStep}", found "${actual}". URL: ${page.url()}`
    );
  }
}

// =====================================
// DROPDOWN SELECTION
// CLICK ONLY - NO TYPING
// =====================================


async function chooseAntOption(page, select, optionText, fieldName) {
  await expect(select).toBeVisible({ timeout: 15000 });

  await expect(select).not.toHaveClass(
    /ant-select-disabled/,
    { timeout: 15000 }
  );

  const desired = normalizeText(optionText);
  const selected = select.locator('.ant-select-selection-item');

  if (await isVisible(selected)) {
    const current = await selected.innerText();

    if (normalizeText(current) === desired) {
      console.log(
        `[Dropdown] Already selected ${fieldName}: ${optionText}`
      );
      return;
    }
  }

  await select.scrollIntoViewIfNeeded();
  await select.locator('.ant-select-selector').click();

  const popup = page.locator(
    '.ant-select-dropdown:visible'
  ).last();

  await expect(popup).toBeVisible({ timeout: 15000 });

  const options = popup.locator(
    '.ant-select-item-option:not(.ant-select-item-option-disabled)'
  );

  await expect(options.first()).toBeVisible({
    timeout: 15000
  });

  const matchingOption = options.filter({
    hasText: new RegExp(
      `^\\s*${escapeRegex(optionText)}\\s*$`,
      'i'
    )
  }).first();

  // FIRST: Click the option immediately if it is visible.
  if (await isVisible(matchingOption)) {
    await matchingOption.click();

    await expect.poll(
      async () => normalizeText(
        await selected.innerText().catch(() => '')
      ),
      { timeout: 15000 }
    ).toBe(desired);

    console.log(
      `[Dropdown] Selected ${fieldName}: ${optionText}`
    );
    return;
  }

  // SECOND: Scroll only if the option is not rendered.
  const holder = popup.locator(
    '.rc-virtual-list-holder'
  ).first();

  if (!(await isVisible(holder))) {
    throw new Error(
      `Cannot find "${optionText}" in ${fieldName}. ` +
      `Options: ${JSON.stringify(await options.allTextContents())}`
    );
  }

  let found = false;

  for (let attempt = 0; attempt < 60; attempt++) {
    if (await isVisible(matchingOption)) {
      await matchingOption.click();
      found = true;
      break;
    }

    const moved = await holder.evaluate(element => {
      const previous = element.scrollTop;

      element.scrollTop += Math.max(
        100,
        Math.floor(element.clientHeight * 0.7)
      );

      return element.scrollTop > previous;
    });

    if (!moved) break;

    // Wait for virtualized dropdown options to update.
    await expect.poll(
      async () => {
        const texts = await options.allTextContents();
        return texts.some(
          text => normalizeText(text) === desired
        );
      },
      {
        timeout: 1500,
        intervals: [100, 200, 300]
      }
    ).toBe(true).catch(() => {});
  }

  if (!found && await isVisible(matchingOption)) {
    await matchingOption.click();
    found = true;
  }

  if (!found) {
    throw new Error(
      `Cannot select "${optionText}" in ${fieldName}. ` +
      `Visible options: ${JSON.stringify(await options.allTextContents())}`
    );
  }

  await expect.poll(
    async () => normalizeText(
      await selected.innerText().catch(() => '')
    ),
    { timeout: 15000 }
  ).toBe(desired);

  console.log(
    `[Dropdown] Selected ${fieldName}: ${optionText}`
  );
}


async function selectAddressDropdown(
  page,
  index,
  optionText,
  fieldName
) {
  const select = page.locator('main .ant-select').nth(index);

  await chooseAntOption(
    page,
    select,
    optionText,
    fieldName
  );
}

async function selectOtherDropdown(
  page,
  fieldLabel,
  optionText
) {
  const placeholders = {
    'Referred Type': 'Select Referred Type',
    'Collection Area': 'Select Or Search Collection Area',
    'Customer Relationship Manager': 'Select Or Search CRM'
  };

  const placeholderText = placeholders[fieldLabel];

  if (!placeholderText) {
    throw new Error(`Unknown dropdown: ${fieldLabel}`);
  }

  const selects = page.locator('main .ant-select');

  const matchingSelect = selects.filter({
    has: page.locator(
      '.ant-select-selection-placeholder',
      { hasText: placeholderText }
    )
  }).first();

  await expect(matchingSelect).toBeVisible({
    timeout: 15000
  });

  const index = await matchingSelect.evaluate(element => {
    const all = Array.from(
      document.querySelectorAll('main .ant-select')
    );

    return all.indexOf(element);
  });

  if (index < 0) {
    throw new Error(`Cannot locate ${fieldLabel}`);
  }

  await chooseAntOption(
    page,
    selects.nth(index),
    optionText,
    fieldLabel
  );
}

// =====================================
// LOGIN ONCE
// =====================================

async function login(page) {
  await page.goto(ROOT_URL, {
    waitUntil: 'domcontentloaded',
    timeout: 45000
  });

  const loginHeading = page.getByRole('heading', {
    name: /admin login/i
  });

  if (!(await isVisible(loginHeading))) {
    console.log('[Login] Existing session detected');
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
      throw new Error('Expected a six-digit OTP');
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

  await expect(loginHeading).toBeHidden({
    timeout: 60000
  });

  await closeBlockingPopup(page);

  console.log('[Login] Successful');
}

// =====================================
// CUSTOMER MANAGEMENT
// =====================================

async function openCustomerManagement(page) {
  const path = new URL(page.url()).pathname;

  if (path !== '/customer-menu' && path !== '/customer-menu/') {
    await page.goto(CUSTOMER_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });
  }

  await closeBlockingPopup(page);

  await expect(
    page.getByRole('button', {
      name: /add customer/i
    })
  ).toBeVisible({
    timeout: 30000
  });

  await expect(page).toHaveURL(
    /\/customer-menu\/?$/
  );

  console.log('[Navigation] Customer Management opened');
}

async function openAddCustomer(page) {
  await openCustomerManagement(page);

  await page.goto(ADD_URL, {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });

  await expect(
    page.getByPlaceholder('First Name')
  ).toBeVisible({
    timeout: 30000
  });

  console.log('[Navigation] Add Customer opened');
}

async function clickContinue(page) {
  const button = page.getByRole('button', {
    name: /save\s*&\s*continue/i
  });

  await expect(button).toBeEnabled();
  await button.click();
}

// =====================================
// STEP 1: BASIC DETAILS
// =====================================

async function fillBasicDetails(page, customer) {
  const parts = String(customer.name).trim().split(/\s+/);

  const firstName = customer.firstName || parts[0];
  const lastName =
    customer.lastName || parts.slice(1).join(' ');

  if (!firstName || !lastName) {
    throw new Error(`Invalid customer name: ${customer.name}`);
  }

  await page.getByPlaceholder('First Name')
    .fill(firstName);

  await fillOptional(
    page.getByPlaceholder('Middle Name'),
    customer.middleName
  );

  await page.getByPlaceholder('Last Name')
    .fill(lastName);

  await fillOptional(
    page.getByPlaceholder('Enter Email'),
    customer.email
  );

  await page.getByPlaceholder('Enter Phone Number')
    .fill(String(customer.phone));

  const password = page.getByPlaceholder(
    'Auto Generated Password'
  );

  if (
    await isVisible(password) &&
    await password.isEditable()
  ) {
    await password.fill(PASSWORD);
  }

  await page.getByPlaceholder('Enter Pincode')
    .fill(String(customer.pincode));

  await page.getByPlaceholder(
    /enter\s+ad(?:h)?aar\s+number/i
  ).fill(String(customer.aadhaar));

  await option.click();

  // Verify using the stable combobox ID.
  // This does not depend on the placeholder remaining visible.
  const selectedField = page.locator(
    `input[id="${comboboxId}"]`
  ).locator(
    'xpath=ancestor::*[contains(concat(" ", normalize-space(@class), " "), " ant-select ")][1]'
  );

  await expect(
    selectedField.locator('.ant-select-selection-item')
  ).toHaveText(type, {
    timeout: 15000
  });

  console.log(`Referred Type selected successfully: ${type}`);
}


// =====================================
// CHECK EXISTING CUSTOMER
// =====================================

async function customerAlreadyExists(page, customer) {
  const phone = String(customer.phone);

  const row = page.getByRole('row').filter({
    has: page.getByRole('cell', {
      name: phone,
      exact: true
    })
  });

  return (await row.count()) > 0;
}

// =====================================
// CREATE ONE CUSTOMER
// =====================================

async function createCustomer(page, customer, index) {
  console.log(
    `Creating customer ${index}/${customers.length}: ${customer.name}`
  );

  await openCustomerManagement(page);

  // Avoid duplicates in the visible customer table.
  if (await customerAlreadyExists(page, customer)) {
    console.log(
      `Skipping existing customer: ${customer.name}`
    );

    return 'skipped';
  }

  await openAddCustomer(page);

  // =====================================
  // STEP 1 - BASIC DETAILS
  // =====================================

  await page.getByPlaceholder(
    'Enter the Full Name'
  ).fill(customer.name);

  await page.getByPlaceholder(
    'Enter Email'
  ).fill(customer.email);

  await page.getByPlaceholder(
    'Enter Phone Number'
  ).fill(String(customer.phone));

  await page.getByPlaceholder(
    'Enter Password'
  ).fill(PASSWORD);

  await page.getByPlaceholder(
    'Enter Pincode'
  ).fill(String(customer.pincode));

  await page.getByPlaceholder(
    /enter\s+(?:aadhaar|adhaar)\s+number/i
  ).fill(String(customer.aadhaar));

  await page.getByPlaceholder(
    /enter\s+pan\s+number/i
  ).fill(String(customer.pan));

  await page.getByPlaceholder(
    /enter\s+the\s+address/i
  ).fill(customer.address);

  await page.getByPlaceholder(
    'Enter the Permanent Address'
  ).fill(customer.address);

  console.log('Step 1 completed');

  await page.getByRole('button', {
    name: /save\s*&\s*continue/i
  }).click();

  // =====================================
  // STEP 2 - ADDITIONAL & PAYMENT
  // =====================================

  const familyCode = page.getByPlaceholder(
    'Enter Family Code'
  );

  await expect(familyCode).toBeVisible({
    timeout: 30000
  });

  if (customer.familyCode != null) {
    await familyCode.fill(
      String(customer.familyCode)
    );
  }

  // Referred Type
  await selectReferredType(
    page,
    customer.referredType || 'Self Joining'
  );

  // Payment Frequency
  const frequency =
    customer.paymentFrequency || 'Daily';

  await page.getByRole('radio', {
    name: new RegExp(`^${frequency}$`, 'i')
  }).check();

  // Installment Amount
  const amount = String(
    customer.installmentAmount ?? 200
  );

  const installment = page.locator(
    'input[placeholder*="installment" i]'
  );

  if (await installment.count() > 0) {
    await installment.first().fill(amount);
  } else {
    await page.getByLabel(
      /installment amount/i
    ).fill(amount);
  }

  console.log('Step 2 completed');

  // =====================================
  // SAVE CUSTOMER
  // =====================================

  await page.getByRole('button', {
    name: /^save customer$/i
  }).click();

  // Handle confirmation if one appears.
  const confirmation = page.getByRole('dialog');

  if (await confirmation.isVisible().catch(() => false)) {
    const confirmButton = confirmation.getByRole(
      'button',
      {
        name: /^(confirm|yes|save|ok|okay|proceed)$/i
      }
    );

    if (await confirmButton.count() === 1) {
      await confirmButton.click();
    }
  }

  // Wait for the form to close.
  await expect(
    page.getByPlaceholder('Enter the Full Name')
  ).toBeHidden({
    timeout: 30000
  });

  console.log(
    `Save flow completed: ${customer.name}`
  );

  return 'created';
}

// =====================================
// MAIN TEST
// =====================================

test('Login once and create 10 customers', async ({ page }) => {
  test.setTimeout(900000);

  page.setDefaultTimeout(30000);
  page.setDefaultNavigationTimeout(60000);

  // Check test data.
  expect(customers).toHaveLength(10);

  let created = 0;
  let skipped = 0;

  try {
    // LOGIN ONLY ONCE
    await test.step('Login to MyChits Admin', async () => {
      await loginOnce(page);
    });

    // CREATE 10 CUSTOMERS SEQUENTIALLY
    for (let i = 0; i < customers.length; i++) {
      const customer = customers[i];

      await test.step(
        `Customer ${i + 1}: ${customer.name}`,
        async () => {
          const result = await createCustomer(
            page,
            customer,
            i + 1
          );

          if (result === 'created') {
            created++;
          } else if (result === 'skipped') {
            skipped++;
          }
        }
      );
    }

    // FINAL STEP
    await test.step(
      'Verify customer processing completed',
      async () => {
        await openCustomerManagement(page);

        expect(created + skipped).toBe(10);
      }
    );

    console.log('================================');
    console.log(`New save flows: ${created}`);
    console.log(`Existing customers skipped: ${skipped}`);
    console.log(`Total processed: ${created + skipped}/10`);
    console.log('================================');

  } catch (error) {
    console.error(
      `Stopped after ${created} new save flows`
    );

    console.error(
      `Existing customers skipped: ${skipped}`
    );

    console.error('Current URL:', page.url());
    console.error('Error:', error.message);

    await page.screenshot({
      path: 'customer-creation-error.png',
      fullPage: true
    }).catch(() => {});

    throw error;
  }
});
