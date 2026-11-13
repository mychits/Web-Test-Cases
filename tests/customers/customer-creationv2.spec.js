
const { test, expect } = require('@playwright/test');
require('dotenv').config();

// ==========================================
// CONFIGURATION
// ==========================================

const BASE_URL = (
  process.env.BASE_URL || 'http://13.48.10.236/'
).replace(/\/+$/, '');

const BRANCH_NAME =
  process.env.BRANCH_NAME || 'Main Branch (CF-BR-1)';

const ADMIN_ID = process.env.ADMIN_ID;
const OTP = process.env.OTP;

const CUSTOMER_COUNT = Number(
  process.env.CUSTOMER_V2_COUNT || 15
);

const ENABLE_CREATE =
  process.env.ENABLE_CUSTOMER_V2_CREATE === 'true';

const RUN_ID = String(Date.now()).slice(-9);

// ==========================================
// COMMON FUNCTIONS
// ==========================================

function required(value, key) {
  if (!value || !String(value).trim()) {
    throw new Error(`${key} is missing from .env`);
  }

  return String(value).trim();
}

function escapeRegex(value) {
  return String(value).replace(
    /[.*+?^${}()|[\]\\]/g,
    '\\$&'
  );
}

function labelRegex(label) {
  return new RegExp(
    `^\\s*${escapeRegex(label)}\\s*\\*?\\s*$`,
    'i'
  );
}

// ==========================================
// OPEN CUSTOMER MANAGEMENT
// ==========================================

async function openCustomerManagement(page) {
  await page.goto(
    `${BASE_URL}/customer-menu`,
    {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    }
  );

  await expect(
    page.getByRole('button', {
      name: /add customer/i
    }).first()
  ).toBeVisible({
    timeout: 30000
  });

  console.log('Customer Management opened');
}

// ==========================================
// LOGIN ONLY ONCE
// ==========================================

async function loginOnce(page) {
  console.log('Opening Hariharan Server...');

  await page.goto(BASE_URL, {
    waitUntil: 'domcontentloaded',
    timeout: 30000
  });

  console.log('Website opened:', page.url());

  if (!/dashboard/i.test(page.url())) {
    const branch = page.locator('select').first();

    await expect(branch).toBeVisible({
      timeout: 30000
    });

    await expect.poll(
      async () => {
        const options = await branch
          .locator('option')
          .allTextContents();

        return options.map(text => text.trim());
      },
      { timeout: 30000 }
    ).toContain(BRANCH_NAME.trim());

    await branch.selectOption({
      label: BRANCH_NAME.trim()
    });

    console.log('Branch selected:', BRANCH_NAME);

    const adminInput = page.getByPlaceholder(
      'XXX-XX-XXXX'
    );

    await expect(adminInput).toBeVisible();

    await adminInput.fill(
      required(ADMIN_ID, 'ADMIN_ID')
    );

    console.log('Admin ID entered');

    const sendOtp = page.getByRole('button', {
      name: /send otp|request otp|continue|login/i
    }).first();

    await expect(sendOtp).toBeEnabled();
    await sendOtp.click();

    console.log('Send OTP button clicked');

    const otpValue = required(OTP, 'OTP');

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
        if (/dashboard/i.test(page.url())) {
          return 'ready';
        }

        return (await otpInputs.count()) > 0
          ? 'ready'
          : 'waiting';
      },
      { timeout: 30000 }
    ).toBe('ready');

    if (!/dashboard/i.test(page.url())) {
      const splitInputs = page.locator(
        'input[maxlength="1"]:visible'
      );

      if (
        await splitInputs.count() === otpValue.length
      ) {
        for (let i = 0; i < otpValue.length; i++) {
          await splitInputs.nth(i).fill(otpValue[i]);
        }
      } else {
        await otpInputs.first().fill(otpValue);
      }

      console.log('OTP entered');

      const verifyButton = page.getByRole('button', {
        name: /verify otp|verify|submit|login|sign in/i
      }).first();

      if (
        await verifyButton.isVisible().catch(() => false)
      ) {
        await expect(verifyButton).toBeEnabled();
        await verifyButton.click();
      }
    }

    await expect(page).toHaveURL(
      /dashboard/i,
      { timeout: 30000 }
    );

    console.log('Admin login successful');
  }

  await openCustomerManagement(page);
}

// ==========================================
// FILL BASIC DETAILS
// ==========================================

