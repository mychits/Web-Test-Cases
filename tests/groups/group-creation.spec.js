
'use strict';

require('dotenv').config();

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

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

if (!Array.isArray(groups)) {
  throw new Error('test-data/groups.js must export an array.');
}

const ROOT_URL = BASE_URL.endsWith('/')
  ? BASE_URL
  : `${BASE_URL}/`;

const GROUP_URL = new URL('group-menu', ROOT_URL).href;

const RESULTS_DIR = path.resolve(
  process.cwd(),
  'group-edit-results'
);

fs.mkdirSync(RESULTS_DIR, { recursive: true });

const TEST_ID = process.env.EDIT_GROUP_TEST_ID || 'TC001';

const groupData = groups.find(
  group => group.testId === TEST_ID
);

if (!groupData) {
  throw new Error(`Group test data not found: ${TEST_ID}`);
}

if (!groupData.groupCode) {
  throw new Error(
    `Add groupCode to ${TEST_ID} in test-data/groups.js.`
  );
}

if (!groupData.updates || !Object.keys(groupData.updates).length) {
  throw new Error(
    `Add updates to ${TEST_ID} in test-data/groups.js.`
  );
}

const FIELD_MAP = {
  groupName: 'Enter the Group Name',
  vacancySeat: 'Enter App Display Vacancy Seat',
  groupValue: 'Enter Group Value',
  groupInstallment: 'Enter Group Installment',
  groupMembers: 'Enter Group Members',
  dailyInstallment: 'Enter Daily Installment',
  weeklyInstallment: 'Enter Weekly Installment',
  monthlyInstallment: 'Enter Monthly Installment',
  groupDuration: 'Enter Group Duration',
  registrationFee: 'Enter Registration Fee',
  minimumBid: 'Enter Minimum Bid %',
  maximumBid: 'Enter Maximum Bid %',
  agentCommission: 'Enter Agent Commission %',
  companyCommission: 'Enter Company Commission %',
  employeeIncentives: 'Enter Employee Incentives %'
};

test.setTimeout(600000);

// =====================================
// COMMON HELPERS
// =====================================

async function visible(locator) {
  return locator.first().isVisible().catch(() => false);
}

function normalize(value) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function escapeRegex(value) {
  return String(value)
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function exactPattern(value) {
  return new RegExp(
    `^\\s*${escapeRegex(value)}\\s*$`,
    'i'
  );
}

async function screenshot(page, name) {
  await page.screenshot({
    path: path.join(RESULTS_DIR, name),
    fullPage: true
  }).catch(() => {});
}

// =====================================
// LOGIN
// =====================================

async function login(page) {
  console.log('[Step 1] Opening Admin application');

  await page.goto(BASE_URL, {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });

  const loginHeading = page.getByRole('heading', {
    name: /admin login/i
  });

  if (!(await visible(loginHeading))) {
    console.log('[Step 1] Checking existing session');
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
    'input[autocomplete="one-time-code"]:visible, ' +
    'input[name*="otp" i]:visible, ' +
    'input[placeholder*="otp" i]:visible, ' +
    'input[inputmode="numeric"]:visible, ' +
    'input[maxlength="6"]:visible'
  );

  await expect(otpInputs.first()).toBeVisible({
    timeout: 30000
  });

  const count = await otpInputs.count();

  if (count === 1) {
    await otpInputs.first().fill(String(OTP));
  } else if (count === 6 && String(OTP).length === 6) {
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
    timeout: 45000
  });

  console.log('[Step 1] Login successful');
}

// =====================================
// CLOSE POPUP
// =====================================

async function closePopup(page) {
  const popup = page.locator(
    'div.fixed.inset-0.z-\\[9999\\]'
  ).first();

  if (!(await visible(popup))) return;

  const closeButton = popup.getByRole('button', {
    name: /remind me later|close|cancel|okay|^ok$/i
  }).first();

  if (await visible(closeButton)) {
    await closeButton.click();

    await expect(popup).toBeHidden({
      timeout: 10000
    });
  }
}

