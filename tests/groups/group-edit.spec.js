
'use strict';

require('dotenv').config();

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const editData = require('../../test-data/groups');

const BASE_URL = (process.env.BASE_URL || '').replace(/\/+$/, '');
const BRANCH_NAME = process.env.BRANCH_NAME;
const ADMIN_ID = process.env.ADMIN_ID;
const OTP = process.env.OTP;

const GROUP_URL = `${BASE_URL}/group-menu`;
const ADD_GROUP_URL = `${BASE_URL}/add-new-group`;

const TEST_ID = process.env.EDIT_GROUP_TEST_ID || 'TC001';

if (!BASE_URL || !BRANCH_NAME || !ADMIN_ID || !OTP) {
  throw new Error('Missing login configuration in .env');
}

if (!Array.isArray(editData)) {
  throw new Error('group-edit-data.js must export an array');
}

const groupData = editData.find(
  item => item.testId === TEST_ID
);

if (!groupData) {
  throw new Error(`Group edit data not found: ${TEST_ID}`);
}

if (!groupData.groupName || !groupData.updates) {
  throw new Error('Group name or updates are missing');
}

const RESULTS_DIR = path.resolve(
  process.cwd(),
  'group-edit-results'
);

fs.mkdirSync(RESULTS_DIR, { recursive: true });

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

test.setTimeout(180000);

// =====================================
// HELPERS
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

async function closePopup(page) {
  const popup = page.locator(
    'div.fixed.inset-0.z-\\[9999\\]'
  ).first();

  if (!(await visible(popup))) return;

  const close = popup.getByRole('button', {
    name: /remind me later|close|cancel|okay/i
  }).first();

  if (await visible(close)) {
    await close.click();
  }
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

  if (await visible(loginHeading)) {
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
      throw new Error(
        `Unsupported OTP input layout: ${count}`
      );
    }

    await page.getByRole('button', {
      name: /verify otp|verify|login|submit/i
    }).last().click();

    await expect(loginHeading).toBeHidden({
      timeout: 45000
    });
  }

  await closePopup(page);

  console.log('[Step 1] Login successful');
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

  await expect(
    page.getByRole('button', {
      name: /add group/i
    })
  ).toBeVisible({
    timeout: 30000
  });

  console.log('[Step 2] Group Management opened');
}

// =====================================
// FIND EXISTING GROUP
// =====================================
async function findGroup(page, groupName, groupCode) {
  console.log('[Step 3] Searching group:', groupName);
  console.log('[Step 3] Searching Group Code:', groupCode);

  if (!groupCode) {
    throw new Error('Group Code is missing from test data.');
  }

  const rows = page.locator('table tbody tr');

  const matchingRows = rows.filter({
    has: page.locator('td').filter({
      hasText: new RegExp(
        `^\\s*${escapeRegex(groupName)}\\s*$`,
        'i'
      )
    })
  }).filter({
    has: page.locator('td').filter({
      hasText: new RegExp(
        `^\\s*${escapeRegex(groupCode)}\\s*$`,
        'i'
      )
    })
  });

  await expect(matchingRows).toHaveCount(1, {
    timeout: 20000
  });

  console.log('[Step 3] Unique group found:', groupCode);

  return matchingRows.first();
}
// =====================================
// OPEN EDIT FORM
// =====================================

async function openGroupEdit(page, group) {
  console.log('[Step 4] Opening Group Edit');

  if (group.groupId) {
    const editUrl = new URL(ADD_GROUP_URL);

    editUrl.searchParams.set('edit', 'true');
    editUrl.searchParams.set('groupId', group.groupId);

    await page.goto(editUrl.href, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });
  } else {
    await openGroupManagement(page);

    const row = await findGroup(
  page,
  group.groupName,
  group.groupCode
);

    const directEdit = row.getByRole('button', {
      name: /^edit$/i
    });

    if (await visible(directEdit)) {
      await directEdit.click();
    } else {
      const cells = row.locator('td');

      const table = row.locator(
        'xpath=ancestor::table[1]'
      );

      const headers = await table.locator('thead th')
        .allTextContents();

      const actionIndex = headers.findIndex(
        text => /^actions?$/i.test(text.trim())
      );

      const actionCell = actionIndex >= 0
        ? cells.nth(actionIndex)
        : cells.last();

      const candidates = [
        actionCell.locator('button'),
        actionCell.locator('[role="button"]'),
        actionCell.locator('[aria-haspopup]'),
        actionCell.locator('a'),
        actionCell.locator('svg')
      ];

      let trigger = null;

      for (const candidate of candidates) {
        if (await visible(candidate)) {
          trigger = candidate.first();
          break;
        }
      }

      if (!trigger) {
        throw new Error(
          'Group Action control not found. HTML: ' +
          (await actionCell.innerHTML()).slice(0, 2000)
        );
      }

      await trigger.click();

      if (!page.url().includes('edit=true')) {
        const editMenuItem = page.getByRole('menuitem', {
          name: /^edit$/i
        });

        const editButton = page.getByRole('button', {
          name: /^edit$/i
        });

        const editText = page.getByText('Edit', {
          exact: true
        });

        if (await visible(editMenuItem)) {
          await editMenuItem.click();
        } else if (await visible(editButton)) {
          await editButton.click();
        } else {
          await expect(editText.first()).toBeVisible();
          await editText.first().click();
        }
      }
    }
  }

  
