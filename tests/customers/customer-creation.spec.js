
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

  await fillOptional(
    page.getByPlaceholder(/enter pan number/i),
    customer.pan
  );

  await clickContinue(page);

  await expect(
    page.getByPlaceholder(
      'Enter Street, Building, Area'
    ).first()
  ).toBeVisible({ timeout: 30000 });

  console.log('[Step 1] Basic Details completed');
}

// =====================================
// STEP 2: ADDRESS DETAILS
// =====================================

async function fillAddressDetails(page, customer) {
  const fields = page.getByPlaceholder(
    'Enter Street, Building, Area'
  );

  await expect(fields).toHaveCount(2);

  const address =
    customer.communicationAddress || customer.address;

  if (!address) {
    throw new Error(`Missing address for ${customer.name}`);
  }

  await fields.nth(0).fill(String(address));

  const country = customer.country || COUNTRY;
  const state = customer.state || STATE;
  const district = customer.district || DISTRICT;

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
    await sameAddress.check();
  } else {
    if (!customer.permanentAddress) {
      throw new Error(
        `Missing permanent address for ${customer.name}`
      );
    }

    await fields.nth(1).fill(
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
  ).toBeVisible({ timeout: 30000 });

  console.log('[Step 2] Address Details completed');
}

// =====================================
// STEP 3: ADDITIONAL & PAYMENT
// =====================================

async function fillAdditionalDetails(page, customer) {
  await fillOptional(
    page.getByPlaceholder('Enter Family Code'),
    customer.familyCode
  );

  await selectOtherDropdown(
    page,
    'Referred Type',
    customer.referredType || 'Self Joining'
  );

  const area = customer.collectionArea || COLLECTION_AREA;
  const crm = customer.crm || CRM;

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

  const radio = page.getByRole('radio', {
    name: new RegExp(
      `^${escapeRegex(frequency)}$`,
      'i'
    )
  });

  await expect(radio).toBeVisible();

  await radio.check();
  await expect(radio).toBeChecked();

  const amountPlaceholders = {
    Daily: 'Enter daily amount',
    Weekly: 'Enter weekly amount',
    Monthly: 'Enter monthly amount'
  };

  const amountPlaceholder =
    amountPlaceholders[frequency];

  if (!amountPlaceholder) {
    throw new Error(
      `Unsupported payment frequency: ${frequency}`
    );
  }

  const amount = String(
    customer.installmentAmount ?? 200
  );

  const amountField = page.getByPlaceholder(
    amountPlaceholder
  );

  await expect(amountField).toBeVisible({
    timeout: 15000
  });

  await amountField.fill(amount);
  await expect(amountField).toHaveValue(amount);

  console.log(
    `[Step 3] ${frequency} installment: ${amount}`
  );
}

