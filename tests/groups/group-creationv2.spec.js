
const { test, expect } = require('@playwright/test');
require('dotenv').config();

const groups = require('../../test-data/groups');

// =====================================
// CONFIGURATION
// =====================================

const BASE_URL = (
  process.env.BASE_URL || 'http://13.48.10.236/'
).replace(/\/+$/, '');

const BRANCH_NAME =
  process.env.BRANCH_NAME || 'Main Branch (CF-BR-1)';

const ADMIN_ID = process.env.ADMIN_ID;
const OTP = process.env.OTP;

const GROUP_URL = `${BASE_URL}/group-menu`;
const ADD_GROUP_URL = `${BASE_URL}/add-new-group`;

const GROUP_COUNT = Number(
  process.env.GROUP_V2_COUNT || groups.length
);

// =====================================
// COMMON HELPERS
// =====================================

function required(value, name) {
  if (
    value === undefined ||
    value === null ||
    String(value).trim() === ''
  ) {
    throw new Error(`${name} is missing`);
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

async function saveDebug(page, name) {
  await page.screenshot({
    path: `${name}.png`,
    fullPage: true
  }).catch(() => {});
}

// =====================================
// LOGIN ONCE
// =====================================

async function loginOnce(page) {
  console.log('Opening Hariharan server...');

  await page.goto(BASE_URL, {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });

  if (!/dashboard/i.test(page.url())) {
    const branch = page.locator('select').first();

    await expect(branch).toBeVisible({
      timeout: 30000
    });

    await branch.selectOption({
      label: BRANCH_NAME
    });

    console.log('Branch selected:', BRANCH_NAME);

    await page.getByPlaceholder(
      'XXX-XX-XXXX'
    ).fill(required(ADMIN_ID, 'ADMIN_ID'));

    await page.getByRole('button', {
      name: /send otp|request otp|continue|login/i
    }).first().click();

    console.log('OTP requested');

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
          return true;
        }

        return (await otpInputs.count()) > 0;
      },
      { timeout: 30000 }
    ).toBe(true);

    if (!/dashboard/i.test(page.url())) {
      const split = page.locator(
        'input[maxlength="1"]:visible'
      );

      if (await split.count() === otpValue.length) {
        for (let i = 0; i < otpValue.length; i++) {
          await split.nth(i).fill(otpValue[i]);
        }
      } else {
        await otpInputs.first().fill(otpValue);
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

  console.log('Login successful');
}

// =====================================
// OPEN GROUP MANAGEMENT
// =====================================


// ==========================================
// OPEN GROUP MANAGEMENT
// ==========================================

async function openGroupManagement(page) {
  console.log('Opening Group Management page...');

  await page.goto(`${BASE_URL}/group-menu`, {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });

  // Verify Group Management has loaded
  await expect(
    page.getByRole('button', {
      name: /add group/i
    }).first()
  ).toBeVisible({
    timeout: 30000
  });

  console.log('Group Management page opened');
}

// ==========================================
// OPEN ADD GROUP FROM GROUP MANAGEMENT
// ==========================================

async function openAddGroup(page) {
  // STEP 1: Open Group Management first
  await openGroupManagement(page);

  console.log('Looking for Add Group button...');

  const addGroupButton = page.getByRole('button', {
    name: /add group/i
  }).first();

  await expect(addGroupButton).toBeVisible({
    timeout: 30000
  });

  await expect(addGroupButton).toBeEnabled();

  console.log('Add Group button found');

  // STEP 2: Click Add Group
  await addGroupButton.click();

  console.log('Add Group button clicked');
  console.log('URL after click:', page.url());

  const groupNameInput = page.getByPlaceholder(
    'Enter the Group Name',
    { exact: true }
  );

  // STEP 3: Check whether the form opened
  let formOpened = await groupNameInput
    .isVisible()
    .catch(() => false);

  if (!formOpened) {
    console.log(
      'Add Group form not visible after click.'
    );

    // Allow the application a short period to navigate.
    try {
      await groupNameInput.waitFor({
        state: 'visible',
        timeout: 5000
      });

      formOpened = true;
    } catch {
      formOpened = false;
    }
  }

  // STEP 4: Fallback to the confirmed Add Group route
  if (!formOpened) {
    console.log(
      'Opening Add Group using its direct URL...'
    );

    await page.goto(`${BASE_URL}/add-new-group`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });
  }

  // STEP 5: Verify the actual form
  await expect(groupNameInput).toBeVisible({
    timeout: 30000
  });

  console.log('Add Group form opened successfully');
  console.log('Current URL:', page.url());
}

// =====================================
// FILL TEXT / NUMBER INPUT
// =====================================

async function fillInput(page, placeholder, value) {
  const input = page.getByPlaceholder(
    placeholder,
    { exact: true }
  );

  await expect(input).toBeVisible({
    timeout: 15000
  });

  await input.fill(
    required(value, placeholder)
  );
  await page.waitForTimeout(700);
  console.log(`Filled: ${placeholder}`);
}

// =====================================
// SELECT DROPDOWN
// =====================================
async function selectDropdown(page, label, value) {
  const desired = required(value, label);

  console.log(`Selecting ${label}: ${desired}`);

  // Find the field label
  const fieldLabel = page.getByText(
    labelRegex(label)
  ).first();

  await expect(fieldLabel).toBeVisible({
    timeout: 15000
  });

  const container = fieldLabel.locator('xpath=..');

  // =====================================
  // CASE 1: NATIVE HTML SELECT
  // =====================================

  const nativeSelect = container.locator(
    'select'
  ).first();

  if (await nativeSelect.count()) {
    await nativeSelect.selectOption({
      label: desired
    });

    console.log(`${label} selected: ${desired}`);
    return;
  }

  // =====================================
  // CASE 2: ANT DESIGN DROPDOWN
  // =====================================

  const antSelect = container.locator(
    '.ant-select'
  ).first();

  if (await antSelect.count()) {
    await expect(antSelect).toBeVisible({
      timeout: 15000
    });

    // Open dropdown
    await antSelect.locator(
      '.ant-select-selector'
    ).click();

    const searchInput = antSelect.locator(
      'input.ant-select-selection-search-input'
    );

    // Search only if the input is editable
    if (
  await searchInput.count() &&
  await searchInput.isVisible().catch(() => false)
) {
  const readonly = await searchInput.getAttribute('readonly');

  if (readonly === null) {
    await searchInput.fill(
      label === 'Relationship Manager'
        ? desired.split('|')[0].trim()
        : desired
    );
  } else {
    console.log(`${label} is read-only. Selecting from dropdown options.`);
  }
}

    // Ant Design renders dropdown options
    // outside the form container.
    const popup = page.locator(
      '.ant-select-dropdown:visible'
    ).last();

    await expect(popup).toBeVisible({
      timeout: 15000
    });

    const options = popup.locator(
      '.ant-select-item-option'
    );

    // Log actual options for debugging
    // Wait for options to load after opening the dropdown
    await expect.poll(
    async () => await options.count(),
    {
    message: `${label} dropdown options should load`,
    timeout: 20000
    }
   ).toBeGreaterThan(0);

   const availableOptions =
   await options.allTextContents();

    console.log(
      `Available ${label} options:`,
      availableOptions
    );

    // Find exact matching option
    const exactOption = options.filter({
      hasText: new RegExp(
        `^\\s*${escapeRegex(desired)}\\s*$`,
        'i'
      )
    });

    try {
      await expect(exactOption).toHaveCount(1, {
        timeout: 15000
      });

      await exactOption.click();

      // Verify selection
      await expect(
        antSelect.locator(
          '.ant-select-selection-item'
        )
      ).toContainText(desired, {
        timeout: 15000
      });

      console.log(
        `${label} selected successfully: ${desired}`
      );

      return;
    } catch (error) {
      console.log(
        `Failed to select ${label}. Available options:`,
        await options.allTextContents()
      );

      await saveDebug(
        page,
        'group-v2-dropdown-error'
      );

      throw error;
    }
  }

  // =====================================
  // CASE 3: ROLE-BASED DROPDOWN
  // =====================================

  const combobox = container.getByRole(
    'combobox'
  ).first();

  if (await combobox.count()) {
    await combobox.click();

    const option = page.getByRole('option', {
      name: desired,
      exact: true
    });

    await expect(option).toBeVisible({
      timeout: 15000
    });

    await option.click();

    console.log(`${label} selected: ${desired}`);
    return;
  }

  throw new Error(
    `Unable to identify dropdown for ${label}`
  );
}
// =====================================
// OPTIONAL GROUP CATEGORY
// =====================================
async function selectGroupCategoryIfPresent(
  page,
  group
) {
  const category = page.getByText(
    labelRegex('Group Category')
  ).first();

  if (await category.isVisible().catch(() => false)) {
    console.log(
      'Group Category exists on this server'
    );

    await selectDropdown(
      page,
      'Group Category',
      required(
        group.groupCategory,
        'group.groupCategory'
      )
    );
  } else {
    console.log(
      'Group Category not present. Skipping.'
    );
  }
}

// =====================================
// DATE HELPERS
// =====================================

function toIsoDate(value) {
  if (value instanceof Date) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1)
      .padStart(2, '0');
    const d = String(value.getDate())
      .padStart(2, '0');

    return `${y}-${m}-${d}`;
  }

  const text = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text;
  }

  const match = text.match(
    /^(\d{2})-(\d{2})-(\d{4})$/
  );

  if (match) {
    return `${match[3]}-${match[2]}-${match[1]}`;
  }

  throw new Error(
    `Unsupported date format: ${text}. ` +
    'Use YYYY-MM-DD or DD-MM-YYYY.'
  );
}

