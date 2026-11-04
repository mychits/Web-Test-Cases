
require('dotenv').config();

const { test, expect } = require('@playwright/test');
const customers = require('../../test-data/customers');

// ========================================
// CONFIGURATION
// ========================================

const BASE_URL = process.env.BASE_URL;
const ADMIN_ID = process.env.ADMIN_ID;
const OTP = process.env.OTP;
const BRANCH_NAME = process.env.BRANCH_NAME;

const COUNTRY =
  process.env.CUSTOMER_COUNTRY || 'India';

const STATE =
  process.env.CUSTOMER_STATE || 'Karnataka';

const DISTRICT =
  process.env.CUSTOMER_DISTRICT || 'Bengaluru Urban';

const PASSWORD =
  process.env.TEST_CUSTOMER_PASSWORD || 'Test@12345';

const COLLECTION_AREA =
  process.env.CUSTOMER_COLLECTION_AREA || '';

const CRM =
  process.env.CUSTOMER_CRM || '';

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

// ========================================
// COMMON HELPERS
// ========================================

async function isVisible(locator) {
  return locator.first()
    .isVisible()
    .catch(() => false);
}

function escapeRegex(value) {
  return String(value)
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function fillOptional(locator, value) {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
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

    await expect(overlay).toBeHidden({
      timeout: 10000
    });
  }
}

// ========================================
// VERIFY CURRENT FORM STEP
// ========================================

async function verifyActiveStep(page, expectedStep) {
  await page.bringToFront();

  const main = page.locator('main');

  const basic = await isVisible(
    main.getByPlaceholder('First Name')
  );

  const address = await isVisible(
    main.getByPlaceholder(
      'Enter Street, Building, Area'
    )
  );

  const additional = await isVisible(
    main.getByPlaceholder('Enter Family Code')
  );

  const actualStep = additional
    ? 'Additional & Payment'
    : address
      ? 'Address Details'
      : basic
        ? 'Basic Details'
        : 'Unknown';

  console.log(
    `[Page Check] Expected: ${expectedStep}, ` +
    `Actual: ${actualStep}`
  );

  if (actualStep !== expectedStep) {
    throw new Error(
      `Expected ${expectedStep}, found ${actualStep}. ` +
      `URL: ${page.url()}`
    );
  }
}

// ========================================
// COMMON ANT DESIGN OPTION SELECTION
// ========================================

async function chooseAntOption(
  page,
  select,
  optionText,
  fieldName
) {
  await expect(select).toBeVisible({
    timeout: 15000
  });

  await expect(select).not.toHaveClass(
    /ant-select-disabled/,
    { timeout: 15000 }
  );

  const selected = select.locator(
    '.ant-select-selection-item'
  );

  if (await isVisible(selected)) {
    const current = (
      await selected.innerText()
    ).trim();

    if (
      current.toLowerCase() ===
      String(optionText).trim().toLowerCase()
    ) {
      console.log(
        `[Dropdown] ${fieldName} already selected: ` +
        optionText
      );

      return;
    }
  }

  await select.scrollIntoViewIfNeeded();

  await select.locator(
    '.ant-select-selector'
  ).click();

  const popup = page.locator(
    '.ant-select-dropdown:visible'
  ).last();

  await expect(popup).toBeVisible({
    timeout: 15000
  });

  const exactOption = new RegExp(
    `^\\s*${escapeRegex(optionText)}\\s*$`,
    'i'
  );

  const option = popup.locator(
    '.ant-select-item-option'
  ).filter({
    hasText: exactOption
  });

  if (!(await isVisible(option))) {
    const searchInput = select.locator(
      'input[role="combobox"]'
    );

    if (
      (await isVisible(searchInput)) &&
      (await searchInput.isEditable())
    ) {
      await searchInput.fill(String(optionText));
    }
  }

  try {
    await expect(option.first()).toBeVisible({
      timeout: 15000
    });
  } catch {
    const available = await popup.locator(
      '.ant-select-item-option'
    ).allTextContents().catch(() => []);

    throw new Error(
      `Cannot select "${optionText}" in ${fieldName}. ` +
      `Available: ${JSON.stringify(available)}`
    );
  }

  await option.first().click();

  await expect(
    select.locator('.ant-select-selection-item')
  ).toContainText(String(optionText), {
    timeout: 15000
  });

  console.log(
    `[Dropdown] Selected ${fieldName}: ${optionText}`
  );
}

// ========================================
// ADDRESS DROPDOWNS
// ========================================

// Address step:
// 0 Communication Country
// 1 Communication State
// 2 Communication District
// 3 Permanent Country
// 4 Permanent State
// 5 Permanent District

