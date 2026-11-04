
require('dotenv').config();

const { test, expect } = require('@playwright/test');
const groups = require('../../test-data/groups');

// =====================================
// ENVIRONMENT CONFIGURATION
// =====================================

const BASE_URL = process.env.BASE_URL;
const ADMIN_ID = process.env.ADMIN_ID;
const OTP = process.env.OTP;
const BRANCH_NAME = process.env.BRANCH_NAME;

if (!BASE_URL || !ADMIN_ID || !OTP || !BRANCH_NAME) {
  throw new Error('Missing environment variables. Check .env file.');
}

const GROUP_URL = new URL('group-menu', BASE_URL).href;
const ADD_GROUP_URL = new URL('add-new-group', BASE_URL).href;

test.setTimeout(600000);

// =====================================
// LOGIN
// =====================================

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

  await page.locator('select').first().selectOption({
    label: BRANCH_NAME
  });

  await page.getByPlaceholder('XXX-XX-XXXX').fill(ADMIN_ID);

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
    await otpInputs.first().fill(OTP);
  } else if (count === 6) {
    for (let i = 0; i < 6; i++) {
      await otpInputs.nth(i).fill(OTP[i]);
    }
  } else {
    throw new Error(`Unexpected OTP input count: ${count}`);
  }

  await page.getByRole('button', {
    name: /verify otp|verify|login|submit/i
  }).last().click();

  await expect(loginHeading).toBeHidden({
    timeout: 30000
  });

  console.log('Login successful');
}

// =====================================
// CLOSE POPUP
// =====================================

async function closePopup(page) {
  const popup = page.locator(
    'div.fixed.inset-0.z-\\[9999\\]'
  ).first();

  if (!(await popup.isVisible().catch(() => false))) {
    return;
  }

  const remindLater = popup.getByRole('button', {
    name: /remind me later/i
  });

  if (await remindLater.isVisible().catch(() => false)) {
    await remindLater.click();
    await expect(popup).toBeHidden();
    console.log('Popup closed');
  }
}

// =====================================
// FILL INPUT
// =====================================

async function fillInput(page, placeholder, value) {
  if (value === undefined || value === null) {
    throw new Error(`Missing value for ${placeholder}`);
  }

  const input = page.getByPlaceholder(placeholder, {
    exact: true
  });

  await expect(input).toBeVisible({
    timeout: 15000
  });

  await input.fill(String(value));

  console.log(`Filled: ${placeholder}`);
}

// =====================================
// SELECT DROPDOWN
// =====================================

async function selectDropdown(page, label, value) {
  if (!value) {
    throw new Error(`Missing value for ${label}`);
  }

  console.log(`Selecting ${label}: ${value}`);

  const escapedLabel = label.replace(
    /[.*+?^${}()|[\]\\]/g,
    '\\$&'
  );

  const labelPattern = new RegExp(
    `^\\s*${escapedLabel}\\s*\\*?\\s*$`,
    'i'
  );

  const fieldLabel = page.getByText(labelPattern).first();

  await expect(fieldLabel).toBeVisible({
    timeout: 15000
  });

  const container = fieldLabel.locator('xpath=..');

  // Native dropdown
  const nativeSelect = container.locator('select');

  if (await nativeSelect.count() === 1) {
    await nativeSelect.selectOption({
      label: value
    });

    console.log(`${label} selected: ${value}`);
    return;
  }

  // Ant Design dropdown
  const antSelect = container.locator('.ant-select');

  if (await antSelect.count() === 1) {
    const selectedValue = antSelect.locator(
      '.ant-select-selection-item'
    );

    if (await selectedValue.isVisible().catch(() => false)) {
      const currentValue = (
        await selectedValue.innerText()
      ).trim();

      if (currentValue.toLowerCase() === value.toLowerCase()) {
        console.log(`${label} already selected: ${value}`);
        return;
      }
    }

    await antSelect.click();

    // Search Relationship Manager
    if (label === 'Relationship Manager') {
      const searchInput = antSelect.locator(
        'input[role="combobox"]'
      );

      await expect(searchInput).toBeVisible({
        timeout: 15000
      });

      await searchInput.fill(value);
    }

    const option = page.locator(
      '.ant-select-item-option:visible'
    ).filter({
      hasText: value
    }).first();

    await expect(option).toBeVisible({
      timeout: 15000
    });

    await option.click();

    console.log(`${label} selected: ${value}`);
    return;
  }

  // Other custom dropdowns
  const trigger = container.locator(
    '[role="combobox"], button, [aria-haspopup="listbox"]'
  ).first();

  await expect(trigger).toBeVisible({
    timeout: 15000
  });

  await trigger.click();

  const option = page.getByText(value, {
    exact: true
  }).last();

  await expect(option).toBeVisible({
    timeout: 15000
  });

  await option.click();

  console.log(`${label} selected: ${value}`);
}

