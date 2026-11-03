
const { test, expect } = require('@playwright/test');

const customers = require('../../test-data/customers');

// =====================================
// CONFIGURATION
// =====================================

const BASE_URL =
  'http://purple-development-mychits-admin.s3-website.eu-north-1.amazonaws.com/';

const CUSTOMER_URL = `${BASE_URL}customer-menu`;

const ADMIN_ID = 'MCF-AD-1003';
const OTP = '888889';

const PASSWORD =
  process.env.TEST_CUSTOMER_PASSWORD || 'Test@12345';

// =====================================
// CLOSE BLOCKING POPUPS
// =====================================

async function closePopup(page) {
  const popup = page.locator(
    'div.fixed.inset-0.z-\\[9999\\]'
  ).first();

  const visible = await popup.isVisible().catch(() => false);

  if (!visible) return;

  const remindLater = popup.getByRole('button', {
    name: /remind me later/i
  });

  if (await remindLater.isVisible().catch(() => false)) {
    await remindLater.click();

    await expect(popup).toBeHidden({
      timeout: 15000
    });

    console.log('Popup closed');
    return;
  }

  const closeButton = popup.locator(
    'button[aria-label*="close" i], ' +
    'button[title*="close" i]'
  ).first();

  if (await closeButton.isVisible().catch(() => false)) {
    await closeButton.click();

    await expect(popup).toBeHidden({
      timeout: 15000
    });

    return;
  }

  throw new Error('Blocking popup could not be closed');
}

// =====================================
// LOGIN ONCE
// =====================================

async function loginOnce(page) {
  await page.goto(BASE_URL, {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });

  const loginHeading = page.getByRole('heading', {
    name: /admin login/i
  });

  await expect(loginHeading).toBeVisible({
    timeout: 30000
  });

  // Select branch
  await page.locator('select').first().selectOption({
    label: 'Test Not Main (CF-BR-2)'
  });

  // Enter Admin ID
  await page.getByPlaceholder('XXX-XX-XXXX')
    .fill(ADMIN_ID);

  // Send OTP
  await page.getByRole('button', {
    name: /send otp/i
  }).click();

  // Locate OTP input fields
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
    await otpInputs.first().fill(OTP);
  } else if (count === 6) {
    for (let i = 0; i < 6; i++) {
      await otpInputs.nth(i).fill(OTP[i]);
    }
  } else {
    throw new Error(
      `Unexpected OTP input count: ${count}`
    );
  }

  // Verify OTP
  await page.getByRole('button', {
    name: /verify otp|verify|login|submit/i
  }).last().click();

  await expect(loginHeading).toBeHidden({
    timeout: 30000
  });

  await closePopup(page);

  console.log('Login successful');
}

// =====================================
// OPEN CUSTOMER MANAGEMENT
// =====================================

async function openCustomerManagement(page) {
  await page.goto(CUSTOMER_URL, {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });

  await closePopup(page);

  await expect(
    page.getByRole('button', {
      name: /add customer/i
    })
  ).toBeVisible({
    timeout: 30000
  });
}

// =====================================
// OPEN ADD CUSTOMER FORM
// =====================================

async function openAddCustomer(page) {
  const button = page.getByRole('button', {
    name: /add customer/i
  });

  await closePopup(page);

  try {
    await button.click({ timeout: 5000 });
  } catch (error) {
    const popup = page.locator(
      'div.fixed.inset-0.z-\\[9999\\]'
    ).first();

    if (await popup.isVisible().catch(() => false)) {
      await closePopup(page);
      await button.click({ timeout: 20000 });
    } else {
      throw error;
    }
  }

  await expect(
    page.getByPlaceholder('Enter the Full Name')
  ).toBeVisible({
    timeout: 30000
  });

  console.log('Add Customer form opened');
}

// =====================================
// SELECT REFERRED TYPE
// ANT DESIGN DROPDOWN FIX
// =====================================


async function selectReferredType(page, type) {
  console.log(`Selecting Referred Type: ${type}`);

  // Find the dropdown before selection.
  const placeholder = page.locator(
    '.ant-select-selection-placeholder',
    { hasText: 'Select Referred Type' }
  );

  await expect(placeholder).toBeVisible({
    timeout: 15000
  });

  // Save the stable combobox ID before selecting.
  const combobox = placeholder.locator(
    'xpath=ancestor::*[contains(concat(" ", normalize-space(@class), " "), " ant-select ")][1]'
  ).locator('input[role="combobox"]');

  const comboboxId = await combobox.getAttribute('id');

  if (!comboboxId) {
    throw new Error('Referred Type combobox ID not found');
  }

  // Click the real input, not the placeholder.
  await combobox.click();

  const dropdown = page.locator(
    '.ant-select-dropdown:visible'
  );

  await expect(dropdown).toBeVisible({
    timeout: 15000
  });

  const option = dropdown.locator(
    '.ant-select-item-option'
  ).filter({
    hasText: type
  });

  await expect(option).toHaveCount(1, {
    timeout: 10000
  });

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