// =====================================
// OPEN GROUP MANAGEMENT
// =====================================

async function openGroupManagement(page) {
  console.log('[Step 2] Opening Group Management');

  await page.goto(GROUP_URL, {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });

  await closePopup(page);

  await expect(page.locator('table tbody tr').first())
    .toBeVisible({ timeout: 30000 });

  console.log('[Step 2] Group Management opened');
}

// =====================================
// FIND GROUP BY NAME + GROUP CODE
// =====================================

async function findGroup(page, groupName, groupCode) {
  console.log('[Step 3] Searching group:', groupName);
  console.log('[Step 3] Group Code:', groupCode);

  if (!groupCode) {
    throw new Error('Group Code is required.');
  }

  const rows = page.locator('table tbody tr');

  const exactGroupName = exactPattern(groupName);
  const exactGroupCode = exactPattern(groupCode);

  const matchingRows = rows.filter({
    has: page.locator('td').filter({
      hasText: exactGroupName
    })
  }).filter({
    has: page.locator('td').filter({
      hasText: exactGroupCode
    })
  });

  await expect.poll(
    async () => matchingRows.count(),
    { timeout: 20000 }
  ).toBeGreaterThan(0);

  const count = await matchingRows.count();

  if (count !== 1) {
    throw new Error(
      `Expected one group with code ${groupCode}, found ${count}.`
    );
  }

  console.log('[Step 3] Unique group found:', groupCode);

  return matchingRows.first();
}

// =====================================
// OPEN GROUP EDIT
// =====================================

async function openGroupEdit(page, group) {
  console.log('[Step 4] Opening Group Edit');

  await openGroupManagement(page);

  const row = await findGroup(
    page,
    group.groupName,
    group.groupCode
  );

  const rowText = await row.innerText();

  console.log(
    '[Step 4] Selected row:',
    rowText.replace(/\s+/g, ' ').trim()
  );

  // Try a visible Edit button first.
  const editButton = row.getByRole('button', {
    name: /^edit$/i
  }).first();

  const editLink = row.getByRole('link', {
    name: /^edit$/i
  }).first();

  if (await visible(editButton)) {
    await editButton.click();
  } else if (await visible(editLink)) {
    await editLink.click();
  } else {
    // Some tables put Edit inside an Actions menu.
    const actionButton = row.getByRole('button', {
      name: /action|more|menu/i
    }).first();

    if (!(await visible(actionButton))) {
      throw new Error(
        `Could not locate Edit action for ${group.groupCode}. ` +
        'Inspect the row action control in the browser.'
      );
    }

    await actionButton.click();

    const menuEdit = page.getByRole('menuitem', {
      name: /^edit$/i
    }).first();

    const fallbackEdit = page.getByText(/^edit$/i).last();

    if (await visible(menuEdit)) {
      await menuEdit.click();
    } else {
      await expect(fallbackEdit).toBeVisible({
        timeout: 10000
      });
      await fallbackEdit.click();
    }
  }

  await expect(page).toHaveURL(/add-new-group/, {
    timeout: 30000
  });

  const url = new URL(page.url());

  if (url.searchParams.get('edit') !== 'true') {
    throw new Error(
      `Edit mode was not opened. Current URL: ${page.url()}`
    );
  }

  const groupId = url.searchParams.get('groupId');

  if (!groupId) {
    throw new Error('Group Edit URL has no groupId.');
  }

  await expect(
    page.getByPlaceholder('Enter the Group Name', {
      exact: true
    })
  ).toHaveValue(group.groupName, {
    timeout: 30000
  });

  console.log('[Step 4] Group Edit opened');
  console.log('[Step 4] Group ID:', groupId);

  return groupId;
}

// =====================================
// LOCATE DROPDOWN
// =====================================