async function selectAddressDropdown(
  page,
  index,
  optionText,
  fieldName
) {
  console.log(
    `[Address] Selecting ${fieldName}: ${optionText}`
  );

  const select = page.locator(
    'main .ant-select'
  ).nth(index);

  await chooseAntOption(
    page,
    select,
    optionText,
    fieldName
  );
}

// ========================================
// STEP 3 DROPDOWNS - LABEL BASED
// ========================================

async function selectOtherDropdown(
  page,
  fieldLabel,
  optionText
) {
  console.log(
    `[Dropdown] ${fieldLabel} -> ${optionText}`
  );

  await page.bringToFront();

  const label = page.locator('main').getByText(
    fieldLabel,
    { exact: true }
  ).first();

  await expect(label).toBeVisible({
    timeout: 15000
  });

  // Find the nearest container that includes
  // this label and its dropdown.
  const container = label.locator(
    'xpath=ancestor::*[.//input or .//*[@role="combobox"]][1]'
  );

  const select = container.locator(
    '.ant-select, [role="combobox"]'
  ).first();

  await expect(select).toBeVisible({
    timeout: 15000
  });

  const currentValue = (
    await select.innerText()
  ).trim();

  if (
    currentValue.toLowerCase() ===
    String(optionText).trim().toLowerCase()
  ) {
    console.log(
      `[Dropdown] Already selected: ${optionText}`
    );

    return;
  }

  await select.scrollIntoViewIfNeeded();

  await select.click();

  const option = page.getByRole('option', {
    name: optionText,
    exact: true
  }).first();

  const antOption = page.locator(
    '.ant-select-dropdown:visible .ant-select-item-option'
  ).filter({
    hasText: new RegExp(
      `^\\s*${escapeRegex(optionText)}\\s*$`,
      'i'
    )
  }).first();

  if (await isVisible(option)) {
    await option.click();
  } else {
    // Some dropdowns need search text before
    // the required option becomes available.
    if (!(await isVisible(antOption))) {
      const searchInput = select.locator(
        'input[role="combobox"]'
      );

      if (
        (await isVisible(searchInput)) &&
        (await searchInput.isEditable())
      ) {
        await searchInput.fill(String(optionText));
      }
    }

    try {
      await expect(antOption).toBeVisible({
        timeout: 15000
      });
    } catch {
      const available = await page.locator(
        '.ant-select-dropdown:visible .ant-select-item-option'
      ).allTextContents().catch(() => []);

      throw new Error(
        `Cannot select "${optionText}" for ` +
        `"${fieldLabel}". Available: ` +
        JSON.stringify(available)
      );
    }

    await antOption.click();
  }

  await expect(select).toContainText(
    String(optionText),
    { timeout: 15000 }
  );

  console.log(
    `[Dropdown] Selected ${fieldLabel}: ${optionText}`
  );
}

// ========================================
// LOGIN ONCE
// ========================================

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

  await page.locator('select')
    .first()
    .selectOption({
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
    timeout: 60000
  });

  await closeBlockingPopup(page);

  console.log('Login successful');
}

// ========================================
// CUSTOMER MANAGEMENT
// ========================================

async function openCustomerManagement(page) {
  const path = new URL(page.url()).pathname;

  if (
    path !== '/customer-menu' &&
    path !== '/customer-menu/'
  ) {
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

  console.log('Customer Management opened');
}

async function openAddCustomer(page) {
  await openCustomerManagement(page);

  await page.getByRole('button', {
    name: /add customer/i
  }).click();

  try {
    await expect(
      page.getByPlaceholder('First Name')
    ).toBeVisible({
      timeout: 7000
    });
  } catch {
    console.log('Opening Add Customer directly');

    await page.goto(ADD_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });
  }

  await expect(
    page.getByPlaceholder('First Name')
  ).toBeVisible({
    timeout: 30000
  });

  console.log('Add Customer form opened');
}

async function clickContinue(page) {
  const button = page.getByRole('button', {
    name: /save\s*&\s*continue/i
  });

  await expect(button).toBeEnabled({
    timeout: 15000
  });

  await button.click();
}

// ========================================
// STEP 1: BASIC DETAILS
// ========================================

