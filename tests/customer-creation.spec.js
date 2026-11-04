
const { test, expect } = require('@playwright/test');
const customers = require('../test-data/customers');

// ==========================================
// CONFIGURATION
// ==========================================

const BASE_URL = process.env.BASE_URL;
const CUSTOMER_URL = `${BASE_URL}customer-menu`;

const ADMIN_ID = process.env.ADMIN_ID;
const OTP = process.env.OTP;
const BRANCH_NAME = process.env.BRANCH_NAME;

const PASSWORD =
  process.env.TEST_CUSTOMER_PASSWORD || 'Test@12345';

// ==========================================
// CLOSE BLOCKING POPUPS
// ==========================================

async function closePopup(page) {
  const overlay = page.locator(
    'div.fixed.inset-0.z-\\[9999\\]'
  );

  // Handle multiple popups if necessary.
  for (let attempt = 0; attempt < 5; attempt++) {
    const appeared = await overlay.first()
      .waitFor({
        state: 'visible',
        timeout: 1500
      })
      .then(() => true)
      .catch(() => false);

    if (!appeared) {
      return;
    }

    const popup = overlay.first();

    const buttonNames = [
      /remind me later/i,
      /^(ok|okay|done|close|continue|confirm|yes)$/i,
      /cancel/i
    ];

    let closed = false;

    for (const name of buttonNames) {
      const button = popup.getByRole('button', { name });

      if (await button.first().isVisible().catch(() => false)) {
        await button.first().click({ timeout: 10000 });
        closed = true;
        break;
      }
    }

    if (!closed) {
      const closeButton = popup.locator(
        'button[aria-label*="close" i], ' +
        'button[title*="close" i]'
      );

      if (await closeButton.first().isVisible().catch(() => false)) {
        await closeButton.first().click();
        closed = true;
      }
    }

    if (!closed) {
      const details = await popup.locator('button')
        .evaluateAll(buttons =>
          buttons.map(button => ({
            text: button.innerText,
            title: button.getAttribute('title'),
            ariaLabel: button.getAttribute('aria-label')
          }))
        );

      throw new Error(
        'Blocking popup could not be closed. Buttons: ' +
        JSON.stringify(details)
      );
    }

    await expect(popup).toBeHidden({
      timeout: 15000
    });

    console.log('Blocking popup closed');
  }
}

// ==========================================
// CLICK ADD CUSTOMER SAFELY
// ==========================================

async function clickAddCustomer(page) {
  const button = page.getByRole('button', {
    name: /add customer/i
  });

  await expect(button).toBeVisible({
    timeout: 30000
  });

  // A popup can appear after the page has loaded.
  // Close it immediately before clicking.
  await closePopup(page);

  try {
    await button.click({ timeout: 5000 });
  } catch (error) {
    const blockingPopup = page.locator(
      'div.fixed.inset-0.z-\\[9999\\]'
    );

    if (await blockingPopup.first().isVisible().catch(() => false)) {
      console.log('Popup appeared during Add Customer click');
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

// ==========================================
// LOGIN
// ==========================================

async function login(page) {
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
  label: BRANCH_NAME
  });

  // Enter Admin ID
  await page.getByPlaceholder('XXX-XX-XXXX')
    .fill(ADMIN_ID);

  // Send OTP
  await page.getByRole('button', {
    name: /send otp/i
  }).click();

  // Enter OTP
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

  const otpCount = await otpInputs.count();

  if (otpCount === 1) {
    await otpInputs.first().fill(OTP);
  } else if (otpCount === 6) {
    for (let i = 0; i < 6; i++) {
      await otpInputs.nth(i).fill(OTP[i]);
    }
  } else {
    throw new Error(
      `Unexpected OTP input count: ${otpCount}`
    );
  }

  // Verify OTP
  await page.getByRole('button', {
    name: /verify otp|verify|login|submit/i
  }).last().click();

  // Wait for successful login
  await page.waitForURL(
    /\/(dashboard|customer-menu)\/?$/,
    { timeout: 60000 }
  );

  await closePopup(page);

  console.log('Login successful');
}

// ==========================================
// OPEN CUSTOMER MANAGEMENT
// ==========================================

async function openCustomerManagement(page) {
  const currentPath = new URL(page.url()).pathname;

  if (!/^\/customer-menu\/?$/.test(currentPath)) {
    await page.goto(CUSTOMER_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });
  }

  await closePopup(page);

  await expect(
    page.getByRole('button', {
      name: /add customer/i
    })
  ).toBeVisible({
    timeout: 30000
  });
}

// ==========================================
// SELECT REFERRED TYPE
// ==========================================