// =====================================
// FILL DATE FIELDS
// =====================================

async function fillDates(page, group) {
  const dateFields = [
    { label: 'Start Date', value: group.startDate },
    { label: 'End Date', value: group.endDate }
  ];

  for (const field of dateFields) {
    if (!field.value) {
      if (field.label === 'End Date') continue;
      throw new Error('Start Date is required');
    }

    const fieldLabel = page.getByText(
      new RegExp(`^${field.label}\\s*\\*?\\s*$`, 'i')
    ).first();

    await expect(fieldLabel).toBeVisible({
      timeout: 15000
    });

    const input = fieldLabel
      .locator('xpath=..')
      .locator('input')
      .first();

    await expect(input).toBeVisible({
      timeout: 15000
    });

    const inputType = await input.getAttribute('type');

    if (inputType === 'date') {
      await input.fill(field.value);
    } else {
      const [year, month, day] = field.value.split('-');

      await input.fill(`${day}-${month}-${year}`);
      await input.press('Tab');
    }

    console.log(`${field.label} entered: ${field.value}`);
  }
}

// =====================================
// OPEN ADD GROUP FORM
// =====================================

async function openAddGroup(page) {
  await page.goto(GROUP_URL, {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });

  await closePopup(page);

  console.log('Group Management page opened');

  const addGroupButton = page.getByRole('button', {
    name: /add group/i
  });

  await expect(addGroupButton).toBeVisible({
    timeout: 30000
  });

  console.log('Add Group button found');

  await page.goto(ADD_GROUP_URL, {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });

  await closePopup(page);

  await expect(page).toHaveURL(/add-new-group/, {
    timeout: 30000
  });

  await expect(
    page.getByPlaceholder('Enter the Group Name')
  ).toBeVisible({
    timeout: 30000
  });

  console.log('Add Group form opened successfully');
}

// =====================================
// VALIDATION MESSAGES
// =====================================

async function printValidationMessages(page) {
  const messages = await page.locator(
    '[role="alert"], ' +
    '.ant-form-item-explain-error, ' +
    '.ant-message-error, ' +
    '.ant-notification-notice, ' +
    '.text-red-500, ' +
    '.text-red-600'
  ).allTextContents();

  const cleanedMessages = messages
    .map(message => message.trim())
    .filter(Boolean);

  console.log('Validation/error messages:', cleanedMessages);

  return cleanedMessages;
}

// =====================================
// SAVE GROUP AND CONFIRM
// =====================================

async function saveAndConfirmGroup(page, group) {
  const saveButton = page.getByRole('button', {
    name: /^save group$/i
  });

  await expect(saveButton).toBeVisible({
    timeout: 15000
  });

  await expect(saveButton).toBeEnabled();

  await saveButton.click();

  console.log('Save Group button clicked');

  const confirmButton = page.getByRole('button', {
    name: /^confirm$/i
  });

  try {
    await expect(confirmButton).toBeVisible({
      timeout: 15000
    });
  } catch (error) {
    console.log('Confirmation popup did not appear');

    await printValidationMessages(page);

    await page.screenshot({
      path: 'group-confirmation-not-opened.png',
      fullPage: true
    });

    throw new Error(
      'Save Group did not open the confirmation popup. ' +
      'Check group-confirmation-not-opened.png.'
    );
  }

  console.log('Confirmation popup opened');

  await expect(confirmButton).toBeEnabled();

  await confirmButton.click();

  console.log('Confirm button clicked');

  await expect(confirmButton).toBeHidden({
    timeout: 30000
  });

  console.log('Confirmation popup closed');

  if (/add-new-group/.test(page.url())) {
    console.log(
      'Still on Add Group page. Group save is not yet verified.'
    );
  } else {
    console.log('Navigated away from Add Group page');
  }

  console.log(
    `Group confirmation completed: ${group.groupName}`
  );
}