await closePopup(page);

console.log('[DEBUG] URL after Edit click:', page.url());

const editOpened = await page.waitForURL(
  url =>
    url.pathname.includes('/add-new-group') &&
    url.searchParams.get('edit') === 'true' &&
    Boolean(url.searchParams.get('groupId')),
  { timeout: 10000 }
).then(() => true).catch(() => false);

if (!editOpened) {
  console.log(
    '[DEBUG] Edit navigation did not occur.'
  );

  console.log(
    '[DEBUG] Current URL:',
    page.url()
  );

  const actionButtons = await page.locator(
    'table tbody tr button'
  ).evaluateAll(buttons =>
    buttons.map(button => ({
      text: button.innerText,
      title: button.getAttribute('title'),
      ariaLabel: button.getAttribute('aria-label'),
      outerHTML: button.outerHTML.slice(0, 500)
    }))
  );

  console.log(
    '[DEBUG] Table action buttons:',
    JSON.stringify(actionButtons, null, 2)
  );

  await page.screenshot({
    path: 'group-edit-navigation-debug.png',
    fullPage: true
  });

  throw new Error(
    'Edit action did not navigate to the Group Edit form.'
  );
}

console.log(
  '[Step 4] Group Edit page opened:',
  page.url()
);

}

 // =====================================
 // UPDATE GROUP TYPE DROPDOWN
 // =====================================

