
const { test, expect } = require('@playwright/test');
const customers = require('../test-data/customers');

const baseURL =
  'http://purple-development-mychits-admin.s3-website.eu-north-1.amazonaws.com/';

// Admin login details
const ADMIN_ID = 'MCF-AD-1003';
const OTP = '888889';

// Development test values
const CUSTOMER_PASSWORD = 'Test@12345';
const FAMILY_CODE = 'REPLACE_WITH_APPROVED_TEST_FAMILY_CODE';

// ======================================
// STEP 1: LOGIN ONCE
// ======================================

async function loginIfRequired(page) {
  await page.goto(baseURL, {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });

  await page.waitForTimeout(5000);

  const loginHeading = page.getByRole('heading', {
    name: /admin login/i
  });

  let loginVisible = await loginHeading
    .isVisible()
    .catch(() => false);

  // Reload once if the login page is blank or missing
  if (!loginVisible) {
    console.log('Login page not visible. Reloading...');

    await page.reload({
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    await expect(loginHeading).toBeVisible({
      timeout: 30000
    });

    loginVisible = true;
  }

  if (!loginVisible) {
    throw new Error('Admin Login page could not be loaded.');
  }

  console.log('Logging in for the first time...');

  await page.locator('select').first().selectOption({
    label: 'Test Not Main (CF-BR-2)'
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
    timeout: 20000
  });

  const otpCount = await otpInputs.count();

  if (otpCount === 1) {
    await otpInputs.first().fill(OTP);
  } else if (otpCount === 6) {
    for (let i = 0; i < OTP.length; i++) {
      await otpInputs.nth(i).fill(OTP[i]);
    }
  } else {
    throw new Error(`Unexpected OTP input count: ${otpCount}`);
  }

  await page.getByRole('button', {
    name: /verify otp|verify|submit|confirm|login/i
  }).last().click();

  await expect(loginHeading).toBeHidden({
    timeout: 30000
  });

  console.log('Admin login successful.');
}

// ======================================
// STEP 2: OPEN CUSTOMER MANAGEMENT
// ======================================

async function openCustomerManagement(page) {
  await page.goto(`${baseURL}customer-menu`, {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });

  await expect(
    page.getByRole('button', { name: /add customer/i })
  ).toBeVisible({
    timeout: 30000
  });

  console.log('Customer Management opened.');
}

// ======================================
// STEP 3: OPEN ADD CUSTOMER
// ======================================

async function openAddCustomer(page) {
  const addButton = page.getByRole('button', {
    name: /add customer/i
  });

  await expect(addButton).toBeVisible({
    timeout: 20000
  });

  await addButton.click();

  await expect(
    page.getByPlaceholder('Enter the Full Name')
  ).toBeVisible({
    timeout: 20000
  });
}

// ======================================
// STEP 4: CREATE CUSTOMER
// ======================================

async function createCustomer(page, customer) {

  // STEP 1: CUSTOMER INFORMATION

  await page.getByPlaceholder('Enter the Full Name')
    .fill(customer.name);

  await page.getByPlaceholder('Enter Email')
    .fill(customer.email);

  await page.getByPlaceholder('Enter Phone Number')
    .fill(String(customer.phone));

  await page.getByPlaceholder('Enter Password')
    .fill(CUSTOMER_PASSWORD);

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

  await page.getByPlaceholder(
    'Enter the Permanent Address'
  ).fill(customer.address);

  // STEP 1 TO STEP 2

  await page.getByRole('button', {
    name: /save\s*&\s*continue/i
  }).click();

  // STEP 2: CUSTOMER SETTINGS

  await expect(
    page.getByPlaceholder('Enter Family Code')
  ).toBeVisible({
    timeout: 20000
  });


  await page.getByLabel(/referred type/i)
    .selectOption({
      label: customer.referredType || 'Self Joining'
    });

  await page.getByRole('radio', {
    name: /daily/i
  }).check();

  const installmentField = page.locator(
    'input[placeholder*="installment" i]'
  );

  if (await installmentField.count() > 0) {
    await installmentField.first().fill(
      String(customer.installmentAmount || 200)
    );
  } else {
    await page.getByLabel(/installment amount/i)
      .fill(String(customer.installmentAmount || 200));
  }

  // SAVE CUSTOMER

  await page.getByRole('button', {
    name: /^save customer$/i
  }).click();

  // VERIFY CUSTOMER

  await expect(
    page.getByText(customer.name, {
      exact: true
    }).first()
  ).toBeVisible({
    timeout: 30000
  });

  console.log(`PASS: ${customer.name} created successfully.`);
}

// ======================================
// MAIN TEST: ONE LOGIN + 10 CUSTOMERS
// ======================================

test('Login once and create 10 customers', async ({ page }) => {

  test.setTimeout(600000);

  // Browser debugging
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER ERROR:', msg.text());
    }
  });

  page.on('pageerror', error => {
    console.log('JAVASCRIPT ERROR:', error.message);
  });

  page.on('requestfailed', request => {
    console.log(
      'REQUEST FAILED:',
      request.url(),
      request.failure()?.errorText
    );
  });

  // Validate test data
  expect(customers).toHaveLength(10);

  for (const customer of customers) {
    expect(customer.name).toBeTruthy();
    expect(customer.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    expect(customer.phone).toBeTruthy();

    // Use company-approved synthetic test identity values.
    expect(String(customer.aadhaar)).toMatch(/^\d{12}$/);
    expect(customer.pan).toMatch(/^[A-Z]{5}\d{4}[A-Z]$/);
  }

  // LOGIN ONLY ONCE
  await loginIfRequired(page);

  // OPEN CUSTOMER MANAGEMENT
  await openCustomerManagement(page);

  // CREATE ALL 10 CUSTOMERS IN THE SAME SESSION
  for (let i = 0; i < customers.length; i++) {

    const customer = customers[i];

    await test.step(
      `TC${String(i + 1).padStart(2, '0')} - ${customer.name}`,
      async () => {

        console.log(
          `Starting customer ${i + 1}/10: ${customer.name}`
        );

        await openAddCustomer(page);

        await createCustomer(page, customer);

        console.log(
          `Completed customer ${i + 1}/10: ${customer.name}`
        );
      }
    );
  }

  console.log('SUCCESS: All 10 customer creation steps completed.');

  // Keep browser open for inspection
  await page.pause();
});