// =====================================
// CREATE GROUP
// =====================================

async function createGroup(page, group) {
  console.log(`Creating group: ${group.groupName}`);

  await openAddGroup(page);

  // =====================================
  // GROUP NAME
  // =====================================

  await fillInput(
    page,
    'Enter the Group Name',
    group.groupName
  );

  // =====================================
  // GROUP CATEGORY - NEW
  // =====================================

  await selectDropdown(
    page,
    'Group Category',
    group.groupCategory
  );

  console.log('Group Category selected successfully');

  // =====================================
  // GROUP TYPE
  // =====================================

  await selectDropdown(
    page,
    'Group Type',
    group.groupType
  );

  // =====================================
  // RELATIONSHIP MANAGER
  // =====================================

  await selectDropdown(
    page,
    'Relationship Manager',
    group.relationshipManager
  );

  // =====================================
  // BASIC GROUP DETAILS
  // =====================================

  await fillInput(
    page,
    'Enter App Display Vacancy Seat',
    group.vacancySeat
  );

  await fillInput(
    page,
    'Enter Group Value',
    group.groupValue
  );

  await fillInput(
    page,
    'Enter Group Installment',
    group.groupInstallment
  );

  await fillInput(
    page,
    'Enter Group Members',
    group.groupMembers
  );

  // =====================================
  // INSTALLMENT DETAILS
  // =====================================

  await fillInput(
    page,
    'Enter Daily Installment',
    group.dailyInstallment
  );

  await fillInput(
    page,
    'Enter Weekly Installment',
    group.weeklyInstallment
  );

  await fillInput(
    page,
    'Enter Monthly Installment',
    group.monthlyInstallment
  );

  await fillInput(
    page,
    'Enter Group Duration',
    group.groupDuration
  );

  await fillInput(
    page,
    'Enter Registration Fee',
    group.registrationFee
  );

  console.log('Basic group details completed');

  // =====================================
  // START DATE TYPE
  // =====================================

  await page.getByRole('radio', {
    name: group.startDateType,
    exact: true
  }).check();

  // =====================================
  // START DATE AND END DATE
  // =====================================

  await fillDates(page, group);

  // =====================================
  // BID CONFIGURATION
  // =====================================

  await fillInput(
    page,
    'Enter Minimum Bid %',
    group.minimumBid
  );

  await fillInput(
    page,
    'Enter Maximum Bid %',
    group.maximumBid
  );

  // =====================================
  // COMMISSION DETAILS
  // =====================================

  await fillInput(
    page,
    'Enter Agent Commission %',
    group.agentCommission
  );

  await fillInput(
    page,
    'Enter Company Commission %',
    group.companyCommission
  );

  await fillInput(
    page,
    'Enter Employee Incentives %',
    group.employeeIncentives
  );

  console.log('Bid and commission details completed');

  // =====================================
  // AUCTION CONFIGURATION
  // =====================================

  await selectDropdown(
    page,
    'Auction Processing Type',
    group.auctionProcessingType
  );

  await selectDropdown(
    page,
    'Auction Mode',
    group.auctionMode
  );

  console.log('Auction configuration completed');

  // =====================================
  // SAVE AND CONFIRM
  // =====================================

  await saveAndConfirmGroup(page, group);

  console.log(
    `Group creation flow completed: ${group.groupName}`
  );
}

// =====================================
// MAIN TEST
// =====================================

test('Login once and create groups', async ({ page }) => {
  page.setDefaultTimeout(30000);
  page.setDefaultNavigationTimeout(60000);

  try {
    await test.step(
      'Login to MyChits Admin',
      async () => {
        await login(page);
      }
    );

    await closePopup(page);

    for (let i = 0; i < groups.length; i++) {
      const group = groups[i];

      await test.step(
        `Create group ${i + 1}: ${group.groupName}`,
        async () => {
          await createGroup(page, group);
        }
      );
    }

    console.log('All group confirmation flows completed');

  } catch (error) {
    console.error(
      'Group creation failed:',
      error.message
    );

    await page.screenshot({
      path: 'group-creation-error.png',
      fullPage: true
    }).catch(() => {});

    throw error;
  }
});