async function fillLabeled(page, label, value) {
  const fieldLabel = page.getByText(
    labelRegex(label)
  ).first();

  await expect(fieldLabel).toBeVisible({
    timeout: 15000
  });

  const input = fieldLabel
    .locator('xpath=..')
    .locator(
      'input:not([type="checkbox"]), textarea'
    )
    .first();

  await expect(input).toBeVisible({
    timeout: 15000
  });

  await input.fill(String(value));
}

// ==========================================
// REFERRED TYPE - ANT DESIGN
// ==========================================

async function chooseSearchDropdown(
  page,
  label,
  optionText
) {
  console.log(`Selecting ${label}: ${optionText}`);

  const modal = page.locator('#modal-wrapper');

  await expect(modal).toBeVisible({
    timeout: 15000
  });

  const fieldName =
    label === 'Referred Type'
      ? 'referral_type'
      : null;

  if (!fieldName) {
    throw new Error(
      `Unsupported dropdown: ${label}`
    );
  }

  const select = modal.locator(
    `.ant-select[name="${fieldName}"]`
  );

  await expect(select).toBeVisible({
    timeout: 15000
  });

  await select.locator(
    '.ant-select-selector'
  ).click();

  const option = page.locator(
    '.ant-select-dropdown:visible ' +
    '.ant-select-item-option'
  ).filter({
    hasText: new RegExp(
      `^\\s*${escapeRegex(optionText)}\\s*$`,
      'i'
    )
  });

  await expect(option).toHaveCount(1, {
    timeout: 15000
  });

  await option.click();

  await expect(
    select.locator('.ant-select-selection-item')
  ).toHaveText(optionText, {
    timeout: 15000
  });

  console.log(
    `${label} selected: ${optionText}`
  );
}

// ==========================================
// CUSTOMER RELATIONSHIP MANAGER
// ==========================================


async function chooseRelationshipManager(page, rmLabel) {
  console.log(
    'Selecting Relationship Manager:',
    rmLabel
  );

  const select = page.locator(
    '#modal-wrapper .ant-select[name="customer_relationship_manager"]'
  );

  await expect(select).toBeVisible({
    timeout: 15000
  });

  // Open Relationship Manager dropdown
  await select.locator(
    '.ant-select-selector'
  ).click();

  // Search manager name
  const managerName = rmLabel.split('|')[0].trim();

  const searchInput = select.locator(
    'input.ant-select-selection-search-input'
  );

  await searchInput.fill(managerName);

  // Ant Design renders options outside the modal
  const popup = page.locator(
    '.ant-select-dropdown:visible'
  ).last();

  await expect(popup).toBeVisible({
    timeout: 15000
  });

  const option = popup.locator(
    '.ant-select-item-option'
  ).filter({
    hasText: new RegExp(
      `^\\s*${escapeRegex(rmLabel)}\\s*$`,
      'i'
    )
  });

  console.log(
    'Available Relationship Managers:',
    await popup.locator(
      '.ant-select-item-option'
    ).allTextContents()
  );

  await expect(option).toHaveCount(1, {
    timeout: 15000
  });

  // Select actual option
  await option.click();

  // Verify selected value
  await expect(
    select.locator('.ant-select-selection-item')
  ).toContainText(managerName, {
    timeout: 15000
  });

  console.log(
    'Relationship Manager selected successfully:',
    rmLabel
  );
}
// ==========================================
// CREATE ONE CUSTOMER
// ==========================================