async function fillBasicDetails(page, customer) {
  console.log('Filling Basic Details...');

  const parts = String(customer.name)
    .trim()
    .split(/\s+/);

  const firstName =
    customer.firstName || parts[0];

  const lastName =
    customer.lastName ||
    parts.slice(1).join(' ');

  if (!firstName || !lastName) {
    throw new Error(
      `Invalid name: ${customer.name}`
    );
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
    (await isVisible(password)) &&
    (await password.isEditable())
  ) {
    await password.fill(PASSWORD);
  }

  await page.getByPlaceholder('Enter Pincode')
    .fill(String(customer.pincode));

  await page.getByPlaceholder(
    /enter\s+ad(?:h)?aar\s+number/i
  ).fill(String(customer.aadhaar));

  await fillOptional(
    page.getByPlaceholder(/enter pan number/i),
    customer.pan
  );

  await clickContinue(page);

  await expect(
    page.getByPlaceholder(
      'Enter Street, Building, Area'
    ).first()
  ).toBeVisible({
    timeout: 30000
  });

  console.log('Basic Details completed');
}

// ========================================
// STEP 2: ADDRESS DETAILS
// ========================================

async function fillAddressDetails(page, customer) {
  console.log('Filling Address Details...');

  const addressFields = page.getByPlaceholder(
    'Enter Street, Building, Area'
  );

  await expect(addressFields).toHaveCount(2, {
    timeout: 15000
  });

  const address =
    customer.communicationAddress ||
    customer.address;

  await addressFields.nth(0)
    .fill(String(address));

  const country =
    customer.country || COUNTRY;

  const state =
    customer.state || STATE;

  const district =
    customer.district || DISTRICT;

  await selectAddressDropdown(
    page, 0, country, 'Communication Country'
  );

  await selectAddressDropdown(
    page, 1, state, 'Communication State'
  );

  await selectAddressDropdown(
    page, 2, district, 'Communication District'
  );

  const sameAddress = page.getByRole('checkbox', {
    name: /same as communication address/i
  });

  if (customer.sameAsCommunicationAddress !== false) {
    await expect(sameAddress).toBeVisible({
      timeout: 15000
    });

    await sameAddress.check();
  } else {
    if (!customer.permanentAddress) {
      throw new Error(
        `Missing permanent address for ${customer.name}`
      );
    }

    await addressFields.nth(1).fill(
      String(customer.permanentAddress)
    );

    await selectAddressDropdown(
      page, 3, country, 'Permanent Country'
    );

    await selectAddressDropdown(
      page, 4, state, 'Permanent State'
    );

    await selectAddressDropdown(
      page, 5, district, 'Permanent District'
    );
  }

  await clickContinue(page);

  await expect(
    page.getByPlaceholder('Enter Family Code')
  ).toBeVisible({
    timeout: 30000
  });

  console.log('Address Details completed');
}

// ========================================
// STEP 3: ADDITIONAL & PAYMENT
// ========================================

async function fillAdditionalDetails(page, customer) {
  console.log('Filling Additional & Payment...');

  await verifyActiveStep(
    page,
    'Additional & Payment'
  );

  await fillOptional(
    page.getByPlaceholder('Enter Family Code'),
    customer.familyCode
  );

  // Referred Type is a required field.
  await selectOtherDropdown(
    page,
    'Referred Type',
    customer.referredType || 'Self Joining'
  );

  const area =
    customer.collectionArea || COLLECTION_AREA;

  const crm =
    customer.crm || CRM;

  // Optional fields.
  if (area) {
    await selectOtherDropdown(
      page,
      'Collection Area',
      area
    );
  }

  if (crm) {
    await selectOtherDropdown(
      page,
      'Customer Relationship Manager',
      crm
    );
  }

  const frequency =
    customer.paymentFrequency || 'Daily';

  const frequencyRadio = page.getByRole('radio', {
    name: new RegExp(
      `^${escapeRegex(frequency)}$`,
      'i'
    )
  });

  await expect(frequencyRadio).toBeVisible({
    timeout: 15000
  });

  if (!(await frequencyRadio.isChecked())) {
    await frequencyRadio.check();
  }

  await expect(frequencyRadio).toBeChecked();

  console.log(
    `[Payment] Selected frequency: ${frequency}`
  );

  // The amount field is not shown in the
  // current screenshot. Fill only if present.
  const amountField = page.getByPlaceholder(
    'Enter daily amount'
  );

  if (await isVisible(amountField)) {
    const amount = String(
      customer.installmentAmount ?? 200
    );

    await amountField.fill(amount);

    await expect(amountField).toHaveValue(amount);

    console.log(
      `[Payment] Installment amount: ${amount}`
    );
  } else {
    console.log(
      '[Payment] No daily amount field displayed'
    );
  }

  console.log('Additional & Payment completed');
}

// ========================================
// SAVE CUSTOMER AND CONFIRM
// ========================================