async function updateGroupType(page, newType) {
  console.log('[Edit] Updating Group Type:', newType);

  const label = page.getByText(
    /^Group Type\s*\*?\s*$/i
  ).first();

  await expect(label).toBeVisible({
    timeout: 15000
  });

  const container = label.locator('xpath=..');

  // Check native HTML select first.
  const nativeSelect = container.locator('select').first();

  if (await nativeSelect.isVisible().catch(() => false)) {
    const oldValue = await nativeSelect
      .locator('option:checked')
      .textContent();

    console.log(
      '[Edit] Previous Group Type:',
      oldValue?.trim()
    );

    await nativeSelect.selectOption({
      label: newType
    });

    const selectedText = await nativeSelect
      .locator('option:checked')
      .textContent();

    expect(
      normalize(selectedText)
    ).toBe(normalize(newType));

    console.log('[Edit] Group Type updated:', newType);
    return;
  }

  // Handle Ant Design dropdown.
  const dropdown = container.locator('.ant-select').first();

  await expect(dropdown).toBeVisible({
    timeout: 15000
  });

  const selectedValue = dropdown.locator(
    '.ant-select-selection-item'
  ).first();

  if (await selectedValue.isVisible().catch(() => false)) {
    const existing = (
      await selectedValue.innerText()
    ).trim();

    console.log('[Edit] Previous Group Type:', existing);

    if (normalize(existing) === normalize(newType)) {
      console.log(
        '[Edit] Group Type already updated:',
        newType
      );
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

  const options = popup.locator(
    '.ant-select-item-option:not(.ant-select-item-option-disabled)'
  );

  const option = options.filter({
    hasText: new RegExp(
      `^\\s*${escapeRegex(newType)}\\s*$`,
      'i'
    )
  });

  await expect(option).toHaveCount(1, {
    timeout: 15000
  });

  await option.click();

  await expect(selectedValue).toHaveText(
    new RegExp(
      `^\\s*${escapeRegex(newType)}\\s*$`,
      'i'
    )
  );

  console.log('[Edit] Group Type updated:', newType);
}


// =====================================
// UPDATE GROUP FIELDS
// =====================================

async function updateGroupFields(page, updates) {
  console.log('[Step 5] Updating group fields');

  if (
    !updates ||
    typeof updates !== 'object' ||
    Array.isArray(updates)
  ) {
    throw new Error('Invalid group updates data');
  }

  const entries = Object.entries(updates);

  if (entries.length === 0) {
    throw new Error('No fields specified for editing');
  }

  for (const [fieldName, newValue] of entries) {

    if (newValue === undefined || newValue === null) {
      throw new Error(
        `Missing value for ${fieldName}`
      );
    }

    // GROUP TYPE - DROPDOWN
    if (fieldName === 'groupType') {
      await updateGroupType(
        page,
        String(newValue)
      );
      continue;
    }

    // OTHER GROUP FIELDS - INPUTS
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

    await expect(input).toHaveValue(
      String(newValue),
      { timeout: 15000 }
    );

    console.log(
      `[Edit] ${fieldName} updated successfully`
    );
  }

  console.log('[Step 5] All requested fields updated');
}


// =====================================
// SAVE GROUP
// =====================================

async function saveGroup(page) {
  console.log('[Step 6] Saving group changes');

  const saveButton = page.getByRole('button', {
    name: /^(save group|update group)$/i
  });

  await expect(saveButton).toBeVisible({
    timeout: 15000
  });

  await expect(saveButton).toBeEnabled();

  await saveButton.click();

  console.log('[Step 6] Save button clicked');

  const confirmButton = page.getByRole('button', {
    name: /^confirm$/i
  });

  if (await visible(confirmButton)) {
    await expect(confirmButton).toBeEnabled();
    await confirmButton.click();

    await expect(confirmButton).toBeHidden({
      timeout: 30000
    });

    console.log('[Step 6] Confirmation completed');
  }

  // Check for visible validation errors.
  const errors = await page.locator(
    '[role="alert"], ' +
    '.ant-form-item-explain-error, ' +
    '.ant-message-error'
  ).allTextContents();

  const messages = errors
    .map(text => text.trim())
    .filter(Boolean);

  if (messages.length) {
    console.log('[Validation]', messages);
  }
}

// =====================================
// VERIFY UPDATED GROUP
// =====================================

async function verifyGroupUpdate(page, group) {
  console.log('[Step 7] Verifying saved changes');

  // Reopen the same group. A real groupId makes
  // this reliable even if the name was changed.
  if (group.groupId) {
    const editUrl = new URL(ADD_GROUP_URL);

    editUrl.searchParams.set('edit', 'true');
    editUrl.searchParams.set('groupId', group.groupId);

    await page.goto(editUrl.href, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    await closePopup(page);

    await expect(
      page.getByPlaceholder('Enter the Group Name')
    ).toBeVisible({
      timeout: 30000
    });
  } else {
    await openGroupManagement(page);

    const updatedName =
      group.updates.groupName || group.groupName;

    const updatedGroup = {
      ...group,
      groupName: updatedName
    };

    await openGroupEdit(page, updatedGroup);
  }

  for (const [fieldName, expectedValue] of Object.entries(
    group.updates
  )) {
    const placeholder = FIELD_MAP[fieldName];

    const input = page.getByPlaceholder(
      placeholder,
      { exact: true }
    );

    await expect(input).toHaveValue(
      String(expectedValue),
      { timeout: 15000 }
    );

    console.log(
      `[Verified] ${fieldName}: ${expectedValue}`
    );
  }

  console.log('[Step 7] Group update verified');
}

// =====================================
// MAIN TEST
// =====================================

test(`Edit Group ${TEST_ID}`, async ({ page }) => {
  page.setDefaultTimeout(15000);
  page.setDefaultNavigationTimeout(60000);

  try {
    await login(page);

    await openGroupEdit(page, groupData);

    await updateGroupFields(
      page,
      groupData.updates
    );

    await saveGroup(page);

    await verifyGroupUpdate(page, groupData);

    console.log('================================');
    console.log('GROUP EDIT TEST PASSED');
    console.log('Test ID:', TEST_ID);
    console.log('Original Group:', groupData.groupName);
    console.log('Updated Fields:', groupData.updates);
    console.log('================================');

  } catch (error) {
    const screenshot = path.join(
      RESULTS_DIR,
      `${TEST_ID}-edit-error.png`
    );

    await page.screenshot({
      path: screenshot,
      fullPage: true
    }).catch(() => {});

    console.error(
      '[ERROR] Group Edit failed:',
      error.message
    );

    throw error;
  }
}
);