// =====================================
// SAVE CUSTOMER
// FIXED SUCCESS / ERROR DETECTION
// =====================================
async function saveCustomer(page, customer) {
  console.log(`[Save] Saving ${customer.name}`);

  const saveButton = page.getByRole('button', {
    name: /^save customer$/i
  });

  await expect(saveButton).toBeVisible();
  await expect(saveButton).toBeEnabled();

  const successPattern =
    /customer added successfully|customer created successfully/i;

  const errorPattern =
    /already exists|duplicate|invalid|failed|unable|required|error/i;

  const getMessages = async () => {
    const notifications = page.locator(
      '.ant-message, ' +
      '.ant-notification, ' +
      '[role="alert"], ' +
      '.ant-form-item-explain-error'
    );

    const texts = await notifications.allTextContents()
      .catch(() => []);

    return texts.map(text => text.trim()).filter(Boolean);
  };

  // Capture notifications before clicking Save.
  const capturedMessages = [];

  const captureMessages = async () => {
    const texts = await getMessages();

    for (const text of texts) {
      if (!capturedMessages.includes(text)) {
        capturedMessages.push(text);
      }
    }
  };

  await saveButton.click();
  console.log('[Save] Save Customer clicked');

  // Handle confirmation dialog if present.

  // =========================================
  // CONFIRM DETAILS POPUP
  // =========================================

  console.log('[Save] Waiting for Confirm Details popup');

  // Locate the popup by its visible heading.
  await expect(
    page.getByText('Confirm Details', { exact: true })
  ).toBeVisible({
    timeout: 15000
  });

  console.log('[Save] Confirm Details popup opened');

  // The popup contains an Edit button and a Confirm button.
  // Click the visible Confirm button.
  const confirmButton = page.getByRole('button', {
    name: /^confirm$/i,
    exact: true
  }).last();

  await expect(confirmButton).toBeVisible({
    timeout: 15000
  });

  await expect(confirmButton).toBeEnabled({
    timeout: 15000
  });

  await confirmButton.click();

  console.log('[Save] Confirm button clicked');

  // Wait until the confirmation popup closes.
  await expect(
    page.getByText('Confirm Details', { exact: true })
  ).toBeHidden({
    timeout: 30000
  });

  console.log('[Save] Confirm Details popup closed');

   let status = 'pending';

  try {
    await expect.poll(
      async () => {
        await captureMessages();

        // Also inspect visible page text in case
        // notifications use custom components.
        const bodyText = await page.locator('body')
          .innerText()
          .catch(() => '');

        const allText = [
          ...capturedMessages,
          bodyText
        ].join('\n');

        if (successPattern.test(allText)) {
          status = 'saved';
          return status;
        }

        const failures = capturedMessages.filter(
          message => errorPattern.test(message)
        );

        if (failures.length > 0) {
          status = 'failed';
          return status;
        }

        return 'pending';
      },
      {
        timeout: 30000,
        intervals: [250, 500, 1000]
      }
    ).not.toBe('pending');
  } catch (error) {
    const currentUrl = page.url();

    const bodyText = await page.locator('body')
      .innerText()
      .catch(() => '');

    console.error('[Save] Current URL:', currentUrl);
    console.error('[Save] Messages:', capturedMessages);
    console.error('[Save] Page text:', bodyText.slice(-3000));

    await page.screenshot({
      path: 'customer-save-failed.png',
      fullPage: true
    }).catch(() => {});

    throw new Error(
      `Unable to confirm save for ${customer.name}. ` +
      `URL: ${currentUrl}. ` +
      `Messages: ${JSON.stringify(capturedMessages)}`
    );
  }

  if (status === 'failed') {
    throw new Error(
      `Customer save failed for ${customer.name}: ` +
      capturedMessages.join(' | ')
    );
  }

  if (status !== 'saved') {
    throw new Error(
      `Customer save not confirmed for ${customer.name}`
    );
  }

  console.log(
    `[Save] Customer added successfully: ${customer.name}`
  );

  // Return to Customer Management.
  await openCustomerManagement(page);

  await expect(page).toHaveURL(
    /\/customer-menu\/?$/
  );

  console.log(
    '[Navigation] Returned to Customer Management'
  );
}
// =====================================
// MAIN TEST
// =====================================
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

      await login(page);
      await openCustomerManagement(page);

      for (let i = 0; i < customers.length; i++) {
        const customer = customers[i];

        await test.step(
          `Customer ${i + 1}: ${customer.name}`,
          async () => {
            await openCustomerManagement(page);
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

            await fillAdditionalDetails(page, customer);

            await saveCustomer(page, customer);

            await expect(page).toHaveURL(
              /\/customer-menu\/?$/
            );

            await expect(
              page.getByRole('button', {
                name: /add customer/i
              })
            ).toBeVisible();

            completed++;

            console.log(
              `[Success] Customer created ${completed}/10: ${customer.name}`
            );
          }
        );
      }

      await openCustomerManagement(page);

      console.log(
        `[Completed] ${completed}/10 customer save flows completed`
      );
    } catch (error) {
      console.error(
        `[Error] Stopped after ${completed}/10 customers`
      );

      console.error(
        '[Error] Current URL:',
        page.url()
      );

      console.error(
        '[Error] Open pages:',
        context.pages().map(p => p.url())
      );

      await page.screenshot({
        path: 'customer-creation-error.png',
        fullPage: true
      }).catch(() => {});

      throw error;
    }
  }
);