async function createCustomer(page, customer) {
  await openCustomerManagement(page);

  // OPEN ADD CUSTOMER
  await page.getByRole('button', {
    name: /add customer/i
  }).first().click();

  await expect(
    page.getByText('Basic Details', {
      exact: true
    })
  ).toBeVisible();

  console.log('Add Customer form opened');

  // STEP 1 - BASIC DETAILS
  await fillLabeled(
    page,
    'Full Name',
    customer.name
  );

  await fillLabeled(
    page,
    'Email',
    customer.email
  );

  await fillLabeled(
    page,
    'Phone Number',
    customer.phone
  );

  await fillLabeled(
    page,
    'Password',
    customer.password
  );

  await fillLabeled(
    page,
    'Pincode',
    customer.pincode
  );

  await fillLabeled(
    page,
    'Address (Communication)',
    customer.address
  );

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

  console.log('Step 1 Basic Details entered');

  await page.getByRole('button', {
    name: 'Save & Continue',
    exact: true
  }).click();

  await expect(
    page.getByText('Additional & Payment', {
      exact: true
    })
  ).toBeVisible({
    timeout: 15000
  });

  console.log(
    'Step 2 Additional & Payment opened'
  );

  // STEP 2 - REFERRED TYPE
  await chooseSearchDropdown(
    page,
    'Referred Type',
    'Self Joining'
  );

  // STEP 2 - RELATIONSHIP MANAGER
  await chooseRelationshipManager(
    page,
    required(
      process.env.CUSTOMER_V2_RM_LABEL,
      'CUSTOMER_V2_RM_LABEL'
    )
  );

  // PAYMENT FREQUENCY - DAILY
  await page.locator(
    '#modal-wrapper ' +
    'input[name="installment_type"][value="daily"]'
  ).check();

  console.log(
    'Payment Frequency selected: Daily'
  );

  // INSTALLMENT AMOUNT
  await page.locator(
    '#modal-wrapper input[name="installment_amount"]'
  ).fill(String(customer.installment));

  console.log('Step 2 details entered');

  // SAVE CUSTOMER
  await page.getByRole('button', {
    name: 'Save Customer',
    exact: true
  }).click();

  const confirmHeading = page.getByText(
    'Confirm Details',
    { exact: true }
  );

  await expect(confirmHeading).toBeVisible({
    timeout: 15000
  });

  await expect(
    page.getByText(
      customer.name,
      { exact: true }
    ).last()
  ).toBeVisible();

  await page.getByRole('button', {
    name: 'Confirm',
    exact: true
  }).click();

  await expect(confirmHeading).toBeHidden({
    timeout: 30000
  });

  await expect(
    page.getByRole('button', {
      name: 'Save Customer',
      exact: true
    })
  ).toBeHidden({
    timeout: 15000
  });

  console.log(
    `Save flow completed: ${customer.name}`
  );

  // RETURN TO CUSTOMER MANAGEMENT
  await openCustomerManagement(page);
}

// ==========================================
// GENERATE 15 UNIQUE CUSTOMERS
// ==========================================

function generateCustomers() {
  return Array.from(
    { length: CUSTOMER_COUNT },
    (_, index) => {
      const serial = String(index + 1)
        .padStart(2, '0');

      return {
        name:
          `QA V2 Customer ${RUN_ID}-${serial}`,

        email:
          `qa.v2.${RUN_ID}.${serial}@example.com`,

        phone:
          `9${RUN_ID.slice(-7)}${serial}`,

        password:
          process.env.CUSTOMER_V2_PASSWORD ||
          'Test@12345',

        pincode:
          process.env.CUSTOMER_V2_PINCODE ||
          '560001',

        address:
          'QA Test Address, Bengaluru',

        installment:
          process.env.CUSTOMER_V2_INSTALLMENT ||
          '100'
      };
    }
  );
}

// ==========================================
// MAIN PLAYWRIGHT TEST
// ==========================================

test(
  'Customer Creation V2 - Create 15 Customers Sequentially',
  async ({ page }) => {
    test.setTimeout(15 * 60 * 1000);
    page.setDefaultTimeout(15000);

    required(ADMIN_ID, 'ADMIN_ID');
    required(OTP, 'OTP');

    if (!ENABLE_CREATE) {
      throw new Error(
        'Set ENABLE_CUSTOMER_V2_CREATE=true in .env'
      );
    }

    if (
      !Number.isInteger(CUSTOMER_COUNT) ||
      CUSTOMER_COUNT !== 15
    ) {
      throw new Error(
        'CUSTOMER_V2_COUNT must be 15 for this test.'
      );
    }

    const customers = generateCustomers();

    console.log(
      `Total customers to create: ${customers.length}`
    );

    // LOGIN ONLY ONCE
    await test.step(
      'Login to MyChits Admin',
      async () => {
        await loginOnce(page);
      }
    );

    // CREATE ALL 15 CUSTOMERS SEQUENTIALLY
    let completed = 0;

    for (const customer of customers) {
      console.log(
        `Creating customer ${completed + 1}/${CUSTOMER_COUNT}: ${customer.name}`
      );

      await test.step(
        `Create ${customer.name}`,
        async () => {
          await createCustomer(page, customer);
        }
      );

      completed++;

      console.log(
        `Completed save flow ${completed}/${CUSTOMER_COUNT}`
      );
    }

    console.log(
      `Completed ${completed}/${CUSTOMER_COUNT} customer save flows`
    );
  }
);