async function fillDate(page, label, value) {
  const fieldLabel = page.getByText(
    labelRegex(label)
  ).first();

  await expect(fieldLabel).toBeVisible({
    timeout: 15000
  });

  const input = fieldLabel.locator('xpath=..')
    .locator('input')
    .first();

  await expect(input).toBeVisible();

  const isoDate = toIsoDate(value);

  const type = await input.getAttribute('type');

  if (type === 'date') {
    await input.fill(isoDate);
  } else {
    const [year, month, day] = isoDate.split('-');
    await input.fill(`${day}-${month}-${year}`);
  }

  console.log(`${label} filled: ${isoDate}`);
}

// =====================================
// GROUP CREATION
// =====================================

async function createGroup(page, group) {
  console.log(`Creating group: ${group.groupName}`);

  await openAddGroup(page);

  // GROUP NAME
  await fillInput(
    page,
    'Enter the Group Name',
    group.groupName
  );

  // GROUP CATEGORY (DEVELOPMENT ONLY)
  await selectGroupCategoryIfPresent(page, group);

  // GROUP TYPE
  await selectDropdown(
    page,
    'Group Type',
    group.groupType
  );

  // RELATIONSHIP MANAGER
  await selectDropdown(
    page,
    'Relationship Manager',
    group.relationshipManager
  );

  // GROUP DETAILS
  const fields = [
    ['Enter App Display Vacancy Seat', group.vacancySeat],
    ['Enter Group Value', group.groupValue],
    ['Enter Group Installment', group.groupInstallment],
    ['Enter Group Members', group.groupMembers],
    ['Enter Daily Installment', group.dailyInstallment],
    ['Enter Weekly Installment', group.weeklyInstallment],
    ['Enter Monthly Installment', group.monthlyInstallment],
    ['Enter Group Duration', group.groupDuration],
    ['Enter Registration Fee', group.registrationFee],
    ['Enter Minimum Bid %', group.minimumBid],
    ['Enter Maximum Bid %', group.maximumBid]
  ];

  for (const [placeholder, value] of fields) {
    await fillInput(page, placeholder, value);
  }

  // START DATE TYPE
  const dateType = required(
    group.startDateType,
    'startDateType'
  );

  await page.getByRole('radio', {
    name: dateType,
    exact: true
  }).check();

  console.log(`Start Date Type: ${dateType}`);

  // START DATE
  await fillDate(
    page,
    'Start Date',
    group.startDate
  );

  // END DATE IF SUPPLIED
  if (group.endDate) {
    await fillDate(
      page,
      'End Date',
      group.endDate
    );
  }

  // COMMISSIONS
  const commissions = [
    ['Agent Commission %', group.agentCommission],
    ['Company Commission %', group.companyCommission],
    ['Employee Incentives %', group.employeeIncentives]
  ];

  for (const [label, value] of commissions) {
    const fieldLabel = page.getByText(
      labelRegex(label)
    ).first();

    await expect(fieldLabel).toBeVisible();

    const input = fieldLabel.locator('xpath=..')
      .locator('input')
      .first();

    await input.fill(required(value, label));
  }

  // AUCTION CONFIGURATION
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

  console.log('All group fields entered');

  
// =====================================
// SAVE GROUP AND VERIFY RESULT
// =====================================
const saveButton = page.getByRole('button', {
  name: 'Save Group',
  exact: true
});

await expect(saveButton).toBeVisible();
await expect(saveButton).toBeEnabled();

console.log('Clicking Save Group...');

await saveButton.click();

console.log('Save Group clicked');

// Handle confirmation dialog if one appears.
const confirmDialog = page.getByRole('dialog')
  .filter({
    hasText: /confirm|save group|are you sure/i
  })
  .last();

if (
  await confirmDialog.isVisible({
    timeout: 3000
  }).catch(() => false)
) {
  const confirmButton = confirmDialog.getByRole(
    'button',
    {
      name: /confirm|yes|proceed/i
    }
  ).first();

  if (
    await confirmButton.isVisible().catch(() => false)
  ) {
    await confirmButton.click();
    console.log('Save confirmation accepted');
  }
}

// Wait for navigation or form closure.
const groupNameInput = page.getByPlaceholder(
  'Enter the Group Name',
  { exact: true }
);

let saveCompleted = false;

try {
  await expect.poll(
    async () => {
      if (/\/group-menu(?:[/?#]|$)/.test(page.url())) {
        return true;
      }

      return !(await groupNameInput
        .isVisible()
        .catch(() => false));
    },
    { timeout: 15000 }
  ).toBe(true);

  saveCompleted = true;
} catch {
  console.log('Form remained open after Save Group.');
}

// Capture useful information before navigating away.
if (!saveCompleted) {
  const messages = await page.locator([
    '.ant-form-item-explain-error',
    '.ant-message-error',
    '.ant-notification-notice',
    '.ant-alert',
    '[role="alert"]'
  ].join(', ')).allTextContents();

  console.log('Current URL:', page.url());
  console.log('Validation/notification messages:', messages);

  await saveDebug(page, 'group-v2-save-error');

  throw new Error(
    `Group save was not confirmed for ${group.groupName}. ` +
    `Messages: ${JSON.stringify(messages)}`
  );
}

console.log(
  `Group save UI flow completed: ${group.groupName}`
);

// Return to Group Management after save.
await openGroupManagement(page);
}

// =====================================
// MAIN TEST
// =====================================

test(
  'Group Creation V2 - Create Groups Sequentially',
  async ({ page }) => {
    test.setTimeout(20 * 60 * 1000);

    page.setDefaultTimeout(15000);
    // Pause briefly after each Playwright action
    await page.context().tracing.start({
    screenshots: true,
    snapshots: true
});
    page.setDefaultNavigationTimeout(60000);

    if (
      !Number.isInteger(GROUP_COUNT) ||
      GROUP_COUNT < 1 ||
      GROUP_COUNT > groups.length
    ) {
      throw new Error(
        `GROUP_V2_COUNT must be between 1 and ${groups.length}`
      );
    }

    await test.step(
      'Login to MyChits Admin',
      async () => {
        await loginOnce(page);
      }
    );

    for (let i = 0; i < GROUP_COUNT; i++) {
      const group = groups[i];

      try {
        await test.step(
          `Create group ${i + 1}: ${group.groupName}`,
          async () => {
            await createGroup(page, group);
          }
        );

        console.log(
          `Completed ${i + 1}/${GROUP_COUNT} groups`
        );
      } catch (error) {
        console.error(
          `Group ${i + 1} failed:`,
          error.message
        );

        await saveDebug(
          page,
          `group-v2-error-${i + 1}`
        );

        throw error;
      }
    }

    console.log(
      `Completed all ${GROUP_COUNT} group save flows`
    );
  }
);