async function selectReferredType(page, type) {
  const selects = page.locator('select');

  for (let i = 0; i < await selects.count(); i++) {
    const select = selects.nth(i);
    const options = await select.locator('option')
      .allTextContents();

    if (options.some(option => option.trim() === type)) {
      await select.selectOption({ label: type });
      return;
    }
  }

  const combo = page.getByRole('combobox', {
    name: /referred type/i
  });

  if (await combo.count() === 1) {
    await combo.click();

    const option = page.getByRole('option', {
      name: type,
      exact: true
    });

    if (await option.count() === 1) {
      await option.click();
      return;
    }

    const textOption = page.getByText(type, {
      exact: true
    });

    if (await textOption.count() === 1) {
      await textOption.click();
      return;
    }
  }

  const label = page.getByText(/referred\s*type/i).first();

  if (await label.isVisible().catch(() => false)) {
    const parent = label.locator('xpath=..');

    const dropdown = parent.locator(
      'select, [role="combobox"], button, ' +
      '[aria-haspopup="listbox"], [aria-haspopup="true"]'
    ).first();

    if (await dropdown.count() === 1) {
      await dropdown.click();

      const option = page.getByRole('option', {
        name: type,
        exact: true
      });

      if (await option.count() === 1) {
        await option.click();
        return;
      }

      const textOption = page.getByText(type, {
        exact: true
      });

      if (await textOption.count() === 1) {
        await textOption.click();
        return;
      }
    }
  }

  throw new Error(
    `Unable to select Referred Type: ${type}`
  );
}

// ==========================================
// CREATE ONE CUSTOMER
// ==========================================

async function createCustomer(page, customer, index) {
  console.log(
    `Creating customer ${index}/${customers.length}: ${customer.name}`
  );

  await openCustomerManagement(page);
  await clickAddCustomer(page);

  // STEP 1 - PERSONAL INFORMATION

  await page.getByPlaceholder('Enter the Full Name')
    .fill(customer.name);

  await page.getByPlaceholder('Enter Email')
    .fill(customer.email);

  await page.getByPlaceholder('Enter Phone Number')
    .fill(String(customer.phone));

  await page.getByPlaceholder('Enter Password')
    .fill(PASSWORD);

  await page.getByPlaceholder('Enter Pincode')
    .fill(String(customer.pincode));

  await page.getByPlaceholder(
    /enter\s+(?:aadhaar|adhaar)\s+number/i
  ).fill(String(customer.aadhaar));

  await page.getByPlaceholder(
    /enter\s+pan\s+number/i
  ).fill(String(customer.pan));

  await page.getByPlaceholder(
    /enter\s+the\s+address/i
  ).fill(customer.address);

  await page.getByPlaceholder('Enter the Permanent Address')
    .fill(customer.address);

  console.log('Step 1 completed');

  await page.getByRole('button', {
    name: /save\s*&\s*continue/i
  }).click();

  // STEP 2 - CUSTOMER SETTINGS

  const familyCode = page.getByPlaceholder('Enter Family Code');

  await expect(familyCode).toBeVisible({
    timeout: 30000
  });

  if (customer.familyCode != null) {
    await familyCode.fill(String(customer.familyCode));
  }

  await selectReferredType(
    page,
    customer.referredType || 'Self Joining'
  );

  const frequency = customer.paymentFrequency || 'Daily';

  await page.getByRole('radio', {
    name: new RegExp(`^${frequency}$`, 'i')
  }).check();

  const amount = String(
    customer.installmentAmount ?? 200
  );

  const installment = page.locator(
    'input[placeholder*="installment" i]'
  );

  if (await installment.count() > 0) {
    await installment.first().fill(amount);
  } else {
    await page.getByLabel(/installment amount/i)
      .fill(amount);
  }

  console.log('Step 2 completed');

  // SAVE CUSTOMER

  await page.getByRole('button', {
    name: /^save customer$/i
  }).click();

  await closePopup(page);

  await expect(
    page.getByPlaceholder('Enter the Full Name')
  ).toBeHidden({
    timeout: 30000
  });

  console.log(
    `Save flow completed: ${customer.name}`
  );
}

// ==========================================
// MAIN TEST
// ==========================================

test('Create 10 customers sequentially', async ({ page }) => {
  test.setTimeout(900000);
  page.setDefaultTimeout(30000);
  page.setDefaultNavigationTimeout(60000);

  expect(customers).toHaveLength(10);

  let completed = 0;

  try {
    await login(page);
    await openCustomerManagement(page);

    for (let i = 0; i < customers.length; i++) {
      await test.step(
        `Customer ${i + 1}: ${customers[i].name}`,
        async () => {
          await createCustomer(page, customers[i], i + 1);
          completed++;
        }
      );
    }

    await openCustomerManagement(page);

    await expect(page).toHaveURL(
      /\/customer-menu\/?$/
    );

    console.log(
      `Completed ${completed}/10 customer save flows`
    );

  } catch (error) {
    console.error(
      `Stopped after ${completed}/10 customer save flows`
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
