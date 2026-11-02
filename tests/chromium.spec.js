
const { test, expect } = require('@playwright/test');

test('Login and Create 5 Jack Customers', async ({ page }) => {
  test.setTimeout(0);

  const baseURL =
    'http://purple-development-mychits-admin.s3-website.eu-north-1.amazonaws.com';

  const dashboardURL = `${baseURL}/dashboard`;
  const customerURL = `${baseURL}/customer-menu`;

  // ==========================================
  // STEP 1: FIVE CUSTOMER DETAILS
  // ==========================================

  const customers = [
    {
      name: 'Jack Smith',
      email: 'jack.smith2411@example.com',
      phone: '7010048996',
      password: 'Jack@2411Test',
      pincode: '600002',
      aadhaar: '234567890123',
      pan: 'FGHIJ5678K',
      address: '25 Green Park Road, Chennai',
      familyCode: 'PW-FAMILY-2411',
      installmentAmount: '300'
    },

    {
      name: 'Jack Wilson',
      email: 'jack.wilson2412@example.com',
      phone: '7010048917',
      password: 'Jack@2412Test',
      pincode: '600003',
      aadhaar: '345678901234',
      pan: 'GHIJK6789L',
      address: '18 Lake View Street, Chennai',
      familyCode: 'PW-FAMILY-2412',
      installmentAmount: '400'
    },

    {
      name: 'Jack Brown',
      email: 'jack.brown2413@example.com',
      phone: '7010048998',
      password: 'Jack@2413Test',
      pincode: '600004',
      aadhaar: '456789012345',
      pan: 'HIJKL7890M',
      address: '42 Green Avenue, Chennai',
      familyCode: 'PW-FAMILY-2413',
      installmentAmount: '500'
    },

    {
      name: 'Jack Taylor',
      email: 'jack.taylor2414@example.com',
      phone: '7010048999',
      password: 'Jack@2414Test',
      pincode: '600005',
      aadhaar: '567890123456',
      pan: 'IJKLM8901N',
      address: '12 Park Road, Chennai',
      familyCode: 'PW-FAMILY-2414',
      installmentAmount: '600'
    },

    {
      name: 'Jack Anderson',
      email: 'jack.anderson2415@example.com',
      phone: '7010048901',
      password: 'Jack@2415Test',
      pincode: '600006',
      aadhaar: '678901234567',
      pan: 'JKLMN9012P',
      address: '35 Rose Garden Street, Chennai',
      familyCode: 'PW-FAMILY-2415',
      installmentAmount: '700'
    }
  ];

  // ==========================================
  // STEP 2: REUSABLE FIELD FUNCTION
  // ==========================================

  async function fillField(locator, value, fieldName) {
    console.log(`Filling ${fieldName}`);

    await expect(locator).toBeVisible({
      timeout: 15000
    });

    await locator.fill(value);

    await expect(locator).toHaveValue(value);

    console.log(`${fieldName} completed`);
  }

  // ==========================================
  // STEP 3: OPEN DASHBOARD
  // ==========================================

  await page.goto(dashboardURL, {
    waitUntil: 'domcontentloaded',
    timeout: 45000
  });

  console.log('Website opened:', page.url());

  // ==========================================
  // STEP 4: LOGIN IF REQUIRED
  // ==========================================

  const loginHeading = page.getByRole('heading', {
    name: 'Admin Login'
  });

  if (await loginHeading.isVisible().catch(() => false)) {

    // Select branch
    await page.locator('select').first().selectOption({
      label: 'Test Not Main (CF-BR-2)'
    });

    await page.waitForTimeout(1000);

    // Enter Admin ID
    await page.getByPlaceholder('XXX-XX-XXXX')
      .fill('MCF-AD-1003');

    await page.waitForTimeout(1000);

    // Send OTP
    await page.getByRole('button', {
      name: /send otp/i
    }).click();

    console.log('OTP requested');

    // Locate OTP inputs
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

    const otp = '888889';

    const otpCount = await otpInputs.count();

    if (otpCount === 1) {

      await otpInputs.first().fill(otp);

    } else if (otpCount === 6) {

      for (let i = 0; i < 6; i++) {
        await otpInputs.nth(i).fill(otp[i]);
      }

    } else {

      throw new Error(
        `Unexpected OTP input count: ${otpCount}`
      );
    }

    // Verify OTP
    const verifyButton = page.getByRole('button', {
      name: /verify otp|verify|submit|confirm|login/i
    }).last();

    await expect(verifyButton).toBeVisible();

    await verifyButton.click();

    await expect(loginHeading).toBeHidden({
      timeout: 30000
    });

    console.log('Login completed');
  }

  // ==========================================
  // STEP 5: CUSTOMER CREATION FUNCTION
  // ==========================================

  async function createCustomer(customer, index) {

    console.log(
      `Starting customer ${index + 1}: ${customer.name}`
    );

    // Open Customer Management
    await page.goto(customerURL, {
      waitUntil: 'domcontentloaded',
      timeout: 45000
    });

    // Click Add Customer
    const addCustomerButton = page.getByRole('button', {
      name: /add customer/i
    });

    await expect(addCustomerButton).toBeVisible({
      timeout: 20000
    });

    await addCustomerButton.click();

    console.log('Add Customer form opened');

    // ------------------------------------------
    // BASIC CUSTOMER DETAILS
    // ------------------------------------------

    await fillField(
      page.getByPlaceholder('Enter the Full Name'),
      customer.name,
      'Full Name'
    );

    await fillField(
      page.getByPlaceholder('Enter Email'),
      customer.email,
      'Email'
    );

    await fillField(
      page.getByPlaceholder('Enter Phone Number'),
      customer.phone,
      'Phone Number'
    );

    await fillField(
      page.getByPlaceholder('Enter Password'),
      customer.password,
      'Password'
    );

    await fillField(
      page.getByPlaceholder('Enter Pincode'),
      customer.pincode,
      'Pincode'
    );

    await fillField(
      page.getByPlaceholder(
        /enter\s+(?:aadhaar|adhaar)\s+number/i
      ),
      customer.aadhaar,
      'Aadhaar Number'
    );

    await fillField(
      page.getByPlaceholder(/enter\s+pan\s+number/i),
      customer.pan,
      'PAN Number'
    );

    await fillField(
      page.getByPlaceholder(/enter\s+the\s+address/i),
      customer.address,
      'Communication Address'
    );

    // ------------------------------------------
    // SAME ADDRESS CHECKBOX
    // ------------------------------------------

    const sameAddress = page.getByRole('checkbox', {
      name: /same as communication address/i
    });

    if (await sameAddress.isVisible().catch(() => false)) {

      if (!(await sameAddress.isChecked())) {
        await sameAddress.check();
      }
    }

    // ------------------------------------------
    // SAVE AND CONTINUE
    // ------------------------------------------

    const saveContinueButton = page.getByRole('button', {
      name: /save\s*&\s*continue/i
    });

    await expect(saveContinueButton).toBeEnabled();

    await saveContinueButton.click();

    console.log('Save and Continue clicked');

    // ------------------------------------------
    // FAMILY CODE
    // ------------------------------------------

    await fillField(
      page.getByPlaceholder('Enter Family Code'),
      customer.familyCode,
      'Family Code'
    );

    // ------------------------------------------
    // VERIFY SELF JOINING
    // ------------------------------------------

    await expect(
      page.getByText('Self Joining', {
        exact: true
      }).first()
    ).toBeVisible({
      timeout: 15000
    });

    // ------------------------------------------
    // SELECT DAILY FREQUENCY
    // ------------------------------------------

    const dailyRadio = page.getByRole('radio', {
      name: 'Daily'
    });

    if (await dailyRadio.count() > 0) {

      await dailyRadio.check();

    } else {

      await page.getByText('Daily', {
        exact: true
      }).click();
    }

    // ------------------------------------------
    // INSTALLMENT AMOUNT
    // ------------------------------------------

    await fillField(
      page.getByPlaceholder(/enter .*installment am/i),
      customer.installmentAmount,
      'Installment Amount'
    );

    // ------------------------------------------
    // SCREENSHOT BEFORE SAVING
    // ------------------------------------------

    await page.screenshot({
      path: `customer-${index + 1}-ready-to-save.png`,
      fullPage: true
    });

    console.log(
      `Customer ${index + 1} details completed`
    );

    // ------------------------------------------
    // SAVE CUSTOMER
    // ------------------------------------------

    const saveCustomerButton = page.getByRole('button', {
      name: 'Save Customer',
      exact: true
    });

    await expect(saveCustomerButton).toBeVisible({
      timeout: 15000
    });

    await expect(saveCustomerButton).toBeEnabled();

    await saveCustomerButton.click();

    console.log('Save Customer clicked');

    // ------------------------------------------
    // OPTIONAL CONFIRMATION
    // ------------------------------------------

    const confirmButton = page.getByRole('button', {
      name: 'Confirm',
      exact: true
    });

    try {

      await confirmButton.waitFor({
        state: 'visible',
        timeout: 7000
      });

      await confirmButton.click();

      console.log('Confirmation completed');

    } catch {

      console.log('No confirmation dialog appeared');
    }

    // ------------------------------------------
    // WAIT FOR SAVE OPERATION
    // ------------------------------------------

    await page.waitForTimeout(4000);

    // ------------------------------------------
    // RESULT SCREENSHOT
    // ------------------------------------------

    await page.screenshot({
      path: `customer-${index + 1}-save-result.png`,
      fullPage: true
    });

    console.log(
      `Customer ${index + 1} flow finished: ${customer.name}`
    );
  }

  // ==========================================
  // STEP 6: CREATE ALL 5 CUSTOMERS
  // ==========================================

  for (let i = 0; i < customers.length; i++) {

    const customer = customers[i];

    console.log('----------------------------------');

    console.log(
      `Processing ${i + 1} of ${customers.length}`
    );

    await createCustomer(customer, i);

    console.log(
      `Completed ${i + 1} of ${customers.length}`
    );

    console.log('----------------------------------');

    // Pause between customers
    await page.waitForTimeout(3000);
  }

  // ==========================================
  // STEP 7: FINISH
  // ==========================================

  console.log('All 5 customer flows completed.');

  console.log('Final URL:', page.url());

  // Keep browser visible for 10 seconds
  await page.waitForTimeout(10000);

  console.log('Automation finished.');
});
