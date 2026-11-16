
'use strict';

const { test, expect } = require('@playwright/test');
require('dotenv').config();

// ======================================
// CONFIGURATION
// ======================================

const BASE_URL = (
  process.env.BASE_URL ||
  'http://purple-development-mychits-admin.s3-website.eu-north-1.amazonaws.com'
).replace(/\/+$/, '');

const AREA_NAME =
  process.env.COLLECTION_AREA_NAME ||
  `Automation Area ${Date.now()}`;

const PINCODE =
  process.env.COLLECTION_AREA_PINCODE || '560001';

const EMPLOYEE_NAME =
  process.env.COLLECTION_AREA_EMPLOYEE || '';

// ======================================
// CLOSE CLOSING GROUPS POPUP
// ======================================


async function closeClosingGroupsPopup(page) {
  console.log('[Popup] Checking Groups Closing Soon');

  const popup = page.locator(
    'div.fixed.inset-0.z-\\[9998\\]'
  ).first();

  // Wait briefly for the popup to appear.
  const appeared = await popup.waitFor({
    state: 'visible',
    timeout: 5000
  }).then(() => true).catch(() => false);

  if (!appeared) {
    console.log('[Popup] No popup displayed');
    return;
  }

  console.log('[Popup] Groups Closing Soon detected');

  // Actual button shown in your screenshot.
  const dontShowAgain = popup.getByRole('button', {
    name: /don['’]?t show(?: me)? again/i
  }).first();

  const remindLater = popup.getByRole('button', {
    name: /remind me later/i
  }).first();

  if (await dontShowAgain.isVisible().catch(() => false)) {
    await dontShowAgain.click();

    console.log("[Popup] Don't show again clicked");
  } else if (
    await remindLater.isVisible().catch(() => false)
  ) {
    await remindLater.click();

    console.log('[Popup] Remind me later clicked');
  } else {
    throw new Error(
      'Groups Closing Soon popup found, but dismissal buttons were not found.'
    );
  }

  await expect(popup).toBeHidden({
    timeout: 15000
  });

  console.log('[Popup] Popup successfully closed');
}
// ======================================
// LOGIN
// ======================================

async function loginIfNeeded(page) {
  await page.goto(BASE_URL, {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });

  const heading = page.getByRole('heading', {
    name: /admin login/i
  });

  if (!(await heading.isVisible().catch(() => false))) {
    console.log(
      '[Login] Already signed in or login page not shown'
    );
    return;
  }

  if (!process.env.ADMIN_ID || !process.env.OTP) {
    throw new Error(
      'ADMIN_ID and OTP must be set in .env'
    );
  }

  const branch = page.locator('select').first();

  if (await branch.isVisible().catch(() => false)) {
    await branch.selectOption({
      label:
        process.env.BRANCH_NAME ||
        'Main Branch (CF-BR-1)'
    });
  }

  await page.getByPlaceholder(
    'XXX-XX-XXXX'
  ).fill(process.env.ADMIN_ID);

  await page.getByRole('button', {
    name: /send otp/i
  }).click();

  const otpInputs = page.locator(
    'input[autocomplete="one-time-code"], ' +
    'input[name*="otp" i], ' +
    'input[placeholder*="otp" i], ' +
    'input[inputmode="numeric"], ' +
    'input[maxlength="6"]:visible'
  );

  await expect(otpInputs.first()).toBeVisible({
    timeout: 30000
  });

  const count = await otpInputs.count();

  if (count === 1) {
    await otpInputs.first().fill(process.env.OTP);
  } else if (count === process.env.OTP.length) {
    for (let i = 0; i < count; i++) {
      await otpInputs.nth(i).fill(process.env.OTP[i]);
    }
  } else {
    throw new Error(
      `Unexpected OTP input count: ${count}`
    );
  }

  await page.getByRole('button', {
    name: /verify otp|verify|login|submit/i
  }).last().click();

  await expect(heading).toBeHidden({
    timeout: 30000
  });

  console.log('[Login] Successful');
}

// ======================================
// OPEN COLLECTION AREA
// ======================================
async function openCollectionArea(page) {
  console.log('[Navigation] Starting Collection Area');

  await closeClosingGroupsPopup(page);

  // STEP 1: Open General Settings
  const settings = page.getByText(
    'General Settings',
    { exact: true }
  ).first();

  await settings.scrollIntoViewIfNeeded();
  await settings.click();

  console.log('[Navigation] General Settings clicked');

  // STEP 2: Find Collection Area in sidebar
  const sidebarArea = page.getByText(
    'Collection Area',
    { exact: true }
  ).first();

  await expect(sidebarArea).toBeVisible({
    timeout: 15000
  });

  await sidebarArea.scrollIntoViewIfNeeded();
  await sidebarArea.click();

  console.log('[Navigation] Collection Area menu clicked');

  // STEP 3: If Collection Management opens,
  // click its Collection Area tab.
  const addButton = page.getByRole('button', {
    name: /add collection area/i
  }).first();

  if (!(await addButton.isVisible().catch(() => false))) {
    const areaTab = page.getByRole('tab', {
      name: /collection area/i
    }).first();

    if (await areaTab.isVisible().catch(() => false)) {
      await areaTab.click();
    } else {
      const areaText = page.getByText(
        'Collection Area',
        { exact: true }
      ).last();

      await expect(areaText).toBeVisible({
        timeout: 15000
      });

      await areaText.click();
    }
  }

  console.log('[Navigation] Collection Area page opened');

  // STEP 4: Click Add Collection Area
  await expect(addButton).toBeVisible({
    timeout: 15000
  });

  await addButton.click();

  console.log('[Form] Add Collection Area clicked');

  await expect(
    page.getByPlaceholder(
      'Enter the Collection Area Name'
    )
  ).toBeVisible({
    timeout: 15000
  });

  console.log('[Form] Add Collection Area opened');
}
// ======================================
// SELECT EMPLOYEE
// ======================================
async function selectEmployee(page) {
  console.log('[Employee] Opening employee dropdown');

  // Locate the Ant Design Select using its placeholder.
  const employeeSelect = page
    .locator('.ant-select')
    .filter({
      has: page.locator(
        '.ant-select-selection-placeholder',
        { hasText: /please select employee/i }
      )
    })
    .first();

  await expect(employeeSelect).toBeVisible({
    timeout: 15000
  });

  // Click the actual interactive selector,
  // not the placeholder span.
  const selector = employeeSelect.locator(
    '.ant-select-selector'
  );

  await selector.click();

  console.log('[Employee] Dropdown opened');

  // Ant Design renders dropdown options in a popup.
  const dropdown = page.locator(
    '.ant-select-dropdown:visible'
  ).last();

  await expect(dropdown).toBeVisible({
    timeout: 15000
  });

  const options = dropdown.locator(
    '.ant-select-item-option:not(.ant-select-item-option-disabled)'
  );

  await expect(options.first()).toBeVisible({
    timeout: 15000
  });

  // If an employee name is specified in .env,
  // select that employee.
  if (EMPLOYEE_NAME) {
    const searchInput = employeeSelect.locator(
      'input[role="combobox"]'
    );

    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill(EMPLOYEE_NAME);
    }

    const employee = dropdown.locator(
      '.ant-select-item-option'
    ).filter({
      hasText: EMPLOYEE_NAME
    }).first();

    await expect(employee).toBeVisible({
      timeout: 15000
    });

    await employee.click();

    console.log(
      '[Employee] Selected:',
      EMPLOYEE_NAME
    );

    return;
  }

  // Otherwise scroll inside the dropdown.
  const scrollContainer = dropdown.locator(
    '.rc-virtual-list-holder'
  ).first();

  if (await scrollContainer.isVisible().catch(() => false)) {
    await scrollContainer.hover();
    await page.mouse.wheel(0, 250);
  } else {
    await dropdown.hover();
    await page.mouse.wheel(0, 250);
  }

  // Select the first available employee.
  const employee = options.first();

  await expect(employee).toBeVisible({
    timeout: 10000
  });

  const employeeName = (
    await employee.innerText()
  ).trim();

  await employee.click();

  console.log(
    '[Employee] Selected:',
    employeeName
  );

  // Otherwise select an available employee
  if (await options.first().isVisible().catch(() => false)) {
    const list = page.locator(
      '.ant-select-dropdown:visible, ' +
      '[role="listbox"]:visible'
    ).last();

    await list.hover();
    await page.mouse.wheel(0, 300);

    const selected = options.first();

    const name = (
      await selected.innerText()
    ).trim();

    await selected.click();

    console.log('[Employee] Selected:', name);

    return;
  }

  // Fallback for custom dropdowns
  const popup = page.locator(
    '[role="listbox"]:visible, ' +
    '[class*="dropdown"]:visible, ' +
    '[class*="menu"]:visible'
  ).last();

  const candidate = popup.locator(
    'li, [role="option"]'
  ).first();

  if (await candidate.isVisible().catch(() => false)) {
    const name = (
      await candidate.innerText()
    ).trim();

    await candidate.click();

    console.log('[Employee] Selected:', name);

    return;
  }

  throw new Error(
    'Employee dropdown opened, but no selectable option was identified. Inspect its DOM/screenshot.'
  );
}