async function getDropdownContainer(page, label) {
  const fieldLabel = page.getByText(
    exactPattern(label)
  ).first();

  await expect(fieldLabel).toBeVisible({
    timeout: 15000
  });

  const parent = fieldLabel.locator('xpath=..');

  if (await parent.locator('select, .ant-select').count()) {
    return parent;
  }

  const container = fieldLabel.locator(
    'xpath=ancestor::div[' +
    './/select or ' +
    './/*[contains(concat(" ",normalize-space(@class)," "),' +
    '" ant-select ")]' +
    '][1]'
  );

  await expect(container).toBeVisible({
    timeout: 15000
  });

  return container;
}

// =====================================
// UPDATE GROUP TYPE
// =====================================

async function updateGroupType(page, newType) {
  console.log('[Edit] Updating Group Type:', newType);

  const container = await getDropdownContainer(
    page,
    'Group Type'
  );

  const nativeSelect = container.locator('select').first();

  if (await visible(nativeSelect)) {
    await nativeSelect.selectOption({
      label: newType
    });

    const selectedText = await nativeSelect
      .locator('option:checked')
      .textContent();

    expect(normalize(selectedText)).toBe(
      normalize(newType)
    );

    console.log('[Edit] Group Type selected:', newType);
    return;
  }

  const dropdown = container.locator('.ant-select').first();

  await expect(dropdown).toBeVisible({
    timeout: 15000
  });

  const selectedValue = dropdown.locator(
    '.ant-select-selection-item'
  ).first();

  if (await visible(selectedValue)) {
    const currentValue = await selectedValue.innerText();

    if (normalize(currentValue) === normalize(newType)) {
      console.log('[Edit] Group Type already:', newType);
      return;
    }
  }

  await dropdown.locator(
    '.ant-select-selector'
  ).first().click();

  const popup = page.locator(
    '.ant-select-dropdown:visible'
  ).last();

  await expect(popup).toBeVisible({
    timeout: 15000
  });

  const option = popup.locator(
    '.ant-select-item-option:not(.ant-select-item-option-disabled)'
  ).filter({
    hasText: exactPattern(newType)
  });

  await expect(option).toHaveCount(1, {
    timeout: 15000
  });

  await option.click();

  await expect(selectedValue).toHaveText(
    exactPattern(newType)
  );

  console.log('[Edit] Group Type selected:', newType);
}

// =====================================
// UPDATE INPUT FIELDS
// =====================================

async function updateGroupFields(page, updates) {
  console.log('[Step 5] Updating group fields');

  for (const [fieldName, newValue] of Object.entries(updates)) {
    if (newValue === undefined || newValue === null) {
      throw new Error(`Missing value for ${fieldName}`);
    }

    if (fieldName === 'groupType') {
      await updateGroupType(page, String(newValue));
      continue;
    }

    const placeholder = FIELD_MAP[fieldName];

    if (!placeholder) {
      throw new Error(
        `Unsupported edit field: ${fieldName}`
      );
    }

    const input = page.getByPlaceholder(
      placeholder,
      { exact: true }
    );

    await expect(input).toBeVisible({
      timeout: 15000
    });

    const oldValue = await input.inputValue();

    console.log(
      `[Edit] ${fieldName}: ${oldValue} -> ${newValue}`
    );

    if (normalize(oldValue) !== normalize(newValue)) {
      await input.fill(String(newValue));
    }

    await expect(input).toHaveValue(String(newValue));
  }

  console.log('[Step 5] Requested fields updated');
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

  const cleaned = messages
    .map(message => message.trim())
    .filter(Boolean);

  console.log(
    '[Validation] Messages:',
    JSON.stringify(cleaned)
  );

  return cleaned;
}

// =====================================
// SAVE GROUP
// =====================================