async function saveCustomer(page, customer) {
  console.log(
    `[Save] Saving ${customer.name}`
  );

  const saveButton = page.getByRole('button', {
    name: /^save customer$/i
  });

  await expect(saveButton).toBeVisible({
    timeout: 15000
  });

  await expect(saveButton).toBeEnabled();

  await saveButton.click();

  console.log('[Save] Save Customer clicked');

  const confirmation = page.locator(
    '[role="dialog"]:visible, ' +
    '.ant-modal:visible, ' +
    '.ant-modal-confirm:visible, ' +
    '[role="alertdialog"]:visible'
  ).last();

  const confirmName =
    /^(confirm|yes|yes, save|proceed|ok|okay)$/i;

  const confirmationVisible = await confirmation
    .waitFor({
      state: 'visible',
      timeout: 5000
    })
    .then(() => true)
    .catch(() => false);

  if (confirmationVisible) {
    const confirmButton = confirmation.getByRole(
      'button',
      { name: confirmName }
    ).first();

    await expect(confirmButton).toBeVisible({
      timeout: 10000
    });

    await confirmButton.click();

    console.log('[Save] Confirm button clicked');
  } else {
    const confirmButton = page.getByRole('button', {
      name: confirmName
    }).last();

    if (await isVisible(confirmButton)) {
      await confirmButton.click();

      console.log('[Save] Confirm button clicked');
    } else {
      console.log(
        '[Save] No separate confirmation detected'
      );
    }
  }

  // Wait for the form to close after saving.
  await expect(
    page.getByPlaceholder('Enter Family Code')
  ).toBeHidden({
    timeout: 30000
  });

  const errorMessage = page.locator(
    '.ant-message-error:visible, ' +
    '.ant-notification-notice-error:visible, ' +
    '[role="alert"]:visible'
  ).filter({
    hasText: /failed|error|unable|duplicate|already exists/i
  });

  if (await isVisible(errorMessage)) {
    throw new Error(
      `Save failed for ${customer.name}: ` +
      await errorMessage.first().innerText()
    );
  }

  console.log(
    `[Save] Form closed for ${customer.name}`
  );

  // Return to Customer Management, not Leads.
  await openCustomerManagement(page);

  await expect(page).toHaveURL(
    /\/customer-menu\/?$/
  );

  console.log(
    '[Save] Returned to Customer Management'
  );
}

// ========================================
// MAIN TEST: CREATE ALL 10 CUSTOMERS
// ========================================

test(
  'Login once and create 10 customers sequentially',
  async ({ page, context }) => {
    test.setTimeout(900000);

    page.setDefaultTimeout(30000);
    page.setDefaultNavigationTimeout(60000);

    expect(customers).toHaveLength(10);

    let completed = 0;

    try {
      await page.bringToFront();

      // Login only once.
      await login(page);

      console.log(
        `[Browser] Playwright controls: ${page.url()}`
      );

      // Create 10 customers sequentially.
      for (let i = 0; i < customers.length; i++) {
        const customer = customers[i];

        await test.step(
          `Customer ${i + 1}: ${customer.name}`,
          async () => {
            await page.bringToFront();

            console.log(
              `Creating customer ${i + 1}/10: ` +
              customer.name
            );

            await openAddCustomer(page);

            await verifyActiveStep(
              page,
              'Basic Details'
            );

            await fillBasicDetails(page, customer);

            await verifyActiveStep(
              page,
              'Address Details'
            );

            await fillAddressDetails(page, customer);

            await verifyActiveStep(
              page,
              'Additional & Payment'
            );

            await fillAdditionalDetails(
              page,
              customer
            );

            await verifyActiveStep(
              page,
              'Additional & Payment'
            );

            // Save, confirm, return to list.
            await saveCustomer(page, customer);

            completed++;

            console.log(
              `[Progress] ${completed}/10 ` +
              'customer save flows completed'
            );
          }
        );
      }

      // Finish on Customer Management.
      await openCustomerManagement(page);
      await page.bringToFront();

      console.log(
        `Finished ${completed}/10 customer save flows`
      );
    } catch (error) {
      console.error(
        `Stopped after ${completed}/10 save flows`
      );

      console.error(
        '[Browser] Active URL:',
        page.url()
      );

      console.error(
        '[Browser] Open pages:',
        context.pages().map(p => p.url())
      );

      console.error(error);

      await page.bringToFront().catch(() => {});

      await page.screenshot({
        path: 'customer-creation-error.png',
        fullPage: true
      }).catch(() => {});

      throw error;
    }
  }
);