// ======================================
// MAIN TEST
// ======================================

test('Create a collection area', async ({ page }) => {
  test.setTimeout(180000);

  page.setDefaultTimeout(15000);

  // STEP 1: Login
  await loginIfNeeded(page);

  // STEP 2: Dismiss Closing Groups popup
  await closeClosingGroupsPopup(page);

  // STEP 3: Navigate and open the form
  await openCollectionArea(page);

  // STEP 4: Fill Collection Area Name
  await page.getByPlaceholder(
    'Enter the Collection Area Name'
  ).fill(AREA_NAME);

  // STEP 5: Fill Pincode
  await page.getByPlaceholder(
    'Enter the Collection Area Pincode'
  ).fill(PINCODE);

  console.log(
    '[Form] Name:',
    AREA_NAME,
    'Pincode:',
    PINCODE
  );

  // STEP 6: Select Employee
  await selectEmployee(page);

  // STEP 7: Save Collection Area
  const save = page.getByRole('button', {
    name: /save collection area/i
  }).first();

  await expect(save).toBeEnabled();

  await save.click();

  console.log(
    '[Save] Clicked Save Collection Area'
  );

  // STEP 8: Verify save result
  const success = page.locator(
    '.ant-message-success, ' +
    '.ant-notification-notice-success, ' +
    '[role="status"]'
  ).filter({
    hasText: /success|created|added|saved/i
  }).first();

  const areaRow = page.getByText(
    AREA_NAME,
    { exact: true }
  ).first();

  const result = await Promise.any([
    success.waitFor({
      state: 'visible',
      timeout: 15000
    }).then(() => 'success message'),

    areaRow.waitFor({
      state: 'visible',
      timeout: 15000
    }).then(() => 'area listed')
  ]).catch(() => null);

  if (!result) {
    throw new Error(
      'Save could not be confirmed by a success message or collection area listing. Check the screenshot and validation messages.'
    );
  }

  console.log(
    '[Completed] Collection Area created:',
    AREA_NAME,
    '| Evidence:',
    result
  );
});