async function saveGroup(page) {
  console.log('[Step 6] Saving group');

  const saveButton = page.getByRole('button', {
    name: /^(save group|update group|save changes|update)$/i
  }).first();

  await expect(saveButton).toBeVisible({
    timeout: 15000
  });

  await expect(saveButton).toBeEnabled();

  await saveButton.click();

  console.log('[Step 6] Save button clicked');

  const confirmButton = page.getByRole('button', {
    name: /^confirm$/i
  }).first();

  // The application may show a confirmation dialog.
  const confirmationAppeared = await confirmButton
    .waitFor({
      state: 'visible',
      timeout: 10000
    })
    .then(() => true)
    .catch(() => false);

  if (confirmationAppeared) {
    await confirmButton.click();

    await expect(confirmButton).toBeHidden({
      timeout: 30000
    });

    console.log('[Step 6] Confirmation completed');
  } else {
    console.log(
      '[Step 6] No confirmation dialog appeared'
    );
  }

  await printValidationMessages(page);

  console.log(
    '[Step 6] Save action completed; verifying persistence next'
  );
}

// =====================================
// VERIFY UPDATED GROUP
// =====================================

async function verifyGroupUpdate(page, group, groupId) {
  console.log('[Step 7] Reopening group for verification');

  const editUrl = new URL('add-new-group', ROOT_URL);

  editUrl.searchParams.set('edit', 'true');
  editUrl.searchParams.set('groupId', groupId);

  await page.goto(editUrl.href, {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });

  await closePopup(page);

  await expect(
    page.getByPlaceholder('Enter the Group Name', {
      exact: true
    })
  ).toHaveValue(group.groupName, {
    timeout: 30000
  });

  for (const [fieldName, expectedValue] of Object.entries(
    group.updates
  )) {
    if (fieldName === 'groupType') {
      const container = await getDropdownContainer(
        page,
        'Group Type'
      );

      const nativeSelect = container.locator('select').first();

      if (await visible(nativeSelect)) {
        await expect.poll(async () => {
          return normalize(
            await nativeSelect
              .locator('option:checked')
              .textContent()
          );
        }).toBe(normalize(expectedValue));
      } else {
        const selected = container.locator(
          '.ant-select-selection-item'
        ).first();

        await expect(selected).toHaveText(
          exactPattern(expectedValue),
          { timeout: 20000 }
        );
      }

      console.log(
        `[Verified] groupType: ${expectedValue}`
      );

      continue;
    }

    const placeholder = FIELD_MAP[fieldName];

    if (!placeholder) {
      throw new Error(
        `Unsupported verification field: ${fieldName}`
      );
    }

    const input = page.getByPlaceholder(
      placeholder,
      { exact: true }
    );

    await expect(input).toHaveValue(
      String(expectedValue),
      { timeout: 20000 }
    );

    console.log(
      `[Verified] ${fieldName}: ${expectedValue}`
    );
  }

  console.log(
    '[SUCCESS] Group updates persisted:',
    group.groupCode
  );
}

// =====================================
// MAIN TEST
// =====================================

test(`Edit Group ${TEST_ID}`, async ({ page }) => {
  page.setDefaultTimeout(30000);
  page.setDefaultNavigationTimeout(60000);

  try {
    await login(page);

    await closePopup(page);

    const groupId = await openGroupEdit(
      page,
      groupData
    );

    await updateGroupFields(
      page,
      groupData.updates
    );

    await screenshot(
      page,
      `${TEST_ID}-before-save.png`
    );

    await saveGroup(page);

    await verifyGroupUpdate(
      page,
      groupData,
      groupId
    );

    await screenshot(
      page,
      `${TEST_ID}-verified.png`
    );

    console.log(
      `[SUCCESS] ${TEST_ID} completed successfully`
    );

  } catch (error) {
    console.error(
      '[ERROR] Group Edit failed:',
      error.message
    );

    await screenshot(
      page,
      `${TEST_ID}-error.png`
    );

    throw error;
  }
});
